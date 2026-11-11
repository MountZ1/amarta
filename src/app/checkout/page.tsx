"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/format";
import { CoffeeWeight, GrindSize } from "@/lib/coffee";
import { ShieldCheck, AlertCircle, Truck, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";

interface ValidatedCartItem {
  productId: number;
  name: string;
  weight: CoffeeWeight;
  grindSize: GrindSize;
  grindLabel: string;
  price: number;
  quantity: number;
  available: boolean;
  itemTotal: number;
}

interface ShippingLocation {
  id: number;
  name: string;
}

interface ShippingQuote {
  expeditionId: number;
  courierCode: string;
  courierName: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
  weight: number;
  token: string;
}

const VISIBLE_QUOTES = 3;

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, removeItems, customerInfo, saveCustomerInfo, isLoaded } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [items, setItems] = useState<ValidatedCartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [provinces, setProvinces] = useState<ShippingLocation[]>([]);
  const [cities, setCities] = useState<ShippingLocation[]>([]);
  const [districts, setDistricts] = useState<ShippingLocation[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<ShippingQuote | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAllQuotes, setShowAllQuotes] = useState(false);

  const orderPlaced = useRef(false);

  useEffect(() => {
    setShowAllQuotes(false);
  }, [shippingQuotes]);

  const baseQuotes = showAllQuotes ? shippingQuotes : shippingQuotes.slice(0, VISIBLE_QUOTES);

  const displayedQuotes =
    selectedQuote && !baseQuotes.some((q) => q.token === selectedQuote.token)
      ? [...baseQuotes, selectedQuote]
      : baseQuotes;

  const hiddenQuotesCount = shippingQuotes.length - displayedQuotes.length;

  useEffect(() => {
    let cancelled = false;
    const loadInitialShippingOptions = async () => {
      try {
        const locationsResponse = await fetch(
          "/api/shipping/locations?type=provinces",
        );
        const locationsData = await locationsResponse.json();
        if (!locationsResponse.ok)
          throw new Error(locationsData.error || "Gagal memuat pilihan lokasi");
        if (!cancelled) {
          setProvinces(locationsData.locations || []);
        }
      } catch (error) {
        if (!cancelled) {
          setShippingError(error instanceof Error ? error.message : "Gagal memuat lokasi");
        }
      } finally {
        if (!cancelled) setLoadingLocations(false);
      }
    };

    void loadInitialShippingOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  // Populate initial values from customerInfo (saved in localStorage)
  useEffect(() => {
    if (isLoaded) {
      if (customerInfo.customerName) setName(customerInfo.customerName);
      if (customerInfo.phoneNumber) setPhone(customerInfo.phoneNumber);
      if (customerInfo.address) setAddress(customerInfo.address);
    }
  }, [isLoaded, customerInfo]);

  // Fetch cart details
  useEffect(() => {
    if (!isLoaded) return;

    const checkoutCart = cart.filter((item) => item.selected);
    if (checkoutCart.length === 0 && !orderPlaced.current) {
      router.push("/cart");
      return;
    }

    const validate = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: checkoutCart }),
        });
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
          setSubtotal(data.subtotal || 0);
        }
      } catch (e) {
        console.error("Failed to validate items:", e);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [cart, isLoaded, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    const checkoutCart = cart.filter((item) => item.selected);

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setErrorMessage("Semua data pengiriman wajib diisi");
      return;
    }

    if (checkoutCart.length === 0) {
      setErrorMessage("Pilih minimal satu item untuk checkout");
      return;
    }

    if (items.some((item) => !item.available)) {
      setErrorMessage("Stok item yang dipilih tidak mencukupi");
      return;
    }

    if (!selectedQuote || !postalCode.trim()) {
      setErrorMessage("Pilih lokasi, kurir, layanan, dan hitung ongkos kirim");
      return;
    }

    try {
      setSubmitting(true);

      // Save customer info to local storage for future orders
      saveCustomerInfo({
        customerName: name.trim(),
        phoneNumber: phone.trim(),
        address: address.trim(),
      });

      const payload = {
        customerName: name.trim(),
        phoneNumber: phone.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
        quoteToken: selectedQuote.token,
        items: checkoutCart.map((i) => ({
          productId: i.productId,
          weight: i.weight || 1000,
          grindSize: i.grindSize || "biji",
          quantity: i.quantity,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat pesanan");
      }

      orderPlaced.current = true;

      // Remove only the items that were purchased.
      removeItems(checkoutCart);

      router.push(`/order-success?invoice=${encodeURIComponent(data.order.invoice)}`);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pesanan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loadCities = async (nextProvinceId: string) => {
    setProvinceId(nextProvinceId);
    setCityId("");
    setDistrictId("");
    setCities([]);
    setDistricts([]);
    setShippingQuotes([]);
    setSelectedQuote(null);
    setShippingError("");
    if (!nextProvinceId) return;

    try {
      const response = await fetch(
        `/api/shipping/locations?type=cities&provinceId=${nextProvinceId}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memuat kota");
      setCities(data.locations || []);
    } catch (error) {
      setShippingError(error instanceof Error ? error.message : "Gagal memuat kota");
    }
  };

  const loadDistricts = async (nextCityId: string) => {
    setCityId(nextCityId);
    setDistrictId("");
    setDistricts([]);
    setShippingQuotes([]);
    setSelectedQuote(null);
    setShippingError("");
    if (!nextCityId) return;

    try {
      const response = await fetch(`/api/shipping/locations?type=districts&cityId=${nextCityId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal memuat kecamatan");
      setDistricts(data.locations || []);
    } catch (error) {
      setShippingError(error instanceof Error ? error.message : "Gagal memuat kecamatan");
    }
  };

  const calculateShipping = async () => {
    setShippingError("");
    setSelectedQuote(null);
    setShippingQuotes([]);
    if (!districtId) {
      setShippingError("Pilih provinsi, kota, dan kecamatan terlebih dahulu");
      return;
    }

    try {
      setLoadingQuotes(true);
      const response = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: Number(districtId),
          items: cart
            .filter((item) => item.selected)
            .map((item) => ({ weight: item.weight, quantity: item.quantity })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menghitung ongkir");
      setShippingQuotes(data.quotes || []);
      if (!data.quotes?.length) {
        setShippingError("Tidak ada layanan kurir untuk lokasi tersebut");
      }
    } catch (error) {
      setShippingError(error instanceof Error ? error.message : "Gagal menghitung ongkir");
    } finally {
      setLoadingQuotes(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container mx-auto flex-1 px-4 sm:px-6 py-10 max-w-4xl">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Keranjang</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
          Checkout & Pengiriman
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Data Anda disimpan di peramban sehingga tidak perlu mengisi ulang di pemesanan berikutnya.
        </p>

        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4 text-sm text-rose-800 dark:text-rose-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Customer Form */}
          <div className="md:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border bg-card p-6 shadow-xs"
            >
              <h2 className="font-bold text-lg flex items-center gap-2 border-b pb-3">
                <Truck className="h-5 w-5 text-amber-800" />
                <span>Informasi Pengiriman</span>
              </h2>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Nama Lengkap Penerima *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Provinsi *
                </label>
                <select
                  required
                  disabled={loadingLocations}
                  value={provinceId}
                  onChange={(event) => void loadCities(event.target.value)}
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                >
                  <option value="">Pilih provinsi</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Kota / Kabupaten *
                  </label>
                  <select
                    required
                    disabled={!provinceId || cities.length === 0}
                    value={cityId}
                    onChange={(event) => void loadDistricts(event.target.value)}
                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800 disabled:opacity-50"
                  >
                    <option value="">Pilih kota</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Kecamatan *
                  </label>
                  <select
                    required
                    disabled={!cityId || districts.length === 0}
                    value={districtId}
                    onChange={(event) => {
                      setDistrictId(event.target.value);
                      setShippingQuotes([]);
                      setSelectedQuote(null);
                    }}
                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800 disabled:opacity-50"
                  >
                    <option value="">Pilih kecamatan</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 ">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Kode Pos *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value)}
                    placeholder="Contoh: 55111"
                    className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={loadingQuotes || !districtId}
                onClick={calculateShipping}
                className="w-full rounded-lg border border-amber-800 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
              >
                {loadingQuotes ? "Menghitung ongkir..." : "Hitung Ongkos Kirim"}
              </button>

              {shippingError && <p className="text-sm text-rose-600">{shippingError}</p>}

              {shippingQuotes.length > 0 && (
                <fieldset className="space-y-2">
                  <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Pilih layanan pengiriman *
                  </legend>

                  {displayedQuotes.map((quote) => (
                    <label
                      key={`${quote.expeditionId}-${quote.service}`}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-amber-800 has-[:checked]:bg-amber-50 dark:has-[:checked]:bg-amber-950/30"
                    >
                      <span className="flex min-w-0 items-start gap-2">
                        <input
                          type="radio"
                          name="shippingQuote"
                          checked={selectedQuote?.token === quote.token}
                          onChange={() => setSelectedQuote(quote)}
                          className="mt-1 accent-amber-800"
                        />
                        <span>
                          <span className="block font-semibold">
                            {quote.courierName} {quote.service}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {quote.description}
                            {quote.etd && ` • Estimasi ${quote.etd}`}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 font-bold">{formatRupiah(quote.cost)}</span>
                    </label>
                  ))}

                  {shippingQuotes.length > VISIBLE_QUOTES && (
                    <button
                      type="button"
                      onClick={() => setShowAllQuotes((prev) => !prev)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {showAllQuotes ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          <span>Tampilkan lebih sedikit</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>Tampilkan {hiddenQuotesCount} layanan lainnya</span>
                        </>
                      )}
                    </button>
                  )}
                </fieldset>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Alamat Lengkap Pengiriman *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, kode pos"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-800"
                />
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Invoice pesanan akan otomatis dibuat dan nomor pelacakan dapat disimpan setelah
                  pesanan dibuat.
                </span>
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  loading ||
                  !selectedQuote ||
                  !postalCode.trim() ||
                  cart.filter((item) => item.selected).length === 0 ||
                  items.some((item) => !item.available)
                }
                className="w-full rounded-xl bg-amber-800 py-3 text-sm font-bold text-white shadow-xs hover:bg-amber-900 transition disabled:opacity-50"
              >
                {submitting ? "Memproses Pesanan..." : "Pesan Sekarang (Konfirmasi)"}
              </button>
            </form>
          </div>

          {/* Items Summary */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border bg-card p-6 shadow-xs sticky top-24">
              <h3 className="font-bold text-base border-b pb-3 mb-4">
                Pesanan Anda ({items.reduce((s, i) => s + i.quantity, 0)} pack)
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.weight}-${item.grindSize}`}
                    className="flex justify-between items-start text-xs border-b pb-2"
                  >
                    <div>
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {item.weight}g • {item.grindLabel || item.grindSize}
                      </div>
                      <div className="text-muted-foreground mt-0.5">
                        {item.quantity} x {formatRupiah(item.price)}
                      </div>
                    </div>
                    <div className="font-bold text-foreground">
                      {formatRupiah(item.itemTotal || item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Biaya Pengiriman</span>
                  <span>{formatRupiah(selectedQuote?.cost || 0)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base border-t pt-2">
                  <span>Total Pembayaran</span>
                  <span className="text-amber-900 dark:text-amber-400">
                    {formatRupiah(subtotal + (selectedQuote?.cost || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
