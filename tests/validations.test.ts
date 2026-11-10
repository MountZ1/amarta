import { describe, expect, it } from "bun:test";
import {
  loginSchema,
  productSchema,
  orderCreateSchema,
  userCreateSchema,
} from "../src/lib/validations";

describe("POST Validation Schemas", () => {
  describe("loginSchema", () => {
    it("should accept valid email and password", () => {
      const result = loginSchema.safeParse({
        email: "admin@kopi.test",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "admin@kopi.test",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("productSchema", () => {
    it("should accept valid product data", () => {
      const result = productSchema.safeParse({
        name: "Aceh Gayo",
        description: "Enak dan wangi",
        origin: "Gayo, Aceh",
        variety: "Arabica",
        price: 95000,
        stock: 20,
        imageUrl: "https://example.com/gayo.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("should reject negative or zero price", () => {
      const result = productSchema.safeParse({
        name: "Aceh Gayo",
        origin: "Gayo, Aceh",
        variety: "Arabica",
        price: -1000,
        stock: 20,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative stock", () => {
      const result = productSchema.safeParse({
        name: "Aceh Gayo",
        origin: "Gayo, Aceh",
        variety: "Arabica",
        price: 95000,
        stock: -5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("orderCreateSchema", () => {
    it("should accept valid customer and items data", () => {
      const result = orderCreateSchema.safeParse({
        customerName: "Budi Santoso",
        phoneNumber: "081234567890",
        address: "Jl. Sudirman No 10, Jakarta",
        items: [{ productId: 1, quantity: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty items array", () => {
      const result = orderCreateSchema.safeParse({
        customerName: "Budi Santoso",
        phoneNumber: "081234567890",
        address: "Jl. Sudirman No 10, Jakarta",
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid phone number or short name", () => {
      const result = orderCreateSchema.safeParse({
        customerName: "A",
        phoneNumber: "123",
        address: "Jl",
        items: [{ productId: 1, quantity: 1 }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject unsupported coffee weights and grind sizes", () => {
      const invalidWeight = orderCreateSchema.safeParse({
        customerName: "Budi Santoso",
        phoneNumber: "081234567890",
        address: "Jl. Sudirman No 10, Jakarta",
        items: [{ productId: 1, weight: 300, grindSize: "fine", quantity: 1 }],
      });
      const invalidGrindSize = orderCreateSchema.safeParse({
        customerName: "Budi Santoso",
        phoneNumber: "081234567890",
        address: "Jl. Sudirman No 10, Jakarta",
        items: [{ productId: 1, weight: 250, grindSize: "extra-fine", quantity: 1 }],
      });

      expect(invalidWeight.success).toBe(false);
      expect(invalidGrindSize.success).toBe(false);
    });
  });

  describe("userCreateSchema", () => {
    it("should accept valid user with password >= 6 characters", () => {
      const result = userCreateSchema.safeParse({
        name: "Super Admin",
        email: "super@kopi.test",
        password: "adminpassword",
      });
      expect(result.success).toBe(true);
    });

    it("should reject password less than 6 characters", () => {
      const result = userCreateSchema.safeParse({
        name: "Super Admin",
        email: "super@kopi.test",
        password: "123",
      });
      expect(result.success).toBe(false);
    });
  });
});
