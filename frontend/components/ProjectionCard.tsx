"use client";

import React from 'react';
import { LineChart, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';

export default function ProjectionCard({ data }: { data: any }) {
  // 1. EXTRAEMOS LOS OBJETOS EXACTOS QUE MANDA PYTHON
  const expectedObj = data?.projections?.find((p: any) => p.id === 'expected');
  const upperObj = data?.projections?.find((p: any) => p.id === 'p95');
  const lowerObj = data?.projections?.find((p: any) => p.id === 'p5');

  // 2. ASIGNAMOS LOS VALORES REALES (y un texto de carga limpio si demora)
  const expectedPrice = expectedObj?.value || "Cargando...";
  const upperPrice = upperObj?.value || "Cargando...";
  const lowerPrice = lowerObj?.value || "Cargando...";

  // 3. APROVECHAMOS LA METADATA DE TU BACKEND ("Potential Upside: 41.6%", etc.)
  const expectedMeta = expectedObj?.data || "Model Output";
  const upperMeta = upperObj?.data || "Model Output";
  const lowerMeta = lowerObj?.data || "Model Output";

  return (
    <div className="flex flex-col h-full w-full bg-transparent p-4 space-y-6">
      
      {/* ROW 1: Expected Value (Mean) */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <LineChart size={16} className="text-gray-400" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">30-Day Simulation</span>
            <span className="text-sm font-bold text-white tracking-wide">Expected Value (Mean)</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-lg font-bold text-white block tabular-nums">{expectedPrice}</span>
            {/* Usamos tu texto dinámico del backend */}
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{expectedMeta}</span>
          </div>
          <div className="flex items-center gap-2 border border-blue-500/20 bg-blue-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">BASELINE</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* ROW 2: Upper Bound (95%) */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <ArrowUpRight size={16} className="text-emerald-500" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">95% Confidence</span>
            <span className="text-sm font-bold text-white tracking-wide">Upper Bound Limit</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-lg font-bold text-emerald-500 block tabular-nums">{upperPrice}</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{upperMeta}</span>
          </div>
          <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">OPTIMISTIC</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

      {/* ROW 3: Lower Bound (5%) */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ArrowDownRight size={16} className="text-red-500" />
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-widest mb-1">5% Confidence</span>
            <span className="text-sm font-bold text-white tracking-wide">Lower Bound Limit</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <span className="text-lg font-bold text-red-500 block tabular-nums">{lowerPrice}</span>
            <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{lowerMeta}</span>
          </div>
          <div className="flex items-center gap-2 border border-red-500/20 bg-red-500/5 px-2 py-1 rounded">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">STRESS TEST</span>
            <ChevronDown size={12} className="text-gray-500" />
          </div>
        </div>
      </div>

    </div>
  );
}