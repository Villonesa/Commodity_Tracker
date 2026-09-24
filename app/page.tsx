import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import TradingViewTicker from "@/components/TradingViewTicker";
import { mockNews, NewsItem } from "@/lib/mockData";

// Fuerza renderizado dinámico para consultar las noticias más recientes
export const dynamic = "force-dynamic";

async function getNews(): Promise<NewsItem[]> {
  try {
    // En un Server Component podemos usar la URL absoluta del entorno
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/news`, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`La API respondió con estado ${res.status}`);
    }

    const news = (await res.json()) as NewsItem[];

    if (!Array.isArray(news) || news.length === 0) {
      throw new Error("La API no devolvió noticias");
    }

    return news;
  } catch (error) {
    // Fallback a datos de prueba si la API real falla (límite de Alpha Vantage, red, etc.)
    console.warn("No se pudieron obtener noticias reales, usando mock data:", error);
    return mockNews;
  }
}

export default async function Home() {
  const news = await getNews();

  return (
    <>
      <Header projectName="Commodities Tracker" />
      <TradingViewTicker />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      </main>
    </>
  );
}
