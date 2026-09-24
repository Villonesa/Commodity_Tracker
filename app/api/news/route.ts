import { NextResponse } from "next/server";

// Caché de 15 minutos en producción (Vercel): la respuesta de esta ruta se
// regenera como máximo una vez cada 900 s, lo que protege el límite diario
// de Twelve Data.
export const revalidate = 900;

// En desarrollo NO usamos caché del runtime de fetch: tras un 429, Next.js
// podía servir la respuesta en caché durante horas aunque la cuota ya se
// hubiera recuperado. La protección real viene del guardamemoria propio
// (CACHE_TTL_MS) y del control de concurrencia de más abajo.
const FETCH_CACHE = process.env.NODE_ENV === "development" ? ("no-store" as const) : ("default" as const);

// Símbolos usados para consultar noticias/press releases en Twelve Data
// (endpoint: /press_releases). Nota verificada empíricamente con la API real:
// los ETFs de materias primas (GLD, USO, XLE) devuelven SIEMPRE una lista
// vacía en este endpoint, por lo que usamos acciones del sector de
// commodities/minería/energía + grandes valores con prensa financiera fresca.
const NEWS_SYMBOLS = ["V", "JPM", "BHP", "FCX"];

interface TDPressRelease {
  id?: string;
  datetime?: string; // ISO 8601, p. ej. "2026-05-28T13:45:00Z"
  title?: string;
  body?: string; // HTML
  language?: string[];
}

interface TDResponse {
  meta?: unknown;
  pagination?: { current_page?: number; per_page?: number };
  press_releases?: TDPressRelease[];
  // Twelve Data señala errores con "code"/"status" (p. ej. 401 key inválida,
  // 429 rate limit) devolviendo HTTP 200 con cuerpo de error.
  code?: number | string;
  status?: string;
  message?: string;
}

// Etiqueta genérica de commodity basada en palabras clave del título
function inferCommodityTag(title: string): string {
  const t = title.toLowerCase();
  if (/copper|gold|silver|zinc|nickel|aluminum|lithium|metal|precious/.test(t)) return "Metales";
  if (/oil|brent|crude|opec|petroleum|gasoline/.test(t)) return "Petróleo";
  if (/natural gas|lng|gas\b/.test(t)) return "Gas Natural";
  if (/energy|power|electric|grid|renewab/.test(t)) return "Energía";
  if (/mining|miner|ore\b/.test(t)) return "Minería";
  return "Commodities";
}

// Convierte el cuerpo HTML de un press release a texto plano legible
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Resumen recortado del body (sin cortar a mitad de palabra)
function buildSummary(body?: string): string {
  if (!body) return "Sin resumen disponible.";
  const text = stripHtml(body);
  if (!text) return "Sin resumen disponible.";
  if (text.length <= 300) return text;
  const cut = text.slice(0, 300);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 200 ? lastSpace : 300)}…`;
}

// Formatea el datetime ISO de Twelve Data ("2026-05-28T13:45:00Z") a fecha
// legible en español. Devuelve undefined si no se puede parsear, para que
// la UI decida cómo mostrarlo.
function formatPublishedDate(isoDate?: string): string | undefined {
  if (!isoDate) return undefined;
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

// Fallback simulado y visible con la MISMA estructura que devuelve la ruta
// real: `date` siempre es una cadena ya formateada en es-ES (no ISO), por lo
// que la UI no se rompe al consumirlo.
async function getMockFallback(reason: string): Promise<NextResponse> {
  console.warn(`[api/news] Fallback a mock data (${reason})`);
  const { mockNews } = await import("@/lib/mockData");
  const simulated = mockNews.map((item) => ({
    ...item,
    title: `[DATOS SIMULADOS - API CAÍDA] ${item.title}`,
    date: formatPublishedDate(item.date) ?? item.date,
  }));
  return NextResponse.json(simulated, { status: 200 });
}

async function fetchPressReleases(
  apiKey: string,
  symbol: string
): Promise<TDPressRelease[]> {
  const url = `https://api.twelvedata.com/press_releases?symbol=${encodeURIComponent(
    symbol
  )}&outputsize=6&apikey=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { cache: FETCH_CACHE });
  if (!res.ok) {
    throw new Error(`Twelve Data respondió con estado ${res.status}`);
  }

  const data = (await res.json()) as TDResponse;

  // Errores de Twelve Data llegan con HTTP 200 + campo "code"/"status"
  if (data?.status === "error" || (data?.code && !Array.isArray(data?.press_releases))) {
    throw new Error(`Twelve Data (${symbol}): ${data?.message ?? `código ${data?.code}`}`);
  }

  return Array.isArray(data?.press_releases) ? data.press_releases : [];
}

// ── Guardamemoria a nivel de proceso + control de concurrencia ────────────
// page.tsx usa `dynamic = "force-dynamic"`, así que CADA recarga de la home
// invoca esta ruta. Con 4 símbolos por barrido y un límite gratuito de 8
// créditos/minuto, recargar varias veces en un minuto agota la cuota (429).
// Solución: cacheamos el resultado 15 min en memoria del servidor y
// serializamos los barridos para que nunca salgan peticiones en paralelo.
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

interface CachedNews {
  body: unknown;
  savedAt: number;
}

let newsCache: CachedNews | null = null;
let inFlight: Promise<CachedNews> | null = null;

async function fetchFreshNews(): Promise<CachedNews> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    return {
      body: { error: "Falta TWELVE_DATA_API_KEY en las variables de entorno (.env.local)" },
      savedAt: Date.now(),
    };
  }

  // Consultamos los símbolos SECUENCIALMENTE (no en paralelo): el plan
  // gratuito de Twelve Data limita a 8 créditos por MINUTO, y cada petición
  // consume 1 crédito. Se toleran fallos parciales: solo caemos a mock si
  // ninguno responde.
  const allItems: { item: TDPressRelease; symbol: string }[] = [];
  const errors: string[] = [];

  for (const symbol of NEWS_SYMBOLS) {
    try {
      const items = await fetchPressReleases(apiKey, symbol);
      for (const item of items) allItems.push({ item, symbol });
    } catch (err) {
      errors.push(`${symbol}: ${String(err)}`);
    }
  }

  if (allItems.length === 0 && errors.length === NEWS_SYMBOLS.length) {
    console.warn(`[api/news] Fallback a mock data (${errors[0]})`);
    const { mockNews } = await import("@/lib/mockData");
    return {
      body: mockNews.map((item) => ({
        ...item,
        title: `[DATOS SIMULADOS - API CAÍDA] ${item.title}`,
        date: formatPublishedDate(item.date) ?? item.date,
      })),
      savedAt: Date.now(),
    };
  }

  if (allItems.length === 0) {
    console.warn("[api/news] Fallback a mock data (Twelve Data no devolvió noticias)");
    const { mockNews } = await import("@/lib/mockData");
    return {
      body: mockNews.map((item) => ({
        ...item,
        title: `[DATOS SIMULADOS - API CAÍDA] ${item.title}`,
        date: formatPublishedDate(item.date) ?? item.date,
      })),
      savedAt: Date.now(),
    };
  }

  // Ordenar por fecha descendente, deduplicar por id/título y quedarse con 6
  const sorted = allItems
    .filter(({ item }) => item?.title)
    .sort((a, b) => {
      const ta = a.item.datetime ? new Date(a.item.datetime).getTime() : 0;
      const tb = b.item.datetime ? new Date(b.item.datetime).getTime() : 0;
      return tb - ta;
    });

  const seen = new Set<string>();
  const news = sorted
    .filter(({ item }) => {
      const key = item.id ?? item.title ?? "";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6)
    .map(({ item, symbol }, index) => ({
      id: item.id ?? String(index + 1),
      title: item.title ?? "Sin título",
      summary: buildSummary(item.body),
      source: "Twelve Data",
      date: formatPublishedDate(item.datetime) ?? new Date().toLocaleDateString("es-ES", { dateStyle: "medium" }),
      commodityTag: inferCommodityTag(`${item.title ?? ""} ${symbol}`),
    }));

  return { body: news, savedAt: Date.now() };
}

export async function GET() {
  try {
    // 1) Caché fresca en memoria → se sirve sin tocar la API
    if (newsCache && Date.now() - newsCache.savedAt < CACHE_TTL_MS) {
      return NextResponse.json(newsCache.body);
    }

    // 2) Si hay un barrido en curso, lo esperamos (evita peticiones paralelas
    //    que agotarían los créditos/minuto)
    if (!inFlight) {
      inFlight = fetchFreshNews().finally(() => {
        inFlight = null;
      });
    }
    const fresh = await inFlight;

    // Solo cacheamos éxitos reales o mocks de fallback; los errores de config
    // (falta API key) no se guardan para poder recuperarse al añadirla.
    const isErrorConfig =
      fresh.body && !Array.isArray(fresh.body) && "error" in (fresh.body as object);
    if (!isErrorConfig) {
      newsCache = fresh;
    } else {
      // No cacheamos el error: caducamos rápido para reintentar tras arreglar .env
      newsCache = { ...fresh, savedAt: Date.now() - CACHE_TTL_MS + 30_000 };
    }

    return NextResponse.json(fresh.body);
  } catch (error) {
    // Cualquier otro fallo (red, parseo, etc.) → fallback simulado y visible
    console.error(`[api/news] Error inesperado: ${String(error)}`);
    return getMockFallback(`Error inesperado: ${String(error)}`);
  }
}
