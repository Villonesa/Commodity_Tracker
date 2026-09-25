import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title, summary } = await request.json();

    if (!title || !summary) {
      return NextResponse.json(
        { error: "Faltan los campos 'title' y 'summary'." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "No se encontró la variable de entorno GEMINI_API_KEY." },
        { status: 500 }
      );
    }

    const prompt = `Actúa como un analista experto en mercados de materias primas. Explica la siguiente noticia para un usuario sin conocimientos técnicos. Detalla brevemente por qué es importante y cómo podría afectar a la oferta, la demanda o los precios. Sé directo, usa viñetas si aporta claridad y no superes los 3 párrafos cortos. Noticia: ${title} - ${summary}`;

    // Corrección: "gemini-1.5-flash" está retirado y la API devuelve 404.
    // El modelo es configurable por variable de entorno para futuros cambios;
    // el valor por defecto es el modelo Flash actual recomendado por Google.
    const geminiModel = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error en la API de Gemini:", response.status, errorBody);
      throw new Error(`Gemini respondió con estado ${response.status}`);
    }

    const data = await response.json();
    const explanation: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!explanation.trim()) {
      throw new Error("La IA no devolvió contenido utilizable.");
    }

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error al generar la explicación con IA:", error);
    return NextResponse.json(
      { error: "Error al generar la explicación" },
      { status: 502 }
    );
  }
}
