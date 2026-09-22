import { NewsItem } from "@/lib/mockData";

interface NewsCardProps {
  news: NewsItem;
}

export default function NewsCard({ news }: NewsCardProps) {
  return (
    <article className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-5 hover:border-neutral-700 hover:bg-neutral-900/80 transition-all duration-200 flex flex-col">
      {/* Header con tag y fuente */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
          {news.commodityTag}
        </span>
        <span className="text-xs text-neutral-500">{news.source}</span>
      </div>

      {/* Título */}
      <h3 className="text-lg font-semibold text-neutral-100 mb-2 leading-tight">
        {news.title}
      </h3>

      {/* Resumen */}
      <p className="text-neutral-400 text-sm mb-4 flex-grow leading-relaxed">
        {news.summary}
      </p>

      {/* Fecha */}
      <div className="text-xs text-neutral-500 mb-4">
        {new Date(news.date).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </div>

      {/* Botón de acción principal */}
      <button className="w-full py-2.5 px-4 border border-amber-500/50 text-amber-500 rounded-md text-sm font-medium hover:bg-amber-500/10 hover:border-amber-500 transition-colors duration-200">
        Entender esta noticia
      </button>
    </article>
  );
}
