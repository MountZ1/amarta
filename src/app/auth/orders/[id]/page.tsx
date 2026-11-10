"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatRupiah, formatDateTime } from "@/lib/format";
import {
  STATUS_META,
  OrderStatus,
  getNextAllowedStatuses,
} from "@/lib/order-status";
import { GRIND_SIZES } from "@/lib/coffee";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Coffee,
  Calendar,
  User,
  Phone,
  MapPin,
  Clock,
} from "lucide-react";

interface OrderData {
  id: number;
  invoice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface ItemData {
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

function AdminOrderDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memuat detail pesanan");
      }
      setOrder(data.order);
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (nextStatus: OrderStatus) => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah status");
      }

      setOrder(data.order);
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        Memuat detail pesanan...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-semibold text-rose-600 mb-4">
          {error || "Pesanan tidak ditemukan"}
        </p>
        <Link
          href="/auth/orders"
          className="text-xs font-semibold text-amber-800 hover:underline"
        >
          &larr; Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  const allowedNext = getNextAllowedStatuses(order.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/auth/orders"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali ke Daftar Pesanan</span>
      </Link>

      {/* Main Order Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Invoice Pesanan
            </div>
            <h1 className="font-mono text-2xl font-extrabold text-foreground mt-0.5">
              {order.invoice}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Dibuat: {formatDateTime(order.createdAt)}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Diperbarui: {formatDateTime(order.updatedAt)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-bold ${
                STATUS_META[order.status]?.bg || ""
              } ${STATUS_META[order.status]?.color || ""}`}
            >
              {STATUS_META[order.status]?.label || order.status}
            </span>
          </div>
        </div>

        {/* Status Transition Action Buttons */}
        <div className="py-4 border-b flex flex-wrap items-center justify-between gap-3 bg-muted/20 rounded-xl px-4 my-4">
          <div className="text-xs">
            <span className="font-bold text-foreground">Aksi Perubahan Status:</span>{" "}
            <span className="text-muted-foreground">
              {allowedNext.length > 0
                ? "Pilih status berikutnya yang diizinkan sesuai alur bisnis."
                : "Pesanan ini sudah mencapai status final."}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {order.status === "pending" && (
              <>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus("processing")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Proses Pesanan</span>
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleUpdateStatus("cancelled")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Batalkan Pesanan</span>
                </button>
              </>
            )}

            {order.status === "processing" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("shipped")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Kirimkan Pesanan</span>
              </button>
            )}

            {order.status === "shipped" && (
              <button
                disabled={updating}
                onClick={() => handleUpdateStatus("completed")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Selesaikan Pesanan</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 text-xs">
          <div className="flex items-start gap-2.5">
            <User className="h-4 w-4 text-amber-800 mt-0.5" />
            <div>
              <span className="text-muted-foreground font-semibold">
                Nama Pelanggan:
              </span>
              <p className="font-bold text-sm text-foreground mt-0.5">
                {order.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="h-4 w-4 text-amber-800 mt-0.5" />
            <div>
              <span className="text-muted-foreground font-semibold">
                Nomor Telepon:
              </span>
              <p className="font-mono font-bold text-sm text-foreground mt-0.5">
                {order.phoneNumber}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-amber-800 mt-0.5" />
            <div>
              <span className="text-muted-foreground font-semibold">
                Alamat Pengiriman:
              </span>
              <p className="font-medium text-xs text-foreground mt-0.5">
                {order.address}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs">
        <h3 className="font-bold text-base border-b pb-3 mb-4">
          Rincian Produk Pesanan
        </h3>

        <div className="divide-y">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3.5 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
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
                  <div className="font-bold text-sm text-foreground">
                    {item.productName || "Produk tidak tersedia"}
                  </div>
                  <div className="text-muted-foreground mt-0.5">
                    {item.weight}g •{" "}
                    {GRIND_SIZES.find((grind) => grind.value === item.grindSize)
                      ?.label || item.grindSize}
                    {item.productVariety && ` • ${item.productVariety}`}
                    {item.productOrigin && ` • ${item.productOrigin}`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-muted-foreground">
                  {item.quantity} x {formatRupiah(item.price)}
                </div>
                <div className="font-extrabold text-sm text-foreground mt-0.5">
                  {formatRupiah(item.quantity * item.price)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center border-t pt-4 mt-2">
          <span className="font-bold text-base">Total Pesanan</span>
          <span className="font-extrabold text-2xl text-amber-900 dark:text-amber-400">
            {formatRupiah(order.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-muted-foreground">Memuat detail pesanan...</div>}>
      <AdminOrderDetailContent />
    </Suspense>
  );
}
