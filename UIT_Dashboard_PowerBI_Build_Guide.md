# UIT Product Dashboard — Power BI Build Guide

A reference for replicating the **UIT Product Dashboard** PowerPoint (Q1 "Top Sellers"
layout + Q2 "Overview metrics" layout) in Power BI Desktop, built **dynamically**
(no hardcoded years/months/quarters) so it rolls forward every quarter on a data refresh.

> **Context:** Unit Investment Trust (UIT) sibling of the MF Product Dashboard
> (see `MF_Dashboard_PowerBI_Build_Guide.md`). Same reporting workflow — replacing a
> manual Excel + PowerPoint process. Data is sensitive and stays on the work laptop.
> All source values are in full dollars unless noted.
> **Reporting date = latest month in the UIT fact table (`EOM_DT`).**
> **Global rule from the slides: "UIT Data excludes FCCS."**

---

## 1. Data Model Overview

| Table | Role | Key columns |
|---|---|---|
| `UIT_Sales` | Fact (gross sales, concessions) | `EOM_DT` (end-of-month date), `FIRM` (sponsor), `TRUST` (product name), `TERM` (15 / 24 month), `MSTAR_CAT`, `ACCT_TYP` (Brokerage / Asset Advisor / FA Directed), `CHANNEL`, `Amount`, `Concession`, `Metric` |
| `Assets` | Fact (AUM snapshots) | `EOM_DT`, `FIRM`, `AUM` (point-in-time, month/quarter end) |
| `Advisory` | Fact/append (advisory sales) | `EOM_DT`, `Amount` (Asset Advisor + FA Directed advisory flows) |
| `Calendar` | Date dimension | `Date`, `Year`, `MonthNo`, `MonthYear`, `MonthYearSort`, `Quarter`, `QtrNo` |
| `Firm` | Dim | `FIRM` = First Trust / Guggenheim / AAM / SmartTrust / Invesco / … |
| `Term` | Disconnected dim | `Term` = "15 month" / "24 month" |
| `AcctType` | Dim | `ACCT_TYP` = Brokerage / Asset Advisor / FA Directed |
| `MetricPeriod` | Disconnected dim (dynamic labels) | `Period`, `Label`, `Sort` |

**Channel rule:** `CHANNEL <> "FCCS"` on **every** UIT measure — bake it into the base
measure so no visual can accidentally include FCCS.
**Term split:** UIT products are grouped by `TERM` = 15-month vs 24-month across the
top-seller tables. Keep `TERM` as a real column on the fact and (optionally) a
disconnected `Term` dim for slicers.
**Account-type split:** `ACCT_TYP` drives the Sales-By-Account-Type panel and the
Brokerage vs Advisory breakdown.

---

## 2. Global Rules & Base Measures

Anchor everything to a dynamic reporting date — no hardcoded 2026/June/Q2.

```dax
-- Reporting month-end (latest data), ignores any filter
UIT Reporting EOM = CALCULATE(MAX(UIT_Sales[EOM_DT]), ALL(UIT_Sales))
```

```dax
-- Base sales measure: FCCS ALWAYS excluded
UIT Sales =
CALCULATE(SUM(UIT_Sales[Amount]), UIT_Sales[CHANNEL] <> "FCCS")
```

```dax
-- Base concession measure: FCCS excluded
UIT Concessions =
CALCULATE(SUM(UIT_Sales[Concession]), UIT_Sales[CHANNEL] <> "FCCS")
```

```dax
-- Current month (the reporting month, e.g. "June")
UIT Sales Curr Mo =
VAR d = [UIT Reporting EOM]
RETURN CALCULATE([UIT Sales], 'Calendar'[Year] = YEAR(d), 'Calendar'[MonthNo] = MONTH(d))
```

```dax
-- YTD through the reporting month, current year
UIT Sales YTD =
VAR d = [UIT Reporting EOM]
RETURN CALCULATE([UIT Sales], 'Calendar'[Year] = YEAR(d), 'Calendar'[MonthNo] <= MONTH(d))
```

```dax
-- Prior-year YTD — cumulative, NOT single month (mirror the MF "<= mo" fix)
UIT Sales Prior YTD =
VAR d = [UIT Reporting EOM]
RETURN CALCULATE([UIT Sales], 'Calendar'[Year] = YEAR(d) - 1, 'Calendar'[MonthNo] <= MONTH(d))
```

> **Lesson carried from the MF build:** every Prior-YTD measure must use
> `MonthNo <= MONTH(d)` (cumulative), never `= MONTH(d)`. Applies to sales,
> concessions, advisory, and the 15mo/24mo variants below.

### 2.1 Term-scoped sales (15mo vs 24mo)
```dax
UIT Sales 15mo = CALCULATE([UIT Sales], UIT_Sales[TERM] = "15 month")
UIT Sales 24mo = CALCULATE([UIT Sales], UIT_Sales[TERM] = "24 month")

UIT Sales 15mo YTD = CALCULATE([UIT Sales YTD], UIT_Sales[TERM] = "15 month")
UIT Sales 24mo YTD = CALCULATE([UIT Sales YTD], UIT_Sales[TERM] = "24 month")

UIT Sales 15mo Curr Mo = CALCULATE([UIT Sales Curr Mo], UIT_Sales[TERM] = "15 month")
UIT Sales 24mo Curr Mo = CALCULATE([UIT Sales Curr Mo], UIT_Sales[TERM] = "24 month")
```

---

## 3. Page 1 — Top Sellers (Q1 layout)

Two panels of **Top-N tables**, each split by term and by period.
Use a **matrix/table visual with a Top-N visual filter** (or a `RANKX` measure) so the
lists roll forward automatically — never a hardcoded product list.

### 3.1 Top Selling Morningstar Category by Term
Four tables, each **Top 3 `MSTAR_CAT`**:

| Table | X (rows) | Value measure | Top-N |
|---|---|---|---|
| 15mo — current month | `UIT_Sales[MSTAR_CAT]` | `[UIT Sales 15mo Curr Mo]` | Top 3 |
| 24mo — current month | `MSTAR_CAT` | `[UIT Sales 24mo Curr Mo]` | Top 3 |
| 15mo — YTD | `MSTAR_CAT` | `[UIT Sales 15mo YTD]` | Top 3 |
| 24mo — YTD | `MSTAR_CAT` | `[UIT Sales 24mo YTD]` | Top 3 |

- Set each visual's **Filters → Top N = Top 3 by the matching measure**.
- Column header for the $ column: bind to the dynamic period label (§5) so
  "Mar 15mo $" / "YTD 15mo $" update with the reporting month.

### 3.2 Top Selling Trust by Term
Four tables, each **Top 5 `TRUST`** with `FIRM` shown alongside:

| Table | X (rows) | Value measure | Top-N |
|---|---|---|---|
| 15 month — current month | `Firm[FIRM]`, `UIT_Sales[TRUST]` | `[UIT Sales 15mo Curr Mo]` | Top 5 |
| 24 month — current month | `FIRM`, `TRUST` | `[UIT Sales 24mo Curr Mo]` | Top 5 |
| 15 month — current quarter | `FIRM`, `TRUST` | `[UIT Sales 15mo QTD]` | Top 5 |
| 24 month — current quarter | `FIRM`, `TRUST` | `[UIT Sales 24mo QTD]` | Top 5 |

Quarter-to-date term measures:
```dax
UIT Sales QTD =
VAR d = [UIT Reporting EOM]
RETURN CALCULATE([UIT Sales],
    'Calendar'[Year] = YEAR(d),
    'Calendar'[QtrNo] = ROUNDUP(MONTH(d)/3, 0))

UIT Sales 15mo QTD = CALCULATE([UIT Sales QTD], UIT_Sales[TERM] = "15 month")
UIT Sales 24mo QTD = CALCULATE([UIT Sales QTD], UIT_Sales[TERM] = "24 month")
```

> **Row numbering on Top-N grids:** a Power Query index won't survive the Top-N filter.
> Use a visual calculation `Row = ROWNUMBER(ORDERBY([<value measure>], DESC))`, or a
> `RANKX(ALLSELECTED('UIT_Sales'[TRUST]), [<value measure>], , DESC)` measure. Always
> include `ORDERBY`/`DESC` or it sorts alphabetically.

---

## 4. Page 2 — Overview Metrics (Q2 layout)

### 4.1 Assets (current vs previous quarter)
```dax
UIT Total Assets = CALCULATE(SUM(Assets[AUM]), Assets[CHANNEL] <> "FCCS")

UIT Assets Curr Qtr =
VAR d = [UIT Reporting EOM]
RETURN CALCULATE([UIT Total Assets], 'Calendar'[Date] = d)

UIT Assets Prev Qtr =
VAR d = EOMONTH([UIT Reporting EOM], -3)   -- one quarter back, month-end
RETURN CALCULATE([UIT Total Assets], 'Calendar'[Date] = d)

UIT Assets % Change =
DIVIDE([UIT Assets Curr Qtr] - [UIT Assets Prev Qtr], [UIT Assets Prev Qtr])
```

### 4.2 Overall Sales (current year vs prior, plus current-month)
```dax
UIT Overall Sales YTD       = [UIT Sales YTD]        -- current year through reporting month
UIT Overall Sales Prior YTD = [UIT Sales Prior YTD]
UIT Overall Sales % Change  = DIVIDE([UIT Overall Sales YTD] - [UIT Overall Sales Prior YTD], [UIT Overall Sales Prior YTD])

-- "Overall <Month> Sales" columns (e.g. June) — current month, both years
UIT Overall Mo Sales        = [UIT Sales Curr Mo]
UIT Overall Mo Sales Prior  =
    VAR d = [UIT Reporting EOM]
    RETURN CALCULATE([UIT Sales], 'Calendar'[Year] = YEAR(d)-1, 'Calendar'[MonthNo] = MONTH(d))
UIT Overall Mo % Change     = DIVIDE([UIT Overall Mo Sales] - [UIT Overall Mo Sales Prior], [UIT Overall Mo Sales Prior])
```

### 4.3 Sales Concessions (current month + YTD, 2025 vs 2026)
```dax
UIT Concessions Curr Mo   = CALCULATE([UIT Concessions], 'Calendar'[Year]=YEAR([UIT Reporting EOM]), 'Calendar'[MonthNo]=MONTH([UIT Reporting EOM]))
UIT Concessions YTD       = CALCULATE([UIT Concessions], 'Calendar'[Year]=YEAR([UIT Reporting EOM]), 'Calendar'[MonthNo]<=MONTH([UIT Reporting EOM]))
UIT Concessions Prior Mo  = CALCULATE([UIT Concessions], 'Calendar'[Year]=YEAR([UIT Reporting EOM])-1, 'Calendar'[MonthNo]=MONTH([UIT Reporting EOM]))
UIT Concessions Prior YTD = CALCULATE([UIT Concessions], 'Calendar'[Year]=YEAR([UIT Reporting EOM])-1, 'Calendar'[MonthNo]<=MONTH([UIT Reporting EOM]))
```
Build as a matrix: rows = {Current Month, YTD}, columns = {2025, 2026, % Change}.

### 4.4 YTD 15mo / 24mo Sales panels
Each panel: rows = {2026, 2025, % Change}; columns = YTD term sales, current-month term
sales, "% of YTD Sales".
```dax
UIT % of YTD (15mo) = DIVIDE([UIT Sales 15mo YTD], [UIT Sales YTD])
UIT % of YTD (24mo) = DIVIDE([UIT Sales 24mo YTD], [UIT Sales YTD])
```
> These two shares are complementary — 15mo + 24mo ≈ 100% of term-classified YTD sales
> (58.0% / 40.0% on the Q2 slide). Use them as a sanity check after each refresh.

### 4.5 Sales By Sponsor (+ YOY % + Market Share)
Table: rows = `Firm[FIRM]` (First Trust, Guggenheim, AAM, SmartTrust, Invesco);
columns = prior-year period total, current-year period total, YOY %, market share.
```dax
UIT Sponsor Total (curr)  = [UIT Sales QTD]          -- or YTD, match the slide's period
UIT Sponsor Total (prior) =
    VAR d = [UIT Reporting EOM]
    RETURN CALCULATE([UIT Sales], 'Calendar'[Year]=YEAR(d)-1, 'Calendar'[QtrNo]=ROUNDUP(MONTH(d)/3,0))
UIT Sponsor YOY %         = DIVIDE([UIT Sponsor Total (curr)] - [UIT Sponsor Total (prior)], [UIT Sponsor Total (prior)])
UIT Sponsor Market Share  = DIVIDE([UIT Sponsor Total (curr)], CALCULATE([UIT Sponsor Total (curr)], ALL(Firm)))
```
Format YOY % and Market Share as Percentage (1 decimal). Sort descending by current total.

### 4.6 YTD Advisory Sales
```dax
UIT Advisory YTD =
    CALCULATE([UIT Sales], UIT_Sales[ACCT_TYP] IN {"Asset Advisor","FA Directed"},
              'Calendar'[Year]=YEAR([UIT Reporting EOM]), 'Calendar'[MonthNo]<=MONTH([UIT Reporting EOM]))
UIT Advisory Prior YTD =
    CALCULATE([UIT Sales], UIT_Sales[ACCT_TYP] IN {"Asset Advisor","FA Directed"},
              'Calendar'[Year]=YEAR([UIT Reporting EOM])-1, 'Calendar'[MonthNo]<=MONTH([UIT Reporting EOM]))
UIT Advisory % Change   = DIVIDE([UIT Advisory YTD]-[UIT Advisory Prior YTD], [UIT Advisory Prior YTD])
UIT Advisory Curr Mo    = CALCULATE([UIT Sales Curr Mo], UIT_Sales[ACCT_TYP] IN {"Asset Advisor","FA Directed"})
```

### 4.7 Sales By Account Type
Table: rows = `AcctType[ACCT_TYP]` (Brokerage / Asset Advisor / FA Directed);
columns = Total Sales YTD prior year, Total Sales YTD current year, % change, % of total.
```dax
UIT Acct YTD (curr)  = [UIT Sales YTD]
UIT Acct YTD (prior) = [UIT Sales Prior YTD]
UIT Acct % Change    = DIVIDE([UIT Acct YTD (curr)] - [UIT Acct YTD (prior)], [UIT Acct YTD (prior)])
UIT Acct % of Total  = DIVIDE([UIT Acct YTD (curr)], CALCULATE([UIT Acct YTD (curr)], ALL(AcctType)))
```

### 4.8 Top Trusts (ranked, with % of overall YTD)
Table: rows = `Firm[FIRM]`, `UIT_Sales[TRUST]`; value = `[UIT Sales YTD]`; Top-N = Top 10.
```dax
UIT Trust % of Overall YTD = DIVIDE([UIT Sales YTD], CALCULATE([UIT Sales YTD], ALL(UIT_Sales[TRUST], Firm)))
```
Format the share as Percentage (2 decimals). Header wording: "YTD Trust Sales",
"Percent of Overall YTD Sales".

### 4.9 YOY Gross Purchases (bar chart)
Clustered column chart, X-axis = month number 1–12, legend = `Calendar[Year]`
(2024 / 2025 / 2026), Y = `[UIT Gross Purchases]`.
```dax
UIT Gross Purchases = CALCULATE(SUM(UIT_Sales[Amount]), UIT_Sales[CHANNEL] <> "FCCS")
```
Y-axis Display units = Billions (matches the $500M–$2.0B gridlines on the slide).
Keep the 3-year legend dynamic: `Calendar[Year]` filtered to the last 3 years, or a
`Last 36 Months` flag if you prefer a rolling window.

---

## 5. Dynamic Titles & Period Labels (no hardcoding)

### 5.1 Page title (quarter + year, dynamic)
```dax
UIT Page Title =
VAR d = [UIT Reporting EOM]
VAR q = "Q" & ROUNDUP(MONTH(d)/3, 0)
RETURN "UIT Product Dashboard – " & q & " " & YEAR(d)
```
Renders "UIT Product Dashboard – Q2 2026" and rolls forward each quarter. Bind via
**General → Title → fx → Field value**.

### 5.2 Fixed sub-caption
"UIT Data excludes FCCS" — static red bold text box (this is a data rule, keep it literal).

### 5.3 MetricPeriod labels (for the term/period column headers)
```dax
MetricPeriod =
VAR d = CALCULATE(MAX(UIT_Sales[EOM_DT]), ALL(UIT_Sales))
RETURN UNION(
    ROW("Period","Curr Mo", "Label", FORMAT(d,"MMM") & " $",  "Sort",1),
    ROW("Period","YTD",     "Label", "YTD $",                 "Sort",2),
    ROW("Period","Curr Qtr","Label", "Q" & ROUNDUP(MONTH(d)/3,0) & " " & YEAR(d) & " $", "Sort",3)
)
```
Sort `Label` by `Sort` (Column tools → Sort by column).

---

## 6. Number Formatting Cheatsheet

| Need | How |
|---|---|
| `$` on values | Measure tools → Format → Currency ($) |
| Full dollars w/ commas ($122,948,767) | Currency, 0 decimals, thousands separator on |
| Billions on chart axis ($1.5B) | Display units = Billions (or format string `$#,##0.0,,,`) |
| `%` columns (YOY, market share, % of total) | Format → Percentage, 1–2 decimals |
| Bold header row | Column headers → Text → **B** |
| Bold total column | Column subtotals → Values → **B** |
| Tight fit (many trust rows) | Font 8pt, tight row padding, Auto-size column width Off, horizontal scroll as safety net |

---

## 7. Data-Quality Fixes Spotted on the Slides

Carry these into the Power BI build so they don't repeat:

1. **Stale source footnote.** Page 2 (Q2 2026) footer reads *"Data as of 3/31/2025"* and the
   Sponsor table headers read *"Total $ Q1 25 / Total $ Q1 26"* while the title is **Q2 2026**.
   Bind the footer date and the period headers to `[UIT Reporting EOM]` (§5) so they can't
   go stale: `"Source: Packaged Investment Products Group; Data as of " & FORMAT([UIT Reporting EOM],"M/D/YYYY")`.
2. **"June" is really the reporting month.** The "Overall June Sales" column should read the
   current month name from `FORMAT([UIT Reporting EOM],"MMMM")`, not the literal "June".
3. **FCCS exclusion** is a data rule stated on both slides — enforce it in the **base measure**
   (§2), not per-visual, so it can't be forgotten on a new visual.
4. **Term totals reconcile:** 15mo % + 24mo % of YTD should ≈ 100% of term-classified sales.
   If they don't after a refresh, an untagged `TERM` value has crept in — add a diagnostic.

---

## 8. Target Values (transcribed from the Q1 & Q2 2026 slides — use for validation)

### 8.1 Top Selling Morningstar Category by Term (Q1, data as of 3/31/2026)
**Mar 15mo:** US UIT Def Outcome $122,948,767 · US UIT Large Value $58,337,093 · US UIT Large Blend $54,459,854
**Mar 24mo:** US UIT Mod Cons Alloc $44,350,759 · US UIT Technology $32,770,297 · US UIT Large Blend $30,733,747
**YTD 15mo:** US UIT Large Blend $585,325,928 · US UIT Def Outcome $333,133,698 · US UIT Large Value $307,137,724
**YTD 24mo:** US UIT Deriv Income $277,088,565 · US UIT Technology $149,045,429 · US UIT Large Blend $148,774,610

### 8.2 Top Selling Trust by Term (Q1)
**15mo — March:** FT Vest Large Cap Deep Buffered 20 $83,426,629 · FT AI Robotics&Technology Opp $42,456,496 · FT American Recovery $36,906,766 · FT Municipal Income Opp CE $34,070,644 · FT Dow Target 10 $31,979,753
**24mo — March:** FT Balanced Income Select $33,280,125 · Guggenheim Large-Cap Core $19,000,029 · FT Balanced Income Equity & ETF $17,142,423 · FT Technology Dividend Portfolio $13,698,266 · FT Aerospace & Defense $12,830,038
**15mo — Q1 26:** FT Capital Strength Buy Write $204,143,236 · FT Balanced Income Select $73,974,707 · FT Aerospace & Defense $54,528,809 · FT Innovative Technology $41,630,322 · FT Technology Select $39,375,746
**24mo — Q1 26:** FT Balanced Income Select $244,279,446 · FT Capital Strength Buy Write $206,550,693 · FT Mega-Cap $155,693,296 · Guggenheim Blue Chip Growth $145,094,783 · FT Limited Duration Fxd Inc $128,913,614

### 8.3 Overview metrics (Q2 2026)
- **Assets:** Current Qtr $17,285,612,764 · Previous Qtr $16,903,373,303 · % Change 2.26%
- **Overall Sales:** 2026 $3,605,137,023 / June $746,385,774 · 2025 $3,234,495,442 / June $660,372,981 · %Δ 11.5% / 13.0%
- **Sales Concessions:** Current Month 2025 $10,639,006 → 2026 $15,096,298 (41.9%) · YTD $45,938,957 → $50,528,547 (10.0%)
- **YTD 15mo:** 2026 $2,061,451,608 / Mar $451,321,136 / 58.0% · 2025 $1,770,246,322 / $408,534,620 / 57.2% · %Δ 16.4% / 10.5% / 1.4%
- **YTD 24mo:** 2026 $1,420,174,912 / Mar $295,456,543 / 40.0% · 2025 $1,322,822,188 / $250,429,300 / 42.8% · %Δ 7.4% / 18.0% / -2.8%
- **YTD Advisory:** 2026 $409,335,444 / Mar $101,277,668 · 2025 $355,589,976 / $82,650,530 · %Δ 15.1% / 22.5%
- **Sales By Sponsor (Q1 25 → Q1 26, YOY%, share):** First Trust $2,533,639,347 → $2,899,420,202 (14.4%, 80.4%) · Guggenheim $308,496,312 → $295,167,285 (-4.3%, 8.2%) · AAM $207,165,475 → $215,426,898 (4.0%, 6.0%) · SmartTrust $77,031,351 → $99,497,001 (29.2%, 2.8%) · Invesco $108,162,957 → $95,625,637 (-11.6%, 2.7%)
- **Sales By Account Type (YTD 2025 → 2026, %Δ, % of total):** Brokerage $2,894,390,456 → $3,198,800,074 (10.5%, 88.7%) · Asset Advisor $244,901,734 → $271,478,377 (10.9%, 7.5%) · FA Directed $98,694,982 → $137,857,067 (39.7%, 3.8%)
- **Top Trusts (YTD, % of overall):** FT DSIP $317,018,246 (8.79%) · FT Vest Large Cap Deep Buffered 20 $228,084,208 (6.33%) · FT Capital Strength Buy Write $210,666,844 (5.84%) · FT Capital Strength Opp $197,295,259 (5.47%) · FT Municipal Income Opp CE $101,969,673 (2.83%) · FT Election Portfolio $101,689,441 (2.82%) · FT AI Robotics&Technology Opp $97,702,756 (2.71%) · FT Balanced Income Select $73,974,706 (2.05%) · FT Cboe Vest Large Cap Buff 10 Port $73,587,315 (2.04%) · FT Dow Target 10 $64,796,845 (1.80%)

---

## 9. Status & Remaining Work

**To build**
- [ ] Base measures with FCCS excluded (§2)
- [ ] Page 1 top-seller tables (Morningstar category ×4, Trust ×4) with Top-N + row numbering
- [ ] Page 2 metric panels (Assets, Overall Sales, Concessions, YTD 15/24mo, Sponsor, Advisory, Account Type, Top Trusts)
- [ ] YOY Gross Purchases 3-year clustered column chart
- [ ] Dynamic page title + dynamic source-date/period headers (§7)
- [ ] Validate every panel against §8 targets

**Open questions to confirm with the data**
- Sponsor & top-seller panels: is the "current" period **QTD** or **YTD**? (Q1 slide mixes
  "March" + "Q1"; Q2 sponsor headers say "Q1 25/26" under a Q2 title — confirm intended window.)
- Does `TERM` cover 100% of sales, or are there untagged products? (Affects the 15/24mo shares.)
- Are Assets true quarter-end snapshots, or should previous quarter = `EOMONTH(d,-3)`?

---

## 10. Key Principles (same discipline as the MF build)
1. **Reporting date is dynamic:** everything anchors to `CALCULATE(MAX(UIT_Sales[EOM_DT]), ALL(UIT_Sales))` — no hardcoded years/months/quarters.
2. **Bake exclusions into base measures:** FCCS is excluded once, in `[UIT Sales]`, so no visual can re-include it.
3. **Prior-YTD is cumulative:** always `MonthNo <= MONTH(d)`, never `= MONTH(d)`.
4. **Top-N, not hardcoded lists:** top-seller tables use Top-N filters / `RANKX`, with `ORDERBY … DESC` row numbering.
5. **Measures, not columns:** SWITCH/period logic lives in measures; a "Sum of …" prefix means you built a column by mistake.
6. **Dynamic titles & footers:** bind titles, source dates, and month names to measures via **fx → Field value** so nothing goes stale.
