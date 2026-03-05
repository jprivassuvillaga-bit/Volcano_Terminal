"use client";

import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { Responsive as ResponsiveGridLayout } from 'react-grid-layout';
import WidgetWrapper from './WidgetWrapper';
import TickerTape from './TickerTape'; 
import PriceStructureCard from './PriceStructureCard';
import LoanSimulator from './LoanSimulator';
import RadarCard from './RadarCard';
import RiskCard from './RiskCard';
import OnChainCard from './OnChainCard';
import PairsTradingCard from './PairsTradingCard';

// DNA de la Terminal: 4 + 4 + 4 = 12
const MASTER_LAYOUT = [
  { i: 'radar-card', x: 0, y: 0, w: 4, h: 22 },    
  { i: 'risk-card', x: 4, y: 0, w: 4, h: 22 },     
  { i: 'loan-simulator', x: 8, y: 0, w: 4, h: 22 }, 
  { i: 'on-chain-card', x: 0, y: 22, w: 6, h: 25 }, 
  { i: 'pairs-trading', x: 6, y: 22, w: 6, h: 25 }, 
];

// 🧠 GUÍAS DE INTERPRETACIÓN (Las que teníamos al inicio)
const INTERPRETATION_GUIDES: Record<string, string> = {
  'radar-card': 'Analiza el flujo COT: Si el NET institucional es alcista y el retail es bajista, el precio tiende a subir (Divergencia Pro).',
  'risk-card': 'Z-Score > 2.0 indica sobrecompra histórica. El VaR (Value at Risk) calcula tu pérdida máxima probable en 24 horas.',
  'loan-simulator': 'Gestiona tu colateral en BTC. Un LTV superior al 70% dispara alarmas de liquidación en condiciones de alta volatilidad.',
  'on-chain-card': 'Mayer Multiple < 1.0 es zona de acumulación histórica. El Hashrate confirma la seguridad y salud de los mineros.',
  'pairs-trading': 'Calcula el arbitraje entre activos correlacionados. Busca Z-Scores extremos (+2 o -2) para entradas de reversión estadística.',
};

export default function WorkspaceCanvas({ activeWidgets, toggleWidget, radarData, riskData, tickerData }: any) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  useEffect(() => {
    setMounted(true);
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth - 10);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full" ref={containerRef}>
      
      <TickerTape initialData={tickerData} />

      <div className="mt-8">
        {activeWidgets.includes('price-structure') && (
          <div className="w-full mb-6 border border-white/5 rounded-2xl overflow-hidden bg-[#050505] shadow-2xl" style={{ height: '520px' }}>
            <PriceStructureCard />
          </div>
        )}

        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: MASTER_LAYOUT, md: MASTER_LAYOUT, sm: MASTER_LAYOUT }}
          breakpoints={{ lg: 1200, md: 1200, sm: 1200, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
          rowHeight={10}
          width={width}
          margin={[12, 12]}
          draggableHandle=".drag-handle"
          useCSSTransforms={true}
          onResizeStop={() => {
             setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
          }}
          {...({ draggableHandle: ".drag-handle" } as any)}
        >
          {activeWidgets.filter((id: string) => id !== 'price-structure').map((id: string) => (
            <div key={id}>
              <WidgetWrapper 
                id={id} 
                title={id.replace('-',' ').toUpperCase()} 
                // AQUÍ RESTAURAMOS LAS INTERPRETACIONES
                description={INTERPRETATION_GUIDES[id] || "Interpretación de mercado Volcano."} 
                onRemove={toggleWidget}
              >
                <div className="h-full w-full bg-[#09090b]">
                  {id === 'radar-card' && <RadarCard data={radarData} />}
                  {id === 'risk-card' && <RiskCard data={riskData} />}
                  {id === 'loan-simulator' && <LoanSimulator btcPrice={riskData?.price || 0} />}
                  {id === 'on-chain-card' && <OnChainCard />}
                  {id === 'pairs-trading' && <PairsTradingCard />}
                </div>
              </WidgetWrapper>
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}