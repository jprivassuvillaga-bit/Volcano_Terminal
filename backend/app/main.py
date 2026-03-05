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
        # 1. Descargamos la data cruda y segura de Yahoo
        df = yf.download(ticker, period="3mo", interval="1d")
        
        if df.empty:
            return {"error": "Datos no disponibles"}
            
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.droplevel(1)

        # 2. LAS MATEMÁTICAS (Lo que faltaba)
        # Calculamos los retornos diarios
        df['returns'] = df['Close'].pct_change()
        
        # Calculamos la Volatilidad Histórica (Rolling de 20 días anualizado)
        df['volatility'] = df['returns'].rolling(window=20).std() * np.sqrt(365) * 100
        
        # Calculamos la Media Móvil de 20 días (SMA 20)
        df['sma_20'] = df['Close'].rolling(window=20).mean()
        
        # Limpiamos los primeros días que no tienen suficientes datos para el cálculo
        df = df.dropna()

        # 3. Extraemos el último valor de nuestras nuevas columnas
        current_volatility = float(df['volatility'].iloc[-1])
        current_sma = float(df['sma_20'].iloc[-1])
        current_price = float(df['Close'].iloc[-1])
        
        # Lógica de Riesgo
        risk_status = "Alto Riesgo" if current_volatility > 60 else "Riesgo Moderado"
        
        # 4. Devolvemos el JSON exacto que tu frontend necesita
        return {
            "ticker": ticker,
            "volatility": current_volatility, # El frontend estaba buscando esta llave exacta
            "sma_20": current_sma,
            "current_price": current_price,
            "status": risk_status
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
    """
    Calcula el Arbitraje Estadístico (Z-Score y Beta) entre BTC y el activo objetivo.
    """
    try:
        # 1. Descargamos 1 año de datos para ambos activos simultáneamente
        df = yf.download(["BTC-USD", target_ticker], period="1y")
        
        # Aplanamos el MultiIndex de Yahoo Finance si existe
        if isinstance(df.columns, pd.MultiIndex):
            close_data = df['Close']
        else:
            close_data = df
            
        # Limpiamos los datos
        close_data = close_data.dropna()
        
        # 2. Matemáticas de Arbitraje Estadístico (Stat Arb)
        # Ratio de precios
        ratio = close_data["BTC-USD"] / close_data[target_ticker]
        
        # Z-Score Móvil de 30 días
        rolling_mean = ratio.rolling(window=30).mean()
        rolling_std = ratio.rolling(window=30).std()
        z_score = (ratio - rolling_mean) / rolling_std
        
        # Beta (Correlación de retornos)
        ret_btc = close_data["BTC-USD"].pct_change()
        ret_target = close_data[target_ticker].pct_change()
        covariance = ret_btc.rolling(window=30).cov(ret_target)
        variance = ret_target.rolling(window=30).var()
        beta = covariance / variance
        
        # 3. Empaquetado
        result_df = pd.DataFrame({'z_score': z_score, 'beta': beta}).dropna()
        
        history = []
        for date, row in result_df.iterrows():
            history.append({
                "time": date.strftime('%Y-%m-%d'),
                "value": float(row['z_score'])
            })
            
        return {
            "z_score": float(result_df['z_score'].iloc[-1]),
            "beta": float(result_df['beta'].iloc[-1]),
            "history": history
        }
    except Exception as e:
        print(f"Error en Pairs Trading: {e}")
        return None

