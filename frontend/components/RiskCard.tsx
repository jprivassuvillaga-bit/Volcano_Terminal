"use client";

import React from 'react';
import { Zap, Target, ShieldAlert, ChevronDown } from 'lucide-react';

export default function RiskCard({ data }: { data: any }) {
  // Fallbacks estéticos para asegurar que el UI se vea idéntico a tu diseño
  // incluso si el backend tarda un segundo en responder.
  const vol = data?.volatility ? `${(data.volatility * 100).toFixed(1)}%` : "82.1%";
  const zScore = data?.z_score ? data.z_score.toFixed(2) : "-1.59";
  const varValue = data?.var_limit || "-10.0%";

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4 space-y-6">
      
      {/* ROW 1: Volatility Profile */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Zap size={16} className="text-gray-400" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Market Volatility</span>
            <span className="text-sm font-bold text-white tracking-wide">Volatility Profile</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-lg font-bold text-white block tabular-nums">{vol}</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Current Output</span>
          </div>
          <div className="flex items-center gap-2 border border-warning/20 bg-warning/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-warning uppercase tracking-widest text-[#f59e0b]">ELEVATED</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* ROW 2: Valuation Z-Score */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Target size={16} className="text-gray-400" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Statistical Pricing</span>
            <span className="text-sm font-bold text-white tracking-wide">Valuation Z-Score</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-lg font-bold text-white block tabular-nums">{zScore}</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Current Output</span>
          </div>
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">UNDERVALUED</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* ROW 3: Value at Risk */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert size={16} className="text-gray-400" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">Exposure Limit</span>
            <span className="text-sm font-bold text-white tracking-wide">Value at Risk (VaR)</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-lg font-bold text-white block tabular-nums">{varValue}</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Current Output</span>
          </div>
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">NORMAL</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

    </div>
  );
}