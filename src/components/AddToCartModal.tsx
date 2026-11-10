"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/format";
import {
  CoffeeWeight,
  GrindSize,
  COFFEE_WEIGHTS,
  GRIND_SIZES,
  calculateUnitPrice,
} from "@/lib/coffee";
import { useCart } from "@/context/CartContext";
import { X, Plus, Minus, Check, ShoppingBag, Coffee } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  origin: string;
  variety: string;
  imageUrl: string | null;
  description?: string | null;
}

interface AddToCartModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToCartModal({ product, isOpen, onClose }: AddToCartModalProps) {
  const { addToCart } = useCart();

  const [weight, setWeight] = useState<CoffeeWeight>(250);
  const [grindSize, setGrindSize] = useState<GrindSize>("biji");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!isOpen || !product) return null;

  const unitPrice = calculateUnitPrice(product.price, weight);
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (product.stock <= 0) return;
    addToCart(product.id, weight, grindSize, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-bold text-base text-foreground">
            Pilih Varian Kopi
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Product header preview */}
        <div className="flex items-center gap-3.5 rounded-xl bg-muted/40 p-3 mb-5">
          <div className="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Coffee className="h-7 w-7 text-amber-800 opacity-40" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">{product.name}</h4>
            <div className="text-xs text-muted-foreground mt-0.5">
              {product.variety} • {product.origin}
            </div>
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-400 mt-1">
              Harga dasar: {formatRupiah(product.price)} / kg
            </div>
          </div>
        </div>

        {/* Weight Selection */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Pilih Ukuran Kemasan (Gram):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COFFEE_WEIGHTS.map((w) => {
              const p = calculateUnitPrice(product.price, w.value);
              const isSelected = weight === w.value;
              return (
                <button
                  type="button"
                  key={w.value}
                  onClick={() => setWeight(w.value)}
                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition ${
                    isSelected
                      ? "border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 ring-2 ring-amber-800"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  <span className="font-bold text-xs">{w.label}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                    {formatRupiah(p)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grind Size Selection */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Pilih Ukuran Gilingan (Grind Size):
          </label>
          <div className="space-y-1.5">
            {GRIND_SIZES.map((g) => {
              const isSelected = grindSize === g.value;
              return (
                <button
                  type="button"
                  key={g.value}
                  onClick={() => setGrindSize(g.value)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2 text-left transition ${
                    isSelected
                      ? "border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 ring-1 ring-amber-800"
                      : "border-border bg-background hover:bg-muted text-foreground"
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs">{g.label}</div>
                    <div className="text-[10px] text-muted-foreground">{g.desc}</div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-amber-800 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between border-t pt-4 mb-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Jumlah Kemasan
            </div>
            <div className="text-[11px] text-muted-foreground">
              Tersedia {product.stock} pack
            </div>
          </div>

          <div className="flex items-center rounded-lg border bg-background">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
              className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Total & Add Button */}
        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <div className="text-xs text-muted-foreground">Subtotal</div>
            <div className="text-lg font-extrabold text-amber-900 dark:text-amber-400">
              {formatRupiah(totalPrice)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock <= 0 || added}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition ${
              added
                ? "bg-emerald-600"
                : "bg-amber-800 hover:bg-amber-900 active:scale-95"
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                <span>Dimasukkan ke Keranjang!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>Tambah ke Keranjang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
