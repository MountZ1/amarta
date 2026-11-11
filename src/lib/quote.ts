import { createHmac, timingSafeEqual } from "node:crypto";

function getSecret() {
  const secret = process.env.QUOTE_SECRET;
  if (!secret) throw new Error("QUOTE_SECRET belum dikonfigurasi");
  return secret;
}

export function signQuote(payload: object, ttlSeconds = 900) {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 }),
  ).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyQuote<T>(token: string): T | null {
  const [body, sig, extra] = token.split(".");
  if (extra) return null;
  if (!body || !sig) return null;

  try {
    const expected = createHmac("sha256", getSecret())
      .update(body)
      .digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    return data as T;
  } catch {
    return null;
  }
}
