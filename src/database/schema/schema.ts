import { pgTable, pgEnum, serial, text, integer } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";

export const orderStatus = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "completed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  ...timestamps,
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  origin: text("origin").notNull(),
  variety: text("variety").notNull(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  ...timestamps,
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  invoice: text("invoice").notNull(),
  customerName: text("customer_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  status: orderStatus("status").notNull().default("pending"),
  total: integer("total").notNull(),
  ...timestamps,
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  weight: integer("weight").notNull().default(1000),
  grindSize: text("grind_size").notNull().default("biji"),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
  ...timestamps,
});
