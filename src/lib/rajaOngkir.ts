const BASE = process.env.RAJAONGKIR_BASE_URL ?? "https://rajaongkir.komerce.id/api/v1";

function getApiKey() {
  const key = process.env.RAJAONGKIR_API_KEY;
  if (!key) throw new Error("RAJAONGKIR_API_KEY belum dikonfigurasi");
  return key;
}

export async function rajaOngkirGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { key: getApiKey() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`RajaOngkir ${path} gagal (${res.status})`);
  }
  const json = await res.json();
  return json.data as T;
}

export async function rajaOngkirPost<T>(path: string, body: URLSearchParams): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      key: getApiKey(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const raw = await res.text();

  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error(`RajaOngkir ${path} gagal`, {
      status: res.status,
      meta: json?.meta,
      body: json ? undefined : raw.slice(0, 300),
    });
    throw new Error(
      `RajaOngkir ${path} gagal (${res.status}): ${json?.meta?.message ?? "tanpa pesan"}`,
    );
  }

  if (json?.meta && json.meta.code !== 200) {
    console.error(`RajaOngkir ${path} meta error`, json.meta);
    throw new Error(`RajaOngkir ${path}: ${json.meta.message ?? "respons tidak berhasil"}`);
  }

  return json?.data as T;
}
