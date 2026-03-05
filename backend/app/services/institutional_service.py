import pandas as pd
import requests
from datetime import datetime

class InstitutionalService:
    def __init__(self):
        self.legacy_url = "https://publicreporting.cftc.gov/resource/6dca-aqww.json"
        self.tff_url = "https://publicreporting.cftc.gov/resource/gpe5-46if.json"
        self.params = {
            "$limit": 52, 
            "$order": "report_date_as_yyyy_mm_dd DESC", 
            "$where": "cftc_contract_market_code like '133741%'"
        }

    def _get_col(self, df, keywords):
        for col in df.columns:
            if all(k in col for k in keywords): return col
        return None

    def get_cot_report(self):
        try:
            df_leg = pd.DataFrame(requests.get(self.legacy_url, params=self.params).json())
            df_tff = pd.DataFrame(requests.get(self.tff_url, params=self.params).json())
            
            df_leg.columns = [c.lower() for c in df_leg.columns]
            df_tff.columns = [c.lower() for c in df_tff.columns]
            
            col_conc = self._get_col(df_leg, ['conc', '4', 'long'])
            col_spread = self._get_col(df_leg, ['noncomm', 'spread'])
            col_asset_l = self._get_col(df_tff, ['asset', 'mgr', 'long'])
            col_asset_s = self._get_col(df_tff, ['asset', 'mgr', 'short'])

            # Numeric Conversion
            current_conc = pd.to_numeric(df_leg[col_conc].iloc[0])
            prev_conc = pd.to_numeric(df_leg[col_conc].iloc[1])
            avg_conc = pd.to_numeric(df_leg[col_conc]).mean()
            
            current_spread = pd.to_numeric(df_leg[col_spread].iloc[0])
            prev_spread = pd.to_numeric(df_leg[col_spread].iloc[1])
            
            asset_net = pd.to_numeric(df_tff[col_asset_l].iloc[0]) - pd.to_numeric(df_tff[col_asset_s].iloc[0])
            prev_asset_net = pd.to_numeric(df_tff[col_asset_l].iloc[1]) - pd.to_numeric(df_tff[col_asset_s].iloc[1])

            status_points = 0
            
            # Module 1: Concentration (Top 4 Holders)
            m1_status = "GREEN" if current_conc > prev_conc else "RED"
            m1 = {
                "title": "Top 4 Concentration (Longs)",
                "data": f"Current: {current_conc:.1f}% | Prev: {prev_conc:.1f}% | 52W Avg: {avg_conc:.1f}%",
                "interp": "Major participants are increasing net exposure." if m1_status == "GREEN" else "Major holders are liquidating structural positions.",
                "hex": "#10B981" if m1_status == "GREEN" else "#EF4444"
            }
            status_points += 1 if m1_status == "GREEN" else -1

            # Module 2: Non-Commercial Spreading (Hedge Funds / Risk Appetite)
            m2_status = "GREEN" if current_spread < prev_spread else "RED"
            m2 = {
                "title": "Leveraged Funds Spreading",
                "data": f"Contracts: {current_spread:,.0f} | WoW Change: {(current_spread-prev_spread):+,.0f}",
                "interp": "Leveraged funds are shifting to directional bias (Risk-On)." if m2_status == "GREEN" else "Funds are hedging via spreading, indicating volatility fears.",
                "hex": "#10B981" if m2_status == "GREEN" else "#EF4444"
            }
            status_points += 1 if m2_status == "GREEN" else -1

            # Module 3: Asset Managers (Real Money)
            m3_status = "GREEN" if asset_net > prev_asset_net else "YELLOW"
            m3 = {
                "title": "Asset Manager Net Position",
                "data": f"Net Longs: {asset_net:,.0f} | Prev: {prev_asset_net:,.0f}",
                "interp": "Structural 'Real Money' accumulation remains active." if m3_status == "GREEN" else "Institutional long exposure is stabilizing/decelerating.",
                "hex": "#10B981" if m3_status == "GREEN" else "#F59E0B"
            }
            status_points += 1 if m3_status == "GREEN" else 0

            return {
                "status": "ACCUMULATION" if status_points >= 1 else "DISTRIBUTION" if status_points <= -1 else "NEUTRAL",
                "last_audit": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "modules": {"m1": m1, "m2": m2, "m3": m3}
            }
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}