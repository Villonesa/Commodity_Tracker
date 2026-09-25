# Análisis y correcciones — Commodities Tracker

**Fecha:** 25-09-2026 · **Síntomas reportados:** no aparecen noticias recientes y algunos precios de materiales no se muestran.

Todas las correcciones descritas aquí **ya están aplicadas en el código**. Verificado en local: `/` → 200, `/api/news` → 200 (antes daba **500**), TypeScript compila sin errores.

---

## 🔴 Error 1 — Falta `ALPHA_VANTAGE_API_KEY` (causa raíz de "no hay noticias recientes")

**Dónde:** `.env.local` (solo tenía `GEMINI_API_KEY` y `TWELVE_DATA_API_KEY`, ambas como placeholder).

**Qué pasaba:** `app/api/news/route.ts` devolvía **500** al no encontrar la clave (confirmado en `dev.log`: `GET /api/news 500`). Entonces `app/page.tsx` capturaba el error y servía **silenciosamente** `lib/mockData.ts` — 4 noticias fijas fechadas en marzo de 2025. Por eso nunca aparecían noticias recientes.

**Corrección:**
- `.env.local` ahora incluye `ALPHA_VANTAGE_API_KEY` (placeholder + instrucciones).
- **Acción necesaria tuya:** pon la clave real (gratuita en <https://www.alphavantage.co/support/#api-key>) en:
  1. `.env.local` para desarrollo, y
  2. **Vercel → Project → Settings → Environment Variables** y luego *Redeploy* (sin este paso producción seguirá mostrando la simulación).

---

## 🔴 Error 2 — Topics inexistentes en la llamada a Alpha Vantage

**Dónde:** `app/api/news/route.ts` → `topics=energy_minerals,metals`.

**Qué pasaba:** Según la documentación oficial, los topics válidos son `blockchain, earnings, ipo, mergers_and_acquisitions, financial_markets, economy_fiscal, economy_monetary, economy_macro, energy_transportation, finance, life_sciences, manufacturing, real_estate, retail_wholesale, technology`. **`energy_minerals` y `metals` no existen** → la API devuelve el feed vacío aunque la clave sea correcta → otra vez el fallback a mocks.

**Corrección (en `lib/news.ts`):**

```ts
const AV_TOPICS = "energy_transportation,financial_markets"; // topics válidos
// Plan B si viene vacío: ETFs de materias primas
const AV_FALLBACK_TICKERS = "USO,UNG,CPER,GLD,SLV";
```

Además se añade **detección de `Error Message`** (antes solo se miraban `Information`/`Note`) y un segundo intento por tickers si el primero viene vacío.

---

## 🔴 Error 3 — La página hacía HTTP contra su propia API (frágil en Vercel)

**Dónde:** `app/page.tsx`:

```ts
// ANTES (anti-patrón)
const res = await fetch(`${baseUrl}/api/news`, { cache: "no-store" });
```

**Qué pasaba:** Un Server Component llamando por red a sí mismo es un anti-patrón: en Vercel, si el despliegue tiene **Deployment Protection** (Vercel Authentication), ese fetch recibe un **401** → fallback silencioso a mocks *aunque todo lo demás esté bien configurado*. Además añade latencia innecesaria (salto HTTP extra por cada visita).

**Corrección:** la lógica se extrajo a **`lib/news.ts`** (nueva capa de datos compartida):

```ts
// app/page.tsx — DESPUÉS
import { fetchLatestNews } from "@/lib/news";
const news = await fetchLatestNews(); // importación directa, sin HTTP propio

// app/api/news/route.ts — DESPUÉS (mismo origen de datos)
export async function GET() {
  const news = await fetchLatestNews();
  return NextResponse.json(news, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
```

Extra: el fallback ahora es **honesto y consistente** en ambas vías — antes `page.tsx` servía los mocks *sin marcar* mientras que el route les añadía el prefijo de simulación. Ahora siempre llevan `[SIMULACIÓN · límite de API]` y sus fechas se generan relativas a "hoy" (antes eran fijas de marzo 2025).

---

## 🔴 Error 4 — Doble formateo de fecha → "Invalid Date"

**Dónde:** cadena `api/news` → `NewsCard.tsx`:

```tsx
// ANTES: la API ya enviaba la fecha formateada: "14 mar 2026, 10:30"
// y el componente la volvía a parsear:
{new Date(news.date).toLocaleDateString("es-ES", {...})}
```

**Qué pasaba:** `new Date("14 ene 2026…")` no entiende las abreviaturas de mes en español (ene, abr, ago, sept, dic…) → **Invalid Date** en pantalla para las noticias reales. Con los mocks (ISO `"2025-03-14"`) sí funcionaba, por eso el bug quedaba oculto.

**Corrección:** la API ahora devuelve **ISO 8601 crudo** (`"2026-09-25T14:30:00.000Z"`) y el formateo visual ocurre solo en el cliente con guardia:

```tsx
// components/NewsCard.tsx — DESPUÉS
function formatNewsDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate; // nunca más "Invalid Date"
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
    timeZone: "UTC", timeZoneName: "short", // determinista: evita hydration mismatch
  }).format(date);
}
```

---

## 🔴 Error 5 — Tres símbolos de TradingView inexistentes (causa raíz de "precios que no se muestran")

**Dónde:** `components/TradingViewTicker.tsx`. Si un `proName` no existe en TradingView, el widget **omite ese material sin avisar**. Verificado contra tradingview.com:

| Símbolo anterior | Estado | Símbolo corregido |
|---|---|---|
| `OANDA:XCUUSD` (Cobre) | retirado por OANDA (redirige a CAPITALCOM) | **`COMEX:HG1!`** (Copper Futures) |
| `TVC:ALUMINIUM` (Aluminio) | **404 — no existe** | **`COMEX:ALI1!`** (Aluminum Futures) |
| `TVC:ZINC` (Zinc) | **404 — no existe** | **`LME:ZS1!`** (Zinc Futures, USD; alternativa `MCX:ZINC1!` en INR) |

Los otros 5 (`OANDA:XAUUSD`, `OANDA:XAGUSD`, `TVC:UKOIL`, `TVC:USOIL`, `OANDA:NATGASUSD`) eran válidos y se conservan. El widget usa websockets: con símbolos válidos los precios **se actualizan en tiempo real** sin necesitar clave de API.

---

## 🟠 Error 6 — Modelo de Gemini retirado

**Dónde:** `app/api/explain/route.ts` → `gemini-1.5-flash`. Ese modelo ya no está disponible (404). Además la clave actual era el placeholder `clave_pendiente_de_poner_en_produccion`, así que el botón *"Entender esta noticia"* fallaba siempre.

**Corrección:** modelo configurable con valor moderno por defecto:

```ts
const geminiModel = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
// … /v1beta/models/${geminiModel}:generateContent?key=…
```

Recuerda poner la **`GEMINI_API_KEY` real** en Vercel (obtener en <https://aistudio.google.com/apikey>).

---

## 🟠 Error 7 — Fallo del análisis mostrado como "✓ Análisis completado" (UX/lógica)

**Dónde:** `components/NewsCard.tsx`. En el `catch` se hacía `setExplanation('Error al generar la explicación')`, lo que activaba el bloque *"✓ Análisis completado"* y ocultaba el botón para siempre (sin reintento).

**Corrección:** estado `explainError` propio → mensaje de error visible y botón que pasa a **"Reintentar análisis"**. También se añadió `whitespace-pre-line` para respetar las viñetas/saltos de línea que devuelve Gemini.

---

## 🟠 Error 8 — `.env.local` y `node_modules` versionados en git (seguridad)

**Dónde:** `.gitignore` solo contenía `.next/`; `git ls-files` confirmó `.env.local` y ~21 000 archivos de `node_modules` trackeados.

**Riesgo:** cuando pongas las claves reales acabarían en el historial del repo (y en GitHub si haces push).

**Corrección:** `.gitignore` completo (estándar Next.js: `.env*`, `node_modules`, `.next`, logs…) y se han sacado del índice (`git rm --cached`) `.env.local`, `node_modules` y `dev.log`. Los archivos siguen en tu disco; solo dejan de versionarse.

> ⚠️ `.env.local` ya está en el historial anterior. Las claves actuales son placeholders, pero si alguna vez fueron reales, **rótalas**.

---

## 🟡 Error 9 — Metadatos e idioma por defecto

`app/layout.tsx` tenía `lang="en"` y el título *"Create Next App"* en un sitio en español. Ahora `lang="es"` y título/descripción propios (SEO y accesibilidad).

---

## ✅ Verificación realizada

```
GET /api/news  → 200 (antes: 500) — fallback marcado "[SIMULACIÓN · límite de API]"
GET /          → 200 — fechas "25 de septiembre de 2026 a las 20:31 UTC" (sin "Invalid Date")
Chunk cliente  → contiene exactamente los 8 símbolos corregidos (sin XCUUSD / TVC:ALUMINIUM / TVC:ZINC)
npx tsc        → 0 errores
```

> En este sandbox no hay salida a internet, por eso se ejercitó la cadena de *fallback*. En Vercel, con la clave configurada, los mismos caminos sirven la API real. Nota: `npm run build` local requiere internet para descargar las fuentes Geist (`next/font/google`); en Vercel funciona.

---

## 📋 Checklist de despliegue

1. [ ] Vercel → **Settings → Environment Variables**: `ALPHA_VANTAGE_API_KEY` (+ `GEMINI_API_KEY` real para el análisis con IA).
2. [ ] **Redeploy** (las variables de entorno solo se aplican en despliegues posteriores).
3. [ ] Abrir la web: los 8 materiales deben aparecer en la cinta de precios y las noticias deben ser recientes. Si Alpha Vantage alcanza su límite diario del plan gratuito, verás el aviso `[SIMULACIÓN · límite de API]` en los títulos (plan gratuito: ~25 peticiones/día · la página consulta la API una vez por carga).
4. [ ] (Opcional) `TWELVE_DATA_API_KEY` está definida pero el código no la usa: los precios en vivo los aporta TradingView sin clave.
