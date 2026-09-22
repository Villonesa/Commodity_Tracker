export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  date: string;
  commodityTag: string;
}

export const mockNews: NewsItem[] = [
  {
    id: "1",
    title: "El Cobre Alcanza Máximos de 6 Meses por Disrupciones en Chile",
    summary: "Las principales mineras de Chile reportan reducciones en la producción debido a huelgas laborales y restricciones hídricas. Los analistas proyectan un déficit global de oferta para Q2 2025.",
    source: "Bloomberg",
    date: "2025-03-14",
    commodityTag: "Cobre"
  },
  {
    id: "2",
    title: "Petróleo Brent Supera los $85/barril ante Tensiones Geopolíticas",
    summary: "Los precios del crudo se disparan tras anuncios de recortes adicionales de producción por parte de la OPEP+. Los mercados energéticos reaccionan con volatilidad ante la incertidumbre en el Mar Rojo.",
    source: "Reuters",
    date: "2025-03-14",
    commodityTag: "Petróleo Brent"
  },
  {
    id: "3",
    title: "El Oro Se Mantiene como Refugio Seguro en Medio de Incertidumbre Económica",
    summary: "Los inversores institucionales aumentan sus posiciones en oro físico y ETFs respaldados por metales preciosos. La demanda de bancos centrales alcanza niveles récord por tercer trimestre consecutivo.",
    source: "Financial Times",
    date: "2025-03-13",
    commodityTag: "Oro"
  },
  {
    id: "4",
    title: "Gas Natural Cae un 12% por Pronósticos de Temperaturas Suaves",
    summary: "Los futuros del gas natural retroceden significativamente tras las previsiones meteorológicas que indican un final de invierno más cálido de lo esperado en Europa y Norteamérica, reduciendo la demanda de calefacción.",
    source: "Wall Street Journal",
    date: "2025-03-13",
    commodityTag: "Gas Natural"
  }
];
