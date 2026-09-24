module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/news/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "revalidate",
    ()=>revalidate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const revalidate = 900;
// Símbolos usados para consultar noticias/press releases en Twelve Data
// (endpoint: /press_releases). Nota verificada empíricamente con la API real:
// los ETFs de materias primas (GLD, USO, XLE) devuelven SIEMPRE una lista
// vacía en este endpoint, por lo que usamos acciones del sector de
// commodities/minería/energía + grandes valores con prensa financiera fresca.
const NEWS_SYMBOLS = [
    "V",
    "JPM",
    "BHP",
    "FCX"
];
// Etiqueta genérica de commodity basada en palabras clave del título
function inferCommodityTag(title) {
    const t = title.toLowerCase();
    if (/copper|gold|silver|zinc|nickel|aluminum|lithium|metal|precious/.test(t)) return "Metales";
    if (/oil|brent|crude|opec|petroleum|gasoline/.test(t)) return "Petróleo";
    if (/natural gas|lng|gas\b/.test(t)) return "Gas Natural";
    if (/energy|power|electric|grid|renewab/.test(t)) return "Energía";
    if (/mining|miner|ore\b/.test(t)) return "Minería";
    return "Commodities";
}
// Convierte el cuerpo HTML de un press release a texto plano legible
function stripHtml(html) {
    return html.replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
// Resumen recortado del body (sin cortar a mitad de palabra)
function buildSummary(body) {
    if (!body) return "Sin resumen disponible.";
    const text = stripHtml(body);
    if (!text) return "Sin resumen disponible.";
    if (text.length <= 300) return text;
    const cut = text.slice(0, 300);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 200 ? lastSpace : 300)}…`;
}
// Formatea el datetime ISO de Twelve Data ("2026-05-28T13:45:00Z") a fecha
// legible en español. Devuelve undefined si no se puede parsear, para que
// la UI decida cómo mostrarlo.
function formatPublishedDate(isoDate) {
    if (!isoDate) return undefined;
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return undefined;
    return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC"
    });
}
// Fallback simulado y visible con la MISMA estructura que devuelve la ruta
// real: `date` siempre es una cadena ya formateada en es-ES (no ISO), por lo
// que la UI no se rompe al consumirlo.
async function getMockFallback(reason) {
    console.warn(`[api/news] Fallback a mock data (${reason})`);
    const { mockNews } = await __turbopack_context__.A("[project]/lib/mockData.ts [app-route] (ecmascript, async loader)");
    const simulated = mockNews.map((item)=>({
            ...item,
            title: `[DATOS SIMULADOS - API CAÍDA] ${item.title}`,
            date: formatPublishedDate(item.date) ?? item.date
        }));
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(simulated, {
        status: 200
    });
}
async function fetchPressReleases(apiKey, symbol) {
    const url = `https://api.twelvedata.com/press_releases?symbol=${encodeURIComponent(symbol)}&outputsize=6&apikey=${encodeURIComponent(apiKey)}`;
    // cache: "no-store" porque la caché de la propia ruta (revalidate=900) ya
    // limita las llamadas salientes; así evitamos cachés encadenadas obsoletas.
    const res = await fetch(url, {
        cache: "no-store"
    });
    if (!res.ok) {
        throw new Error(`Twelve Data respondió con estado ${res.status}`);
    }
    const data = await res.json();
    // Errores de Twelve Data llegan con HTTP 200 + campo "code"/"status"
    if (data?.status === "error" || data?.code && !Array.isArray(data?.press_releases)) {
        throw new Error(`Twelve Data (${symbol}): ${data?.message ?? `código ${data?.code}`}`);
    }
    return Array.isArray(data?.press_releases) ? data.press_releases : [];
}
async function GET() {
    try {
        const apiKey = process.env.TWELVE_DATA_API_KEY;
        if (!apiKey) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Falta TWELVE_DATA_API_KEY en las variables de entorno (.env.local)"
            }, {
                status: 500
            });
        }
        // Consultamos los símbolos SECUENCIALMENTE (no en paralelo): el plan
        // gratuito de Twelve Data limita a 8 créditos por MINUTO, y cada petición
        // consume 1 crédito. En paralelo + revalidaciones cercanas se supera ese
        // límite y todos los símbolos devuelven 429. Con la caché de 900 s de la
        // ruta, este barrido de ~4 peticiones apenas consume cuota diaria.
        // Se toleran fallos parciales: solo caemos a mock si ninguno responde.
        const allItems = [];
        const errors = [];
        for (const symbol of NEWS_SYMBOLS){
            try {
                const items = await fetchPressReleases(apiKey, symbol);
                for (const item of items)allItems.push({
                    item,
                    symbol
                });
            } catch (err) {
                errors.push(`${symbol}: ${String(err)}`);
            }
        }
        if (allItems.length === 0 && errors.length === NEWS_SYMBOLS.length) {
            return getMockFallback(`Todas las peticiones a Twelve Data fallaron (${errors[0]})`);
        }
        if (allItems.length === 0) {
            return getMockFallback("Twelve Data no devolvió noticias en ningún símbolo consultado");
        }
        // Ordenar por fecha descendente, deduplicar por id/título y quedarse con 6
        const sorted = allItems.filter(({ item })=>item?.title).sort((a, b)=>{
            const ta = a.item.datetime ? new Date(a.item.datetime).getTime() : 0;
            const tb = b.item.datetime ? new Date(b.item.datetime).getTime() : 0;
            return tb - ta;
        });
        const seen = new Set();
        const news = sorted.filter(({ item })=>{
            const key = item.id ?? item.title ?? "";
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 6).map(({ item, symbol }, index)=>({
                id: item.id ?? String(index + 1),
                title: item.title ?? "Sin título",
                summary: buildSummary(item.body),
                source: "Twelve Data",
                date: formatPublishedDate(item.datetime) ?? new Date().toLocaleDateString("es-ES", {
                    dateStyle: "medium"
                }),
                commodityTag: inferCommodityTag(`${item.title ?? ""} ${symbol}`)
            }));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(news);
    } catch (error) {
        // Cualquier otro fallo (red, parseo, etc.) → fallback simulado y visible
        return getMockFallback(`Error inesperado: ${String(error)}`);
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1cpwy2e._.js.map