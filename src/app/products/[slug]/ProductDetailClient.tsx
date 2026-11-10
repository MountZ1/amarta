"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import {
  CoffeeWeight,
  GrindSize,
  COFFEE_WEIGHTS,
  GRIND_SIZES,
  calculateUnitPrice,
} from "@/lib/coffee";
import { useCart } from "@/context/CartContext";
import {
  ShoppingBag,
  Check,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  Coffee,
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

export function ProductDetailClient({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const [weight, setWeight] = useState<CoffeeWeight>(250);
  const [grindSize, setGrindSize] = useState<GrindSize>("biji");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const unitPrice = calculateUnitPrice(product.price, weight);
  const totalPrice = unitPrice * quantity;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product.id, weight, grindSize, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Price Display */}
      <div className="rounded-2xl border bg-muted/20 p-5">
        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
          Harga Kemasan Terpilih
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-3xl font-extrabold text-amber-900 dark:text-amber-400">
            {formatRupiah(unitPrice)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {weight} gram
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Harga dasar: {formatRupiah(product.price)} per kilogram
        </div>
      </div>

      {/* Weight Options */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
          Pilih Ukuran Kemasan (Gram):
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {COFFEE_WEIGHTS.map((w) => {
            const p = calculateUnitPrice(product.price, w.value);
            const isSelected = weight === w.value;
            return (
              <button
                type="button"
                key={w.value}
                onClick={() => setWeight(w.value)}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  isSelected
                    ? "border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 ring-2 ring-amber-800"
                    : "border-border bg-background hover:bg-muted text-foreground"
                }`}
              >
                <span className="font-bold text-sm">{w.label}</span>
                <span className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {formatRupiah(p)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grind Size Options */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
          Pilih Profil Gilingan (Grind Size):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GRIND_SIZES.map((g) => {
            const isSelected = grindSize === g.value;
            return (
              <button
                type="button"
                key={g.value}
                onClick={() => setGrindSize(g.value)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 ring-1 ring-amber-800"
                    : "border-border bg-background hover:bg-muted text-foreground"
                }`}
              >
                <div>
                  <div className="font-bold text-xs">{g.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {g.desc}
                  </div>
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-amber-800 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity & Add to Cart */}
      <div className="border-t pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Jumlah Kemasan
            </div>
            <div className="text-xs text-muted-foreground">
              {isOutOfStock ? (
                <span className="text-rose-600 font-bold">Stok Habis</span>
              ) : (
                <span>Tersedia {product.stock} pack</span>
              )}
            </div>
          </div>

          <div className="flex items-center rounded-xl border bg-background">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-sm font-bold">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock || isOutOfStock}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Total & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="text-xs text-muted-foreground">Total Harga</div>
            <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-400">
              {formatRupiah(totalPrice)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-xs transition ${
                isOutOfStock
                  ? "cursor-not-allowed bg-muted text-muted-foreground opacity-50"
                  : added
                  ? "bg-emerald-600"
                  : "bg-amber-800 hover:bg-amber-900 active:scale-95"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Berhasil Ditambahkan!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" />
                  <span>Tambah ke Keranjang</span>
                </>
              )}
            </button>

            {added && (
              <Link
                href="/cart"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-100"
              >
                <span>Lihat Keranjang</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Assurance perks */}
      <div className="grid grid-cols-2 gap-3 border-t pt-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-amber-800" />
          <span>Pengiriman Cepat Seluruh Nusantara</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>100% Biji Kopi Asli Tanpa Campuran</span>
        </div>
      </div>
    </div>
  );
}
