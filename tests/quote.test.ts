import { afterEach, describe, expect, it } from "bun:test";
import { signQuote, verifyQuote } from "../src/lib/quote";

const originalSecret = process.env.QUOTE_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.QUOTE_SECRET;
  else process.env.QUOTE_SECRET = originalSecret;
});

describe("Shipping quote signatures", () => {
  it("verifies untampered quotes", () => {
    process.env.QUOTE_SECRET = "test-quote-secret";
    const token = signQuote({ cost: 12000 });

    expect(verifyQuote<{ cost: number }>(token)?.cost).toBe(12000);
  });

  it("rejects tampered, malformed, and expired quotes", () => {
    process.env.QUOTE_SECRET = "test-quote-secret";
    const token = signQuote({ cost: 12000 });
    const [body, signature] = token.split(".");

    expect(verifyQuote(`${body}.invalid`)).toBeNull();
    expect(verifyQuote("not-a-token")).toBeNull();
    expect(
      verifyQuote(signQuote({ cost: 12000 }, -1)),
    ).toBeNull();
    expect(signature).toBeTruthy();
  });
});
