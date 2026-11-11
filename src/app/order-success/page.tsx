"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { GRIND_SIZES } from "@/lib/coffee";
import { AlertCircle, CheckCircle2, Coffee, PackageCheck } from "lucide-react";

interface CreatedOrder {
  invoice: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  courier: string | null;
  courierService: string | null;
  etd: string | null;
  provinceName: string | null;
  cityName: string | null;
  districtName: string | null;
  postalCode: string | null;
  createdAt: string;
}

interface CreatedOrderItem {
  id: number;
  weight: number;
  grindSize: string;
  quantity: number;
  price: number;
  productName: string | null;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const invoice = searchParams.get("invoice")?.trim() || "";
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [items, setItems] = useState<CreatedOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!invoice) return;

    let cancelled = false;
    const fetchOrder = async () => {
      try {
        const response = await fetch(
          `/api/orders/invoice/${encodeURIComponent(invoice)}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Gagal memuat detail pesanan");
        }
        if (!cancelled) {
          setOrder(data.order);
          setItems(data.items || []);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Gagal memuat detail pesanan"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [invoice]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-10 sm:px-6">
        {!invoice ? (
          <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-600" />
            <h1 className="text-xl font-bold">Invoice tidak ditemukan</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nomor invoice diperlukan untuk menampilkan detail pesanan.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-900"
            >
              Kembali ke toko
            </Link>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Memuat detail pesanan...
          </div>
        ) : error || !order ? (
          <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-rose-600" />
            <h1 className="text-xl font-bold">Detail pesanan tidak tersedia</h1>
            <p className="mt-2 text-sm text-rose-700">{error}</p>
            <Link
              href={`/check-order?invoice=${encodeURIComponent(invoice)}`}
              className="mt-6 inline-flex rounded-lg bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-900"
            >
              Lacak dengan invoice
            </Link>
          </div>
        ) : (
          <section className="mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="bg-emerald-50 p-6 text-center dark:bg-emerald-950/40">
              <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-600" />
              <h1 className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100">
                Pesanan Berhasil Dibuat
              </h1>
              <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
                Terima kasih telah berbelanja di Amarta Kopi.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-4 border-b pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nomor Invoice
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold">
                    {order.invoice}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </div>
                </div>
                <PackageCheck className="h-8 w-8 shrink-0 text-amber-800" />
              </div>

              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <div className="font-semibold">Informasi pengiriman</div>
                <div className="mt-1 text-muted-foreground">
                  {order.courier} {order.courierService}
                  {order.etd && ` • Estimasi ${order.etd}`}
                </div>
                <div className="text-muted-foreground">
                  {[order.districtName, order.cityName, order.provinceName]
                    .filter(Boolean)
                    .join(", ")}
                  {order.postalCode && ` ${order.postalCode}`}
                </div>
              </div>

              <div>
                <h2 className="mb-3 font-bold">Item yang Dibeli</h2>
                <div className="divide-y">
                  {items.map((item) => {
                    const grindLabel =
                      GRIND_SIZES.find(
                        (grind) => grind.value === item.grindSize
                      )?.label || item.grindSize;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                            <Coffee className="h-5 w-5 text-amber-800 opacity-40" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {item.productName || "Produk tidak tersedia"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.weight}g • {grindLabel} • {item.quantity} x{" "}
                              {formatRupiah(item.price)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-sm font-bold">
                          {formatRupiah(item.price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal produk</span>
                  <span>{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ongkos kirim</span>
                  <span>{formatRupiah(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between border-t pt-3 text-base font-extrabold">
                  <span>Total Pembayaran</span>
                  <span className="text-amber-900 dark:text-amber-400">
                    {formatRupiah(order.total)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href={`/check-order?invoice=${encodeURIComponent(order.invoice)}`}
                  className="inline-flex items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-muted"
                >
                  Lacak Pesanan
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-900"
                >
                  Kembali ke Toko
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
