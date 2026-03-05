"use client";

import React, { useEffect, useRef } from 'react';
import { Globe, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';

// --- SUB-COMPONENTE: EL MINI GRÁFICO (DATOS REALES) ---
function MiniChart({ data, color, isPositive }: { data: any[], color: string, isPositive: boolean }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'transparent' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      timeScale: { visible: false, borderVisible: false },
      rightPriceScale: { visible: false, borderVisible: false },
      crosshair: { mode: 2 }, 
      handleScroll: false,
      handleScale: false,
    });

    const topColor = isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
    const bottomColor = 'rgba(0, 0, 0, 0)';

    const series = chart.addSeries(AreaSeries, {
      lineColor: color,
      topColor: topColor,
      bottomColor: bottomColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    series.setData(data);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    });
    ro.observe(chartContainerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [data, color, isPositive]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}

// --- COMPONENTE PRINCIPAL ---
export default function MacroScopeCard({ data }: { data: any[] }) {
  const tradfiSymbols = ["S&P 500", "GOLD", "DXY", "NVDA"];
  
  const macroData = data?.length > 0 ? data.filter((item: any) => tradfiSymbols.includes(item.symbol)) : [];

  const assetDictionary: Record<string, { name: string, description: string, impactRule: "direct" | "inverse" }> = {
    "S&P 500": { name: "US Stock Market", description: "Salud económica. Si sube, hay confianza para comprar activos de riesgo como BTC.", impactRule: "direct" },
    "DXY": { name: "US Dollar Index", description: "Fuerza del Dólar. Si el dólar cae, se necesitan más dólares para comprar 1 BTC.", impactRule: "inverse" },
    "GOLD": { name: "Traditional Gold", description: "Refugio tradicional. Compara si el capital prefiere oro físico o digital.", impactRule: "direct" },
    "NVDA": { name: "Tech & AI Demand", description: "Termómetro del apetito institucional por tecnología y riesgo.", impactRule: "direct" }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4">
      
      {/* HEADER */}
      <div className="flex-none flex justify-between items-center mb-4 border-b border-white/5 pb-2">
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-blue-500" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">TradFi Correlation</span>
            <span className="text-sm font-bold text-white tracking-wide">Macro Scope Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded">
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Global Liquidity</span>
        </div>
      </div>

      {macroData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-gray-500 font-mono text-[10px] tracking-widest uppercase animate-pulse">Waiting for real market data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {macroData.map((asset: any, index: number) => {
            const dict = assetDictionary[asset.symbol];
            if (!dict) return null;

            const isBullishForBTC = dict.impactRule === "inverse" ? !asset.isPositive : asset.isPositive;
            const chartColor = asset.isPositive ? '#10b981' : '#ef4444';
            
            // Verificamos si Python ya nos mandó la historia
            const hasHistory = asset.history && asset.history.length > 0;

            return (
              <div key={index} className="bg-white/[0.02] border border-white/5 rounded-lg flex flex-col hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
                
                {/* ZONA SUPERIOR: Datos Duros y Gráfico */}
                <div className="p-3 pb-0 flex-1 flex flex-col relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white tracking-wider">{asset.symbol}</span>
                      </div>
                      <span className="text-xl font-bold text-white block tabular-nums">
                        {asset.symbol === "DXY" ? '' : '$'}{asset.price}
                      </span>
                    </div>
                    
                    <div className="text-right">
                       <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${asset.isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {asset.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span className="text-[10px] font-mono font-bold tracking-widest">{asset.change}</span>
                      </div>
                    </div>
                  </div>

                  {/* EL GRÁFICO REAL (Ocupa el centro del cuadrante) */}
                  <div className="flex-1 w-full min-h-[50px] mt-1 relative opacity-80 group-hover:opacity-100 transition-opacity">
                    {hasHistory ? (
                      <MiniChart data={asset.history} color={chartColor} isPositive={asset.isPositive} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-600 font-mono uppercase">Update Python API</div>
                    )}
                  </div>
                </div>

                {/* ZONA INFERIOR: Interpretación Humana (Fija abajo) */}
                <div className="p-3 pt-2 bg-black/20 border-t border-white/5 relative z-20">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">{dict.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${isBullishForBTC ? 'text-emerald-500' : 'text-red-500'}`}>
                      BTC Impact: {isBullishForBTC ? 'Positive' : 'Negative'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug flex items-start gap-1">
                    <Info size={10} className="shrink-0 mt-0.5 text-blue-400" />
                    {dict.description}
                  </p>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}