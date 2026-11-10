"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Coffee, ShoppingCart, Search, ShieldCheck } from "lucide-react";

export function Navbar() {
  const { totalItemsCount, isLoaded } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-amber-900 dark:text-amber-500">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-800 text-amber-100 shadow-sm">
            <Coffee className="h-5 w-5" />
          </div>
          <span>Amarta Kopi</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Katalog
          </Link>
          <Link
            href="/check-order"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            <span>Lacak Order</span>
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative flex h-10 items-center justify-center rounded-lg border bg-background px-3.5 text-sm font-medium shadow-xs transition hover:bg-muted"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Keranjang</span>
            {isLoaded && totalItemsCount > 0 && (
              <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-800 px-1 text-xs font-semibold text-white">
                {totalItemsCount}
              </span>
            )}
          </Link>

          <Link
            href="/auth/dashboard"
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-muted px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
            title="Area Admin"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden md:inline">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
