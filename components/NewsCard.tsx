'use client';

import { useState } from 'react';
import { NewsItem } from "@/lib/mockData";

interface NewsCardProps {
  news: NewsItem;
}

/**
 * Formatea la fecha ISO 8601 que llega de la API/mock.
 *
 * Corrección: antes el componente hacía new Date(news.date) sobre un string
 * YA formateado en español ("14 mar 2026, 10:30") que le llegaba de la API.
 * El parser de Date no entiende las abreviaturas de mes en español
 * (ene, abr, ago, sept, dic…), así que mostraba "Invalid Date".
 * Ahora la API envía ISO 8601 crudo y el formateo visual ocurre aquí.
 *
 * timeZone: 'UTC' fija el huso para que el HTML del servidor y la
 * hidratación del cliente generen exactamente el mismo texto
 * (evita hydration mismatch) y para respetar la hora UTC de Alpha Vantage.
 */
function formatNewsDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) {
    // Última red de seguridad: muestra el valor crudo en lugar de "Invalid Date"
    return isoDate;
  }
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(date);
}

export default function NewsCard({ news }: NewsCardProps) {
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  const handleExplain = async () => {
    setIsExplaining(true);
    setExplainError(null);

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

      if (!data?.explanation) {
        throw new Error('La respuesta no incluyó el campo "explanation"');
      }

      setExplanation(`🤖 ${data.explanation}`);
    } catch (error) {
      console.error('Error al solicitar la explicación:', error);
      // Corrección: el error se guarda en un estado propio. Antes se metía
      // el texto "Error al generar…" en `explanation`, lo que activaba el
      // bloque "✓ Análisis completado" y ocultaba el botón para siempre.
      setExplainError('No se pudo generar el análisis. Inténtalo de nuevo.');
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

      {/* Fecha (ISO → formato legible, con guardia anti "Invalid Date") */}
      <div className="text-xs text-neutral-500 mb-4">
        {formatNewsDate(news.date)}
      </div>

      {/* Botón de acción principal (visible mientras no haya análisis) */}
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
          ) : explainError ? (
            'Reintentar análisis'
          ) : (
            'Entender esta noticia'
          )}
        </button>
      )}

      {/* Mensaje de error con posibilidad de reintento */}
      {explainError && !isExplaining && !explanation && (
        <p className="text-xs text-red-400/80 mt-2 text-center">{explainError}</p>
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
          <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
            {explanation}
          </p>
        </div>
      )}
    </article>
  );
}
