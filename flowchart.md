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
    K -- Ya --> L[Pilih provinsi, kota, kecamatan, kode pos, dan kurir]
    L --> M{Lokasi ada di database?}
    M -- Tidak --> N[Ambil lokasi dari RajaOngkir dan simpan ke database]
    M -- Ya --> O[Pilih layanan pengiriman]
    N --> O
    O --> P[Hitung ongkir melalui RajaOngkir]
    P --> Q[Buat token quote bertanda tangan dengan TTL]
    Q --> R[Pilih layanan dan isi kontak serta alamat jalan]
    R --> S[Checkout mengirim quote token dan item terpilih]
    S --> T[Server validasi token, berat, harga, stok, dan data pesanan]
    T --> U{Data valid dan token masih berlaku?}
    U -- Tidak --> V[Tampilkan kesalahan; hitung ulang ongkir jika perlu]
    V --> L
    U -- Ya --> W[Hitung subtotal barang dan total termasuk ongkir]
    W --> X[Buat invoice dan pesanan]
    X --> Y[Simpan rincian lokasi/kurir, order_items, dan kurangi stok]
    Y --> Z[Alihkan ke halaman sukses dengan invoice]
    Z --> AA[Tampilkan invoice, item, berat, grind size, ongkir, dan total]
    AA --> AB[Pembeli dapat melacak pesanan dengan invoice]
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
