import { describe, expect, it } from "bun:test";
import { hashPassword, verifyPassword, createToken, verifyToken } from "../src/lib/auth";

describe("Auth Utilities (Bcryptjs & Jose)", () => {
  it("should hash and verify passwords correctly using bcryptjs", async () => {
    const raw = "admin123";
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$2")).toBe(true);

    const isValid = await verifyPassword(raw, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("wrongpassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should create and verify JWT session tokens", async () => {
    const payload = { userId: 1, email: "admin@kopi.test", name: "Admin" };
    const token = await createToken(payload);

    expect(typeof token).toBe("string");

    const decoded = await verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(1);
    expect(decoded?.email).toBe("admin@kopi.test");
  });
});
