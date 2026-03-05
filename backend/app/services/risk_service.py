import numpy as np
import pandas as pd

class RiskService:
    def calculate_volatility_metrics(self, prices: pd.Series, window=30):
        log_returns = np.log(prices / prices.shift(1))
        realized_vol = log_returns.rolling(window=window).std() * np.sqrt(365)
        
        vol_avg = realized_vol.rolling(window=10).mean()
        panic_multiplier = np.where(vol_avg > 0.60, 0.40, 0.15)
        spread = (vol_avg * panic_multiplier) + 0.05
        implied_vol_sim = realized_vol + spread

        curr_rv = realized_vol.iloc[-1]
        curr_iv = implied_vol_sim.iloc[-1]

        return {
            "id": "volatility",
            "title": "Volatility Profile",
            "value": f"{curr_rv:.1%}",
            "status": "STABLE" if curr_rv < 0.50 else "ELEVATED",
            "hex": "#10B981" if curr_rv < 0.50 else "#F59E0B",
            "interp": f"Realized volatility is holding at {curr_rv:.1%}, with an implied panic spread of {(curr_iv-curr_rv):.1%}.",
            "data": f"RV: {curr_rv:.1%} | IV (Sim): {curr_iv:.1%}"
        }

    def get_valuation_zscore(self, prices: pd.Series, window=120):
        realized_price_proxy = prices.rolling(window=window).mean()
        std_dev = prices.rolling(window=window).std()
        z_score = (prices - realized_price_proxy) / std_dev
        curr_z = z_score.iloc[-1]
        
        if curr_z > 2: status, hex_val = "OVEREXTENDED", "#EF4444"
        elif curr_z < -1: status, hex_val = "UNDERVALUED", "#10B981"
        else: status, hex_val = "FAIR VALUE", "#F59E0B"

        return {
            "id": "valuation",
            "title": "Valuation Z-Score",
            "value": f"{curr_z:.2f}",
            "status": status,
            "hex": hex_val,
            "interp": f"Price is trading at {abs(curr_z):.2f} standard deviations from the 120-day mean.",
            "data": f"Z-Score: {curr_z:.2f} | Basis: 120D Moving Mean"
        }

    def run_var_simulator(self, spot_price, volatility, days=1, confidence="99%"):
        z = 2.326 # 99% Confidence
        time_factor = np.sqrt(days / 365.0)
        price_drop_pct = z * volatility * time_factor
        potential_loss = spot_price * price_drop_pct

        return {
            "id": "var",
            "title": "Value at Risk (VaR)",
            "value": f"-{price_drop_pct:.1%}",
            "status": "CRITICAL" if price_drop_pct > 0.10 else "NORMAL",
            "hex": "#EF4444" if price_drop_pct > 0.10 else "#10B981",
            "interp": f"99% statistical confidence that maximum 24h drawdown will not exceed {price_drop_pct:.1%}.",
            "data": f"Max Probable Loss: -${potential_loss:,.0f} per BTC"
        }
    


    

def advanced_loan_audit(self, loan_amount, btc_collateral, btc_price, haircut=0.20, ltv_target=0.50, conf_interval=0.99):
    """
    Calcula la viabilidad de un préstamo bajo parámetros institucionales.
    """
    # Valor de la garantía aplicando el Haircut
    effective_collateral_value = (btc_collateral * btc_price) * (1 - haircut)
    
    # LTV Actual
    current_ltv = loan_amount / effective_collateral_value if effective_collateral_value > 0 else 0
    
    # Precio de Liquidación (Asumiendo umbral del 80%)
    liq_threshold = 0.80
    liquidation_price = loan_amount / (btc_collateral * liq_threshold)
    
    return {
        "current_ltv": current_ltv,
        "liquidation_price": liquidation_price,
        "collateral_needed": loan_amount / (ltv_target * btc_price * (1 - haircut)),
        "health_factor": "OPTIMAL" if current_ltv <= ltv_target else "WARNED"
    }