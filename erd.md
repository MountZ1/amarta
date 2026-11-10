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
        text invoice
        text customer_name
        text phone_number
        text address
        order_status status
        integer total
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
```

## Catatan

- `users` menyimpan akun admin. Pembeli tidak memiliki akun dan tidak berelasi dengan `orders`.
- `products.price` adalah harga dasar per kilogram dalam integer rupiah.
- `order_items.price` adalah harga per kemasan saat pesanan dibuat; `weight` dan `grind_size` menyimpan pilihan varian pada transaksi.
- Penghapusan pesanan menghapus item-itemnya melalui relasi cascade. Produk yang sudah dirujuk item pesanan tidak dihapus otomatis.
- Status pesanan berasal dari enum `order_status`: `pending`, `processing`, `shipped`, `completed`, dan `cancelled`.
- `invoice` saat ini wajib diisi, tetapi skema tidak menetapkan constraint unique.
