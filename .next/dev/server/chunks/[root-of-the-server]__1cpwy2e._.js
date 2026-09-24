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
    "dynamic",
    ()=>dynamic,
    "revalidate",
    ()=>revalidate
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const dynamic = "force-dynamic";
const revalidate = 0;
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
// Formatea time_published (YYYYMMDDTHHMMSS) a una fecha legible
function formatPublishedDate(timePublished) {
    if (!timePublished) return new Date().toLocaleDateString("es-ES", {
        dateStyle: "medium"
    });
    const year = timePublished.slice(0, 4);
    const month = timePublished.slice(4, 6);
    const day = timePublished.slice(6, 8);
    const hours = timePublished.slice(9, 11) || "00";
    const minutes = timePublished.slice(11, 13) || "00";
    const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:00Z`);
    if (isNaN(date.getTime())) return new Date().toLocaleDateString("es-ES", {
        dateStyle: "medium"
    });
    return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}
// Importamos el mock data para usarlo como fallback visible cuando la API falle
async function getMockFallback(reason) {
    console.warn(`[api/news] Fallback a mock data (${reason})`);
    const { mockNews } = await __turbopack_context__.A("[project]/lib/mockData.ts [app-route] (ecmascript, async loader)");
    const simulated = mockNews.map((item)=>({
            ...item,
            title: `[LÍMITE API - SIMULACIÓN] ${item.title}`
        }));
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(simulated, {
        status: 200
    });
}
async function GET() {
    try {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        if (!apiKey) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Falta ALPHA_VANTAGE_API_KEY en las variables de entorno"
            }, {
                status: 500
            });
        }
        const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=energy_minerals,metals&sort=LATEST&limit=6&apikey=${apiKey}`;
        // cache: 'no-store' → tiempo real estricto, sin respuestas cacheadas
        const res = await fetch(url, {
            cache: "no-store"
        });
        if (!res.ok) {
            // Error HTTP → fallback simulado y visible
            return getMockFallback(`Alpha Vantage respondió con estado ${res.status}`);
        }
        const data = await res.json();
        // Alpha Vantage devuelve "Information" o "Note" cuando se excede el límite
        // del plan gratuito (rate limit), en lugar del array "feed".
        if (data?.Information || data?.Note) {
            const message = String(data.Information ?? data.Note);
            return getMockFallback(`Rate limit de Alpha Vantage: ${message}`);
        }
        const feed = Array.isArray(data?.feed) ? data.feed : [];
        if (feed.length === 0) {
            // Sin noticias (posible límite de API alcanzado) → fallback simulado y visible
            return getMockFallback("Alpha Vantage no devolvió noticias en el feed");
        }
        const news = feed.slice(0, 6).map((item, index)=>({
                id: String(index + 1),
                title: item.title ?? "Sin título",
                summary: item.summary ?? "Sin resumen disponible.",
                source: item.source_domain ?? "Fuente desconocida",
                date: formatPublishedDate(item.time_published),
                commodityTag: inferCommodityTag(item.title ?? "")
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