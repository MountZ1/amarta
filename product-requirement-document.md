# Product Requirement Document — Amarta Kopi

## Ringkasan

Amarta Kopi adalah toko kopi online sederhana. Pembeli dapat melihat kopi, memilih berat dan tingkat gilingan, lalu membuat dan melacak pesanan tanpa akun. Admin menggunakan area khusus untuk mengelola produk, admin, dan pesanan.

## Tujuan

- Memudahkan pembeli memilih kopi dan membuat pesanan dari web.
- Menyimpan pilihan keranjang dan data pengiriman agar pembeli tidak perlu mengisi ulang setelah halaman dimuat kembali.
- Membantu admin mengelola katalog dan memproses pesanan.
- Menampilkan harga dan rincian produk secara jelas, termasuk berat serta jenis gilingan.

## Pengguna

### Pembeli

- Tidak perlu mendaftar atau login.
- Dapat mencari dan melihat detail produk.
- Dapat mengelola keranjang, memilih item yang akan dibeli, dan membuat pesanan.
- Dapat melihat invoice dan melacak pesanan menggunakan nomor invoice.

### Admin

- Login untuk mengakses area admin.
- Mengelola produk dan akun admin.
- Melihat pesanan dan memperbarui status sesuai alur yang diizinkan.
- Melihat ringkasan penjualan pada dashboard.

## Ruang Lingkup Fitur

### Katalog dan produk

- Halaman utama menampilkan katalog dengan pencarian nama, asal, dan varietas kopi.
- Deskripsi di kartu katalog dibatasi maksimal 10 kata; deskripsi yang lebih panjang diberi `...`.
- Pembeli dapat membuka halaman detail produk.
- Admin dapat membuat, mengubah, mencari, dan menghapus produk.
- Slug produk dibuat di backend.
- Foto produk berupa JPEG/PNG dengan batas ukuran 2 MB dan disimpan di Supabase Storage.
- Harga produk dimasukkan dalam rupiah per kilogram. Form admin menampilkan pemisah ribuan berupa titik.

### Keranjang dan checkout

- Keranjang disimpan di browser dan divalidasi dengan data produk terbaru dari server.
- Pembeli dapat mengubah berat (250, 500, 750, atau 1000 gram) dan grind size (fine, medium, coarse, atau biji) di keranjang.
- Pembeli dapat memilih sebagian atau seluruh item untuk checkout.
- Data nama, nomor telepon, dan alamat disimpan di browser untuk pemesanan berikutnya.
- Pembeli memilih provinsi, kota/kabupaten, kecamatan, kode pos, dan kurir.
- Data lokasi dibaca dari database terlebih dahulu. Jika belum tersedia, backend mengambilnya dari RajaOngkir lalu menyimpannya untuk permintaan berikutnya.
- Backend meminta tarif ke RajaOngkir berdasarkan kecamatan tujuan, kurir, dan berat total item yang dipilih. Pembeli memilih layanan yang tersedia sebelum membuat pesanan.
- Tarif disimpan sementara sebagai quote bertanda tangan yang kedaluwarsa setelah 15 menit. Checkout memvalidasi quote tersebut tanpa meminta tarif RajaOngkir untuk kedua kalinya.
- Server memvalidasi data, harga, dan stok sebelum membuat pesanan.
- Harga per kemasan dihitung dari harga per kilogram: `harga per kg × berat gram / 1000`.
- Setelah pesanan dibuat, stok produk dikurangi dan pembeli diarahkan ke halaman sukses.
- Halaman sukses menampilkan nomor invoice, item yang dibeli, berat, grind size, pilihan kurir/layanan, ongkir, dan total.
- Invoice dibuat oleh backend dengan format `INV-DDMMYYHHSSMS`.

### Pelacakan pesanan

- Pembeli dapat mencari pesanan menggunakan invoice.
- Halaman detail menampilkan status, alamat dan wilayah tujuan, kurir/layanan, estimasi, nomor resi bila tersedia, daftar item, berat, grind size, ongkir, dan total.

### Area admin

- Admin login menggunakan email dan password.
- Dashboard menyediakan filter tanggal dan ringkasan: jumlah penjualan, produk terlaris, pendapatan, lima pesanan terbaru, serta lima produk dengan stok terendah. Pembaruan menggunakan SSE.
- Admin dapat mengelola produk dan akun admin.
- Daftar pesanan diperbarui melalui SSE dan dapat dicari berdasarkan invoice, nama pelanggan, atau nomor telepon.
- Admin dapat melihat rincian pesanan dan memperbarui status mengikuti aturan berikut:

| Status saat ini | Status berikutnya yang diizinkan |
| --- | --- |
| `pending` | `processing` atau `cancelled` |
| `processing` | `shipped` |
| `shipped` | `completed` |
| `completed` atau `cancelled` | Tidak ada |

## Konfigurasi Integrasi Pengiriman

Integrasi membutuhkan environment variables server-side:

- `RAJAONGKIR_API_KEY` — API key RajaOngkir.
- `RAJAONGKIR_ORIGIN_DISTRICT_ID` — ID kecamatan asal dari provider.
- `QUOTE_SECRET` — secret acak rahasia untuk menandatangani quote ongkir.
- `RAJAONGKIR_BASE_URL` — opsional; default `https://rajaongkir.komerce.id/api/v1`.

Seed daftar kurir yang didukung ke tabel `expeditions` dengan `bun run db:seed:expeditions`. Data provinsi dapat diisi terlebih dahulu dengan `bun run db:seed:provinces`; kota dan kecamatan diambil dan dicache ketika diminta. Skema tabel lokasi, ekspedisi, dan pesanan harus tersedia sebelum endpoint integrasi digunakan.

## Aturan dan Batasan

- Buyer tidak memerlukan akun. Tabel `users` hanya untuk admin.
- Harga disimpan sebagai integer rupiah; harga produk adalah harga dasar per kilogram.
- Setiap item pesanan menyimpan berat, grind size, kuantitas, dan harga per kemasan.
- Endpoint POST harus memvalidasi input.
- Perubahan struktur database atau tabel memerlukan persetujuan terlebih dahulu. Migrasi yang sudah dijalankan tidak diedit; perubahan skema menggunakan migrasi baru.
- Proyek menggunakan Bun untuk instalasi, pengembangan, pengujian, dan perintah proyek.
- Pembayaran berada di luar cakupan; RajaOngkir digunakan untuk daftar lokasi dan kalkulasi tarif saja.

## Kriteria Penerimaan Utama

1. Pembeli dapat membuat pesanan tanpa login.
2. Pembeli dapat memilih varian kopi dan hanya checkout item yang dipilih.
3. Harga dan stok pesanan dihitung serta divalidasi di server.
4. Halaman sukses menampilkan invoice, daftar item beserta berat dan grind size, ongkir, serta total.
5. Pembeli dapat melihat pesanan menggunakan invoice.
6. Admin dapat mengelola katalog dan pesanan, termasuk pencarian dan transisi status yang valid.
7. Input API POST divalidasi dan perubahan perilaku penting memiliki pengujian.
