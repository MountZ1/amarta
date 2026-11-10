"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { formatRupiah } from "@/lib/format";
import { truncateWords, calculateUnitPrice } from "@/lib/coffee";
import { AddToCartModal } from "@/components/AddToCartModal";
import { Search, ShoppingBag, Coffee, Sparkles, ArrowRight } from "lucide-react";

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

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [selectedVariety, setSelectedVariety] = useState("all");

  // Modal Add to Cart
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenModal = (product: Product) => {
    if (product.stock <= 0) return;
    setModalProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-900 to-amber-950 py-16 text-white">
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-800/80 px-4 py-1.5 text-xs font-medium text-amber-200 backdrop-blur-sm mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Kopi Asli Pilihan Nusantara</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Cita Rasa Kopi Otentik Langsung dari Kebun
          </h1>
          <p className="text-amber-200/80 text-base sm:text-lg mb-8">
            Jelajahi beragam biji kopi specialty dari Sabang sampai Merauke.
            Pilih ukuran kemasan (250g - 1kg) dan jenis gilingan sesuai selera seduh Anda.
          </p>

          {/* Search Box in Hero */}
          <div className="relative mx-auto max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kopi berdasarkan nama, origin, atau varietas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-amber-700/60 bg-white dark:bg-slate-900 py-3.5 pl-12 pr-4 text-sm text-foreground shadow-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main className="container mx-auto flex-1 px-4 sm:px-6 py-10">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
              Varietas:
            </span>
            {["all", "Arabica", "Robusta"].map((variety) => (
              <button
                key={variety}
                onClick={() => setSelectedVariety(variety)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                  selectedVariety === variety
                    ? "bg-amber-800 text-white shadow-xs"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {variety === "all" ? "Semua Varietas" : variety}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Origin:
            </span>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="rounded-lg border bg-background px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-800"
            >
              <option value="all">Semua Daerah</option>
              <option value="Gayo, Aceh">Aceh (Gayo)</option>
              <option value="Toraja, Sulawesi Selatan">Toraja</option>
              <option value="Bajawa, Flores">Flores (Bajawa)</option>
              <option value="Kintamani, Bali">Bali (Kintamani)</option>
              <option value="Preanger, Jawa Barat">Jawa (Preanger)</option>
              <option value="Lampung">Lampung</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl bg-muted/60"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="my-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-4">
              <Coffee className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">Produk Tidak Ditemukan</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Tidak ada produk kopi yang cocok dengan kata kunci atau filter yang Anda pilih.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedOrigin("all");
                setSelectedVariety("all");
              }}
              className="mt-4 rounded-lg bg-amber-800 px-4 py-2 text-xs font-medium text-white hover:bg-amber-900"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const startingPrice = calculateUnitPrice(product.price, 250);

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs transition hover:shadow-md"
                >
                  {/* Image Container with Link to Detail Page */}
                  <Link
                    href={`/products/${product.slug}`}
                    className="relative aspect-square w-full overflow-hidden bg-muted block"
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-50/50 text-amber-700">
                        <Coffee className="h-12 w-12 opacity-30" />
                      </div>
                    )}

                    {/* Badges on image */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-amber-900/80 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-xs">
                        {product.variety}
                      </span>
                      <span className="rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
                        {product.origin}
                      </span>
                    </div>

                    {isOutOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                        <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                          Stok Habis
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-bold text-base line-clamp-1 group-hover:text-amber-800 transition">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Description: Exactly max 10 words, with ... if longer */}
                    <p className="text-xs text-muted-foreground mt-1 min-h-[34px] leading-relaxed">
                      {truncateWords(product.description, 10)}
                    </p>

                    <div className="mt-auto pt-4 flex items-end justify-between">
                      <div>
                        <div className="text-[11px] text-muted-foreground">
                          Mulai dari (250g)
                        </div>
                        <div className="text-base font-extrabold text-amber-900 dark:text-amber-400">
                          {formatRupiah(startingPrice)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatRupiah(product.price)} / kg
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenModal(product)}
                        disabled={isOutOfStock}
                        className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
                          isOutOfStock
                            ? "cursor-not-allowed bg-muted text-muted-foreground opacity-50"
                            : "bg-amber-800 text-white hover:bg-amber-900 active:scale-95 shadow-xs"
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Pilih & Beli</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Add to Cart */}
      <AddToCartModal
        product={modalProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© 2026 Amarta Kopi. Penjualan Kopi Spesial Nusantara.</p>
        </div>
      </footer>
    </div>
  );
}
