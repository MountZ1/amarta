# ERD — Amarta Kopi

Diagram menggambarkan tabel dan relasi berdasarkan skema Drizzle saat ini.

```mermaid
erDiagram
    USERS {
        serial id PK
        text name
        text email UK
        text password
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        serial id PK
        text name
        text slug UK
        text description
        text origin
        text variety
        integer price
        integer stock
        text image_url
        timestamp created_at
        timestamp updated_at
    }

    ORDERS {
        serial id PK
        text invoice UK
        text customer_name
        text phone_number
        text address
        integer district_id FK
        text province_name
        text city_name
        text district_name
        text postal_code
        text courier
        text courier_service
        text etd
        integer shipping_cost
        text tracking_number
        integer subtotal
        integer total
        order_status status
        timestamp created_at
        timestamp updated_at
    }

    PROVINCES {
        serial id PK
        text external_id UK
        text name
        timestamp created_at
        timestamp updated_at
    }

    CITIES {
        serial id PK
        text external_id UK
        integer province_id FK
        text name
        timestamp created_at
        timestamp updated_at
    }

    DISTRICTS {
        serial id PK
        text external_id UK
        integer city_id FK
        text name
        timestamp created_at
        timestamp updated_at
    }

    EXPEDITIONS {
        serial id PK
        text code UK
        text name
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        serial id PK
        integer order_id FK
        integer product_id FK
        integer weight
        text grind_size
        integer quantity
        integer price
        timestamp created_at
        timestamp updated_at
    }

    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : references
    PROVINCES ||--o{ CITIES : contains
    CITIES ||--o{ DISTRICTS : contains
    DISTRICTS o|--o{ ORDERS : destination
```

## Catatan

- `users` menyimpan akun admin. Pembeli tidak memiliki akun dan tidak berelasi dengan `orders`.
- `products.price` adalah harga dasar per kilogram dalam integer rupiah.
- `order_items.price` adalah harga per kemasan saat pesanan dibuat; `weight` dan `grind_size` menyimpan pilihan varian pada transaksi.
- Penghapusan pesanan menghapus item-itemnya melalui relasi cascade. Produk yang sudah dirujuk item pesanan tidak dihapus otomatis.
- Status pesanan berasal dari enum `order_status`: `pending`, `processing`, `shipped`, `completed`, dan `cancelled`.
- `orders.subtotal` adalah jumlah harga barang; `shipping_cost` adalah ongkos kirim; `total` adalah subtotal ditambah ongkos kirim.
- `orders.district_id` mengacu pada kecamatan di cache lokasi; nama provinsi/kota/kecamatan pada pesanan disimpan sebagai snapshot agar alamat transaksi tetap terbaca.
- `orders.courier` dan `courier_service` menyimpan pilihan layanan; `tracking_number` dapat diisi setelah pesanan dikirim. Daftar kurir aktif berasal dari `expeditions`.
- `invoice` wajib diisi dan memiliki constraint unique.
- Cache penawaran ongkir bertanda tangan dan kedaluwarsa disimpan di token checkout, bukan di tabel database.
