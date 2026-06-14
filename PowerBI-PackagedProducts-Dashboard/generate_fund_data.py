"""
Mutual Fund Power BI Migration — Sample Data Generator
Generates realistic CSV files matching the actual schema from MF_SLS_FLOW,
MF_SLS_POS, Morningstar_monthly, Revenue_Trails_Commissions, and AUM_Summary.
"""

import csv
import random
import string
from datetime import date, timedelta
import os

random.seed(42)

# ── Output paths ──────────────────────────────────────────────────────────────
OUT_DIR = os.path.join(os.path.dirname(__file__), "sample_data")
os.makedirs(OUT_DIR, exist_ok=True)


# ── Shared reference data ──────────────────────────────────────────────────────
EOM_DATES = [
    "2025-01-31", "2025-02-28", "2025-03-31", "2025-04-30", "2025-05-31",
    "2025-06-30", "2025-07-31", "2025-08-31", "2025-09-30", "2025-10-31",
    "2025-11-30", "2025-12-31", "2026-01-31", "2026-02-28", "2026-03-31",
]

MONTH_LABELS = [
    "Jan-25", "Feb-25", "Mar-25", "Apr-25", "May-25",
    "Jun-25", "Jul-25", "Aug-25", "Sep-25", "Oct-25",
    "Nov-25", "Dec-25", "Jan-26", "Feb-26", "Mar-26",
]

FAMILY_BRAND_MAP = {
    "DWS FUNDS":           "DWS",
    "AMERICAN FUNDS":      "capital group",
    "INVESCO":             "Invesco",
    "CAPITAL GROUP":       "capital group",
    "PIMCO":               "PIMCO",
    "JPMORGAN":            "JPMorgan",
    "FIDELITY":            "Fidelity",
    "T ROWE PRICE":        "T. Rowe Price",
    "FRANKLIN TEMPLETON":  "Franklin Templeton",
    "LORD ABBETT":         "Lord Abbett",
    "VANGUARD":            "Vanguard",
    "MFS":                 "MFS",
    "BLACKROCK":           "BlackRock",
    "NUVEEN":              "Nuveen",
    "FIRST EAGLE":         "First Eagle",
}

MF_FAMILIES = list(FAMILY_BRAND_MAP.keys())

MF_CLASSES      = ["A", "C", "S", "INST", "INV"]
MF_CLASS_WEIGHTS = [0.40, 0.15, 0.10, 0.30, 0.05]

CHANNELS        = ["PCG", "WBS", "FINET", "WFAS", "FCCS"]
ACCT_TYPES      = ["ADVISORY", "BROKERAGE"]
PROGRAMS        = ["ADVISORY", "BROKERAGE"]
LEGACY_PROGRAMS = [
    "BROKERAGE", "ASSET ADVISOR", "CUSTOMCHOICE", "FUNDSOURCE",
    "MASTERS", "PIM", "FC/QC", "PERSONALIZED UMA",
]
RTMT_TYPES      = ["IRA", "NON-RETIREMENT", "SEP", "SIM", "QP"]

MSTAR_CATS = [
    "US Fund Large Blend",
    "US Fund Large Growth",
    "US Fund Large Value",
    "US Fund Moderate Allocation",
    "US Fund Short-Term Bond",
    "US Fund Intermediate Core Bond",
    "US Fund Foreign Large Blend",
    "US Fund Mid-Cap Blend",
    "US Fund Small Blend",
    "US Fund Multisector Bond",
    "US Fund High Yield Bond",
    "US Fund Small Growth",
    "US Fund Real Estate",
    "US Fund Tactical Allocation",
]

BROAD_CATEGORIES = [
    "US Equity",
    "International Equity",
    "Fixed Income",
    "Allocation",
    "Alternative",
    "Sector Equity",
    "Commodities",
]

ASSET_CLASSES = [
    "Equity Fund",
    "Bond Fund",
    "Balanced Fund",
    "Money Market Fund",
    "International Equity Fund",
    "Alternative Fund",
]

# ── Helper generators ──────────────────────────────────────────────────────────

def rand_cusip():
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=9))


def rand_fund_id():
    prefix = random.choice(["FSUSA", "FSC", "FSCAP", "FSINV"])
    if prefix == "FSC":
        return prefix + "".join(random.choices(string.digits, k=7))
    return prefix + "".join(random.choices(string.digits + string.ascii_uppercase, k=5))


def weighted_choice(choices, weights):
    return random.choices(choices, weights=weights, k=1)[0]


def rand_amount(lo, hi):
    return round(random.uniform(lo, hi), 2)


# Pre-build a small fund master so rows are internally consistent
def build_fund_master(n=80):
    master = []
    for _ in range(n):
        family = random.choice(MF_FAMILIES)
        brand  = FAMILY_BRAND_MAP[family]
        mstar  = random.choice(MSTAR_CATS)
        mf_cls = weighted_choice(MF_CLASSES, MF_CLASS_WEIGHTS)
        fund_id = rand_fund_id()
        cusip   = rand_cusip()
        sym     = "".join(random.choices(string.ascii_uppercase, k=4)) + "X"
        mf_nm   = f"{family} {mstar.split()[-1]} Fund {mf_cls}"
        master.append({
            "CUSIP":       cusip,
            "SEC_SYM":     sym,
            "MF_FAM_DESC": family,
            "MF_NM":       mf_nm,
            "MF_CLASS":    mf_cls,
            "Fund_ID":     fund_id,
            "Brand":       brand,
            "Mstar_Cat":   mstar,
            "US_cat":      mstar,
        })
    return master


FUND_MASTER = build_fund_master(80)


# ═══════════════════════════════════════════════════════════════════════════════
# A) MF_SLS_FLOW_sample.csv — transaction-level, ~2000 rows
# ═══════════════════════════════════════════════════════════════════════════════

def generate_flow(path, n_rows=2000):
    cols = [
        "EOM_DT", "CUSIP", "SEC_SYM", "MF_FAM_DESC", "MF_NM", "MF_CLASS",
        "EXISTS_ON_MSTA", "CHANNEL", "ACCT_TYP", "PROGRAM", "LEGACY_PROGRAM",
        "RTMT_ACCT_TYP", "TRADE_SIDE", "EXCHANGE_IND", "GROSS_AMOUNT",
        "NET_ORIG_AMOUNT", "NET_AMOUNT", "TRD_CNT", "Is_it_a_MF", "Rec",
        "ACL", "Fund_ID", "Brand", "Mstar_Cat", "US_cat",
    ]
    rows = []
    for _ in range(n_rows):
        fund   = random.choice(FUND_MASTER)
        eom    = random.choice(EOM_DATES)
        side   = "P" if random.random() < 0.60 else "S"
        gross  = rand_amount(500, 5_000_000)
        net    = gross if side == "P" else -gross
        exch   = "Y" if random.random() < 0.15 else "N"
        acct   = "ADVISORY" if random.random() < 0.60 else "BROKERAGE"
        channel = random.choices(
            CHANNELS, weights=[0.40, 0.20, 0.15, 0.15, 0.10], k=1
        )[0]
        legacy  = random.choice(LEGACY_PROGRAMS)
        rtmt    = random.choice(RTMT_TYPES)

        rows.append([
            eom,
            fund["CUSIP"],
            fund["SEC_SYM"],
            fund["MF_FAM_DESC"],
            fund["MF_NM"],
            fund["MF_CLASS"],
            "Y" if random.random() < 0.90 else "N",   # EXISTS_ON_MSTA
            channel,
            acct,
            acct,                                       # PROGRAM mirrors ACCT_TYP
            legacy,
            rtmt,
            side,
            exch,
            round(gross, 2),
            round(net, 2),
            round(net, 2),
            random.randint(1, 50),
            "Y" if random.random() < 0.95 else "N",   # Is_it_a_MF
            "Y" if random.random() < 0.70 else "N",   # Rec
            "Y" if random.random() < 0.80 else "N",   # ACL
            fund["Fund_ID"],
            fund["Brand"],
            fund["Mstar_Cat"],
            fund["US_cat"],
        ])

    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(rows)

    print(f"  Created {path}  ({len(rows)} rows)")
    return len(rows)


# ═══════════════════════════════════════════════════════════════════════════════
# B) MF_SLS_POS_sample.csv — monthly AUM/positions, ~1000 rows
# ═══════════════════════════════════════════════════════════════════════════════

def generate_pos(path, n_rows=1000):
    cols = [
        "EOM_DT", "MF_NM", "MF_CLASS", "ASSET_CLASS", "CHANNEL", "ACCT_TYP",
        "PROGRAM", "LEGACY_PROGRAM", "RET_ACCT_TYPE", "POS_MKT_VAL",
        "POSITION_COUNT", "Is_it_a_MF", "Rec", "ACL", "Fund_ID", "Brand",
        "Mstar_Cat", "US_cat",
    ]
    rows = []
    for _ in range(n_rows):
        fund    = random.choice(FUND_MASTER)
        eom     = random.choice(EOM_DATES)
        acct    = "ADVISORY" if random.random() < 0.60 else "BROKERAGE"
        channel = random.choices(
            ["PCG", "WBS", "FINET", "WFAS"], weights=[0.40, 0.20, 0.20, 0.20], k=1
        )[0]
        rows.append([
            eom,
            fund["MF_NM"],
            fund["MF_CLASS"],
            random.choice(ASSET_CLASSES),
            channel,
            acct,
            acct,
            random.choice(LEGACY_PROGRAMS),
            random.choice(RTMT_TYPES),
            round(rand_amount(50_000, 500_000_000), 2),
            random.randint(1, 500),
            "Y" if random.random() < 0.95 else "N",
            "Y" if random.random() < 0.70 else "N",
            "Y" if random.random() < 0.80 else "N",
            fund["Fund_ID"],
            fund["Brand"],
            fund["Mstar_Cat"],
            fund["US_cat"],
        ])

    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(rows)

    print(f"  Created {path}  ({len(rows)} rows)")
    return len(rows)


# ═══════════════════════════════════════════════════════════════════════════════
# C) Morningstar_monthly_sample.csv — one row per CUSIP, ~200 rows
# ═══════════════════════════════════════════════════════════════════════════════

def generate_morningstar(path):
    cols = [
        "CUSIP", "SEC_SYM", "MF_FAM_DESC", "MF_NM", "Fund_ID", "Brand",
        "Mstar_Cat", "US_cat", "Is_SMA_or_529", "Allowable_List",
        "Is_Master_List_Fund", "Real_Share_Class", "Broad_Category",
    ]

    # Start from the fund master, add extra rows for variety
    extra = build_fund_master(120)
    all_funds = FUND_MASTER + extra
    # Deduplicate by CUSIP
    seen = {}
    for f in all_funds:
        if f["CUSIP"] not in seen:
            seen[f["CUSIP"]] = f

    rows = []
    for fund in seen.values():
        rows.append([
            fund["CUSIP"],
            fund["SEC_SYM"],
            fund["MF_FAM_DESC"],
            fund["MF_NM"],
            fund["Fund_ID"],
            fund["Brand"],
            fund["Mstar_Cat"],
            fund["US_cat"],
            "Y" if random.random() < 0.10 else "N",   # Is_SMA_or_529
            "Y" if random.random() < 0.75 else "N",   # Allowable_List
            "Y" if random.random() < 0.65 else "N",   # Is_Master_List_Fund
            "Y" if random.random() < 0.85 else "N",   # Real_Share_Class
            random.choice(BROAD_CATEGORIES),
        ])

    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(rows)

    print(f"  Created {path}  ({len(rows)} rows)")
    return len(rows)


# ═══════════════════════════════════════════════════════════════════════════════
# D) Revenue_Trails_Commissions_sample.csv — 15 monthly rows
# ═══════════════════════════════════════════════════════════════════════════════

def generate_revenue(path):
    cols = [
        "Month", "Month_End_Date",
        "Commission_Revenue", "Trail_Revenue", "Total_Revenue",
        "Advisory_Pct", "Brokerage_Pct",
    ]
    rows = []
    for label, eom in zip(MONTH_LABELS, EOM_DATES):
        commission = round(rand_amount(25_000_000, 35_000_000), 0)
        trail      = round(rand_amount(120_000_000, 170_000_000), 0)
        total      = commission + trail
        adv_pct    = round(random.uniform(0.55, 0.65), 4)
        brok_pct   = round(1 - adv_pct, 4)
        rows.append([label, eom, commission, trail, total, adv_pct, brok_pct])

    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(rows)

    print(f"  Created {path}  ({len(rows)} rows)")
    return len(rows)


# ═══════════════════════════════════════════════════════════════════════════════
# E) AUM_Summary_sample.csv — 15 monthly summary rows
# ═══════════════════════════════════════════════════════════════════════════════

def generate_aum_summary(path):
    cols = [
        "Month", "Month_End_Date",
        "Advisory_AUM", "Brokerage_AUM", "Level0_AUM", "Total_AUM",
        "PCG_Advisory", "PCG_Brokerage",
        "WBS_Advisory", "WBS_Brokerage",
        "FINET_Advisory", "FINET_Brokerage",
        "WFAS_Advisory", "WFAS_Brokerage",
    ]
    rows = []
    for label, eom in zip(MONTH_LABELS, EOM_DATES):
        total      = round(rand_amount(380_000_000_000, 430_000_000_000), 0)
        adv_frac   = random.uniform(0.58, 0.64)
        advisory   = round(total * adv_frac, 0)
        brokerage  = round(total * (1 - adv_frac), 0)
        level0     = round(total * random.uniform(0.01, 0.03), 0)

        # Channel splits — PCG biggest, then WBS, FINET, WFAS
        pcg_frac   = random.uniform(0.48, 0.55)
        wbs_frac   = random.uniform(0.18, 0.24)
        finet_frac = random.uniform(0.12, 0.18)
        wfas_frac  = 1 - pcg_frac - wbs_frac - finet_frac

        pcg_adv    = round(advisory * pcg_frac, 0)
        pcg_brok   = round(brokerage * pcg_frac, 0)
        wbs_adv    = round(advisory * wbs_frac, 0)
        wbs_brok   = round(brokerage * wbs_frac, 0)
        finet_adv  = round(advisory * finet_frac, 0)
        finet_brok = round(brokerage * finet_frac, 0)
        wfas_adv   = round(advisory * wfas_frac, 0)
        wfas_brok  = round(brokerage * wfas_frac, 0)

        rows.append([
            label, eom,
            advisory, brokerage, level0, total,
            pcg_adv, pcg_brok,
            wbs_adv, wbs_brok,
            finet_adv, finet_brok,
            wfas_adv, wfas_brok,
        ])

    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(rows)

    print(f"  Created {path}  ({len(rows)} rows)")
    return len(rows)


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("Generating mutual fund sample data...\n")

    counts = {}
    counts["MF_SLS_FLOW"]              = generate_flow(
        os.path.join(OUT_DIR, "MF_SLS_FLOW_sample.csv"), n_rows=2000
    )
    counts["MF_SLS_POS"]               = generate_pos(
        os.path.join(OUT_DIR, "MF_SLS_POS_sample.csv"), n_rows=1000
    )
    counts["Morningstar_monthly"]       = generate_morningstar(
        os.path.join(OUT_DIR, "Morningstar_monthly_sample.csv")
    )
    counts["Revenue_Trails_Commissions"] = generate_revenue(
        os.path.join(OUT_DIR, "Revenue_Trails_Commissions_sample.csv")
    )
    counts["AUM_Summary"]              = generate_aum_summary(
        os.path.join(OUT_DIR, "AUM_Summary_sample.csv")
    )

    print("\nRow counts:")
    for name, cnt in counts.items():
        print(f"  {name}: {cnt}")

    print("\nDone. All files written to:", OUT_DIR)
