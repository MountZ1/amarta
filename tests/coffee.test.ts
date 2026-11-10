import { describe, expect, it } from "bun:test";
import { truncateWords, calculateUnitPrice } from "../src/lib/coffee";

describe("Coffee Utility Helpers", () => {
  it("should truncate description to max 10 words with trailing ...", () => {
    const longDesc =
      "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas dua belas";
    const truncated = truncateWords(longDesc, 10);
    expect(truncated).toBe(
      "Satu dua tiga empat lima enam tujuh delapan sembilan sepuluh..."
    );
  });

  it("should not truncate description with 10 words or fewer", () => {
    const shortDesc = "Satu dua tiga empat lima";
    expect(truncateWords(shortDesc, 10)).toBe(shortDesc);
  });

  it("should handle null or empty description gracefully", () => {
    expect(truncateWords(null, 10)).toBe("");
    expect(truncateWords("", 10)).toBe("");
  });

  it("should calculate correct unit price based on gram ratio from kg price", () => {
    const pricePerKg = 100000;
    expect(calculateUnitPrice(pricePerKg, 250)).toBe(25000);
    expect(calculateUnitPrice(pricePerKg, 500)).toBe(50000);
    expect(calculateUnitPrice(pricePerKg, 750)).toBe(75000);
    expect(calculateUnitPrice(pricePerKg, 1000)).toBe(100000);
  });
});
