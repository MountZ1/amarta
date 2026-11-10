"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah, formatDateTime } from "@/lib/format";
import { STATUS_META, OrderStatus } from "@/lib/order-status";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Award,
  AlertTriangle,
  Clock,
  Calendar,
  Radio,
  ArrowRight,
} from "lucide-react";
import todayLocal from "@/lib/todayLocal";

interface TopProduct {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalSalesAmount: number;
}

interface OrderItem {
  id: number;
  invoice: string;
  customerName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

interface LowStockProduct {
  id: number;
  name: string;
  stock: number;
  origin: string;
  price: number;
}

interface DashboardMetrics {
  totalSales: number;
  totalRevenue: number;
  topProduct: TopProduct | null;
  latestOrders: OrderItem[];
  lowestStockProducts: LowStockProduct[];
  timestamp?: string;
}

export default function AdminDashboardPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateReady, setDateReady] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalRevenue: 0,
    topProduct: null,
    latestOrders: [],
    lowestStockProducts: [],
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const today = todayLocal();
    setStartDate(today);
    setEndDate(today);
    setDateReady(true);
  }, []);

  useEffect(() => {
    if (!dateReady) return;
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      const params = new URLSearchParams();
      if (startDate) params.set("start", startDate);
      if (endDate) params.set("end", endDate);

      const url = `/api/admin/sse/dashboard?${params.toString()}`;
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMetrics(data);
        } catch (e) {
          console.error("Failed to parse SSE data:", e);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [startDate, endDate]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Penjualan
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Pantau metrik penjualan dan analitik inventaris secara realtime melalui SSE.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${connected
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800"
              }`}
          >
            <Radio className={`h-3 w-3 ${connected ? "animate-pulse text-emerald-600" : ""}`} />
            <span>{connected ? "Realtime SSE Aktif" : "Menghubungkan..."}</span>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <Calendar className="h-4 w-4" />
          <span>Filter Tanggal:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Mulai:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-800"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                const t = todayLocal();
                setStartDate(t);
                setEndDate(t);
              }}
              className="rounded-lg bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Sales */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Penjualan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-foreground">{metrics.totalSales}</div>
          <p className="text-xs text-muted-foreground mt-1">Transaksi pesanan</p>
        </div>

        {/* Total Revenue */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Pendapatan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">
            {formatRupiah(metrics.totalRevenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Pendapatan kotor</p>
        </div>

        {/* Top Product */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Produk Terlaris
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 text-xl font-extrabold text-amber-900 dark:text-amber-400 line-clamp-1">
            {metrics.topProduct ? metrics.topProduct.productName : "Belum ada"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.topProduct
              ? `Terjual ${metrics.topProduct.totalQuantity} unit (${formatRupiah(
                metrics.topProduct.totalSalesAmount,
              )})`
              : "Menunggu transaksi"}
          </p>
        </div>
      </div>

      {/* Two Columns: 5 Latest Orders & 5 Lowest Stock Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 5 Latest Orders */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-800" />
              <h3 className="font-bold text-base">5 Order Terbaru</h3>
            </div>
            <Link
              href="/auth/orders"
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Semua Pesanan</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {metrics.latestOrders.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Belum ada pesanan terbaru.
            </p>
          ) : (
            <div className="divide-y">
              {metrics.latestOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <div className="font-mono font-bold text-foreground">{order.invoice}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {order.customerName} • {formatDateTime(order.createdAt)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatRupiah(order.total)}</div>
                    <span
                      className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_META[order.status]?.bg || ""
                        } ${STATUS_META[order.status]?.color || ""}`}
                    >
                      {STATUS_META[order.status]?.label || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5 Lowest Stock Products */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <h3 className="font-bold text-base">5 Produk Stok Paling Sedikit</h3>
            </div>
            <Link
              href="/auth/products"
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Kelola Produk</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {metrics.lowestStockProducts.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Belum ada data produk.</p>
          ) : (
            <div className="divide-y">
              {metrics.lowestStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <div className="font-bold text-foreground">{p.name}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {p.origin} • {formatRupiah(p.price)}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-extrabold ${p.stock === 0
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : p.stock <= 5
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-muted text-foreground"
                        }`}
                    >
                      Stok: {p.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
