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
        { proName: "COMEX:GC1!", title: "Oro" },
        { proName: "COMEX:SI1!", title: "Plata" },
        { proName: "COMEX:HG1!", title: "Cobre" },
        { proName: "TVC:UKOIL", title: "Petróleo Brent" },
        { proName: "NYMEX:NG1!", title: "Gas Natural" },
        { proName: "CBOT:ZW1!", title: "Trigo" },
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
    <div className="border-b border-neutral-800 bg-neutral-950 overflow-hidden">
      <div ref={containerRef} />
    </div>
  );
}
