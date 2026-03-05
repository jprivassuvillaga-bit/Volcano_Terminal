"use client";

import React from 'react';
import { Menu, X, Zap, Satellite, ShieldAlert, Calculator, Database } from 'lucide-react';

export default function Sidebar({ activeWidgets, toggleWidget, isOpen, setIsOpen }: any) {
  const items = [
    { id: 'price-structure', name: 'Price', icon: <Zap size={14} /> },
    { id: 'radar-card', name: 'Radar', icon: <Satellite size={14} /> },
    { id: 'risk-card', name: 'Risk', icon: <ShieldAlert size={14} /> },
    { id: 'loan-simulator', name: 'Simulator', icon: <Calculator size={14} /> },
    { id: 'on-chain-card', name: 'On-Chain', icon: <Database size={14} /> },
    { id: 'pairs-trading', name: 'Pairs', icon: <Satellite size={14} /> },
  ];

  return (
    <>
      {/* BOTÓN FLOTANTE */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="fixed top-6 left-6 z-[120] p-2 bg-[#111114] border border-white/10 rounded-lg text-white shadow-2xl hover:border-emerald-500/50 transition-all"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* PANEL OVERLAY: Con z-index alto para no desplazar el dashboard */}
      <div className={`fixed inset-0 z-[110] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        
        <aside className={`absolute top-0 left-0 h-full bg-[#050505] border-r border-white/5 w-60 transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 pt-24 space-y-4">
            <p className="text-[9px] font-mono text-emerald-500 uppercase tracking-[0.4em] mb-8 font-bold opacity-50">Librería Volcano</p>
            {items.map(item => (
              <button 
                key={item.id} 
                className={`flex items-center gap-4 w-full p-3 rounded-xl transition-all ${activeWidgets.includes(item.id) ? 'bg-white/5 border border-emerald-500/20' : 'hover:bg-white/5 border border-transparent'}`} 
                onClick={() => toggleWidget(item.id)}
              >
                <div className={activeWidgets.includes(item.id) ? 'text-emerald-500' : 'text-gray-600'}>{item.icon}</div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${activeWidgets.includes(item.id) ? 'text-white' : 'text-gray-500'}`}>{item.name}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}