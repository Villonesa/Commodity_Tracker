import { mockNews, NewsItem } from "@/lib/mockData";

/**
 * Capa de datos de noticias, compartida entre:
 *  - app/api/news/route.ts   (endpoint público /api/news)
 *  - app/page.tsx            (Server Component, importación directa)
 *
 * Así el Server Component NO necesita hacer una petición HTTP a su propia
 * API (que en Vercel puede fallar con Deployment Protection o devolver
 * respuestas inesperadas), y ambos consumidores comparten exactamente la
 * misma lógica y el mismo fallback.
 */

// ---------------------------------------------------------------------------
// Tipos de la respuesta de Alpha Vantage (NEWS_SENTIMENT)
// ---------------------------------------------------------------------------
interface AVFeedItem {
  title: string;
  summary: string;
  url?: string;
  source_domain?: string;
  time_published?: string; // formato YYYYMMDDTHHMMSS (UTC)
}

interface AVResponse {
  feed?: AVFeedItem[];
  Information?: string; // presente cuando se excede el rate limit del plan gratuito
  Note?: string;
  "Error Message"?: string;
}

// ---------------------------------------------------------------------------
// Topics VÁLIDOS de Alpha Vantage (según su documentación oficial):
// blockchain, earnings, ipo, mergers_and_acquisitions, financial_markets,
// economy_fiscal, economy_monetary, economy_macro, energy_transportation,
// finance, life_sciences, manufacturing, real_estate, retail_wholesale,
// technology
//
// El código anterior usaba "energy_minerals,metals", que NO existen y hacían
// que la API devolviera un feed vacío.
// ---------------------------------------------------------------------------
const AV_TOPICS = "energy_transportation,financial_markets";

// Plan B si el filtro por topics viene vacío: ETFs representativos de
// materias primas (petróleo, gas natural, cobre, oro y plata).
const AV_FALLBACK_TICKERS = "USO,UNG,CPER,GLD,SLV";

const MAX_NEWS = 6;

// Etiqueta genérica de commodity basada en palabras clave del título
function inferCommodityTag(title: string): string {
  const t = title.toLowerCase();
  if (/copper|gold|silver|zinc|nickel|alumin|lithium|metal|precious/.test(t)) return "Metales";
  if (/oil|brent|crude|opec|petroleum|gasoline/.test(t)) return "Petróleo";
  if (/natural gas|lng|\bgas\b/.test(t)) return "Gas Natural";
  if (/energy|power|electric|grid|renewab/.test(t)) return "Energía";
  if (/mining|miner|\bore\b/.test(t)) return "Minería";
  return "Commodities";
}

/**
 * Convierte time_published (YYYYMMDDTHHMMSS, en UTC) a ISO 8601.
 * Devolver ISO (y no un string ya formateado en español) es la corrección
 * clave: el formateo visual es responsabilidad del componente cliente.
 * Antes NewsCard recibía "14 mar 2026, 10:30" y new Date() lo parseaba
 * como Invalid Date para la mayoría de meses en español.
 */
function avDateToISO(timePublished?: string): string {
  if (timePublished) {
    const year = Number(timePublished.slice(0, 4));
    const month = Number(timePublished.slice(4, 6));
    const day = Number(timePublished.slice(6, 8));
    const hours = Number(timePublished.slice(9, 11) || "0");
    const minutes = Number(timePublished.slice(11, 13) || "0");
    const seconds = Number(timePublished.slice(13, 15) || "0");

    const ms = Date.UTC(year, month - 1, day, hours, minutes, seconds);
    const date = new Date(ms);
    if (!isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

async function fetchAlphaVantage(params: string, apiKey: string): Promise<AVFeedItem[]> {
  const url =
    `https://www.alphavantage.co/query?function=NEWS_SENTIMENT` +
    `&${params}&sort=LATEST&limit=${MAX_NEWS * 2}&apikey=${apiKey}`;

  // cache: 'no-store' → tiempo real estricto, sin respuestas cacheadas
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Alpha Vantage respondió con estado ${res.status}`);

  const data = (await res.json()) as AVResponse;

  // Alpha Vantage devuelve "Information", "Note" o "Error Message" en lugar
  // del array "feed" cuando hay rate limit o un problema con la petición.
  const info = data?.Information ?? data?.Note ?? data?.["Error Message"];
  if (info) throw new Error(`Alpha Vantage: ${String(info)}`);

  return Array.isArray(data?.feed) ? data.feed : [];
}

function mapFeedToNews(feed: AVFeedItem[]): NewsItem[] {
  return feed.slice(0, MAX_NEWS).map((item, index) => ({
    id: `av-${index + 1}`,
    title: item.title ?? "Sin título",
    summary: item.summary ?? "Sin resumen disponible.",
    source: item.source_domain ?? "Fuente desconocida",
    date: avDateToISO(item.time_published), // ← ISO 8601, lo formatea NewsCard
    commodityTag: inferCommodityTag(item.title ?? ""),
  }));
}

/**
 * Fallback visible y HONESTO: se devuelven los datos de prueba con una marca
 * clara de simulación, para que el usuario no confunda mocks con noticias
 * reales (el fallback antiguo de page.tsx los servía sin marcar).
 */
export function getSimulatedNews(reason: string): NewsItem[] {
  console.warn(`[news] Fallback a datos simulados (${reason})`);
  return mockNews.map((item) => ({
    ...item,
    title: `[SIMULACIÓN · límite de API] ${item.title}`,
  }));
}

/**
 * Obtiene las noticias más recientes. Nunca lanza excepciones: si la API
 * falla por cualquier motivo, devuelve el mock marcado como simulación.
 */
export async function fetchLatestNews(): Promise<NewsItem[]> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return getSimulatedNews(
      "falta ALPHA_VANTAGE_API_KEY en las variables de entorno (configúrala en Vercel y .env.local)"
    );
  }

  // Intento 1: filtrar por topics válidos de energía y mercados financieros
  try {
    const feed = await fetchAlphaVantage(`topics=${AV_TOPICS}`, apiKey);
    if (feed.length > 0) return mapFeedToNews(feed);
    console.warn("[news] Topics sin resultados, probando con tickers de ETFs de commodities");
  } catch (error) {
    console.warn("[news] Fallo con topics:", error);
  }

  // Intento 2: sin filtro de topics, por tickers de ETFs de materias primas
  try {
    const feed = await fetchAlphaVantage(`tickers=${AV_FALLBACK_TICKERS}`, apiKey);
    if (feed.length > 0) return mapFeedToNews(feed);
  } catch (error) {
    return getSimulatedNews(error instanceof Error ? error.message : String(error));
  }

  return getSimulatedNews("Alpha Vantage no devolvió noticias en ningún intento");
}

export type { NewsItem };
