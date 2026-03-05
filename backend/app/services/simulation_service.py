import numpy as np
import pandas as pd
from scipy import stats

class SimulationService:
    def run_monte_carlo(self, price_series: pd.Series, horizon=30, n_sims=1000):
        log_returns = np.log(price_series / price_series.shift(1)).dropna()
        u, var, stdev = log_returns.mean(), log_returns.var(), log_returns.std()
        drift = u - (0.5 * var)

        # Fit T-Student for Fat Tails
        params = stats.t.fit(log_returns)
        df_deg = params[0]
        
        random_shocks = np.random.standard_t(df_deg, (horizon, n_sims))
        daily_returns = np.exp(drift + stdev * random_shocks)

        last_price = price_series.iloc[-1]
        price_paths = np.zeros_like(daily_returns)
        price_paths[0] = last_price
        for t in range(1, horizon):
            price_paths[t] = price_paths[t-1] * daily_returns[t]

        final_prices = price_paths[-1]
        expected = float(final_prices.mean())
        p5 = float(np.percentile(final_prices, 5))
        p95 = float(np.percentile(final_prices, 95))

        # We return 3 specific projection "paths" for the UI
        return {
            "status": "BULLISH" if expected > last_price else "BEARISH",
            "last_audit": pd.Timestamp.now().strftime("%H:%M"),
            "projections": [
                {
                    "id": "expected",
                    "actor": "Baseline Projection",
                    "title": "Mean Expected Value",
                    "value": f"${expected:,.0f}",
                    "status": "POSITIVE" if expected > last_price else "NEGATIVE",
                    "hex": "#10B981" if expected > last_price else "#EF4444",
                    "interp": f"The model suggests a central tendency toward ${expected:,.0f} by day {horizon}.",
                    "data": f"Current: ${last_price:,.0f} | 30D Target: ${expected:,.0f}"
                },
                {
                    "id": "p95",
                    "actor": "Optimistic Boundary",
                    "title": "95th Percentile (P95)",
                    "value": f"${p95:,.0f}",
                    "status": "UPSIDE",
                    "hex": "#10B981",
                    "interp": "Upper statistical boundary assuming a positive volatility shock.",
                    "data": f"Potential Upside: {((p95/last_price)-1):.1%}"
                },
                {
                    "id": "p5",
                    "actor": "Pessimistic Boundary",
                    "title": "5th Percentile (P5)",
                    "value": f"${p5:,.0f}",
                    "status": "DOWNSIDE",
                    "hex": "#EF4444",
                    "interp": "Lower statistical boundary accounting for T-Student 'Fat Tail' events.",
                    "data": f"Potential Drawdown: {((p5/last_price)-1):.1%}"
                }
            ]
        }