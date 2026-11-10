"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ProductDetailClient } from "./ProductDetailClient";
import { Coffee, ChevronRight, AlertCircle, ArrowLeft } from "lucide-react";

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

function ProductDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/products/slug/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Produk tidak ditemukan");
        }
        setProduct(data.product);
      } catch (err: any) {
        setError(err.message || "Gagal memuat produk");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-xs text-muted-foreground">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-800 border-t-transparent mb-3" />
        <p>Memuat rincian kopi...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-foreground">Produk Tidak Ditemukan</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6">
          {error || "Kopi yang Anda cari mungkin sudah tidak tersedia atau link salah."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  return (
    <main className="container mx-auto flex-1 px-4 sm:px-6 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Katalog
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span>{product.origin}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-foreground truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Image & Badges */}
        <div>
          <div className="relative aspect-square w-full overflow-hidden rounded-3xl border bg-muted shadow-sm">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-800">
                <Coffee className="h-20 w-20 opacity-30" />
              </div>
            )}

            {/* Badges on image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-amber-900/85 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                {product.variety}
              </span>
              <span className="rounded-lg bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-xs">
                {product.origin}
              </span>
            </div>

            {product.stock <= 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <span className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-bold text-white shadow-md">
                  Stok Habis
                </span>
              </div>
            )}
          </div>

          {/* Product description card */}
          <div className="mt-6 rounded-2xl border bg-card p-5 shadow-xs">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider mb-2">
              Deskripsi & Profil Rasa
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {product.description || "Biji kopi pilihan nusantara dengan aroma khas dan cita rasa terbaik."}
            </p>
          </div>
        </div>

        {/* Right Column: Information & Options */}
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              <span>Varietas: <strong className="text-foreground">{product.variety}</strong></span>
              <span>•</span>
              <span>Asal: <strong className="text-foreground">{product.origin}</strong></span>
            </div>
          </div>

          {/* Interactive Options Client Component */}
          <ProductDetailClient product={product} />
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Suspense fallback={<div className="p-12 text-center text-xs text-muted-foreground">Memuat...</div>}>
        <ProductDetailContent />
      </Suspense>
      <footer className="border-t bg-muted/30 py-8 text-center text-xs text-muted-foreground mt-12">
        <div className="container mx-auto px-4">
          <p>© 2026 Amarta Kopi. Penjualan Kopi Spesial Nusantara.</p>
        </div>
      </footer>
    </div>
  );
}
