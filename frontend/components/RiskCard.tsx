"use client";

import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Activity, ChevronDown } from 'lucide-react';

export default function RiskCard({ data }: { data: any }) {
  // El motor interactivo para saber qué fila está abierta
  const [openRow, setOpenRow] = useState<number | null>(null);

  // Rescatamos los datos del backend (o mostramos fallback si está cargando)
  const volatility = data?.volatility ? `${data.volatility.toFixed(1)}%` : "84.1%";
  const sma20 = data?.sma_20 ? `$${data.sma_20.toLocaleString('en-US', {maximumFractionDigits: 2})}` : "$62,450";
  const status = data?.status || "ELEVATED";

  // Textos explicativos
  const explanations = {
    1: "La Volatilidad Realizada (RV) a 30 días mide la dispersión histórica de los retornos logarítmicos. Niveles superiores al 60% indican un régimen de alta turbulencia y riesgo de liquidaciones.",
    2: "La Media Móvil Simple de 20 días (SMA 20) define la tendencia a corto plazo. Si el precio actual está muy desviado de esta media, aumenta el riesgo de reversión a la media (mean reversion).",
    3: "El modelo de Riesgo de Volcano Engine sintetiza las métricas de volatilidad y estructura de mercado para determinar el régimen actual de exposición recomendada."
  };

  const toggleRow = (row: number) => {
    setOpenRow(openRow === row ? null : row);
  };

  // Determinar colores según el status
  const isHighRisk = status === "ELEVATED" || status === "HIGH RISK" || status === "Alto Riesgo";
  const badgeColor = isHighRisk ? "text-red-500" : "text-emerald-500";
  const badgeBg = isHighRisk ? "border-red-500/20 bg-red-500/5 group-hover:bg-red-500/10" : "border-emerald-500/20 bg-emerald-500/5 group-hover:bg-emerald-500/10";

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4 space-y-6">
      
      {/* ROW 1: 30-Day Realized Volatility */}
      <div className="flex flex-col border-b border-white/5 pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer group" 
          onClick={() => toggleRow(1)}
        >
          <div className="flex items-center gap-3">
            <Activity size={16} className="text-gray-400" />
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Market Dynamics</span>
              <span className="text-sm font-bold text-white tracking-wide">Realized Volatility</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className={`text-lg font-bold block tabular-nums ${isHighRisk ? 'text-red-500' : 'text-emerald-500'}`}>
                {volatility}
              </span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">30-Day RV</span>
            </div>
            <div className={`flex items-center gap-2 border px-2 py-1 rounded transition-colors ${badgeBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${badgeColor}`}>
                {status}
              </span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${openRow === 1 ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        {openRow === 1 && (
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
            {explanations[1]}
          </div>
        )}
      </div>

      {/* ROW 2: SMA 20 Trend */}
      <div className="flex flex-col border-b border-white/5 pb-4">
        <div 
          className="flex justify-between items-center cursor-pointer group"
          onClick={() => toggleRow(2)}
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={16} className="text-gray-400" />
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Trend Analysis</span>
              <span className="text-sm font-bold text-white tracking-wide">SMA 20 Baseline</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="text-lg font-bold text-white block tabular-nums">{sma20}</span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Moving Average</span>
            </div>
            <div className="flex items-center gap-2 border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded transition-colors group-hover:bg-blue-500/10">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">NEUTRAL</span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${openRow === 2 ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        {openRow === 2 && (
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
            {explanations[2]}
          </div>
        )}
      </div>

      {/* ROW 3: System Status */}
      <div className="flex flex-col">
        <div 
          className="flex justify-between items-center cursor-pointer group"
          onClick={() => toggleRow(3)}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-gray-400" />
            <div>
              <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Volcano Engine</span>
              <span className="text-sm font-bold text-white tracking-wide">System Risk State</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className={`text-lg font-bold block tabular-nums ${badgeColor}`}>
                {status}
              </span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Global Status</span>
            </div>
            <div className={`flex items-center gap-2 border px-2 py-1 rounded transition-colors ${badgeBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${badgeColor}`}>
                INFO
              </span>
              <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${openRow === 3 ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </div>
        {openRow === 3 && (
          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-gray-400 leading-relaxed animate-in slide-in-from-top-2 fade-in duration-200">
            {explanations[3]}
          </div>
        )}
      </div>

    </div>
  );
}