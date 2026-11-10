import { describe, expect, it } from "bun:test";
import { slugify } from "../src/lib/slug";

describe("Slug Generator Utility", () => {
  it("should convert product name into lowercase kebab-case slug", () => {
    expect(slugify("Gayo Highland Arabica")).toBe("gayo-highland-arabica");
  });

  it("should remove punctuation and special characters", () => {
    expect(slugify("Toraja Sapan (Specialty Roast!)")).toBe("toraja-sapan-specialty-roast");
  });

  it("should collapse multiple whitespace and dashes", () => {
    expect(slugify("  Flores   Bajawa -- Super  ")).toBe("flores-bajawa-super");
  });

  it("should handle accented characters", () => {
    expect(slugify("Café au Lait")).toBe("cafe-au-lait");
  });
});
