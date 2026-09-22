import Header from "@/components/Header";

export default function Home() {
  return (
    <>
      <Header projectName="Commodities Tracker" />
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 
          CSS Grid responsivo para el dashboard de commodities:
          - Móvil: 1 columna
          - Tablet (md): 2 columnas
          - Desktop (lg): 3 columnas
        */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 
            Aquí se renderizarán los widgets del dashboard:
            - Precios de metales (oro, plata, cobre)
            - Energía (petróleo, gas natural)
            - Agrícolas (trigo, maíz, soja)
            - Gráficos y tendencias
          */}
        </div>
      </main>
    </>
  );
}
