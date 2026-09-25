"use client";

import { useEffect, useRef } from "react";

/**
 * Ticker de precios en vivo usando el widget "Ticker Tape" de TradingView.
 *
 * El script se inyecta dinámicamente con useEffect + useRef para evitar
 * errores de hidratación en React (el HTML del servidor no contiene el
 * contenido generado por TradingView). El widget se conecta por websocket
 * a TradingView, así que los precios se actualizan en tiempo real.
 *
 * SÍMBOLOS: solo se pueden usar identificadores que existan realmente en
 * TradingView; si un "proName" no existe, el widget simplemente NO muestra
 * ese material (ese era el bug de "algunos precios no aparecen"):
 *
 *   ✗ OANDA:XCUUSD   → OANDA retiró el cobre (redirige a CAPITALCOM:XCUUSD)
 *   ✓ COMEX:HG1!     → Copper Futures (CORREGIDO)
 *   ✗ TVC:ALUMINIUM  → no existe (404 en tradingview.com/symbols/)
 *   ✓ COMEX:ALI1!    → Aluminum Futures (CORREGIDO)
 *   ✗ TVC:ZINC       → no existe (404 en tradingview.com/symbols/)
 *   ✓ LME:ZS1!       → Zinc Futures, referencia global en USD (CORREGIDO)
 *                      (alternativa: MCX:ZINC1!, cotiza en INR)
 */
const TICKER_SYMBOLS = [
  { proName: "OANDA:XAUUSD", title: "Oro" },
  { proName: "OANDA:XAGUSD", title: "Plata" },
  { proName: "COMEX:HG1!", title: "Cobre" },
  { proName: "COMEX:ALI1!", title: "Aluminio" },
  { proName: "LME:ZS1!", title: "Zinc" },
  { proName: "TVC:UKOIL", title: "Petróleo Brent" },
  { proName: "TVC:USOIL", title: "Crudo WTI" },
  { proName: "OANDA:NATGASUSD", title: "Gas Natural" },
];

export default function TradingViewTicker() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    // Evita insertar el script más de una vez (Strict Mode / re-renders)
    if (!container || container.hasChildNodes()) {
      return;
    }

    const script = document.createElement("script");
    script.setAttribute(
      "src",
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
    );
    script.async = true;
    // El widget lee su configuración del innerHTML del propio <script>
    script.innerHTML = JSON.stringify({
      symbols: TICKER_SYMBOLS,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "regular",
      colorTheme: "dark",
      locale: "es",
    });

    container.appendChild(script);

    // Limpieza: elimina el widget al desmontar el componente para que,
    // si vuelve a montarse, se inyecte de nuevo correctamente.
    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="border-b border-neutral-800 bg-neutral-950 overflow-hidden relative group">
      {/* Capa invisible para bloquear clics hacia TradingView */}
      <div className="absolute inset-0 z-10 cursor-default"></div>
      <div ref={containerRef} className="tradingview-widget-container" />
    </div>
  );
}
