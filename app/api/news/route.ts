import { NextResponse } from "next/server";

// Caché de 15 minutos: la respuesta de esta ruta se regenera como máximo
// una vez cada 900 s, lo que protege el límite diario de Twelve Data.
export const revalidate = 900;

// Símbolos de referencia del sector de commodities usados para consultar
// noticias/press releases en Twelve Data (endpoint: /press_releases).
const NEWS_SYMBOLS = ["GLD", "USO", "XLE", "FCX"];

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

  // cache: "no-store" porque la caché de la propia ruta (revalidate=900) ya
  // limita las llamadas salientes; así evitamos cachés encadenadas obsoletas.
  const res = await fetch(url, { cache: "no-store" });
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

export async function GET() {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta TWELVE_DATA_API_KEY en las variables de entorno (.env.local)" },
        { status: 500 }
      );
    }

    // Consultamos varios símbolos del sector y combinamos los resultados.
    // Se toleran fallos parciales: solo caemos a mock si ninguno responde.
    const results = await Promise.allSettled(
      NEWS_SYMBOLS.map((symbol) => fetchPressReleases(apiKey, symbol))
    );

    const allItems: { item: TDPressRelease; symbol: string }[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const item of r.value) allItems.push({ item, symbol: "" });
      }
    }

    const fulfilledCount = results.filter((r) => r.status === "fulfilled").length;

    if (fulfilledCount === 0) {
      const reason =
        results[0]?.status === "rejected" ? String(results[0].reason) : "sin respuestas";
      return getMockFallback(`Todas las peticiones a Twelve Data fallaron: ${reason}`);
    }

    if (allItems.length === 0) {
      return getMockFallback("Twelve Data no devolvió noticias en ningún símbolo consultado");
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
      .map(({ item }, index) => ({
        id: item.id ?? String(index + 1),
        title: item.title ?? "Sin título",
        summary: buildSummary(item.body),
        source: "Twelve Data",
        date: formatPublishedDate(item.datetime) ?? new Date().toLocaleDateString("es-ES", { dateStyle: "medium" }),
        commodityTag: inferCommodityTag(item.title ?? ""),
      }));

    return NextResponse.json(news);
  } catch (error) {
    // Cualquier otro fallo (red, parseo, etc.) → fallback simulado y visible
    return getMockFallback(`Error inesperado: ${String(error)}`);
  }
}
