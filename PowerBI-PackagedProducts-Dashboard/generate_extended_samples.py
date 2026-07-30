"""
Generate extended sample files from new screenshot discoveries:
  1. Morningstar_monthly_extended_sample.csv  — adds Net_Assets_M, fees, Share_Class, Inception_Date
  2. March_TopHoldings_sample.csv             — "March" tab (WFA AUM vs Industry AUM, Ownership %)
  3. Net_YTD_ChannelBreakdown_sample.csv      — monthly channel/advisory/brokerage net breakdown
Run: python3 generate_extended_samples.py
"""

import csv, random
from datetime import date, timedelta

random.seed(99)

# ─── Shared reference data ───────────────────────────────────────────────────
FUND_FAMILIES = [
    "Capital Group", "PIMCO", "JPMorgan", "Fidelity", "T. Rowe Price",
    "Allspring", "Vanguard", "Lord Abbett", "Franklin Templeton", "MFS",
    "BlackRock", "Nuveen", "First Eagle", "John Hancock", "Invesco",
    "Dodge & Cox", "Eaton Vance", "Goldman Sachs", "Principal", "New York Life",
    "Columbia Threadneedle", "Natixis", "Russell Investments", "Harbor",
    "AllianceBernstein", "Hartford Funds", "Virtus", "Guggenheim", "BNY Mellon",
    "Federated Hermes", "Victory Capital", "Baird", "Touchstone Investments",
]

MSTAR_CATS = [
    "US Fund Large Blend", "US Fund Large Growth", "US Fund Large Value",
    "US Fund Moderate Allocation", "US Fund Short-Term Bond",
    "US Fund Intermediate Core Bond", "US Fund Intermediate Core-Plus Bond",
    "US Fund Foreign Large Blend", "US Fund Foreign Large Growth",
    "US Fund Mid-Cap Blend", "US Fund Small Blend", "US Fund Multisector Bond",
    "US Fund High Yield Bond", "US Fund High Yield Muni",
    "US Fund Muni National Interm", "US Fund Small Growth",
    "US Fund Real Estate", "US Fund Tactical Allocation",
    "US Fund Global Moderate Allocation", "US Fund Diversified Emerging Mkts",
    "US Fund Commodities Broad Basket", "US Fund Nontraditional Bond",
    "US Fund Muni National Long", "US Fund Mid-Cap Growth",
    "US Fund Foreign Large Value",
]

US_CAT_GROUP = {
    "US Fund Large Blend": "U.S. Equity", "US Fund Large Growth": "U.S. Equity",
    "US Fund Large Value": "U.S. Equity", "US Fund Mid-Cap Blend": "U.S. Equity",
    "US Fund Mid-Cap Growth": "U.S. Equity", "US Fund Small Blend": "U.S. Equity",
    "US Fund Small Growth": "U.S. Equity", "US Fund Real Estate": "Sector Equity",
    "US Fund Moderate Allocation": "Allocation", "US Fund Tactical Allocation": "Allocation",
    "US Fund Global Moderate Allocation": "Allocation",
    "US Fund Short-Term Bond": "Fixed Income", "US Fund Intermediate Core Bond": "Fixed Income",
    "US Fund Intermediate Core-Plus Bond": "Fixed Income",
    "US Fund Multisector Bond": "Fixed Income", "US Fund High Yield Bond": "Fixed Income",
    "US Fund Nontraditional Bond": "Fixed Income",
    "US Fund High Yield Muni": "Municipal Bond", "US Fund Muni National Interm": "Municipal Bond",
    "US Fund Muni National Long": "Municipal Bond",
    "US Fund Foreign Large Blend": "International Equity",
    "US Fund Foreign Large Growth": "International Equity",
    "US Fund Foreign Large Value": "International Equity",
    "US Fund Diversified Emerging Mkts": "International Equity",
    "US Fund Commodities Broad Basket": "Commodities",
}

BROAD_CAT = {
    "U.S. Equity": "U.S. Equity", "Sector Equity": "Sector Equity",
    "Allocation": "Allocation", "Fixed Income": "Taxable Bond",
    "Municipal Bond": "Municipal Bond", "International Equity": "International Equity",
    "Commodities": "Commodities",
}

SHARE_CLASSES = ["A", "C", "I", "Inst", "R", "R6", "Retirement", "Investor"]
SHARE_CLASS_WEIGHTS = [0.30, 0.15, 0.10, 0.25, 0.05, 0.05, 0.05, 0.05]

def weighted_choice(items, weights):
    r = random.random()
    cumulative = 0
    for item, w in zip(items, weights):
        cumulative += w
        if r < cumulative:
            return item
    return items[-1]

def random_cusip():
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
    return ''.join(random.choices(chars, k=9))

def random_fund_id():
    return "FSUSA" + ''.join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ0123456789", k=5))

def random_date(start_year=1985, end_year=2020):
    start = date(start_year, 1, 1)
    end   = date(end_year, 12, 31)
    return start + timedelta(days=random.randint(0, (end - start).days))

# ─── 1. Morningstar Extended ──────────────────────────────────────────────────
mstar_rows = []
for i in range(200):
    family   = random.choice(FUND_FAMILIES)
    mcat     = random.choice(MSTAR_CATS)
    us_group = US_CAT_GROUP.get(mcat, "U.S. Equity")
    broad    = BROAD_CAT.get(us_group, "U.S. Equity")
    sc       = weighted_choice(SHARE_CLASSES, SHARE_CLASS_WEIGHTS)
    fund_nm  = f"{family} {mcat.replace('US Fund ', '')} Fund {sc}"
    cusip    = random_cusip()
    fund_id  = random_fund_id()
    ticker   = ''.join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=3)) + \
               {'A':'X','C':'X','I':'X','Inst':'X','R':'X','R6':'X','Retirement':'X','Investor':'X'}[sc]
    net_assets_m = round(random.uniform(50, 85000), 2)  # $50M to $85B
    mgmt_fee     = round(random.uniform(0.10, 1.20), 4)
    fee_12b1     = round(random.choices([0.0, 0.25, 0.50, 1.00],
                          weights=[0.40, 0.30, 0.15, 0.15])[0], 2)
    shareholder  = round(random.uniform(0.0, 0.25), 4)
    inception    = random_date()
    net_assets_dt = date(2026, 3, 31)

    mstar_rows.append({
        "CUSIP": cusip,
        "Ticker": ticker,
        "Allowable_List": random.choices(["Y","N"], weights=[0.75, 0.25])[0],
        "Rec": random.choices(["Y","N"], weights=[0.70, 0.30])[0],
        "ACL": random.choices(["Y","N"], weights=[0.80, 0.20])[0],
        "Fund_Legal_Name": fund_nm,
        "Fund_ID": fund_id,
        "Branding_Name": family,
        "US_Category_Group": us_group,
        "Global_Broad_Category_Group": broad,
        "Morningstar_Category": mcat,
        "Share_Class": sc,
        "Inception_Date": inception.strftime("%m/%d/%Y"),
        "Net_Assets_Date": net_assets_dt.strftime("%m/%d/%Y"),
        "Net_Assets_M": net_assets_m,
        "Net_Assets_Currency": "USD",
        "Management_Fee": mgmt_fee,
        "Prospectus_12b1": fee_12b1,
        "Shareholder_Fee": shareholder,
        "Is_SMA_or_529": random.choices(["N","Y"], weights=[0.92, 0.08])[0],
        "Is_Master_List_Fund": random.choices(["Y","N"], weights=[0.65, 0.35])[0],
        "Real_Share_Class": random.choices(["Y","N"], weights=[0.85, 0.15])[0],
    })

out = "sample_data/Morningstar_monthly_extended_sample.csv"
with open(out, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(mstar_rows[0].keys()))
    writer.writeheader()
    writer.writerows(mstar_rows)
print(f"Written {len(mstar_rows)} rows to {out}")

# ─── 2. March Tab — Top Holdings by AUM ──────────────────────────────────────
# Mirrors the "March" tab in March Net 2026 V2.xlsx
top_holding_rows = []
wfa_total_aum = 431_938_729_975  # $431.9B total

for rank, row in enumerate(sorted(mstar_rows, key=lambda x: -x["Net_Assets_M"])[:50], start=1):
    industry_aum  = row["Net_Assets_M"] * 1_000_000
    wfa_ownership = round(random.uniform(0.005, 0.15), 4)  # 0.5% to 15%
    wfa_aum       = round(industry_aum * wfa_ownership)
    cur_mo_net    = round(random.uniform(-250_000_000, 150_000_000), 2)
    ytd_net       = round(cur_mo_net * random.uniform(0.8, 3.5), 2)

    top_holding_rows.append({
        "Fund_ID":              row["Fund_ID"],
        "Name":                 row["Fund_Legal_Name"],
        "Family":               row["Branding_Name"],
        "Morningstar_Category": row["Morningstar_Category"],
        "Broad_Category":       row["Global_Broad_Category_Group"],
        "WFA_AUM":              wfa_aum,
        "Fund_AUM_Industry":    round(industry_aum),
        "WFA_Ownership_Pct":    round(wfa_ownership * 100, 2),
        "AUM_Rank":             rank,
        "Current_Month_Net":    cur_mo_net,
        "YTD_Net":              ytd_net,
        "Rec":                  row["Rec"],
        "Is_Master_List_Fund":  row["Is_Master_List_Fund"],
        "Month_End_Date":       "2026-03-31",
    })

out2 = "sample_data/March_TopHoldings_sample.csv"
with open(out2, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(top_holding_rows[0].keys()))
    writer.writeheader()
    writer.writerows(top_holding_rows)
print(f"Written {len(top_holding_rows)} rows to {out2}")

# ─── 3. Net YTD Channel Breakdown ────────────────────────────────────────────
# Mirrors the YTD tab (one row per month, channel x advisory/brokerage breakdown)
months = [
    ("2025-01-31","Jan-25"),("2025-02-28","Feb-25"),("2025-03-31","Mar-25"),
    ("2025-04-30","Apr-25"),("2025-05-31","May-25"),("2025-06-30","Jun-25"),
    ("2025-07-31","Jul-25"),("2025-08-31","Aug-25"),("2025-09-30","Sep-25"),
    ("2025-10-31","Oct-25"),("2025-11-30","Nov-25"),("2025-12-31","Dec-25"),
    ("2026-01-31","Jan-26"),("2026-02-28","Feb-26"),("2026-03-31","Mar-26"),
]

# Actual Q1 2026 data from screenshots for first 3 2026 months
actuals = {
    "2026-01-31": {"Adv":-182_285_881, "Brok":-473_935_621, "Total":-635_291_502,
                   "PCG_Adv":-214_385_865, "PCG_Brok":-277_975_388,
                   "WBS_Adv":-142_166_356, "WBS_Brok": 52_806_908,
                   "FINET_Adv":-78_170_585, "FINET_Brok": 34_406_406,
                   "WFAS_Adv":-13_986_787, "WFAS_Brok":-35_524_681},
    "2026-02-28": {"Adv":-239_116_205, "Brok":-205_992_598, "Total":-33_125_607,
                   "PCG_Adv":-41_328_434, "PCG_Brok":-283_253_280,
                   "WBS_Adv":-138_505_960, "WBS_Brok":-86_158_799,
                   "FINET_Adv":-234_393_080, "FINET_Brok":-106_893_388,
                   "WFAS_Adv":-13_498_070, "WFAS_Brok":-53_769_997},
    "2026-03-31": {"Adv":-776_166_010, "Brok":-568_477_592, "Total":-1_344_643_602,
                   "PCG_Adv":-400_368_918, "PCG_Brok":-283_253_280,
                   "WBS_Adv":-138_505_960, "WBS_Brok":-86_158_799,
                   "FINET_Adv":-234_393_080, "FINET_Brok":-106_893_388,
                   "WFAS_Adv":-13_498_070, "WFAS_Brok":-53_769_997},
}

channel_rows = []
for eom, label in months:
    if eom in actuals:
        a = actuals[eom]
        adv, brok, total = a["Adv"], a["Brok"], a["Total"]
        pcg_adv, pcg_brok = a["PCG_Adv"], a["PCG_Brok"]
        wbs_adv, wbs_brok = a["WBS_Adv"], a["WBS_Brok"]
        fin_adv, fin_brok = a["FINET_Adv"], a["FINET_Brok"]
        wfa_adv, wfa_brok = a["WFAS_Adv"], a["WFAS_Brok"]
    else:
        adv   = round(random.uniform(-350_000_000, -100_000_000))
        brok  = round(random.uniform(-500_000_000, -50_000_000))
        total = adv + brok
        pcg_adv  = round(adv  * random.uniform(0.45, 0.60))
        pcg_brok = round(brok * random.uniform(0.40, 0.55))
        wbs_adv  = round(adv  * random.uniform(0.20, 0.30))
        wbs_brok = round(brok * random.uniform(0.15, 0.25))
        fin_adv  = round(adv  * random.uniform(0.20, 0.30))
        fin_brok = round(brok * random.uniform(0.15, 0.25))
        wfa_adv  = round(adv  * random.uniform(0.03, 0.08))
        wfa_brok = round(brok * random.uniform(0.05, 0.12))

    fs_gross      = round(random.uniform(0, 500_000_000))
    pathways_gross= 0
    rec_net       = round(total * random.uniform(-0.50, 0.20))
    master_net    = round(total * random.uniform(-0.60, 0.15))

    channel_rows.append({
        "Month_End_Date":       eom,
        "Month_Label":          label,
        "FS_Gross_Purchases":   fs_gross,
        "Pathways_Gross":       pathways_gross,
        "Overall_Net_Advisory": adv,
        "Overall_Net_Brokerage":brok,
        "Overall_Net":          total,
        "PCG_Net_Advisory":     pcg_adv,
        "PCG_Net_Brokerage":    pcg_brok,
        "PCG_Total_Net":        pcg_adv + pcg_brok,
        "WBS_Net_Advisory":     wbs_adv,
        "WBS_Net_Brokerage":    wbs_brok,
        "WBS_Total_Net":        wbs_adv + wbs_brok,
        "FINET_Net_Advisory":   fin_adv,
        "FINET_Net_Brokerage":  fin_brok,
        "FINET_Total_Net":      fin_adv + fin_brok,
        "WFAS_Net_Advisory":    wfa_adv,
        "WFAS_Net_Brokerage":   wfa_brok,
        "WFAS_Total_Net":       wfa_adv + wfa_brok,
        "Rec_Funds_Net_incl_Exchanges":    rec_net,
        "Master_List_Funds_Net_incl_Exch": master_net,
    })

out3 = "sample_data/Net_YTD_ChannelBreakdown_sample.csv"
with open(out3, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(channel_rows[0].keys()))
    writer.writeheader()
    writer.writerows(channel_rows)
print(f"Written {len(channel_rows)} rows to {out3}")

print("\nDone. Files created:")
for f in [out, out2, out3]:
    print(f"  {f}")
