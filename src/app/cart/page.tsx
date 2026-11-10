"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import {
  COFFEE_WEIGHTS,
  CoffeeWeight,
  GrindSize,
  GRIND_SIZES,
} from "@/lib/coffee";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Coffee,
  AlertTriangle,
} from "lucide-react";

interface ValidatedCartItem {
  productId: number;
  name: string;
  slug: string;
  origin: string;
  variety: string;
  weight: CoffeeWeight;
  grindSize: GrindSize;
  grindLabel: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  quantity: number;
  available: boolean;
  itemTotal: number;
  reason?: string;
}

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoaded,
    setAllSelected,
    setSelected,
    updateVariant,
  } = useCart();
  const [items, setItems] = useState<ValidatedCartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLatestCartData = async () => {
    if (!isLoaded) return;
    if (cart.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart }),
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (e) {
      console.error("Failed to validate cart:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestCartData();
  }, [cart, isLoaded]);

  const selectedItems = items.filter((item) =>
    cart.find(
      (stored) =>
        stored.productId === item.productId &&
        stored.weight === item.weight &&
        stored.grindSize === item.grindSize
    )?.selected
  );
  const selectedSubtotal = selectedItems.reduce(
    (sum, item) => sum + item.itemTotal,
    0
  );
  const hasUnavailableSelected = selectedItems.some((item) => !item.available);
  const selectedQuantity = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const allSelected = cart.length > 0 && cart.every((item) => item.selected);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container mx-auto flex-1 px-4 sm:px-6 py-10 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Keranjang Belanja
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data tersimpan di peramban dengan pilihan ukuran gram dan jenis gilingan.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {items.length > 0 && (
          <label className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(event) => setAllSelected(event.target.checked)}
              className="h-4 w-4 accent-amber-800"
            />
            Pilih semua untuk checkout
          </label>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="my-16 flex flex-col items-center justify-center rounded-2xl border border-dashed p-12 text-center bg-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 mb-4">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold">Keranjang Belanja Kosong</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Anda belum menambahkan kopi pilihan ke dalam keranjang belanja.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-amber-900 transition"
            >
              <span>Jelajahi Produk Kopi</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List of items */}
            <div className="lg:col-span-2 space-y-4">
              {hasUnavailableSelected && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Stok item yang dipilih tidak mencukupi atau sudah habis. Silakan sesuaikan jumlah sebelum checkout.
                  </span>
                </div>
              )}

              {items.map((item) => {
                const itemKey = `${item.productId}-${item.weight}-${item.grindSize}`;

                return (
                  <div
                    key={itemKey}
                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border bg-card p-4 shadow-2xs transition ${
                      !item.available ? "border-rose-300 bg-rose-50/20" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Pilih ${item.name} untuk checkout`}
                      checked={
                        cart.find(
                          (stored) =>
                            stored.productId === item.productId &&
                            stored.weight === item.weight &&
                            stored.grindSize === item.grindSize
                        )?.selected ?? false
                      }
                      onChange={(event) =>
                        setSelected(
                          item.productId,
                          item.weight,
                          item.grindSize,
                          event.target.checked
                        )
                      }
                      className="h-4 w-4 shrink-0 accent-amber-800"
                    />
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted relative">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name || "Kopi"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-amber-50 text-amber-700">
                            <Coffee className="h-6 w-6 opacity-30" />
                          </div>
                        )}
                      </div>

                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-bold text-base hover:text-amber-800 transition"
                        >
                          {item.name}
                        </Link>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Berat
                            <select
                              value={item.weight}
                              onChange={(event) =>
                                updateVariant(
                                  item.productId,
                                  item.weight,
                                  item.grindSize,
                                  Number(event.target.value) as CoffeeWeight,
                                  item.grindSize
                                )
                              }
                              className="ml-1 rounded-md border bg-background px-2 py-1 text-[11px] text-foreground"
                            >
                              {COFFEE_WEIGHTS.map((weight) => (
                                <option key={weight.value} value={weight.value}>
                                  {weight.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Gilingan
                            <select
                              value={item.grindSize}
                              onChange={(event) =>
                                updateVariant(
                                  item.productId,
                                  item.weight,
                                  item.grindSize,
                                  item.weight,
                                  event.target.value as GrindSize
                                )
                              }
                              className="ml-1 max-w-40 rounded-md border bg-background px-2 py-1 text-[11px] text-foreground"
                            >
                              {GRIND_SIZES.map((grind) => (
                                <option key={grind.value} value={grind.value}>
                                  {grind.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="text-sm font-semibold text-foreground mt-1.5">
                          {formatRupiah(item.price)}{" "}
                          <span className="text-[11px] font-normal text-muted-foreground">
                            / pack
                          </span>
                        </div>

                        {!item.available && (
                          <div className="text-xs font-semibold text-rose-600 mt-1">
                            {item.reason || `Hanya tersisa ${item.stock} item`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity and Actions */}
                    <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="flex items-center rounded-lg border bg-background">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.weight,
                              item.grindSize,
                              item.quantity - 1
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.weight,
                              item.grindSize,
                              item.quantity + 1
                            )
                          }
                          disabled={item.quantity >= item.stock}
                          className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <div className="text-sm font-bold text-amber-900 dark:text-amber-400">
                          {formatRupiah(item.itemTotal || item.price * item.quantity)}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          removeFromCart(
                            item.productId,
                            item.weight,
                            item.grindSize
                          )
                        }
                        className="text-muted-foreground hover:text-rose-600 p-1"
                        title="Hapus dari keranjang"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout Card Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-xs">
                <h3 className="font-bold text-lg mb-4">Ringkasan Pesanan</h3>

                <div className="space-y-2.5 text-sm border-b pb-4 mb-4">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Dipilih untuk checkout</span>
                    <span>{selectedQuantity} item</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Subtotal dipilih</span>
                    <span>{formatRupiah(selectedSubtotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-6">
                  <span className="font-bold text-base">Total Bayar</span>
                  <span className="font-extrabold text-xl text-amber-900 dark:text-amber-400">
                    {formatRupiah(selectedSubtotal)}
                  </span>
                </div>

                <Link
                  href={hasUnavailableSelected || selectedQuantity === 0 ? "#" : "/checkout"}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-xs transition ${
                    hasUnavailableSelected || selectedQuantity === 0
                      ? "cursor-not-allowed bg-muted text-muted-foreground opacity-60"
                      : "bg-amber-800 text-white hover:bg-amber-900"
                  }`}
                  onClick={(e) => {
                    if (hasUnavailableSelected || selectedQuantity === 0) {
                      e.preventDefault();
                      alert(
                        selectedQuantity === 0
                          ? "Pilih minimal satu item untuk checkout."
                          : "Harap sesuaikan item yang stoknya habis."
                      );
                    }
                  }}
                >
                  <span>Checkout Item Dipilih</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/"
                  className="mt-3 block text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  &larr; Lanjut Belanja
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
