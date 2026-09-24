import { NextResponse } from "next/server";

// Tipos básicos de la respuesta de Alpha Vantage (NEWS_SENTIMENT)
interface AVTickerSentiment {
  ticker: string;
  sentiment_type?: string;
}

interface AVFeedItem {
  title: string;
  summary: string;
  url?: string;
  source_domain?: string;
  time_published?: string; // formato YYYYMMDDTHHMMSS
  categories?: { label?: string }[];
  ticker_sentiment?: AVTickerSentiment[];
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

// Formatea time_published (YYYYMMDDTHHMMSS) a una fecha legible
function formatPublishedDate(timePublished?: string): string {
  if (!timePublished) return new Date().toLocaleDateString("es-ES", { dateStyle: "medium" });

  const year = timePublished.slice(0, 4);
  const month = timePublished.slice(4, 6);
  const day = timePublished.slice(6, 8);
  const hours = timePublished.slice(9, 11) || "00";
  const minutes = timePublished.slice(11, 13) || "00";

  const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);

  if (isNaN(date.getTime())) return new Date().toLocaleDateString("es-ES", { dateStyle: "medium" });

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta ALPHA_VANTAGE_API_KEY en las variables de entorno" },
        { status: 500 }
      );
    }

    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=energy_minerals,metals&sort=LATEST&limit=6&apikey=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 900 } }); // cache 15 min

    if (!res.ok) {
      return NextResponse.json(
        { error: `Alpha Vantage respondió con estado ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const feed: AVFeedItem[] = Array.isArray(data?.feed) ? data.feed : [];

    if (feed.length === 0) {
      return NextResponse.json(
        { error: "No se recibieron noticias de Alpha Vantage (posible límite de API alcanzado)" },
        { status: 502 }
      );
    }

    const news = feed.slice(0, 6).map((item, index) => ({
      id: String(index + 1),
      title: item.title ?? "Sin título",
      summary: item.summary ?? "Sin resumen disponible.",
      source: item.source_domain ?? "Fuente desconocida",
      date: formatPublishedDate(item.time_published),
      commodityTag: inferCommodityTag(item.title ?? ""),
    }));

    return NextResponse.json(news);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al consultar Alpha Vantage", details: String(error) },
      { status: 500 }
    );
  }
}
