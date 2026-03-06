"use client";

import React, { useState, useEffect } from 'react';
import WorkspaceCanvas from '../components/WorkspaceCanvas';
import { Plus, X, Zap, Satellite, ShieldAlert, Calculator, Database } from 'lucide-react';

const WIDGET_OPTIONS = [
  { id: 'price-structure', name: 'Price Action', icon: <Zap size={14} /> },
  { id: 'radar-card', name: 'Flow Radar', icon: <Satellite size={14} /> },
  { id: 'risk-card', name: 'Risk Audit', icon: <ShieldAlert size={14} /> },
  { id: 'loan-simulator', name: 'Simulator', icon: <Calculator size={14} /> },
  //{ id: 'on-chain-card', name: 'On-Chain', icon: <Database size={14} /> },
  { id: 'pairs-trading', name: 'Pairs Trading', icon: <Satellite size={14} /> },
];

export default function TerminalPage() {
  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [terminalData, setTerminalData] = useState<any>({ radar: [], risk: null, sim: null, tickers: [] });

  // 1. Definición de la función Toggle (FIX para error 2304)
  const toggleWidget = (id: string) => {
    setActiveWidgets(prev => {
      const updated = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id];
      localStorage.setItem('volcano-layout', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('volcano-layout');
    setActiveWidgets(saved ? JSON.parse(saved) : ['price-structure', 'radar-card', 'risk-card', 'loan-simulator']);
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [resRadar, resRisk, resTickers] = await Promise.all([
          fetch(process.env.NEXT_PUBLIC_API_URL + '/radar'),
          fetch(process.env.NEXT_PUBLIC_API_URL + '/risk'),
          fetch(process.env.NEXT_PUBLIC_API_URL + '/tickers')
        ]);

        const radar = resRadar.ok ? await resRadar.json() : [];
        const risk = resRisk.ok ? await resRisk.json() : null;
        const tickers = resTickers.ok ? await resTickers.json() : [];

        setTerminalData({ radar, risk, tickers, sim: null });
      } catch (e) {
        console.error("Conexión perdida con Volcano Engine:", e);
      }
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden">
      <div className="p-4 md:p-10 max-w-[1700px] mx-auto">
        
        {/* HEADER */}
        <div className="mb-6 flex justify-between items-end border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter uppercase italic">
              Volcano <span className="text-emerald-500">Terminal</span>
            </h1>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mt-1">
              {terminalData.risk ? '● Engine Connected' : '○ Synchronizing...'}
            </p>
          </div>
        </div>

        <WorkspaceCanvas 
          activeWidgets={activeWidgets} 
          toggleWidget={toggleWidget}
          radarData={terminalData.radar}
          riskData={terminalData.risk}
          tickerData={terminalData.tickers}
        />
      </div>

      {/* FLOATING ADD BUTTON */}
      <div className="fixed bottom-8 right-8 z-[100]">
        {isMenuOpen && (
          <div className="absolute bottom-20 right-0 w-64 bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 font-mono text-[9px] text-emerald-500 uppercase tracking-widest">
              Librería de Módulos
            </div>
            <div className="p-2 space-y-1">
              {WIDGET_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { toggleWidget(item.id); setIsMenuOpen(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    activeWidgets.includes(item.id) ? 'bg-emerald-500/10 text-white border border-emerald-500/20' : 'hover:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-4 rounded-full shadow-2xl transition-all duration-300 ${
            isMenuOpen ? 'bg-white text-black rotate-90' : 'bg-emerald-500 text-black hover:scale-110'
          }`}
        >
          {isMenuOpen ? <X size={24} /> : <Plus size={24} />}
        </button>
      </div>
    </main>
  );
} 