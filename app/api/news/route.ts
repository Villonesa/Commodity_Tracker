import { NextResponse } from "next/server";
import { fetchLatestNews } from "@/lib/news";

// Fuerza tiempo real estricto: sin caché estático ni revalidación
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/news
 *
 * Toda la lógica vive en lib/news.ts, compartida con la página, para que
 * ambas vías devuelvan exactamente los mismos datos (y el mismo fallback marcado
 * como simulación). El endpoint nunca devuelve 5xx por un fallo de la API
 * externa: en ese caso responde 200 con mocks etiquetados como simulación.
 */
export async function GET() {
  const news = await fetchLatestNews();

  return NextResponse.json(news, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
