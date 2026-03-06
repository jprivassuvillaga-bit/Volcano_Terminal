"use client";

import React, { useEffect, useState } from 'react';
import { Database, Cpu, AlertTriangle, Info, Activity } from 'lucide-react';

export default function OnChainCard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Descargamos la data 100% real
  useEffect(() => {
    const fetchOnChain = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/onchain`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error conectando al OnChain API:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOnChain();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex flex-col h-full w-full bg-transparent p-4 items-center justify-center">
        <span className="text-purple-500 font-mono text-[10px] tracking-widest uppercase animate-pulse flex items-center gap-2">
          <Database size={14} /> Auditing Blockchain Data...
        </span>
      </div>
    );
  }

  // Cálculos visuales para el Mayer Multiple (Históricamente oscila entre 0.5 y 3.0)
  const mayerProgress = Math.min(Math.max(((data.valuation.value - data.valuation.min) / (data.valuation.max - data.valuation.min)) * 100, 0), 100);
  
  // Colores: Verde < 1.0 (Oportunidad), Amarillo 1.0-2.4 (Normal), Rojo > 2.4 (Burbuja)
  const getMayerColor = (val: number) => {
    if (val <= 1.0) return "bg-emerald-500";
    if (val < 2.4) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isCapitulating = data.miner_capitulation.is_capitulating;

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4 space-y-4">
      
      {/* HEADER */}
      <div className="flex-none flex justify-between items-center pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Database size={18} className="text-purple-500" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Blockchain Analytics</span>
            <span className="text-sm font-bold text-white tracking-wide">On-Chain Health</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-purple-500/20 bg-purple-500/5 px-2 py-1 rounded">
          <Activity size={10} className="text-purple-500 animate-pulse" />
          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Live Network</span>
        </div>
      </div>

      {/* METRIC 1: MAYER MULTIPLE */}
      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-gray-400" />
            <span className="text-xs font-mono font-bold text-gray-300">Mayer Multiple</span>
          </div>
          <span className="text-lg font-bold text-white tabular-nums">{data.valuation.value}</span>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden mb-2 mt-1 relative">
          {/* AQUÍ ESTÁ LA CORRECCIÓN: z-10 está ahora dentro de las comillas */}
          <div className="absolute top-0 bottom-0 w-px bg-white/20 left-[20%] z-10" /> 
          <div 
            className={`h-full ${getMayerColor(data.valuation.value)} transition-all duration-1000 relative z-0`} 
            style={{ width: `${mayerProgress}%` }}
          />
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">Undervalued (&lt;1.0)</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">Overheated (&gt;2.4)</span>
        </div>

        <p className="text-[10px] text-gray-400 leading-snug flex items-start gap-1.5 border-t border-white/5 pt-2">
          <Info size={12} className="shrink-0 text-blue-400" />
          Mide la distancia del precio frente a su tendencia a largo plazo (SMA 200). Valores menores a 1.0 indican una oportunidad histórica de compra institucional.
        </p>
      </div>

      {/* METRIC 2: NETWORK HASHRATE */}
      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-gray-400" />
            <span className="text-xs font-mono font-bold text-gray-300">Network Hashrate</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-white tabular-nums">{data.hashrate.value} <span className="text-[10px] text-gray-500">EH/s</span></span>
          </div>
        </div>
        
        <p className="text-[10px] text-gray-400 leading-snug flex items-start gap-1.5 border-t border-white/5 pt-2">
          <Info size={12} className="shrink-0 text-blue-400" />
          Poder de procesamiento global en vivo. Un número en crecimiento significa que la red invierte en infraestructura y es casi imposible de hackear.
        </p>
      </div>

      {/* METRIC 3: MINER CAPITULATION (HASH RIBBONS) */}
      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xs font-mono font-bold text-gray-300 block">Miner Capitulation</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 block">SMA 30 vs SMA 60</span>
          </div>
          <div className="text-right">
             <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isCapitulating ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
              {data.miner_capitulation.status}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono mb-2 bg-black/30 p-1.5 rounded">
          <span className="text-gray-400">SMA 30d: <span className="text-white">{data.miner_capitulation.sma30}</span></span>
          <span className="text-gray-400">SMA 60d: <span className="text-white">{data.miner_capitulation.sma60}</span></span>
        </div>
        
        <p className="text-[10px] text-gray-400 leading-snug flex items-start gap-1.5 border-t border-white/5 pt-2">
          <Info size={12} className="shrink-0 text-blue-400" />
          {isCapitulating 
            ? "El promedio corto cayó debajo del largo. Los mineros están apagando máquinas por falta de rentabilidad (Zona de riesgo, posible suelo formándose)."
            : "El promedio corto cruzó arriba del largo. Los mineros se han recuperado y vuelto a encender máquinas. Históricamente, señal fuerte de compra."}
        </p>
      </div>

    </div>
  );
}