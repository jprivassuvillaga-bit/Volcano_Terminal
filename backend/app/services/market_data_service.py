import yfinance as yf
import pandas as pd
import numpy as np
import ccxt
import requests
import feedparser
from datetime import datetime
from functools import lru_cache

class MarketDataService:
    """
    Servicio Centralizado de Ingesta de Datos.
    Conecta con Yahoo Finance, Binance y fuentes On-Chain.
    """

    def __init__(self):
        self.binance = ccxt.binance()

    def get_ohlcv(self, ticker="BTC-USD", period="2y", interval="1d"):
        """Descarga y procesa datos históricos con métricas técnicas."""
        try:
            t = yf.Ticker(ticker)
            df = t.history(period=period, interval=interval)
            
            if df.empty: return pd.DataFrame()

            df.columns = [c.lower() for c in df.columns]
            if df.index.tz is not None:
                df.index = df.index.tz_localize(None)

            # --- Tus cálculos originales (El ADN de Volcano Bank) ---
            df['sma_50'] = df['close'].rolling(window=50).mean()
            df['sma_200'] = df['close'].rolling(window=200).mean()
            
            # Volatilidad Realizada
            df['log_ret'] = np.log(df['close'] / df['close'].shift(1))
            annual_factor = np.sqrt(365) if interval == "1d" else np.sqrt(365 * 24)
            df['volatility'] = df['log_ret'].rolling(window=30).std() * annual_factor
            
            # Tu IV Proxy original
            df['implied_vol_proxy'] = df['volatility'] * 1.1 + (df['volatility'] ** 2) * 2
            
            # Z-Score de 200 días
            std_200 = df['close'].rolling(window=200).std()
            df['z_score'] = (df['close'] - df['sma_200']) / std_200.replace(0, np.nan)
            
            return df.fillna(0)
        except Exception as e:
            print(f"Error en OHLCV: {e}")
            return pd.DataFrame()

    def get_order_book(self, symbol='BTC/USDT'):
        """Extrae liquidez real del LOB de Binance."""
        try:
            ob = self.binance.fetch_order_book(symbol, limit=100)
            
            def process_side(data, side):
                df = pd.DataFrame(data, columns=['price', 'amount'])
                df['side'] = side
                df['liquidity_usd'] = df['price'] * df['amount']
                return df

            bids = process_side(ob['bids'], 'bid')
            asks = process_side(ob['asks'], 'ask')
            
            return pd.concat([bids, asks])
        except Exception as e:
            return pd.DataFrame()

    def get_derivatives_risk(self):
        """Métricas de derivados: Funding y Put/Call Ratio."""
        risk = {"funding_rate": 0, "pc_ratio": 0.75}
        try:
            # Funding de Binance
            funding = self.binance.fetch_funding_rate('BTC/USDT')
            risk['funding_rate'] = funding['fundingRate'] * 100
            
            # Put/Call Ratio desde BITO (ETF)
            bito = yf.Ticker("BITO")
            if bito.options:
                opts = bito.option_chain(bito.options[0])
                calls_v = opts.calls['volume'].sum()
                puts_v = opts.puts['volume'].sum()
                if calls_v > 0:
                    risk['pc_ratio'] = puts_v / calls_v
        except: pass
        return risk

    def get_etf_flow_proxy(self, ticker="IBIT"):
        """Calcula el RVOL (Relative Volume) como proxy de interés institucional."""
        try:
            hist = yf.Ticker(ticker).history(period="30d")
            curr_vol = hist['Volume'].iloc[-1]
            avg_vol = hist['Volume'].iloc[:-1].mean()
            return {
                "ticker": ticker,
                "rvol": round(curr_vol / avg_vol, 2) if avg_vol > 0 else 0,
                "price": round(hist['Close'].iloc[-1], 2)
            }
        except: return None

    def get_fear_greed(self):
        """Índice de Sentimiento."""
        try:
            res = requests.get("https://api.alternative.me/fng/?limit=1").json()
            return {"value": int(res['data'][0]['value']), "label": res['data'][0]['value_classification']}
        except: return {"value": 50, "label": "Neutral"}

    def get_onchain_hashrate(self):
        """Métrica de seguridad de la red."""
        try:
            res = requests.get("https://api.blockchain.info/charts/hash-rate?timespan=1year&format=json").json()
            latest = res['values'][-1]
            return {"value": f"{latest['y']/1e6:.2f} EH/s", "date": datetime.fromtimestamp(latest['x']).strftime('%Y-%m-%d')}
        except: return None
    # Dentro de tu clase MarketDataService en market_data_service.py

    def get_macro_data(self):
        """
        Extracción Híbrida: 
        Cripto vía Binance (CCXT) -> 100% Real-time y sin bloqueos.
        Macro vía Yahoo Finance -> Índices tradicionales + 30 días de historia para gráficos.
        """
        results = []
        
        # 1. BLOQUE CRIPTO (Datos Reales de Binance)
        try:
            tickers = self.binance.fetch_tickers(['BTC/USDT', 'ETH/USDT', 'SOL/USDT'])
            
            for symbol in ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']:
                if symbol in tickers:
                    data = tickers[symbol]
                    current = data['last']
                    change = data['percentage'] 
                    
                    name = symbol.replace("USDT", "USD")
                    results.append({
                        "symbol": name,
                        "price": f"{current:,.2f}" if current < 1000 else f"{current:,.0f}",
                        "change": f"{change:+.2f}%",
                        "isPositive": change >= 0
                    })
        except Exception as e:
            print(f"Error extrayendo Cripto de Binance: {e}")

        # 2. BLOQUE MACRO (Datos Reales de Wall Street vía Yahoo con Historia)
        tradfi_tickers = {
            "S&P 500": "^GSPC",
            "GOLD": "GC=F",
            "DXY": "DX-Y.NYB",
            "NVDA": "NVDA"
        }
        
        for name, sym in tradfi_tickers.items():
            try:
                t = yf.Ticker(sym)
                # ¡AQUÍ ESTÁ LA MAGIA! Pedimos 30 días en lugar de 5
                hist = t.history(period="30d") 
                
                if len(hist) >= 2:
                    current = float(hist['Close'].iloc[-1])
                    prev = float(hist['Close'].iloc[-2])
                    
                    if prev == 0: continue
                    change = ((current / prev) - 1) * 100
                    
                    # Formateamos el historial para TradingView en React
                    history_data = []
                    for date, row in hist.iterrows():
                        history_data.append({
                            "time": date.strftime('%Y-%m-%d'),
                            "value": float(row['Close'])
                        })
                    
                    results.append({
                        "symbol": name,
                        "price": f"{current:,.2f}" if current < 1000 else f"{current:,.0f}",
                        "change": f"{change:+.2f}%",
                        "isPositive": change >= 0,
                        "history": history_data # Inyectamos la historia al JSON
                    })
            except Exception as e:
                print(f"Error extrayendo {name} de Yahoo: {e}")
                continue
                
        return results