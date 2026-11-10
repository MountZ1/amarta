"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  ExternalLink,
  Coffee,
} from "lucide-react";

function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/auth/login") {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const navLinks = [
    { href: "/auth/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/auth/products", label: "Produk", icon: Package },
    { href: "/auth/orders", label: "Pesanan", icon: ShoppingBag },
    { href: "/auth/users", label: "Admin Users", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/auth/dashboard"
            className="flex items-center gap-2 font-bold text-lg text-amber-900 dark:text-amber-500"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-800 text-amber-100">
              <Coffee className="h-4 w-4" />
            </div>
            <span className="hidden sm:inline">Amarta Admin</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/auth/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-amber-800 text-white shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <span>Lihat Toko</span>
            <ExternalLink className="h-3 w-3" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            title="Keluar dari akun admin"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/60 dark:bg-slate-950">
      <Suspense fallback={<div className="h-16 border-b" />}>
        <AdminHeader />
      </Suspense>
      <main className="container mx-auto flex-1 px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
