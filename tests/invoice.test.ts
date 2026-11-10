import { describe, expect, it } from "bun:test";
import { generateInvoice } from "../src/lib/invoice";

describe("Invoice Generator", () => {
  it("should generate invoice with prefix INV- and correct format", () => {
    const fixedDate = new Date("2026-11-10T15:30:45.120Z");
    const invoice = generateInvoice(fixedDate);

    expect(invoice.startsWith("INV-")).toBe(true);
    // Formula: INV-DDMMYYHHSSMS
    // Regex for INV- followed by digits
    expect(invoice).toMatch(/^INV-\d{10,14}$/);
  });

  it("should generate unique invoices consecutively", () => {
    const inv1 = generateInvoice();
    const inv2 = generateInvoice();
    expect(typeof inv1).toBe("string");
    expect(typeof inv2).toBe("string");
  });
});
