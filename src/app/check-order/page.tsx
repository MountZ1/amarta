"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { STATUS_META, OrderStatus } from "@/lib/order-status";
import { GRIND_SIZES } from "@/lib/coffee";
import {
  Search,
  CheckCircle2,
  Package,
  Truck,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Coffee,
} from "lucide-react";

interface OrderDetail {
  id: number;
  invoice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  provinceName: string | null;
  cityName: string | null;
  districtName: string | null;
  postalCode: string | null;
  courier: string | null;
  courierService: string | null;
  etd: string | null;
  shippingCost: number;
  subtotal: number;
  trackingNumber: string | null;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderItemDetail {
  id: number;
  productId: number;
  weight: number;
  grindSize: string;
  quantity: number;
  price: number;
  productName: string | null;
  productSlug: string | null;
  productOrigin: string | null;
  productVariety: string | null;
  productImageUrl: string | null;
}

function CheckOrderContent() {
  const searchParams = useSearchParams();
  const initialInvoice = searchParams.get("invoice") || "";
  const isSuccess = searchParams.get("success") === "1";

  const [invoiceQuery, setInvoiceQuery] = useState(initialInvoice);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItemDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchOrder = async (inv: string) => {
    if (!inv.trim()) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/orders/invoice/${encodeURIComponent(inv.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Pesanan tidak ditemukan");
      }
      setOrder(data.order);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat status pesanan");
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialInvoice) {
      fetchOrder(initialInvoice);
    }
  }, [initialInvoice]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(invoiceQuery);
  };

  const handleCopyInvoice = () => {
    if (order?.invoice) {
      navigator.clipboard.writeText(order.invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    { key: "pending", label: "Pesanan Dibuat", icon: Clock },
    { key: "processing", label: "Diproses / Disiapkan", icon: Package },
    { key: "shipped", label: "Dalam Pengiriman", icon: Truck },
    { key: "completed", label: "Pesanan Selesai", icon: CheckCircle2 },
  ];

  const getStepStatus = (stepKey: string, currentStatus: OrderStatus) => {
    if (currentStatus === "cancelled") return "cancelled";
    const statusOrder = ["pending", "processing", "shipped", "completed"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex <= currentIndex) return "done";
    return "pending";
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container mx-auto flex-1 px-4 sm:px-6 py-10 max-w-3xl">
        {isSuccess && order && (
          <div className="mb-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">
                Pesanan Anda Berhasil Dibuat!
              </h2>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Invoice <span className="font-mono font-bold">{order.invoice}</span>
              </p>
            </div>
            <div className="mt-5 divide-y border-y border-emerald-200 dark:border-emerald-800">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-emerald-950 dark:text-emerald-100">
                      {item.productName || "Produk tidak tersedia"}
                    </div>
                    <div className="text-xs text-emerald-800 dark:text-emerald-300">
                      {item.weight}g •{" "}
                      {GRIND_SIZES.find(
                        (grind) => grind.value === item.grindSize
                      )?.label || item.grindSize}{" "}
                      • {item.quantity} x {formatRupiah(item.price)}
                    </div>
                  </div>
                  <div className="font-bold text-emerald-950 dark:text-emerald-100">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between font-extrabold text-emerald-950 dark:text-emerald-100">
              <span>Total Pembayaran</span>
              <span>{formatRupiah(order.total)}</span>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lacak Pesanan Kopi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau status pemrosesan dan pengiriman pesanan Anda menggunakan nomor invoice.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mt-6 flex max-w-md mx-auto gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Masukkan nomor invoice (INV-...)"
                value={invoiceQuery}
                onChange={(e) => setInvoiceQuery(e.target.value)}
                className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-amber-800 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-amber-900 disabled:opacity-50"
            >
              {loading ? "Mencari..." : "Lacak"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4 text-sm text-rose-800 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Nomor Invoice
                  </div>
                  <div className="flex items-center gap-2 font-mono text-lg font-bold text-foreground mt-0.5">
                    <span>{order.invoice}</span>
                    <button
                      onClick={handleCopyInvoice}
                      className="text-muted-foreground hover:text-foreground p-1"
                      title="Salin invoice"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Waktu Pesan: {formatDateTime(order.createdAt)}
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-bold ${
                      STATUS_META[order.status]?.bg || ""
                    } ${STATUS_META[order.status]?.color || ""}`}
                  >
                    {STATUS_META[order.status]?.label || order.status}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              {order.status !== "cancelled" ? (
                <div className="py-6 border-b">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {steps.map((st, idx) => {
                      const Icon = st.icon;
                      const status = getStepStatus(st.key, order.status);
                      const isDone = status === "done";
                      return (
                        <div key={st.key} className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                              isDone
                                ? "bg-amber-800 text-white shadow-xs"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span
                            className={`mt-2 text-[11px] font-medium leading-tight ${
                              isDone
                                ? "text-foreground font-bold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-4 border-b text-center text-xs text-rose-600 font-semibold">
                  Pesanan ini telah dibatalkan.
                </div>
              )}

              {/* Customer info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Penerima:</span>
                  <p className="font-semibold text-sm text-foreground mt-0.5">
                    {order.customerName} ({order.phoneNumber})
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Alamat Pengiriman:</span>
                  <p className="font-semibold text-sm text-foreground mt-0.5">
                    {order.address}
                  </p>
                  <p className="font-semibold text-sm text-foreground mt-0.5">
                    {[order.districtName, order.cityName, order.provinceName]
                      .filter(Boolean)
                      .join(", ")}
                    {order.postalCode && ` ${order.postalCode}`}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Kurir:</span>
                  <p className="font-semibold text-sm text-foreground mt-0.5">
                    {order.courier || "-"} {order.courierService || ""}
                    {order.etd && ` (estimasi ${order.etd})`}
                  </p>
                  {order.trackingNumber && (
                    <p className="mt-0.5 text-xs">
                      Resi: <span className="font-mono">{order.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Items details */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs">
              <h3 className="font-bold text-base border-b pb-3 mb-4">
                Daftar Produk yang Dipesan
              </h3>

              <div className="divide-y">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                        {item.productImageUrl ? (
                          <img
                            src={item.productImageUrl}
                            alt={item.productName || "Kopi"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Coffee className="h-5 w-5 text-amber-800 opacity-40" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">
                          {item.productName || "Produk tidak tersedia"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.weight}g •{" "}
                          {GRIND_SIZES.find(
                            (grind) => grind.value === item.grindSize
                          )?.label || item.grindSize}
                          {" • "}
                          {item.quantity} x {formatRupiah(item.price)}
                        </div>
                      </div>
                    </div>

                    <div className="font-bold text-sm text-foreground">
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t pt-4 mt-2">
                <div className="w-full space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal produk</span>
                    <span>{formatRupiah(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ongkos kirim</span>
                    <span>{formatRupiah(order.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="font-bold text-base">Total Tagihan</span>
                    <span className="font-extrabold text-xl text-amber-900 dark:text-amber-400">
                      {formatRupiah(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CheckOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Memuat...</div>}>
      <CheckOrderContent />
    </Suspense>
  );
}
