"use client";

import { useEffect, useState, useRef } from "react";
import { formatRupiah } from "@/lib/format";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Upload,
  Coffee,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  origin: string;
  variety: string;
  price: number;
  stock: number;
  imageUrl: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedVariety, setSelectedVariety] = useState("all");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [origin, setOrigin] = useState("");
  const [variety, setVariety] = useState("Arabica");
  const [price, setPrice] = useState<string>("");
  const [stock, setStock] = useState<number | string>("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPriceWithDots = (val: string | number) => {
    if (!val && val !== 0) return "";
    const cleanDigits = String(val).replace(/\D/g, "");
    if (!cleanDigits) return "";
    return new Intl.NumberFormat("id-ID").format(parseInt(cleanDigits, 10));
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (selectedOrigin !== "all") params.set("origin", selectedOrigin);
      if (selectedVariety !== "all") params.set("variety", selectedVariety);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error("Failed to fetch products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedOrigin, selectedVariety]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setOrigin("");
    setVariety("Arabica");
    setPrice("");
    setStock("");
    setImageUrl("");
    setModalError("");
    setModalSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description || "");
    setOrigin(p.origin);
    setVariety(p.variety);
    setPrice(formatPriceWithDots(p.price));
    setStock(p.stock);
    setImageUrl(p.imageUrl || "");
    setModalError("");
    setModalSuccess("");
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setModalError("Ukuran gambar maksimal 2MB");
      return;
    }

    // Validate type (jpeg/png)
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setModalError("Format gambar harus JPEG atau PNG");
      return;
    }

    try {
      setUploadingImage(true);
      setModalError("");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah gambar");
      }

      setImageUrl(data.url);
      setModalSuccess("Gambar berhasil diunggah ke Supabase Storage");
      setTimeout(() => setModalSuccess(""), 3000);
    } catch (err: any) {
      setModalError(err.message || "Gagal mengunggah gambar");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    const rawPrice = parseInt(String(price).replace(/\D/g, ""), 10);
    if (!name.trim() || !origin.trim() || !variety.trim() || isNaN(rawPrice) || rawPrice <= 0 || stock === "") {
      setModalError("Mohon lengkapi semua kolom yang wajib diisi dengan benar");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        origin: origin.trim(),
        variety: variety.trim(),
        price: rawPrice,
        stock: Number(stock),
        imageUrl: imageUrl || null,
      };

      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan produk");
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setModalError(err.message || "Terjadi kesalahan saat menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, prodName: string) => {
    if (!confirm(`Yakin ingin menghapus produk "${prodName}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus");
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus produk");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Katalog Produk Admin
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Kelola inventaris kopi, upload gambar ke bucket Supabase, dan generate slug otomatis.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-900 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk Kopi</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama, origin, atau varietas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedVariety}
            onChange={(e) => setSelectedVariety(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-800"
          >
            <option value="all">Semua Varietas</option>
            <option value="Arabica">Arabica</option>
            <option value="Robusta">Robusta</option>
            <option value="Liberica">Liberica</option>
          </select>

          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-800"
          >
            <option value="all">Semua Daerah</option>
            <option value="Aceh">Aceh</option>
            <option value="Toraja">Toraja</option>
            <option value="Flores">Flores</option>
            <option value="Bali">Bali</option>
            <option value="Jawa">Jawa</option>
            <option value="Lampung">Lampung</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Memuat daftar produk...
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Coffee className="mx-auto h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm font-semibold">Tidak ada produk ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Slug (Backend)</th>
                  <th className="px-4 py-3">Varietas & Origin</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Coffee className="h-5 w-5 text-amber-800 opacity-40" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-sm">
                            {p.name}
                          </div>
                          {p.description && (
                            <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {p.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-amber-800 dark:text-amber-400">
                        {p.variety}
                      </span>{" "}
                      • {p.origin}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 font-bold ${
                          p.stock === 0
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : p.stock <= 5
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Edit Produk"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus Produk"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-base">
                {editingProduct ? "Edit Produk Kopi" : "Tambah Produk Kopi Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gayo Highland Specialty"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  * Slug URL akan dibuat secara otomatis di backend dari nama produk.
                </p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Deskripsi / Profil Rasa
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan rasa, aroma, profil sangrai..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Origin (Asal Daerah) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gayo, Aceh"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Varietas Kopi *
                  </label>
                  <select
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                  >
                    <option value="Arabica">Arabica</option>
                    <option value="Robusta">Robusta</option>
                    <option value="Liberica">Liberica</option>
                    <option value="Excelsa">Excelsa</option>
                    <option value="Blend">Blend</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Harga (Rupiah per Kg) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="95.000"
                      value={price}
                      onChange={(e) => setPrice(formatPriceWithDots(e.target.value))}
                      className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Dipisah dengan titik untuk memudahkan pembacaan ribuan
                  </p>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Jumlah Stok *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="50"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
              </div>

              {/* Image Upload to Supabase Storage */}
              <div className="border rounded-xl p-3 bg-muted/20">
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Foto Produk (Supabase Storage Bucket, JPEG/PNG max 2MB)
                </label>

                <div className="flex items-center gap-3">
                  {imageUrl ? (
                    <div className="h-16 w-16 rounded-lg overflow-hidden border bg-background relative shrink-0">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border border-dashed flex items-center justify-center text-muted-foreground shrink-0">
                      <Upload className="h-5 w-5 opacity-40" />
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      {uploadingImage
                        ? "Mengunggah ke Supabase..."
                        : imageUrl
                        ? "Ganti File Gambar"
                        : "Pilih File Gambar (JPEG/PNG)"}
                    </button>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Maksimal ukuran file: 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border bg-background px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="rounded-lg bg-amber-800 px-4 py-2 text-xs font-bold text-white hover:bg-amber-900 disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
