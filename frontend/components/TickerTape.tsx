"use client";

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: string | number;
  change: string | number;
}

export default function TickerTape({ initialData = [] }: { initialData?: TickerItem[] }) {
  // Estado de seguridad: Si el backend no ha enviado nada, no inventamos datos.
  if (!initialData || initialData.length === 0) {
    return (
      <div className="w-full bg-[#050505] border-y border-white/5 py-2.5 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] italic">
            Waiting for Volcano Engine live feed...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#050505] border-y border-white/5 py-2 overflow-hidden whitespace-nowrap">
      <div className="flex animate-ticker hover:pause">
        {/* Duplicamos los items para el efecto de scroll infinito sin saltos */}
        {[...initialData, ...initialData].map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 px-10 border-r border-white/5">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {item.symbol}
            </span>
            <span className="text-[11px] font-mono font-bold text-white">
              {typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
            </span>
            <span className={`text-[9px] font-bold flex items-center gap-1 ${
              String(item.change).includes('+') || Number(item.change) > 0 
                ? 'text-emerald-500' 
                : 'text-red-500'
            }`}>
              {(String(item.change).includes('+') || Number(item.change) > 0) 
                ? <ArrowUpRight size={10} /> 
                : <ArrowDownRight size={10} />
              }
              {item.change}%
            </span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          width: fit-content;
          animation: ticker 45s linear infinite;
        }
        .hover\:pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}