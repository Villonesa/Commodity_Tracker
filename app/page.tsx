import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import TradingViewTicker from "@/components/TradingViewTicker";
import { fetchLatestNews } from "@/lib/news";

// Fuerza renderizado dinámico para consultar las noticias más recientes
// en cada petición (sin caché estática de la página).
export const dynamic = "force-dynamic";

export default async function Home() {
  // Corrección: se importa la capa de datos directamente en lugar de hacer
  // fetch HTTP a /api/news desde el propio servidor. Ese auto-fetch era
  // frágil en Vercel (falla si el despliegue tiene Deployment Protection
  // activada → 401 → fallback silencioso a mocks) y añadía latencia extra.
  const news = await fetchLatestNews();

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
