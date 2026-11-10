# Kopi Shop

E-commerce mini penjualan kopi. Next.js (App Router), Tailwind, Shadcdn, Drizzle ORM, Supabase Postgres, Bun.

## Perintah

- `bun install` : install dependency
- `bun run dev` : jalankan dev server
- `bun run db:generate` / `db:migrate` : buat dan jalankan migrasi

## Struktur

- `src/database/schema/schema.ts` : skema Drizzle
- `src/database/seed/seed.ts` : seed data

## Aturan

- Gunakan Bun, bukan npm atau yarn.
- Jangan edit file migrasi yang sudah dijalankan; buat migrasi baru.
- Harga disimpan sebagai integer rupiah.
- Buyer tidak perlu login; tabel `users` hanya untuk admin.
- Selalu request aproval untuk semua eksekusi untuk semua yang berkaitan dengan perubahan struktur database dan tabel.
- Generate dan atau update chats.log / chats.json setiap percakapan yang kita lakukan di projek ini.
