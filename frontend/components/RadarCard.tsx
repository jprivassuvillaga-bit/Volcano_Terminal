"use client";

import React from 'react';
import { Users, Activity, BarChart2, ChevronDown } from 'lucide-react';

export default function RadarCard({ data }: { data: any }) {
  // Rescatamos datos o mostramos el default de tu diseño si el backend falla
  const top4 = data?.top4_concentration || "60.7%";
  const leveraged = data?.leveraged_spreading || "4,862";
  const netLongs = data?.net_long_exposure || "5,718";

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4 space-y-6">
      
      {/* ROW 1: Top 4 Concentration */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
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
          <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">WARNING</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* ROW 2: Leveraged Spreading */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
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
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">STRENGTH</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* ROW 3: Net Long Exposure */}
      <div className="flex justify-between items-center">
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
          <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">WARNING</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

    </div>
  );
}