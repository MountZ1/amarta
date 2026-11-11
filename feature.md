## halaman auth (hanya untuk admin)

- login (/auth/login) : email dan password
- dashboard (/auth/dashboard) :
  - filter dengan tanggal (start-end),
  - analytics realtime menggunakan sse (jumalah penjualan, produk terlaris, total pendapatan, 5 order terbaru, 5 produk dengan stok paling kecil),
- product (/auth/products):
  - filter search by name, origin or variety
  - crud product:
    - name
    - description
    - origin (aceh, jawa, sumatra, etc)
    - variety (robusta, arabika, etc)
    - image (upload image ke bucket supabase, jpeg/png, max 2mb)
  - makesure slug digenerate di backend
- users (/auth/users)
  - crud users:
    - name
    - email
    - password
- orders (/auth/ orders)
  - realtime use sse
  - on index table show invoice, customer name, phonenumber, status, and total, action for update status
  - make show page show all the data (check src/database/schema/schema.ts) and add button for update status
  - if status:
    - pending only allow update status to processing or canceled
    - processing only allow to shipped
    - shipped only allow to complete

# Halaman public (for customer)

- index
  - add search by name, origin, and variety
- cart
  - makesure to keep data product id in browser local storage and hit to api to get the latest information of the products so the cart data wont dissapear even when user reload the web
- orders
  - user need to add customer information first like name, address, phone number
  - the user information saved into local storage to so user doesn't have to filled the form all the time when they want to make an order
  - invoice will be generated automaticalyy in backend with formula (INV-DDMMYYHHSSMS)
- check order
  - check by invoice

# General

- always put validation on post method
- make test

# New Feature 1

- input price di create & edit produk dibuat pemisah dengan . agar mudah dibaca
- di cart tambah bagian untuk ubah tipe size weight dan grindSize
- buat agar checkout bisa dipilih jadi tidak semua yang masuk cart harus dicheckout, user bisa pilih mana yang mau dicheckout
- setelah create order buat halaman sukses create order dengan no invoice, list item yang dibeli (termasuk weight dan grind level) dan total
- di show order milik tambahkan weight tiap produk, hapus id di list,masukkan grind size dan hapus typografi order_items
- list pesanan admin tambah search by invoice dan nama customer juga phone number

# Integrasi ongkir raja ongkir

- cek schema untuk perubahan database ini sudah di implement jadi tidak perlu run migration lagi
- bagian checkout tambahkan select provinces, city dan district ke api backend dengan logic check ke database kalau tidak ada hit ke rajaongkir (check lib rajaongkir) kemudian simpan data ke databse dan return
- hit ke rajaongkir untuk menghitung nilai ongkir kemudian buat cache (cek lib quote.ts). cache digunakan agar tidak perlu hit 2x ke rajaongkir saat checkout dan buat order
- validasi nilai order temasuk nilai ongkir berdasarkan cache yang dibuat sebelumya
- tambahkan data ke pesanan detail di sisi admin
- berdasarkan perubahan ini update juga erd dan flowchart
