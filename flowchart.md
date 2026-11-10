# Flowchart — Amarta Kopi

## Alur pembelian dan checkout

```mermaid
flowchart TD
    A[Pembeli membuka katalog] --> B[Cari atau pilih produk]
    B --> C[Lihat detail produk]
    C --> D[Pilih berat dan grind size]
    D --> E[Tambahkan ke keranjang]
    E --> F[Keranjang tersimpan di browser]
    F --> G[Ubah varian atau kuantitas bila perlu]
    G --> H[Pilih item untuk checkout]
    H --> I{Ada item terpilih?}
    I -- Tidak --> F
    I -- Ya --> J[Server validasi harga dan stok terbaru]
    J --> K{Item tersedia?}
    K -- Tidak --> G
    K -- Ya --> L[Isi nama, nomor telepon, dan alamat]
    L --> M[Server validasi data pesanan]
    M --> N{Data valid dan stok cukup?}
    N -- Tidak --> O[Tampilkan pesan kesalahan]
    O --> G
    N -- Ya --> P[Hitung harga sesuai berat]
    P --> Q[Buat invoice dan pesanan]
    Q --> R[Simpan order_items dan kurangi stok]
    R --> S[Alihkan ke halaman sukses dengan invoice]
    S --> T[Tampilkan invoice, item, berat, grind size, dan total]
    T --> U[Pembeli dapat melacak pesanan dengan invoice]
```

## Alur admin dan pemrosesan pesanan

```mermaid
flowchart TD
    A[Admin membuka login] --> B{Email dan password valid?}
    B -- Tidak --> C[Tampilkan pesan login gagal]
    C --> A
    B -- Ya --> D[Buat sesi admin]
    D --> E[Dashboard]
    E --> F[Ringkasan penjualan diperbarui melalui SSE]
    D --> G[Kelola produk]
    D --> H[Kelola akun admin]
    D --> I[Daftar pesanan realtime melalui SSE]
    I --> J[Cari invoice, nama, atau nomor telepon]
    J --> K[Lihat detail pesanan]
    K --> L{Status saat ini}
    L -- pending --> M{Pilih proses atau batalkan}
    M -- proses --> N[processing]
    M -- batalkan --> O[cancelled]
    L -- processing --> P[shipped]
    L -- shipped --> Q[completed]
    L -- completed atau cancelled --> R[Status final]
    N --> I
    O --> I
    P --> I
    Q --> I
```
