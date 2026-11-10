import { NextRequest, NextResponse } from "next/server";
import { uploadProductImage } from "@/lib/storage";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File gambar wajib diunggah" },
        { status: 400 }
      );
    }

    const result = await uploadProductImage(file, file.name);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Gagal mengunggah file", message: error.message },
      { status: 500 }
    );
  }
}
