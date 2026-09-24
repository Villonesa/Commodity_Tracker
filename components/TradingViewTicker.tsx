"use client";

import { useEffect, useRef } from "react";

/**
 * Ticker de precios en vivo usando el widget "Ticker Tape" de TradingView.
 *
 * El script se inyecta dinámicamente con useEffect + useRef para evitar
 * errores de hidratación en React (el HTML del servidor no contiene el
 * contenido generado por TradingView).
 *
 * En Strict Mode, useEffect se ejecuta dos veces en desarrollo, por lo que
 * comprobamos si el contenedor ya tiene hijos para no duplicar el widget.
 */
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
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "OANDA:XAUUSD", title: "Oro" },
        { proName: "OANDA:XAGUSD", title: "Plata" },
        { proName: "CAPITALCOM:COPPER", title: "Cobre" },
        { proName: "CAPITALCOM:ALUMINIUM", title: "Aluminio" },
        { proName: "CAPITALCOM:ZINC", title: "Zinc" },
        { proName: "TVC:UKOIL", title: "Petróleo Brent" },
        { proName: "TVC:USOIL", title: "Crudo WTI" },
        { proName: "CAPITALCOM:NATURALGAS", title: "Gas Natural" },
      ],
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
