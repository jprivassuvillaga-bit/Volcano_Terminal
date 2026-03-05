"use client";

import React, { useState } from 'react';
import { Users, Activity, BarChart2, ChevronDown } from 'lucide-react';

export default function RadarCard({ data }: { data: any }) {
  // 1. EL MOTOR: Este estado recuerda qué fila está abierta (1, 2, 3 o null si todas están cerradas)
  const [openRow, setOpenRow] = useState<number | null>(null);

  const top4 = data?.top4_concentration || "60.7%";
  const leveraged = data?.leveraged_spreading || "4,862";
  const netLongs = data?.net_long_exposure || "5,718";

  // Textos explicativos (puedes conectarlos al backend después si lo deseas)
  const explanations = {
    1: "Una concentración alta en los top 4 jugadores indica un riesgo estructural de liquidez si deciden liquidar posiciones simultáneamente.",
    2: "El aumento en contratos apalancados sugiere que los fondos de cobertura están asumiendo más riesgo direccional en el mercado spot.",
    3: "La exposición neta larga está en niveles de sobrecompra, lo que históricamente precede a correcciones de corto plazo."
  };

  const toggleRow = (row: number) => {
    setOpenRow(openRow === row ? null : row);
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4 space-y-6">
      
      {/* ROW 1: Top 4 Concentration */}
      <div className="flex flex-col border-b border-white/5 pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer group" 
          onClick={() => toggleRow(1)}
        >
          <div className="flex items-center gap-3">
            <Users size={16} className="text-gray-400" />
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Structural Holders</span>
              <span className="text-sm font-bold text-white tracking-wide">Top 4 Concentration</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-lg font-bold text-red-500 block tabular-nums">{top4}</span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Spot Metric</span>
            </div>
            {/* Agregamos transición a la flecha para que gire */}
            <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-2 py-1 rounded transition-colors group-hover:bg-red-500/10">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">WARNING</span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${openRow === 1 ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        {/* El contenido desplegable */}
        {openRow === 1 && (
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
            {data?.explanation_top4 || explanations[1]}
          </div>
        )}
      </div>

      {/* ROW 2: Leveraged Spreading */}
      <div className="flex flex-col border-b border-white/5 pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer group"
          onClick={() => toggleRow(2)}
        >
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-gray-400" />
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Hedge Fund Managers</span>
              <span className="text-sm font-bold text-white tracking-wide">Leveraged Spreading</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-lg font-bold text-emerald-500 block tabular-nums">Contracts: {leveraged}</span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Spot Metric</span>
            </div>
            <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded transition-colors group-hover:bg-emerald-500/10">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">STRENGTH</span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${openRow === 2 ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        {openRow === 2 && (
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
            {data?.explanation_leveraged || explanations[2]}
          </div>
        )}
      </div>

      {/* ROW 3: Net Long Exposure */}
      <div className="flex flex-col">
        <div 
          className="flex justify-between items-center cursor-pointer group"
          onClick={() => toggleRow(3)}
        >
          <div className="flex items-center gap-3">
            <BarChart2 size={16} className="text-gray-400" />
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Asset Managers</span>
              <span className="text-sm font-bold text-white tracking-wide">Net Long Exposure</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-lg font-bold text-red-500 block tabular-nums">Net Longs: {netLongs}</span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Spot Metric</span>
            </div>
            <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-2 py-1 rounded transition-colors group-hover:bg-red-500/10">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">WARNING</span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${openRow === 3 ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        {openRow === 3 && (
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
            {data?.explanation_net_longs || explanations[3]}
          </div>
        )}
      </div>

    </div>
  );
}