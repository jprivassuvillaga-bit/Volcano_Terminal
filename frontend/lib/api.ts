// frontend/lib/api.ts

const API_BASE = 'http://localhost:8000/api/v1';

export async function getInstitutionalRadar() {
  try {
    // cache: 'no-store' obliga a Next.js a pedir datos frescos en CADA recarga
    const res = await fetch(`${API_BASE}/radar`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching radar:", error);
    return null;
  }
}

export async function getRiskAnalysis(ticker: string = "BTC-USD") {
  try {
    const res = await fetch(`${API_BASE}/risk-analysis?ticker=${ticker}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching risk:", error);
    return null;
  }
}

export async function getSimulationData(ticker: string = "BTC-USD", days: number = 30) {
  try {
    const res = await fetch(`${API_BASE}/simulate?ticker=${ticker}&days=${days}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching simulation:", error);
    return null;
  }
}
// frontend/lib/api.ts
// (Añade esto debajo de las otras funciones que ya pusiste)

export async function getMacroTicker() {
  try {
    const res = await fetch(`${API_BASE}/macro-ticker`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error fetching ticker:", error);
    return [];
  }
}