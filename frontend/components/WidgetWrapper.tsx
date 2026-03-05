"use client";

import React, { useState } from 'react';
import { GripHorizontal, Info, X } from 'lucide-react';

interface WidgetWrapperProps {
  id: string;
  title: string;
  description: string;
  onRemove: (id: string) => void;
  children: React.ReactNode;
}

export default function WidgetWrapper({ id, title, description, onRemove, children }: WidgetWrapperProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="w-full h-full flex flex-col bg-[#0f0f11] border border-white/10 rounded-xl overflow-hidden shadow-xl group">
      
      {/* HEADER DEL WIDGET (Barra de arrastre) */}
      <div className="h-10 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-3 select-none">
        
        <div className="flex items-center gap-2">
          {/* DRAG HANDLE: Solo de aquí se puede arrastrar */}
          <div className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded text-gray-500 transition-colors">
            <GripHorizontal size={14} />
          </div>
          <h3 className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{title}</h3>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`p-1.5 rounded transition-colors ${showInfo ? 'bg-emerald-500/20 text-emerald-500' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}
            title="Methodology & Info"
          >
            <Info size={14} />
          </button>
          <button 
            onClick={() => onRemove(id)}
            className="p-1.5 rounded text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Remove Widget"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* PANEL DE INFORMACIÓN (Se despliega al hacer click en 'i') */}
      {showInfo && (
        <div className="bg-black/80 border-b border-white/5 p-4 text-sm animate-in slide-in-from-top-2">
          <h4 className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest mb-2">Module Documentation</h4>
          <p className="text-gray-400 text-xs leading-relaxed">{description}</p>
        </div>
      )}

      {/* CONTENIDO DEL WIDGET (Gráfico, Simulador, etc.) */}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        {children}
      </div>
    </div>
  );
}