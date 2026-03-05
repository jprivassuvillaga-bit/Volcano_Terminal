"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Loader, BarChart3 } from 'lucide-react';

// Timeframes solicitados para Volcano Terminal
const TIMEFRAMES = ['1H', '1D', '7D', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];

export default function PriceStructureCard() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  const [period, setPeriod] = useState('1D');
  const [isLoading, setIsLoading] = useState(true);

  // 1. INICIALIZACIÓN DEL MOTOR (ESTÁTICO)
  useEffect(() => {
    if (!chartContainerRef.current) return;
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      autoSize: true, 
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, horzLines: { color: 'rgba(255, 255, 255, 0.03)' } },
      
      // DESACTIVAMOS SCROLL Y SCALE PARA FIJAR LA VISTA
      handleScroll: false,
      handleScale: false,
      
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)', autoScale: true },
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444', borderVisible: false, 
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    return () => { chart.remove(); };
  }, []); 

  // 2. CARGA DE DATOS CON AUTO-AJUSTE FORZADO
  useEffect(() => {
    const fetchRealData = async () => {
      setIsLoading(true);
      try {
        // Mapeo simple para el backend de Python
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ohlcv?ticker=BTC-USD&period=${period}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && candleSeriesRef.current) {
            candleSeriesRef.current.setData(data);
            
            // FORZAMOS EL AJUSTE PERFECTO AL CONTENEDOR
            chartRef.current?.timeScale().fitContent();
          }
        }
      } catch (error) {
        console.error("Error en Price Action:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRealData();
  }, [period]); 

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] p-5">
      
      {/* HEADER DE CONTROL */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <BarChart3 size={18} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tighter">BTC/USD Price Action</h2>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Market Microstructure</p>
          </div>
        </div>

        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 shadow-inner">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setPeriod(t)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all duration-200 ${
                period === t 
                ? 'bg-emerald-500 text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DEL GRÁFICO */}
      <div className="flex-1 w-full relative min-h-[350px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20 rounded-xl">
            <div className="flex flex-col items-center gap-3">
              <Loader className="animate-spin text-emerald-500" size={30} />
              <span className="text-[9px] font-mono text-emerald-500 uppercase tracking-[0.2em]">Syncing {period} History</span>
            </div>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

    </div>
  );
}