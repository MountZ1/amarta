import { pgTable, pgEnum, serial, text, integer, index, boolean } from "drizzle-orm/pg-core";
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

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    invoice: text("invoice").notNull().unique(),
    customerName: text("customer_name").notNull(),
    phoneNumber: text("phone_number").notNull(),
    address: text("address").notNull(),

    // lokasi tujuan: referensi + salinan teks (snapshot)
    districtId: integer("district_id").references(() => districts.id, {
      onDelete: "restrict",
    }),
    provinceName: text("province_name"),
    cityName: text("city_name"),
    districtName: text("district_name"),
    postalCode: text("postal_code"),

    // pengiriman
    courier: text("courier"), // mis. "jne"
    courierService: text("courier_service"), // mis. "REG"
    etd: text("etd"), // estimasi tiba, mis. "2-3 hari"
    shippingCost: integer("shipping_cost").notNull().default(0),
    trackingNumber: text("tracking_number"), // resi, diisi admin saat shipped

    // harga
    subtotal: integer("subtotal").notNull().default(0), // total harga barang
    total: integer("total").notNull(), // subtotal + shippingCost

    status: orderStatus("status").notNull().default("pending"),
    ...timestamps,
  },
  (t) => [index("orders_created_at_idx").on(t.createdAt)],
);

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

export const provinces = pgTable(
  "provinces",
  {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull().unique(), // ID dari provider (RajaOngkir/Komerce)
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [index("provinces_name_idx").on(t.name)],
);

export const cities = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull().unique(),
    provinceId: integer("province_id")
      .notNull()
      .references(() => provinces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [index("cities_name_idx").on(t.name), index("cities_province_id_idx").on(t.provinceId)],
);

export const districts = pgTable(
  "districts",
  {
    id: serial("id").primaryKey(),
    externalId: text("external_id").notNull().unique(),
    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    ...timestamps,
  },
  (t) => [index("districts_name_idx").on(t.name), index("districts_city_id_idx").on(t.cityId)],
);

export const expeditions = pgTable("expeditions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // kode kurir untuk API, mis. "jne"
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps,
});
