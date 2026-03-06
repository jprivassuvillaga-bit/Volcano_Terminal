"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Satellite, ChevronDown, Activity, ArrowDownRight, ArrowUpRight, Minus, Loader } from 'lucide-react';
import { createChart, ColorType, LineSeries, CrosshairMode } from 'lightweight-charts';

const TARGET_ASSETS: Record<string, string> = {
  "MicroStrategy": "MSTR",
  "S&P 500": "^GSPC",
  "Ethereum": "ETH-USD",
  "NASDAQ": "^IXIC",
  "Gold": "GC=F",
  "DXY (Dollar)": "DX-Y.NYB"
};

export default function PairsTradingCard() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  
  const [assetA] = useState('Bitcoin');
  const [assetB, setAssetB] = useState('MicroStrategy');
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. INICIALIZACIÓN ÚNICA DEL GRÁFICO
  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      autoSize: true, // Auto-ajuste nativo
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)', mode: 0 }, 
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', rightOffset: 5 },
    });

    const series = chart.addSeries(LineSeries, {
      color: '#3b82f6', 
      lineWidth: 2,
      autoscaleInfoProvider: () => ({
        priceRange: { minValue: -4, maxValue: 4 },
        margins: { above: 0, below: 0 },
      }),
    });

    // Líneas de referencia (Bandas de Desviación)
    series.createPriceLine({ price: 2, color: '#ef4444', lineWidth: 1, lineStyle: 2, title: '+2σ' });
    series.createPriceLine({ price: 0, color: '#9ca3af', lineWidth: 1, lineStyle: 0, title: '0' });
    series.createPriceLine({ price: -2, color: '#10b981', lineWidth: 1, lineStyle: 2, title: '-2σ' });

    chartRef.current = chart;
    seriesRef.current = series;

    // Observer para que el gráfico se adapte al tamaño de la caja al arrastrar/redimensionar
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartContainerRef.current) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  // 2. FETCH DE DATOS (Se dispara al montar y al cambiar assetB)
  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoading(true);
      try {
        const ticker = TARGET_ASSETS[assetB];
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pairs-trading?target_ticker=${ticker}`, { cache: 'no-store' });
        
        if (res.ok) {
          const json = await res.json();
          if (json && json.history) {
            setData(json);
            seriesRef.current?.setData(json.history);
            chartRef.current?.timeScale().fitContent();
          }
        }
      } catch (error) {
        console.error("Error en Pairs Trading:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRealData();
  }, [assetB]);

  const currentZScore = data?.z_score ? Number(data.z_score.toFixed(2)) : 0.00;
  const currentBeta = data?.beta ? Number(data.beta.toFixed(2)) : 0.00;

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4">
      <div className="flex items-center gap-3 mb-6">
        <Satellite className="text-gray-300" size={20} />
        <h2 className="text-lg font-bold text-white tracking-wide uppercase">Pairs Trading Radar</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        {/* ASSET A */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Position (A)</label>
          <div className="bg-white/5 border border-white/10 text-white text-xs rounded px-3 py-2">Bitcoin</div>
        </div>

        {/* ASSET B - FIX DE DRAG AQUÍ */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Target (B)</label>
          <div className="relative">
            <select 
              value={assetB} 
              onChange={(e) => setAssetB(e.target.value)}
              // --- FIX: ESTO DETIENE EL ARRASTRE DEL WIDGET ---
              onMouseDown={(e) => e.stopPropagation()} 
              className="w-full bg-[#1a1a1f] border border-red-500/30 text-white text-xs rounded px-3 py-2 appearance-none outline-none focus:border-red-500 cursor-pointer"
            >
              {Object.keys(TARGET_ASSETS).map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-2 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* METRICS */}
        <div className="flex flex-col justify-center relative">
          {isLoading && <Loader size={14} className="animate-spin text-blue-500 absolute -top-4 right-0" />}
          <div className="text-2xl font-bold text-white tabular-nums">{currentZScore} <span className="text-sm font-normal text-gray-500">σ</span></div>
          <div className="text-[10px] text-gray-500 uppercase font-mono mt-1">Beta: {currentBeta}</div>
        </div>
      </div>

      {/* CHART CONTAINER - USANDO TODO EL ESPACIO */}
      <div className="flex-1 w-full relative min-h-[250px] border border-white/5 rounded-lg overflow-hidden bg-black/20">
        <div className="absolute top-0 left-0 right-0 h-[25%] bg-red-500/5 border-b border-red-500/10 pointer-events-none z-0" />
        <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-emerald-500/5 border-t border-emerald-500/10 pointer-events-none z-0" />
        <div ref={chartContainerRef} className="w-full h-full relative z-10" />
      </div>
    </div>
  );
}