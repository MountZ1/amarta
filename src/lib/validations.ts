import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

export const productSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  description: z.string().optional().default(""),
  origin: z.string().min(1, "Origin (asal daerah) harus diisi"),
  variety: z.string().min(1, "Varietas kopi harus diisi"),
  price: z.coerce.number().int().positive("Harga harus bilangan bulat positif"),
  stock: z.coerce.number().int().nonnegative("Stok tidak boleh negatif"),
  imageUrl: z.string().optional().nullable(),
});

export const userCreateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
});

export const orderItemSchema = z.object({
  productId: z.coerce.number().int().positive("ID produk tidak valid"),
  weight: z.union([
    z.literal(250),
    z.literal(500),
    z.literal(750),
    z.literal(1000),
  ]).default(1000),
  grindSize: z.enum(["fine", "medium", "coarse", "biji"]).default("biji"),
  quantity: z.coerce.number().int().positive("Jumlah minimal 1"),
});

export const orderCreateSchema = z.object({
  customerName: z.string().min(2, "Nama pelanggan minimal 2 karakter"),
  phoneNumber: z.string().min(8, "Nomor telepon minimal 8 digit"),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  items: z.array(orderItemSchema).min(1, "Keranjang belanja tidak boleh kosong"),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
