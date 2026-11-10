import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { users } from "@/database/schema/schema";
import { eq, and, ne } from "drizzle-orm";
import { userUpdateSchema } from "@/lib/validations";
import { getSession, hashPassword } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // Check email uniqueness
    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, userId)))
      .limit(1);

    if (conflict) {
      return NextResponse.json(
        { error: "Email sudah digunakan oleh user lain" },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      email,
      updatedAt: new Date(),
    };

    if (password && password.trim().length > 0) {
      updateData.password = await hashPassword(password);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui data user", message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    if (session.userId === userId) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang login" },
        { status: 400 }
      );
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User berhasil dihapus" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus user", message: error.message },
      { status: 500 }
    );
  }
}
