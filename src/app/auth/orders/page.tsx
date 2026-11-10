"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import {
  STATUS_META,
  OrderStatus,
  getNextAllowedStatuses,
} from "@/lib/order-status";
import {
  Radio,
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Truck,
  Package,
  Search,
} from "lucide-react";

interface AdminOrder {
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

export default function AdminOrdersPage() {
  const [ordersList, setOrdersList] = useState<AdminOrder[]>([]);
  const [connected, setConnected] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/admin/sse/orders");

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.orders) {
            setOrdersList(data.orders);
          }
        } catch (e) {
          console.error("Failed to parse orders SSE:", e);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleUpdateStatus = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui status");
      }

      // Optimistically update local list
      setOrdersList((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status pesanan");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = ordersList.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [o.invoice, o.customerName, o.phoneNumber].some((value) =>
        value.toLowerCase().includes(query)
      );
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Daftar Pesanan (Realtime SSE)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pesanan baru dan status terupdate otomatis tanpa reload halaman.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              connected
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <Radio
              className={`h-3 w-3 ${
                connected ? "animate-pulse text-emerald-600" : ""
              }`}
            />
            <span>{connected ? "Realtime Aktif" : "Menghubungkan..."}</span>
          </div>
        </div>
      </div>

      <label className="relative block max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Cari invoice, nama, atau nomor telepon..."
          className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
        />
      </label>

      {/* Filter by status */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-3 shadow-xs text-xs">
        <span className="font-bold text-muted-foreground uppercase tracking-wider mr-2">
          Status:
        </span>
        {[
          { key: "all", label: "Semua" },
          { key: "pending", label: "Pending" },
          { key: "processing", label: "Diproses" },
          { key: "shipped", label: "Dikirim" },
          { key: "completed", label: "Selesai" },
          { key: "cancelled", label: "Dibatalkan" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              statusFilter === tab.key
                ? "bg-amber-800 text-white shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm font-semibold">Tidak ada pesanan ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/40 font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone Number</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Aksi Transisi Status</th>
                  <th className="px-4 py-3 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => {
                  const allowedNext = getNextAllowedStatuses(order.status);
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-muted/30 transition">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        <Link
                          href={`/auth/orders/${order.id}`}
                          className="hover:underline hover:text-amber-800"
                        >
                          {order.invoice}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {order.phoneNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            STATUS_META[order.status]?.bg || ""
                          } ${STATUS_META[order.status]?.color || ""}`}
                        >
                          {STATUS_META[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground">
                        {formatRupiah(order.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {order.status === "pending" && (
                            <>
                              <button
                                disabled={isUpdating}
                                onClick={() =>
                                  handleUpdateStatus(order.id, "processing")
                                }
                                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-blue-700 disabled:opacity-50"
                              >
                                <Package className="h-3 w-3" />
                                <span>Proses</span>
                              </button>
                              <button
                                disabled={isUpdating}
                                onClick={() =>
                                  handleUpdateStatus(order.id, "cancelled")
                                }
                                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-rose-700 disabled:opacity-50"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>Batalkan</span>
                              </button>
                            </>
                          )}

                          {order.status === "processing" && (
                            <button
                              disabled={isUpdating}
                              onClick={() =>
                                handleUpdateStatus(order.id, "shipped")
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-purple-700 disabled:opacity-50"
                            >
                              <Truck className="h-3 w-3" />
                              <span>Kirimkan</span>
                            </button>
                          )}

                          {order.status === "shipped" && (
                            <button
                              disabled={isUpdating}
                              onClick={() =>
                                handleUpdateStatus(order.id, "completed")
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Selesaikan</span>
                            </button>
                          )}

                          {allowedNext.length === 0 && (
                            <span className="text-[11px] text-muted-foreground italic">
                              Status Final
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/auth/orders/${order.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1 text-[11px] font-semibold hover:bg-muted"
                        >
                          <span>Lihat</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
