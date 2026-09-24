'use client';

import { useState } from 'react';
import { NewsItem } from "@/lib/mockData";

interface NewsCardProps {
  news: NewsItem;
}

// Formatea la fecha de la noticia de forma segura:
// - Si llega en formato ISO (p. ej. "2026-09-25" o "2026-05-28T13:45:00Z"),
//   se parsea con new Date() y se muestra en es-ES. Esto evita el bug de
//   Safari/NaN al parsear "2025-03-14" sin componente de tiempo ni zona.
// - Si ya viene como texto legible (fallback mock o API), se muestra tal cual.
function formatDisplayDate(raw?: string): string {
  if (!raw) return '';
  const isoLike = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(raw);
  if (isoLike) {
    // Normaliza "YYYY-MM-DD HH:mm:ss" (sin zona) a ISO con 'T' para máxima compatibilidad
    const normalized = raw.includes(' ') && !raw.endsWith('Z') ? `${raw.replace(' ', 'T')}Z` : raw;
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }
  return raw;
}

export default function NewsCard({ news }: NewsCardProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleExplain = async () => {
    setIsExplaining(true);

    try {
      // Llamada real a nuestra API Route que conecta con Gemini
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: news.title,
          summary: news.summary,
        }),
      });

      if (!response.ok) {
        throw new Error(`La API respondió con estado ${response.status}`);
      }

      const data = await response.json();
      setExplanation(`🤖 ${data.explanation}`);
    } catch (error) {
      console.error('Error al solicitar la explicación:', error);
      setExplanation('Error al generar la explicación');
    } finally {
      setIsExplaining(false);
    }
  };

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
        {formatDisplayDate(news.date)}
      </div>

      {/* Botón de acción principal */}
      {!explanation && (
        <button
          onClick={handleExplain}
          disabled={isExplaining}
          className="w-full py-2.5 px-4 border border-amber-500/50 text-amber-500 rounded-md text-sm font-medium hover:bg-amber-500/10 hover:border-amber-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isExplaining ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analizando con IA...
            </>
          ) : (
            'Entender esta noticia'
          )}
        </button>
      )}

      {/* Completed State */}
      {explanation && !isExplaining && (
        <div className="w-full py-2.5 px-4 border border-neutral-700 bg-neutral-800/30 rounded-md text-neutral-400 text-sm text-center cursor-default">
          ✓ Análisis completado
        </div>
      )}

      {/* Explanation Insight */}
      {explanation && (
        <div className="bg-neutral-800/80 border-l-4 border-amber-500 p-4 mt-4 rounded-r-md">
          <p className="text-sm text-neutral-300 leading-relaxed">
            {explanation}
          </p>
        </div>
      )}
    </article>
  );
}
