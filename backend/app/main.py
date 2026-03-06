from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from app.services.institutional_service import InstitutionalService
from app.services.risk_service import RiskService
from app.services.market_data_service import MarketDataService
from app.services.simulation_service import SimulationService
import yfinance as yf
from fastapi import APIRouter 
import pandas as pd
import requests
from datetime import datetime
import numpy as np
from scipy import stats
from fastapi.middleware.cors import CORSMiddleware


# 1. Inicialización de la API
app = FastAPI(title="Volcano Terminal API", version="1.0.0")

# Permitimos tanto tu localhost (para desarrollo) como tu futura URL de Vercel
origins = [
    "http://localhost:3000",
    "https://volcano-terminal.vercel.app", # Reemplaza esto con tu URL de Vercel cuando la tengas
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # El asterisco es la llave maestra: permite que Vercel entre.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servisios...
inst_service = InstitutionalService()
risk_service = RiskService()
market_service = MarketDataService()
sim_service = SimulationService()

# --- ENDPOINTS SINCRONIZADOS ---

@app.get("/")
async def health_check():
    return {"status": "online", "system": "Volcano Terminal Core"}

@app.get("/api/v1/radar")
async def get_institutional_radar():
    return inst_service.get_cot_report()

# 1. CAMBIO: De 'risk-analysis' a 'risk' para que el Frontend lo encuentre
@app.get("/api/v1/risk")
def get_risk_analysis(ticker: str = "BTC-USD"):
    try:
        # Descargamos data (3 meses es perfecto para calcular 50 días de historia)
        df = yf.download(ticker, period="3mo", interval="1d")
        
        if df.empty:
            return {"error": "Datos no disponibles"}
            
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)

        # 1. Cálculo de Volatilidad
        df['log_returns'] = np.log(df['Close'] / df['Close'].shift(1))
        recent_30d_returns = df['log_returns'].tail(30)
        realized_volatility = float(recent_30d_returns.std() * np.sqrt(365)*100)
        
        # 2. Cálculo de Medias Móviles (Corto y Medio plazo)
        df['sma_20'] = df['Close'].rolling(window=20).mean()
        df['sma_50'] = df['Close'].rolling(window=50).mean()
        
        # Extracción de valores actuales
        current_sma_20 = float(df['sma_20'].iloc[-1])
        current_sma_50 = float(df['sma_50'].iloc[-1])
        current_price = float(df['Close'].iloc[-1])
        
        # --- VOLCANO RISK ENGINE: Scoring Multifactorial ---
        risk_score = 0
        
        if realized_volatility > 0.60:
            risk_score += 1
            
        if current_price < current_sma_20:
            risk_score += 1
            
        if current_price < current_sma_50:
            risk_score += 1
            
        # Asignación del régimen de mercado basado en el score
        if risk_score == 0:
            system_status = "NORMAL"
        elif risk_score == 1:
            system_status = "WATCH"
        elif risk_score == 2:
            system_status = "ELEVATED"
        else:
            system_status = "CRITICAL"
        
        return {
            "ticker": ticker,
            "volatility": realized_volatility, 
            "sma_20": current_sma_20,
            "sma_50": current_sma_50,
            "price": current_price,         
            "current_price": current_price, 
            "status": system_status,
            "risk_score": risk_score # Lo enviamos por si quieres pintar una barra de peligro en el futuro
        }
        
    except Exception as e:
        print(f"Error calculando riesgo: {e}")
        return {"error": "Error interno al calcular riesgo"}

# 2. CAMBIO: De 'simulate' a 'sim'
@app.get("/api/v1/sim")
async def get_simulation(ticker: str = "BTC-USD", days: int = 30):
    df = market_service.get_ohlcv(ticker=ticker)
    if df.empty:
        return {"error": "Datos insuficientes"}
    return sim_service.run_monte_carlo(df['close'], horizon=days)

# 3. CAMBIO: De 'macro-ticker' a 'tickers' (Este era el error del TickerTape)
@app.get("/api/v1/tickers")
async def get_macro_ticker():
    try:
        data = market_service.get_macro_data()
        return data if data else []
    except Exception as e:
        print(f"Error crítico en endpoint Ticker: {e}")
        return []
    
@app.get("/api/v1/ohlcv")
def get_historical_ohlcv(ticker: str = "BTC-USD", period: str = "1M"):
    """
    Motor OHLCV Multi-Timeframe.
    Traduce las peticiones del UI a los intervalos exactos de Yahoo Finance.
    """
    # Mapeo maestro de temporalidades
    period_map = {
        "1H": {"period": "1d", "interval": "2m"},  # 1 día de historia en velas de 2 min
        "1D": {"period": "5d", "interval": "15m"}, # 5 días de historia en velas de 15 min
        "7D": {"period": "1mo", "interval": "1h"}, # 1 mes de historia en velas de 1 hora
        "1M": {"period": "1mo", "interval": "1d"}, # 1 mes en velas diarias
        "3M": {"period": "3mo", "interval": "1d"}, 
        "1Y": {"period": "1y", "interval": "1d"},
        "5Y": {"period": "5y", "interval": "1wk"}, # Semanal para evitar colapsar la memoria
        "ALL": {"period": "max", "interval": "1wk"}
    }
    
    # Si el frontend manda un periodo raro, caemos por defecto en 1 Mes
    config = period_map.get(period, {"period": "1mo", "interval": "1d"})
    
    try:
        df = yf.download(ticker, period=config["period"], interval=config["interval"])
        
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)
            
        # Limpieza institucional de datos
        df = df.dropna(subset=['Open', 'Close'])
        df = df[~df.index.duplicated(keep='first')] # Elimina marcas de tiempo duplicadas
        df = df.sort_index() # Asegura orden cronológico perfecto
        
        results = []
        for index, row in df.iterrows():
            # Convertimos la fecha a UNIX Timestamp (segundos) - El formato nativo de TradingView
            unix_time = int(index.timestamp())
            
            results.append({
                "time": unix_time,
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close'])
            })
            
        return results
        
    except Exception as e:
        print(f"Error crítico en OHLCV Multi-Timeframe: {e}")
        return []
    
@app.get("/api/v1/onchain")
def get_onchain_metrics():
    """
    100% DATOS REALES:
    - Mayer Multiple vía Yahoo Finance (SMA 200)
    - Hashrate y Hash Ribbons vía Blockchain.com API
    """
    try:
        # 1. VALUACIÓN ESTADÍSTICA (Mayer Multiple)
        btc = yf.Ticker("BTC-USD")
        hist = btc.history(period="200d") # Descargamos 200 días exactos
        
        current_price = hist['Close'].iloc[-1]
        sma200 = hist['Close'].mean()
        mayer_multiple = current_price / sma200
        
        # 2. HASH RATE & CAPITULACIÓN (Blockchain.com)
        resp = requests.get("https://api.blockchain.info/charts/hash-rate?timespan=90days&format=json")
        data = resp.json()
        df = pd.DataFrame(data['values'])
        df['hashrate_EH'] = df['y'] / 1e6 
        
        df['sma30'] = df['hashrate_EH'].rolling(window=30).mean()
        df['sma60'] = df['hashrate_EH'].rolling(window=60).mean()
        
        latest = df.dropna().iloc[-1]
        current_hash = latest['hashrate_EH']
        sma30 = latest['sma30']
        sma60 = latest['sma60']
        
        is_capitulating = sma30 < sma60
        
        return {
            "valuation": {
                "name": "Mayer Multiple",
                "value": round(mayer_multiple, 2),
                "status": "UNDERVALUED" if mayer_multiple < 1 else "OVERHEATED" if mayer_multiple > 2.4 else "NEUTRAL",
                "min": 0.5,
                "max": 3.0
            },
            "hashrate": {
                "value": f"{current_hash:.0f}",
                "status": "SECURE"
            },
            "miner_capitulation": {
                "is_capitulating": bool(is_capitulating),
                "sma30": f"{sma30:.0f}",
                "sma60": f"{sma60:.0f}",
                "status": "CAPITULATION" if is_capitulating else "RECOVERY (BULLISH)"
            }
        }
    except Exception as e:
        print(f"Error crítico en OnChain API: {e}")
        return None
    
@app.get("/api/v1/pairs-trading")
def get_pairs_trading(target_ticker: str = "MSTR"):
    try:
        base_ticker = "BTC-USD"
        
        # 1. Descargamos ambos activos al mismo tiempo para que las fechas coincidan perfecto
        df = yf.download([base_ticker, target_ticker], period="1y", interval="1d")
        
        # Extraemos solo la tabla de precios de cierre
        if isinstance(df.columns, pd.MultiIndex):
            df_close = df['Close'].dropna()
        else:
            return {"error": "Formato de datos inesperado"}
            
        if df_close.empty or base_ticker not in df_close.columns or target_ticker not in df_close.columns:
            return {"error": "Datos insuficientes para el par"}

        # 2. CÁLCULO DE BETA (Sensibilidad direccional)
        returns = df_close.pct_change().dropna()
        covariance = returns[base_ticker].cov(returns[target_ticker])
        variance = returns[target_ticker].var()
        beta = float(covariance / variance) if variance != 0 else 0.0

        # 3. CÁLCULO DE Z-SCORE (Reversión a la media)
        # Calculamos el ratio o spread entre ambos activos
        ratio = df_close[base_ticker] / df_close[target_ticker]
        
        # Calculamos media y desviación estándar móvil de 30 días
        rolling_mean = ratio.rolling(window=30).mean()
        rolling_std = ratio.rolling(window=30).std()
        
        # Z-Score: (Valor Actual - Media) / Desviación Estándar
        z_score = (ratio - rolling_mean) / rolling_std
        
        # Limpiamos los primeros 30 días que dan 'NaN' por la ventana móvil
        z_score_clean = z_score.dropna()

        # 4. FORMATEO PARA EL GRÁFICO (Unix Timestamp)
        history = []
        for index, val in z_score_clean.items():
            history.append({
                "time": int(index.timestamp()),
                "value": float(val)
            })

        current_z = float(z_score_clean.iloc[-1])

        return {
            "z_score": current_z,
            "beta": beta,
            "history": history
        }

    except Exception as e:
        print(f"Error calculando Pairs Trading: {e}")
        return {"error": "Error interno calculando pares"}
