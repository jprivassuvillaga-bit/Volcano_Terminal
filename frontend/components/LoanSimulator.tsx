"use client";

import React, { useState } from 'react';
import { Landmark, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function LoanSimulator({ btcPrice }: { btcPrice: number }) {
  // 1. INPUTS DEL CLIENTE Y DEL BANCO
  const [loan, setLoan] = useState(50000);
  const [targetLtv, setTargetLtv] = useState(62.5); // %
  const [haircut, setHaircut] = useState(30); // %
  
  // 2. INPUTS DEL MODELO VaR
  const [confLevel, setConfLevel] = useState(99); // %
  const [varDays, setVarDays] = useState(30); // Días
  const [isOpen, setIsOpen] = useState(false);

  // Prevención matemática básica
  const safeLtv = targetLtv > 0 ? targetLtv / 100 : 0.01;
  const safeHaircut = haircut < 100 ? haircut / 100 : 0.99;
  const currentPrice = btcPrice > 0 ? btcPrice : 94000; // Fallback si la API tarda

  // --- NÚCLEO MATEMÁTICO (VOLCANO BANK) ---
  
  // A. Colateral Requerido = Monto / (LTV * Precio * (1 - Haircut))
  const requiredCollateral = loan / (safeLtv * currentPrice * (1 - safeHaircut));
  const collateralValueUsd = requiredCollateral * currentPrice;

  // B. Precio de Liquidación (Asumiendo que el banco liquida al 85% de LTV real)
  const liqThreshold = 0.85; 
  const liqPrice = loan / (requiredCollateral * liqThreshold);
  const distanceToLiq = ((currentPrice - liqPrice) / currentPrice) * 100;

  // C. Motor VaR (Value at Risk Paramétrico)
  const getZScore = (conf: number) => {
    if (conf === 95) return 1.645;
    if (conf === 99.9) return 3.090;
    return 2.326; // 99% default
  };
  
  const zScore = getZScore(confLevel);
  const annualVolatility = 0.65; // Asumimos 65% de volatilidad anualizada (puede venir del backend luego)
  const timeFactor = Math.sqrt(varDays / 365);
  
  // Caída máxima probable en porcentaje
  const maxDrawdownPct = zScore * annualVolatility * timeFactor;
  // Precio de BTC en el peor escenario del VaR
  const stressTestedPrice = currentPrice * (1 - maxDrawdownPct);
  // Riesgo en Dólares
  const varUsd = maxDrawdownPct * collateralValueUsd;
  
  // ¿Sobrevive el préstamo al VaR?
  const isVarSafe = stressTestedPrice > liqPrice;

  return (
    <div className="bg-[#0f0f11] border border-white/10 rounded-xl overflow-hidden shadow-2xl w-full">
      
      {/* HEADER */}
      <div className="p-5 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Landmark size={18} className="text-emerald-500" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Volcano Origination Engine</h2>
        </div>
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">BTC Price: ${currentPrice.toLocaleString()}</span>
      </div>

      <div className="p-6 space-y-6">
        
        {/* RESULTADO HERO: COLATERAL REQUERIDO */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest block mb-1">Required Collateral</span>
            <span className="text-3xl font-black text-white">{requiredCollateral.toFixed(4)} <span className="text-lg text-gray-400">BTC</span></span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Equivalent Value</span>
            <span className="text-lg font-bold text-gray-300">${collateralValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* INPUTS DE ORIGINACIÓN */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-gray-400 uppercase">Requested Loan (USD)</label>
            <input 
              type="number" value={loan} onChange={(e) => setLoan(Number(e.target.value))}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full bg-black/50 border border-white/5 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-gray-400 uppercase">Target LTV (%)</label>
            <input 
              type="number" value={targetLtv} onChange={(e) => setTargetLtv(Number(e.target.value))}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full bg-black/50 border border-white/5 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-[9px] font-mono text-gray-400 uppercase">Institutional Haircut</label>
            <span className="text-[10px] text-emerald-500 font-bold">{haircut}%</span>
          </div>
          <input 
            type="range" min="0" max="50" step="1" value={haircut} onChange={(e) => setHaircut(Number(e.target.value))} 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-full accent-emerald-500 h-1 bg-white/5 rounded-lg appearance-none cursor-pointer" 
          />
        </div>

        {/* CONTROLES DEL VaR */}
        <div className="p-4 bg-black/30 border border-white/5 rounded-lg space-y-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Time-Horizon Risk (VaR)</span>
            {isVarSafe ? <ShieldCheck size={14} className="text-emerald-500" /> : <ShieldAlert size={14} className="text-red-500 animate-pulse" />}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-500 uppercase">Time Horizon</label>
              <select 
                value={varDays} onChange={(e) => setVarDays(Number(e.target.value))} 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full bg-black border border-white/10 rounded p-2 text-[10px] text-white outline-none"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>1 Month (30d)</option>
                <option value={90}>1 Quarter (90d)</option>
                <option value={180}>6 Months (180d)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-gray-500 uppercase">Confidence Level</label>
              <select 
                value={confLevel} onChange={(e) => setConfLevel(Number(e.target.value))} 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full bg-black border border-white/10 rounded p-2 text-[10px] text-white outline-none"
              >
                <option value={95}>95% (Z=1.645)</option>
                <option value={99}>99% (Z=2.326)</option>
                <option value={99.9}>99.9% (Z=3.090)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div>
              <span className="text-[8px] font-mono text-gray-500 uppercase block">Liquidation Price</span>
              <span className="text-sm font-bold text-white">${liqPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div>
              <span className="text-[8px] font-mono text-gray-500 uppercase block">VaR Stress Price</span>
              <span className={`text-sm font-bold ${isVarSafe ? 'text-amber-500' : 'text-red-500'}`}>
                ${stressTestedPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[8px] font-mono text-gray-500 uppercase block">Max Loss (USD)</span>
              <span className="text-sm font-bold text-gray-400">-${varUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* DROPDOWN AUDITORÍA MATEMÁTICA */}
        <div className="pt-2">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-full flex justify-between items-center p-3 bg-white/[0.02] hover:bg-white/[0.05] rounded-lg transition-all"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Mathematical Audit Log</span>
            {isOpen ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
          </button>

          {isOpen && (
            <div className="p-4 bg-black/60 border-x border-b border-white/5 rounded-b-lg space-y-4">
              <div>
                <h4 className="text-[9px] font-bold text-emerald-500 uppercase mb-2 underline decoration-emerald-500/30 underline-offset-4">Collateral Equation</h4>
                <div className="my-2 p-3 bg-black rounded font-mono text-[10px] text-blue-400 overflow-x-auto whitespace-nowrap">
                  {`$$Col_{req} = \\frac{Loan}{LTV_{target} \\times Price_{BTC} \\times (1 - Haircut)}$$`}
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-bold text-gray-500 uppercase mb-1">Time-Scaled VaR Engine</h4>
                <p className="text-[10px] text-gray-400 leading-relaxed italic mb-2">
                  Calcula la caída máxima del precio basada en la raíz cuadrada del tiempo. Si el "VaR Stress Price" es menor que el "Liquidation Price", el banco enfrenta un alto riesgo de insolvencia para este marco de tiempo.
                </p>
                <div className="p-3 bg-black rounded font-mono text-[10px] text-amber-500 overflow-x-auto whitespace-nowrap">
                  {`$$VaR_{\\%} = Z_{score} \\times \\sigma_{anual} \\times \\sqrt{\\frac{Days}{365}}$$`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}