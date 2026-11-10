import { db } from "../index";
import { orderItems, orders, products, users } from "../schema/schema";
import bcrypt from "bcryptjs";

await db.delete(orderItems);
await db.delete(orders);
await db.delete(products);
await db.delete(users);

// admin
await db.insert(users).values({
  name: "Admin",
  email: "admin@kopi.test",
  password: await bcrypt.hash("admin123", 10),
});

// produk
const insertedProducts = await db
  .insert(products)
  .values([
    {
      name: "Gayo Highland",
      slug: "gayo-highland",
      description: "Body tebal, aroma rempah, aftertaste manis bersih.",
      origin: "Gayo, Aceh",
      variety: "Arabica",
      price: 95000,
      stock: 40,
      imageUrl: "https://picsum.photos/seed/gayo/600/600",
    },
    {
      name: "Toraja Sapan",
      slug: "toraja-sapan",
      description: "Earthy, cokelat gelap, sedikit rasa buah kering.",
      origin: "Toraja, Sulawesi Selatan",
      variety: "Arabica",
      price: 105000,
      stock: 25,
      imageUrl: "https://picsum.photos/seed/toraja/600/600",
    },
    {
      name: "Flores Bajawa",
      slug: "flores-bajawa",
      description: "Floral, keasaman lembut, nuansa karamel.",
      origin: "Bajawa, Flores",
      variety: "Arabica",
      price: 98000,
      stock: 30,
      imageUrl: "https://picsum.photos/seed/bajawa/600/600",
    },
    {
      name: "Kintamani Natural",
      slug: "kintamani-natural",
      description: "Citrus cerah dengan rasa jeruk dan madu.",
      origin: "Kintamani, Bali",
      variety: "Arabica",
      price: 110000,
      stock: 15,
      imageUrl: "https://picsum.photos/seed/kintamani/600/600",
    },
    {
      name: "Java Preanger",
      slug: "java-preanger",
      description: "Seimbang, cokelat dan kacang, cocok untuk harian.",
      origin: "Preanger, Jawa Barat",
      variety: "Arabica",
      price: 165000,
      stock: 20,
      imageUrl: "https://picsum.photos/seed/preanger/600/600",
    },
    {
      name: "Lampung Robusta",
      slug: "lampung-robusta",
      description: "Pahit tegas, crema tebal, pas untuk espresso blend.",
      origin: "Lampung",
      variety: "Robusta",
      price: 90000,
      stock: 0, // sengaja habis, untuk uji logika stok kosong
      imageUrl: "https://picsum.photos/seed/lampung/600/600",
    },
  ])
  .returning();

// contoh order (opsional, buat uji halaman order)
const [gayo, toraja] = insertedProducts;

const [order] = await db
  .insert(orders)
  .values({
    invoice: "INV-0001",
    customerName: "Budi Santoso",
    phoneNumber: "081234567890",
    address: "Jl. Malioboro No. 10, Yogyakarta",
    status: "pending",
    total: gayo.price * 2 + toraja.price,
  })
  .returning();

await db.insert(orderItems).values([
  {
    orderId: order.id,
    productId: gayo.id,
    weight: 1000,
    grindSize: "fine",
    quantity: 2,
    price: gayo.price,
  },
  {
    orderId: order.id,
    productId: toraja.id,
    weight: 1000,
    grindSize: "fine",
    quantity: 1,
    price: toraja.price,
  },
]);

console.log("Seed selesai");
process.exit(0);
