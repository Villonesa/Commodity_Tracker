export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  /** Fecha en formato ISO 8601 (p. ej. "2026-09-25T14:30:00.000Z"). NewsCard se encarga de formatearla. */
  date: string;
  commodityTag: string;
}

/**
 * Datos de prueba usados SOLO como fallback cuando Alpha Vantage no está
 * disponible (sin clave, rate limit del plan gratuito, caída de red…).
 *
 * Las fechas se generan relativas a "ahora" para que, en caso de fallback,
 * la cuadrícula no muestre noticias de hace meses (hoy hace 3h, ayer, etc.).
 * Estos mocks siempre se sirven marcados con el prefijo "[SIMULACIÓN…]"
 * desde lib/news.ts para que no se confundan con noticias reales.
 */
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const mockNews: NewsItem[] = [
  {
    id: "mock-1",
    title: "El Cobre Alcanza Máximos de 6 Meses por Disrupciones en Chile",
    summary:
      "Las principales mineras de Chile reportan reducciones en la producción debido a huelgas laborales y restricciones hídricas. Los analistas proyectan un déficit global de oferta para el próximo trimestre.",
    source: "Bloomberg",
    date: hoursAgo(2),
    commodityTag: "Cobre",
  },
  {
    id: "mock-2",
    title: "Petróleo Brent Supera los $85/barril ante Tensiones Geopolíticas",
    summary:
      "Los precios del crudo se disparan tras anuncios de recortes adicionales de producción por parte de la OPEP+. Los mercados energéticos reaccionan con volatilidad ante la incertidumbre en el Mar Rojo.",
    source: "Reuters",
    date: hoursAgo(5),
    commodityTag: "Petróleo Brent",
  },
  {
    id: "mock-3",
    title: "El Oro Se Mantiene como Refugio Seguro en Medio de Incertidumbre Económica",
    summary:
      "Los inversores institucionales aumentan sus posiciones en oro físico y ETFs respaldados por metales preciosos. La demanda de bancos centrales alcanza niveles récord por tercer trimestre consecutivo.",
    source: "Financial Times",
    date: hoursAgo(9),
    commodityTag: "Oro",
  },
  {
    id: "mock-4",
    title: "Gas Natural Cae un 12% por Pronósticos de Temperaturas Suaves",
    summary:
      "Los futuros del gas natural retroceden significativamente tras las previsiones meteorológicas que indican un final de invierno más cálido de lo esperado en Europa y Norteamérica, reduciendo la demanda de calefacción.",
    source: "Wall Street Journal",
    date: hoursAgo(26),
    commodityTag: "Gas Natural",
  },
];
