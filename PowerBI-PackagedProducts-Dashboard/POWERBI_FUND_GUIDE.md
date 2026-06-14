# Mutual Fund Power BI Migration Guide

## Overview

This guide documents the migration of the manual monthly Mutual Fund reporting process to an automated Power BI dashboard. The current process is entirely manual and time-consuming:

1. **Download source files** — Each month, an analyst downloads `MF_SLS_FLOW` (gross/net flows, transaction-level) and `MF_SLS_POS` (AUM/positions) files from the data warehouse.
2. **VLOOKUP enrichment** — The analyst copies the CUSIP column and uses Excel VLOOKUPs against the `Morningstar_monthly` reference file to add fund attributes: `Is_SMA_or_529`, `Allowable_List`, `Is_Master_List_Fund`, `Real_Share_Class`, and `Broad_Category`.
3. **Pivot table construction** — Manual pivot tables are built to summarize gross sales by CUSIP, Fund Family, and Morningstar Category. Filters are set manually for Channel, Account Type, Trade Side, Exchange Indicator, and Is_it_a_MF.
4. **PowerPoint updates** — Numbers from the pivot tables are manually copied into 4 PowerPoint slides covering Executive Overview, Net Flows Detail, Gross Sales Detail, and AUM & Holdings.

**After migration:** Drop a new monthly file into the watched folder and click Refresh. All 4 report pages update automatically with correct filters, rankings, YTD totals, and prior-year comparisons — no manual steps required.

---

## Section 1: Source Files & Schema

### A. MF_SLS_FLOW — Monthly Net/Gross Flow File (Transaction-Level)

Used for: Gross Sales, Net Flows, trade-level analysis, YTD/PY comparisons.

| Column | Type | Description |
|--------|------|-------------|
| EOM_DT | Date | End-of-month date (e.g., 2026-03-31) |
| CUSIP | Text | 9-character fund identifier — primary join key to Morningstar |
| SEC_SYM | Text | Security symbol (ticker-like) |
| MF_FAM_DESC | Text | Fund family description (e.g., AMERICAN FUNDS, DWS FUNDS) |
| MF_NM | Text | Full fund name |
| MF_CLASS | Text | Share class: A, C, S, INST, INV |
| EXISTS_ON_MSTA | Text | Y/N — fund exists in Morningstar data |
| CHANNEL | Text | Distribution channel: PCG, WBS, FINET, WFAS, FCCS |
| ACCT_TYP | Text | Account type: ADVISORY or BROKERAGE |
| PROGRAM | Text | Program: ADVISORY or BROKERAGE |
| LEGACY_PROGRAM | Text | Legacy program name (BROKERAGE, ASSET ADVISOR, CUSTOMCHOICE, FUNDSOURCE, MASTERS, PIM, FC/QC, PERSONALIZED UMA) |
| RTMT_ACCT_TYP | Text | Retirement account type: IRA, NON-RETIREMENT, SEP, SIM, QP |
| TRADE_SIDE | Text | P = Purchase (inflow), S = Sale (outflow) |
| EXCHANGE_IND | Text | Y = exchange trade, N = non-exchange |
| GROSS_AMOUNT | Decimal | Gross dollar amount of the transaction (always positive) |
| NET_ORIG_AMOUNT | Decimal | Original net amount |
| NET_AMOUNT | Decimal | Net dollar amount — positive for P, negative for S |
| TRD_CNT | Integer | Number of trades in this aggregated row |
| Is_it_a_MF | Text | Y = is a mutual fund (filter to Y for all analysis) |
| Rec | Text | Y = Recommended fund on the recommended list |
| ACL | Text | Y = on the Approved/Allowed Consideration List |
| Fund_ID | Text | Internal fund identifier (e.g., FSUSA08E50) |
| Brand | Text | Brand name (e.g., capital group, Fidelity, PIMCO) |
| Mstar_Cat | Text | Morningstar category (e.g., US Fund Large Blend) |
| US_cat | Text | US category — typically same as Mstar_Cat |

**Key filters always applied in analysis:**
- `Is_it_a_MF = "Y"` — exclude non-fund instruments
- `CHANNEL <> "FCCS"` — exclude FCCS and WellsTrade channel
- For Gross Sales only: `TRADE_SIDE = "P"` and `EXCHANGE_IND = "N"` (unless including exchanges)

---

### B. MF_SLS_POS — Monthly AUM/Position File

Used for: AUM trending, Advisory/Brokerage split, channel-level AUM, fund-level holdings.

| Column | Type | Description |
|--------|------|-------------|
| EOM_DT | Date | End-of-month snapshot date |
| MF_NM | Text | Fund name |
| MF_CLASS | Text | Share class |
| ASSET_CLASS | Text | Equity Fund, Bond Fund, Balanced Fund, Money Market Fund, International Equity Fund, Alternative Fund |
| CHANNEL | Text | PCG, WBS, FINET, WFAS |
| ACCT_TYP | Text | ADVISORY or BROKERAGE |
| PROGRAM | Text | ADVISORY or BROKERAGE |
| LEGACY_PROGRAM | Text | Legacy program name |
| RET_ACCT_TYPE | Text | IRA, NON-RETIREMENT, SEP, SIM, QP |
| POS_MKT_VAL | Decimal | Position market value in dollars (AUM) |
| POSITION_COUNT | Integer | Number of positions in this group |
| Is_it_a_MF | Text | Y/N |
| Rec | Text | Y/N — recommended fund |
| ACL | Text | Y/N |
| Fund_ID | Text | Internal fund ID |
| Brand | Text | Brand name |
| Mstar_Cat | Text | Morningstar category |
| US_cat | Text | US category |

**Note:** This file does not have CUSIP — joins to the Morningstar file use Fund_ID or MF_NM. ACCT_TYP values "Overall Advisory" and "Overall Brokerage" capture total AUM by account type.

---

### C. Morningstar_monthly — Fund Attributes Reference File

Used for: VLOOKUP replacement — provides fund classification attributes. One row per CUSIP (fund-class combination).

| Column | Type | Description |
|--------|------|-------------|
| CUSIP | Text | Primary key — 9-character identifier |
| SEC_SYM | Text | Security symbol |
| MF_FAM_DESC | Text | Fund family |
| MF_NM | Text | Fund name |
| Fund_ID | Text | Internal fund ID |
| Brand | Text | Brand name |
| Mstar_Cat | Text | Morningstar category |
| US_cat | Text | US category |
| Is_SMA_or_529 | Text | Y = SMA or 529 share class (EXCLUDE from analysis) |
| Allowable_List | Text | Y = on the allowable investment list |
| Is_Master_List_Fund | Text | Y = on the master recommended list |
| Real_Share_Class | Text | Y = real/valid share class (not placeholder) |
| Broad_Category | Text | US Equity, International Equity, Fixed Income, Allocation, Alternative, Sector Equity, Commodities |

---

### D. Revenue_Trails_Commissions — Monthly Revenue Summary

Used for: Revenue trending, commission vs. trail split, YTD revenue reporting.

| Column | Type | Description |
|--------|------|-------------|
| Month | Text | Month label (e.g., Jan-26) |
| Month_End_Date | Date | End-of-month date |
| Commission_Revenue | Decimal | Commission revenue for the month (~$25–35M) |
| Trail_Revenue | Decimal | Trail/12b-1 revenue for the month (~$120–170M) |
| Total_Revenue | Decimal | Commission + Trail |
| Advisory_Pct | Decimal | Percentage from advisory accounts |
| Brokerage_Pct | Decimal | Percentage from brokerage accounts |

---

### E. AUM_Summary — Monthly AUM Summary for Trending

Used for: Executive overview AUM chart, channel-level AUM trends, Advisory/Brokerage breakdown.

| Column | Type | Description |
|--------|------|-------------|
| Month | Text | Month label |
| Month_End_Date | Date | End-of-month date |
| Advisory_AUM | Decimal | Total advisory AUM (~$228–275B) |
| Brokerage_AUM | Decimal | Total brokerage AUM (~$152–172B) |
| Level0_AUM | Decimal | Level 0 estimate AUM (separate, ~1–3% of total) |
| Total_AUM | Decimal | Total AUM (~$380–430B) |
| PCG_Advisory | Decimal | PCG advisory AUM |
| PCG_Brokerage | Decimal | PCG brokerage AUM |
| WBS_Advisory | Decimal | WBS advisory AUM |
| WBS_Brokerage | Decimal | WBS brokerage AUM |
| FINET_Advisory | Decimal | FINET advisory AUM |
| FINET_Brokerage | Decimal | FINET brokerage AUM |
| WFAS_Advisory | Decimal | WFAS advisory AUM |
| WFAS_Brokerage | Decimal | WFAS brokerage AUM |

---

## Section 2: Power BI Folder Connector Setup

Using the Folder connector allows Power BI to automatically pick up new monthly files as they are added — no manual import needed each month.

### Setting Up the Flow File Folder Connector

1. In Power BI Desktop, click **Get Data → Folder**.
2. Enter the folder path containing all `MF_SLS_FLOW_*.xlsx` files (e.g., `\\wfa-nas.wellsfargo.net\mf_reporting\flow_files\`).
3. Click **Transform Data** (do not click Combine yet).
4. In Power Query Editor, click **Combine Files** (the double-arrow icon in the Content column).
5. Power Query will detect the schema from the first file and apply it to all files in the folder.
6. The result is a single table with all months stacked vertically — new months auto-append when you refresh.

### Setting Up the AUM/Position File Folder Connector

Repeat the same steps for the `MF_SLS_POS_*.xlsx` files in their own folder. This creates a separate `Fact_AUM` table.

### Fixing Column Types via Power Query

After combining, always explicitly set column types to prevent misdetection:

```powerquery
// In Advanced Editor — apply after the Combine step
= Table.TransformColumnTypes(
    #"Combined Files",
    {
        {"EOM_DT",        type date},
        {"GROSS_AMOUNT",  type number},
        {"NET_AMOUNT",    type number},
        {"NET_ORIG_AMOUNT", type number},
        {"TRD_CNT",       Int64.Type},
        {"CUSIP",         type text},
        {"CHANNEL",       type text},
        {"TRADE_SIDE",    type text},
        {"Is_it_a_MF",    type text},
        {"EXCHANGE_IND",  type text},
        {"Rec",           type text},
        {"ACL",           type text}
    }
)
```

Apply equivalent transforms for the AUM file with `POS_MKT_VAL` as `type number` and `POSITION_COUNT` as `Int64.Type`.

---

## Section 3: Power Query Transformations

This section replaces all manual Excel steps. These transformations are applied once in Power Query and re-run automatically on every Refresh.

### 3a — Flow File Cleanup (Fact_Flows)

Apply these steps in Power Query after loading `MF_SLS_FLOW`:

```powerquery
// Step 1: Filter to mutual funds only
#"Filter MF Only" = Table.SelectRows(#"Fixed Types", each [Is_it_a_MF] = "Y"),

// Step 2: Add Gross Sales column (purchases only)
#"Add Gross Sales" = Table.AddColumn(
    #"Filter MF Only",
    "Gross_Sales",
    each if [TRADE_SIDE] = "P" then [GROSS_AMOUNT] else 0,
    type number
),

// Step 3: Add Net Flows column (already in NET_AMOUNT but explicit alias)
#"Add Net Flows" = Table.AddColumn(
    #"Add Gross Sales",
    "Net_Flows",
    each [NET_AMOUNT],
    type number
),

// Step 4: Add Exchange flag
#"Add Is Exchange" = Table.AddColumn(
    #"Add Net Flows",
    "Is_Exchange",
    each [EXCHANGE_IND],
    type text
),

// Step 5: Tag recommended fund rows
#"Add Is Rec Fund" = Table.AddColumn(
    #"Add Is Exchange",
    "Is_Rec_Fund",
    each [Rec],
    type text
),

// Step 6: Clean channel — tag FCCS for visibility but keep for filtering
#"Add Channel Clean" = Table.AddColumn(
    #"Add Is Rec Fund",
    "Channel_Clean",
    each if [CHANNEL] = "FCCS" then "FCCS (excluded)" else [CHANNEL],
    type text
)
```

### 3b — AUM File Cleanup (Fact_AUM)

```powerquery
// Step 1: Filter to mutual funds
#"Filter MF Only" = Table.SelectRows(#"Fixed Types", each [Is_it_a_MF] = "Y"),

// Step 2: Remove zero/negative AUM rows
#"Filter Positive AUM" = Table.SelectRows(
    #"Filter MF Only",
    each [POS_MKT_VAL] > 0
),

// Step 3: Add explicit Account_Type column
#"Add Account Type" = Table.AddColumn(
    #"Filter Positive AUM",
    "Account_Type",
    each [ACCT_TYP],
    type text
)
```

### 3c — Morningstar Merge (Replaces VLOOKUP)

This is the critical step that replaces the manual VLOOKUP process. In Power Query, after loading both `Fact_Flows` and `Dim_Fund` (from Morningstar):

```powerquery
// In the Fact_Flows query — merge Morningstar attributes
#"Merge Morningstar" = Table.NestedJoin(
    #"Add Channel Clean",
    {"CUSIP"},
    Dim_Fund,
    {"CUSIP"},
    "Morningstar",
    JoinKind.LeftOuter
),

// Expand the columns you need
#"Expand Morningstar Cols" = Table.ExpandTableColumn(
    #"Merge Morningstar",
    "Morningstar",
    {
        "Is_SMA_or_529",
        "Allowable_List",
        "Is_Master_List_Fund",
        "Real_Share_Class",
        "Broad_Category"
    }
)
```

This single merge step replaces 5 separate VLOOKUP columns. Every month when a new file is loaded, the merge runs automatically against the current Morningstar reference table — no manual copy-paste.

---

## Section 4: Data Model

The Power BI data model uses a **star schema** with fact tables at different grains and shared dimension tables.

### Tables

| Table | Grain | Source |
|-------|-------|--------|
| Fact_Flows | One row per transaction group (CUSIP × Channel × Month × Trade Side) | MF_SLS_FLOW folder |
| Fact_AUM | One row per fund/channel/acct-type position per month | MF_SLS_POS folder |
| Fact_Revenue | One row per month | Revenue_Trails_Commissions.xlsx |
| Dim_Fund | One row per CUSIP | Morningstar_monthly.xlsx |
| Dim_Calendar | One row per date | Generated in Power Query |
| Dim_Channel | One row per channel (PCG, WBS, FINET, WFAS) | Manually entered or derived |

### Dim_Calendar — Generated Date Table

Create in Power Query (or DAX):

```powerquery
// Power Query — create a complete date table
let
    StartDate = #date(2024, 1, 1),
    EndDate    = #date(2027, 12, 31),
    DayCount   = Duration.Days(EndDate - StartDate) + 1,
    DateList   = List.Dates(StartDate, DayCount, #duration(1, 0, 0, 0)),
    DateTable  = Table.FromList(DateList, Splitter.SplitByNothing(), {"Date"}),
    TypedTable = Table.TransformColumnTypes(DateTable, {{"Date", type date}}),
    AddYear    = Table.AddColumn(TypedTable, "Year", each Date.Year([Date]), Int64.Type),
    AddMonth   = Table.AddColumn(AddYear, "Month Number", each Date.Month([Date]), Int64.Type),
    AddMonthNm = Table.AddColumn(AddMonth, "Month Name", each Date.ToText([Date], "MMM-yy"), type text),
    AddQuarter = Table.AddColumn(AddMonthNm, "Quarter", each "Q" & Text.From(Date.QuarterOfYear([Date])), type text),
    AddEOM     = Table.AddColumn(AddQuarter, "End of Month", each Date.EndOfMonth([Date]), type date)
in
    AddEOM
```

**Important:** Sort the Month Name column by Month Number to avoid alphabetical sorting in visuals.

### Relationships

```
Fact_Flows[CUSIP]           → Dim_Fund[CUSIP]          (Many-to-One, Active)
Fact_Flows[EOM_DT]          → Dim_Calendar[Date]        (Many-to-One, Active)
Fact_Flows[CHANNEL]         → Dim_Channel[CHANNEL]      (Many-to-One, Active)

Fact_AUM[EOM_DT]            → Dim_Calendar[Date]        (Many-to-One, Active)

Fact_Revenue[Month_End_Date] → Dim_Calendar[Date]       (Many-to-One, Active)
```

All relationships are one-directional (filter flows from dimension to fact). Do not enable bidirectional filtering unless required for a specific visual — it degrades performance and can cause ambiguity.

---

## Section 5: DAX Measures

All measures are organized into display folders in the measure table. None of the fact tables should have implicit measures — hide all numeric columns and use only explicit DAX measures.

### Gross Sales Measures

```dax
-- Base: Gross Sales (P side only, excludes FCCS, exchanges, non-MF)
-- This is the primary gross sales measure used on all pages
Gross Sales =
CALCULATE(
    SUMX(Fact_Flows, IF(Fact_Flows[TRADE_SIDE] = "P", Fact_Flows[GROSS_AMOUNT], 0)),
    Fact_Flows[Is_it_a_MF] = "Y",
    Fact_Flows[CHANNEL] <> "FCCS",
    Fact_Flows[EXCHANGE_IND] = "N"
)

-- Gross Sales Including Exchanges (used on Executive page note)
Gross Sales incl Exchanges =
CALCULATE(
    SUMX(Fact_Flows, IF(Fact_Flows[TRADE_SIDE] = "P", Fact_Flows[GROSS_AMOUNT], 0)),
    Fact_Flows[Is_it_a_MF] = "Y",
    Fact_Flows[CHANNEL] <> "FCCS"
)

-- Advisory Gross Sales
Gross Sales Advisory =
CALCULATE([Gross Sales], Fact_Flows[ACCT_TYP] = "ADVISORY")

-- Brokerage Gross Sales
Gross Sales Brokerage =
CALCULATE([Gross Sales], Fact_Flows[ACCT_TYP] = "BROKERAGE")

-- Commission Gross Sales (equivalent to Brokerage)
Commission Gross Sales = [Gross Sales Brokerage]

-- Advisory Gross Sales (note: subtract FS rebalances in a separate measure)
Advisory Gross Sales =
[Gross Sales Advisory]
// Note: manually subtract FS rebalances stored in Fact_FSRebalances
// Use [Advisory Gross Sales excl Rebalances] for the slide that shows net-of-rebalances

-- YTD Gross Sales
YTD Gross Sales =
TOTALYTD([Gross Sales], Dim_Calendar[Date])

-- Prior Year YTD Gross Sales
PY YTD Gross Sales =
CALCULATE([YTD Gross Sales], SAMEPERIODLASTYEAR(Dim_Calendar[Date]))

-- Current Month Gross Sales
Current Month Gross =
CALCULATE(
    [Gross Sales],
    Dim_Calendar[Month Number] = MONTH(TODAY()),
    Dim_Calendar[Year] = YEAR(TODAY())
)

-- Prior Year Same Month Gross Sales
PY Same Month Gross =
CALCULATE([Gross Sales], SAMEPERIODLASTYEAR(Dim_Calendar[Date]))
```

### Net Flows Measures

```dax
-- Overall Net Flows (P and S both included, excludes FCCS, is MF = Y)
Net Flows =
CALCULATE(
    SUM(Fact_Flows[NET_AMOUNT]),
    Fact_Flows[Is_it_a_MF] = "Y",
    Fact_Flows[CHANNEL] <> "FCCS"
)

-- Net Flows Excluding Exchanges
Net Flows ex Exchanges =
CALCULATE(
    SUM(Fact_Flows[NET_AMOUNT]),
    Fact_Flows[Is_it_a_MF] = "Y",
    Fact_Flows[CHANNEL] <> "FCCS",
    Fact_Flows[EXCHANGE_IND] = "N"
)

-- Advisory Net Flows
Net Flows Advisory =
CALCULATE([Net Flows], Fact_Flows[ACCT_TYP] = "ADVISORY")

-- Brokerage Net Flows
Net Flows Brokerage =
CALCULATE([Net Flows], Fact_Flows[ACCT_TYP] = "BROKERAGE")

-- YTD Net Flows
YTD Net Flows =
TOTALYTD([Net Flows], Dim_Calendar[Date])

-- Prior Year YTD Net Flows
PY YTD Net Flows =
CALCULATE([YTD Net Flows], SAMEPERIODLASTYEAR(Dim_Calendar[Date]))

-- Trailing 12 Month Net Flows
T12M Net Flows =
CALCULATE(
    [Net Flows],
    DATESINPERIOD(Dim_Calendar[Date], LASTDATE(Dim_Calendar[Date]), -12, MONTH)
)

-- Recommended Funds Net Flows (Rec = Y, includes exchanges)
Rec Funds Net Flows =
CALCULATE([Net Flows], Fact_Flows[Rec] = "Y")

-- Net Flows by Channel
PCG Net Flows   = CALCULATE([Net Flows], Fact_Flows[CHANNEL] = "PCG")
WBS Net Flows   = CALCULATE([Net Flows], Fact_Flows[CHANNEL] = "WBS")
FINET Net Flows = CALCULATE([Net Flows], Fact_Flows[CHANNEL] = "FINET")
WFAS Net Flows  = CALCULATE([Net Flows], Fact_Flows[CHANNEL] = "WFAS")
```

### AUM Measures

```dax
-- Total AUM
Total AUM = SUM(Fact_AUM[POS_MKT_VAL])

-- Advisory AUM
Advisory AUM =
CALCULATE([Total AUM], Fact_AUM[ACCT_TYP] = "ADVISORY")

-- Brokerage AUM
Brokerage AUM =
CALCULATE([Total AUM], Fact_AUM[ACCT_TYP] = "BROKERAGE")

-- Advisory AUM as % of Total
Advisory AUM % =
DIVIDE([Advisory AUM], [Total AUM])

-- AUM by Channel
PCG AUM   = CALCULATE([Total AUM], Fact_AUM[CHANNEL] = "PCG")
WBS AUM   = CALCULATE([Total AUM], Fact_AUM[CHANNEL] = "WBS")
FINET AUM = CALCULATE([Total AUM], Fact_AUM[CHANNEL] = "FINET")
WFAS AUM  = CALCULATE([Total AUM], Fact_AUM[CHANNEL] = "WFAS")

-- Prior Month AUM (for trailing trend chart)
Prior Month AUM =
CALCULATE([Total AUM], DATEADD(Dim_Calendar[Date], -1, MONTH))

-- Sales/AUM Penetration Rate
Sales AUM Ratio =
DIVIDE([YTD Gross Sales], [Total AUM])

-- Recommended Fund AUM and %
Rec Fund AUM =
CALCULATE([Total AUM], Fact_AUM[Rec] = "Y")

Rec Fund AUM % =
DIVIDE([Rec Fund AUM], [Total AUM])
```

### Revenue Measures

```dax
-- Monthly Commission Revenue
Commission Revenue = SUM(Fact_Revenue[Commission_Revenue])

-- Monthly Trail Revenue
Trail Revenue = SUM(Fact_Revenue[Trail_Revenue])

-- Monthly Total MF Revenue
Total MF Revenue = SUM(Fact_Revenue[Total_Revenue])

-- YTD Revenue Measures
YTD Commission Revenue =
TOTALYTD([Commission Revenue], Dim_Calendar[Date])

YTD Trail Revenue =
TOTALYTD([Trail Revenue], Dim_Calendar[Date])

YTD Total Revenue =
TOTALYTD([Total MF Revenue], Dim_Calendar[Date])

-- Prior Year YTD Revenue
PY YTD Total Revenue =
CALCULATE([YTD Total Revenue], SAMEPERIODLASTYEAR(Dim_Calendar[Date]))
```

### Ranking Measures (for Top Inflows/Outflows Tables)

```dax
-- Fund Family Net Flow Rank (1 = largest inflow)
Fund Family Net Rank =
RANKX(ALLSELECTED(Dim_Fund[Brand]), [Net Flows], , DESC, DENSE)

-- Morningstar Category Net Flow Rank
Category Net Rank =
RANKX(ALLSELECTED(Dim_Fund[Mstar_Cat]), [Net Flows], , DESC, DENSE)

-- Individual Fund Net Flow Rank (CUSIP-level)
Fund Net Rank =
RANKX(ALLSELECTED(Fact_Flows[CUSIP]), [Net Flows], , DESC, DENSE)

-- Top 10 Inflow Flag (use in visual-level filter: Is Top 10 Inflow = TRUE)
Is Top 10 Inflow = [Fund Net Rank] <= 10

-- Outflow Rank (1 = most negative net flows)
Fund Outflow Rank =
RANKX(ALLSELECTED(Fact_Flows[CUSIP]), [Net Flows], , ASC, DENSE)
```

---

## Section 6: Report Pages

The dashboard has 4 pages matching the 4 PowerPoint slides in the current manual process.

### Page 1 — Executive Overview

*Matches Slide 1 of the current PowerPoint*

| Visual | Type | Configuration |
|--------|------|---------------|
| Gross MF Sales | Clustered bar chart | X-axis: Category (Commission, Advisory, Total). Values: YTD Gross Sales (red), Current Month Gross (blue), PY YTD Gross Sales (gold), PY Same Month Gross (orange). 4 bars per category. |
| Net MF Flows | Line chart | X-axis: Month (trailing 12). Y-axis: Net Flows. Show data labels on line. Title dynamically shows YTD total vs PY YTD. |
| YTD MF Revenue | Clustered bar chart | X-axis: Category (Commission, Trail, Total). Values: YTD amounts vs PY YTD. |
| MF AUM Trailing 12 Months | Stacked bar chart | X-axis: Month. Y-axis: Brokerage AUM (red) + Advisory AUM (blue), stacked. |
| Year Slicer | Dropdown slicer | Field: Dim_Calendar[Year] |
| Channel Slicer | Dropdown slicer | Field: Fact_Flows[CHANNEL] — options: PCG, WBS, FINET, WFAS (FCCS pre-excluded by measures) |

**Notes on the Gross Sales bar chart:** The 4 bars per category represent:
- 2026 YTD (red)
- Mar-26 current month (blue)
- 2025 YTD (yellow/gold)
- Mar-25 prior year same month (orange)

For the Advisory category, add a separate text box or data label note: "Includes rebalances" in red. Advisory YTD ex-rebalances should be a visible card or footnote on this page.

**Dynamic title for Net Flows chart:**
```dax
Net Flows Title =
"Overall MF Net: YTD " & FORMAT([YTD Net Flows]/1000000, "$#,##0.0M") &
" vs PY " & FORMAT([PY YTD Net Flows]/1000000, "$#,##0.0M")
```

---

### Page 2 — Net Flows Detail

*Matches Slide 2 of the current PowerPoint*

The page is split into two sections: **Top Inflows** (upper half) and **Top Outflows** (lower half). Both use the same visuals with opposite sorting.

| Visual | Type | Configuration |
|--------|------|---------------|
| Morningstar Category Inflows YTD | Table | Rows: Dim_Fund[Mstar_Cat]. Columns: [YTD Net Flows], [Total AUM], [Sales AUM Ratio]. Sort descending by YTD Net Flows. Visual-level filter: Net Flows > 0. |
| Fund Family Inflows YTD | Table | Rows: Dim_Fund[Brand]. Columns: [YTD Net Flows], [Total AUM], [Sales AUM Ratio]. Sort descending. |
| Individual Fund Inflows YTD | Table | Rows: Fact_Flows[MF_NM] + Fact_Flows[CUSIP]. Columns: [YTD Net Flows], [Total AUM], [Sales AUM Ratio]. Sort descending. |
| Morningstar Category Outflows YTD | Table | Same as inflows but sort ascending by YTD Net Flows (most negative first). Visual-level filter: Net Flows < 0. |
| Fund Family Outflows YTD | Table | Same as inflow table but sorted ascending. |
| Individual Fund Outflows YTD | Table | Same structure, sorted ascending. |
| Channel Slicer | Buttons/dropdown | PCG, WBS, FINET, WFAS |
| Advisory/Brokerage Slicer | Toggle | ACCT_TYP: ADVISORY / BROKERAGE |
| Year Slicer | Dropdown | Dim_Calendar[Year] |

**Tip:** To show inflows and outflows on the same page without mutual interference, use visual-level filters on each table rather than page-level filters.

---

### Page 3 — Gross Sales Detail

*Matches Slide 3 of the current PowerPoint*

This page excludes exchanges (`EXCHANGE_IND = "N"`) and SMA/529 share classes (`Is_SMA_or_529 = "N"`) in all visuals. Add a static text box at the bottom: *"All data excludes 529s and SMA share classes. This tab excludes exchanges."*

| Visual | Type | Configuration |
|--------|------|---------------|
| Morningstar Category Gross Sales YTD | Table | Rows: Dim_Fund[Mstar_Cat]. Columns: [YTD Gross Sales], [Total AUM], [Sales AUM Ratio]. Sort descending by YTD Gross Sales. |
| Fund Family Gross Sales YTD | Table | Rows: Dim_Fund[Brand]. Columns: [YTD Gross Sales], [Total AUM], [Sales AUM Ratio]. Sort descending. |
| Individual Fund Gross Sales YTD | Table | Rows: Fact_Flows[MF_NM]. Columns: [YTD Gross Sales], [Total AUM], [Sales AUM Ratio]. Sort descending. |
| Broad Asset Class Gross Sales | Matrix | Rows: Dim_Fund[Broad_Category]. Columns: [YTD Gross Sales], [Current Month Gross], [Prior Month Gross], [Sales AUM Ratio]. Conditional formatting on values. |

**Prior Month Gross measure:**
```dax
Prior Month Gross =
CALCULATE(
    [Gross Sales],
    DATEADD(Dim_Calendar[Date], -1, MONTH)
)
```

---

### Page 4 — AUM & Holdings

*Matches Slide 4 of the current PowerPoint*

| Visual | Type | Configuration |
|--------|------|---------------|
| Top MF Holdings by AUM | Table | Rows: Dim_Fund[Mstar_Cat]. Columns: [YTD Gross Sales], [Total AUM], [Sales AUM Ratio]. Add rank column using [Category Net Rank]. |
| Fund Family Sales YTD | Table | Rows: Dim_Fund[Brand]. Columns: [YTD Gross Sales], [Total AUM], [Sales AUM Ratio]. |
| Broad Asset Class Summary | Table | Rows: Dim_Fund[Broad_Category]. Columns: [Current Month Gross], [Prior Month Gross], [Total AUM], [Prior Month AUM], [YTD Gross Sales], [Sales AUM Ratio]. |
| Total AUM Card | KPI Card | Value: [Total AUM]. Format as $XxxB. |
| Advisory AUM Card | KPI Card | Value: [Advisory AUM]. |
| Advisory AUM % Card | KPI Card | Value: [Advisory AUM %]. Format as percentage. |
| Brokerage AUM Card | KPI Card | Value: [Brokerage AUM]. |
| PCG Total AUM Card | KPI Card | Value: [PCG AUM]. |
| WBS Total AUM Card | KPI Card | Value: [WBS AUM]. |
| FINET Total AUM Card | KPI Card | Value: [FINET AUM]. |
| WFAS Total AUM Card | KPI Card | Value: [WFAS AUM]. |

---

## Section 7: Replacing Manual Monthly Steps

This table maps each step in the current manual Excel/PowerPoint process to the Power BI equivalent.

| Current Manual Step | Power BI Equivalent |
|---------------------|---------------------|
| Download new `MF_SLS_FLOW_month.xlsx` and save to shared folder | Drop file in watched folder → click Refresh in Power BI Service (or auto-refresh at 6 AM) |
| Copy CUSIPs from last month, delete duplicates | Power Query auto-deduplicates on the Morningstar merge — no action needed |
| Add "Is it a SMA or 529?" column via VLOOKUP from Morningstar file | Merge query join on CUSIP — runs automatically every refresh |
| Add "Allowable List" column via VLOOKUP | Same merge — automatic |
| Add "Is it a Master List Fund?" via VLOOKUP | Same merge — automatic |
| Add "Real Share Class" via VLOOKUP | Same merge — automatic |
| Add "Broad Category" via VLOOKUP | Same merge — automatic |
| Create pivot table (Filters: Channel, ACCT_TYP, PROGRAM, TRADE_SIDE, EXCHANGE_IND, Is_it_a_MF; Rows: trim; Values: sum of net) | All filters are embedded in DAX measures; slicers on report pages provide interactive filtering |
| Filter P only for gross, Y for "is it a MF", N for exchanges | `Gross Sales` DAX measure applies all three filters automatically |
| For Net: include both P and S | `Net Flows` DAX measure sums NET_AMOUNT for both trade sides |
| Manually update 4 PowerPoint charts | Click Refresh → all 4 report pages update automatically |
| Sort YTD column largest to smallest for inflows | Table visual → set default sort by YTD Net Flows column descending |
| Sort YTD column smallest (most negative) for outflows | Table visual → set default sort by YTD Net Flows column ascending |
| Highlight 12 months on Net Flows chart | Use relative date filter on the visual: "Last 12 months" |
| Get Advisory/Brokerage AUM from "Overall Advisory" and "Overall Brokerage" rows in AUM file | `Advisory AUM` and `Brokerage AUM` measures filter on ACCT_TYP |
| Level 0 estimate is a separate column in the AUM file | Filter Level0 rows from Fact_AUM, or add an `Is_Level0` flag column and use as a slicer |
| FS Rebalances tab — manually subtract from Advisory gross | Create `Fact_FSRebalances` table; use this measure: `Advisory Gross Sales excl Rebalances = [Gross Sales Advisory] - [FS Rebalances Amount]` |
| Commission Revenue from trails/commissions Excel | Load `Revenue_Trails_Commissions.xlsx` as `Fact_Revenue`; use `YTD Commission Revenue` measure |
| Trail Revenue from same file | `YTD Trail Revenue` measure |
| Copy/paste revenue numbers into PowerPoint chart | Revenue measures populate Page 1 revenue bar chart automatically on Refresh |
| Manually check CUSIP matching between FLOW and Morningstar | Power Query merge preview shows unmatched rows — fix in source data before refresh |

---

## Section 8: Scheduled Refresh & Governance

### Setting Up Scheduled Refresh in Power BI Service

1. Publish the report to Power BI Service (app.powerbi.com).
2. Navigate to the dataset Settings → Scheduled Refresh.
3. Enable refresh and set frequency: **Daily at 6:00 AM ET** (adjust timezone to match your data warehouse refresh).
4. Add your service account email for failure notifications.

### On-Premises Data Gateway (for Network Drive Files)

If the source files live on a corporate network path (e.g., `\\wfa-nas.wellsfargo.net\mf_reporting\`), you must use the **On-Premises Data Gateway**:

1. Install the gateway on a machine that has access to the network drive and runs 24/7.
2. In Power BI Service → Manage Gateways, add the gateway and configure the data source with the UNC path and credentials.
3. In the dataset settings, associate the dataset with the gateway.
4. Scheduled refresh will now run through the gateway to reach the network files.

### Row-Level Security (RLS)

Configure RLS so that channel managers only see their own channel's data:

```dax
// In the RLS role definition — "PCG Channel Manager" role
[CHANNEL] = "PCG"
```

Create separate roles for PCG, WBS, FINET, and WFAS. Assign Active Directory groups or individual users to each role in Power BI Service under the dataset → Security settings.

Report-level managers who need to see all channels should be assigned to the report as Viewer without an RLS role.

### Dynamic Report Title

Use a DAX measure for the report/page title so it automatically reflects the latest data period:

```dax
Report Title =
"Mutual Fund Product Dashboard – " &
FORMAT(MAX(Dim_Calendar[Date]), "MMM YYYY")
```

Place this in a card visual at the top of each page with the card background set to transparent.

### Version Control

- Save the `.pbix` file with a date suffix before major updates: `MF_Dashboard_2026-03.pbix`
- Keep a `_Archive` folder with prior versions
- When publishing to Service, use the same workspace dataset (overwrite) rather than creating new datasets each month — this preserves all bookmarks and subscriptions

---

## Section 9: Common Issues & Resolutions

### FCCS and WellsTrade Excluded from All Metrics

**Problem:** FCCS appears in the CHANNEL column and should never appear in gross sales or net flows numbers presented to management.

**Resolution:** The `Gross Sales` and `Net Flows` base measures both include `Fact_Flows[CHANNEL] <> "FCCS"` as a permanent filter. The `Channel_Clean` Power Query column tags FCCS rows as "FCCS (excluded)" for visibility in audit tables. Add a visual-level filter on the channel slicer to exclude FCCS from the dropdown entirely so users cannot accidentally select it.

---

### Level 0 Estimate

**Problem:** The AUM file contains a "Level 0" AUM estimate that represents assets where pricing is uncertain. This is tracked separately and should not be included in the headline AUM figures presented on slide 4.

**Resolution:** Add a Power Query step to flag Level 0 rows:

```powerquery
#"Add Level0 Flag" = Table.AddColumn(
    #"Filter Positive AUM",
    "Is_Level0",
    each if Text.Contains([LEGACY_PROGRAM], "LEVEL0") then "Y" else "N",
    type text
)
```

Add a visual-level filter on AUM visuals: `Is_Level0 = "N"`. Add a separate KPI card showing `Level0_AUM` from the AUM_Summary table so it is visible but clearly labeled.

---

### FS Trades and Pathways Trades

**Problem:** FundSource (FS) trades and Pathways rebalance trades inflate Advisory Gross Sales figures because they are systematic rebalances rather than new money decisions.

**Resolution:** Create a separate `Fact_FSRebalances` table loaded from the FS Rebalances tab in the source Excel file. Add these measures:

```dax
FS Rebalances Amount =
SUM(Fact_FSRebalances[Rebalance_Amount])

Advisory Gross Sales excl Rebalances =
[Gross Sales Advisory] - [FS Rebalances Amount]

Advisory Gross Sales incl Rebalances =
[Gross Sales Advisory]
```

On the Executive Overview page, show both measures with clear labels. The slide note should read: "Advisory YTD includes rebalances ($X.XB). Advisory ex-rebalances: $X.XB."

---

### Advisory Monthly Gross Sales — Rebalance Subtraction

**Problem:** For month-over-month Advisory gross sales, the prior process manually subtracted the FS rebalance amount from the Advisory total. This step was easy to forget or miscalculate.

**Resolution:** Use the `Advisory Gross Sales excl Rebalances` measure in the monthly gross sales bar chart for the Advisory category. Add a tooltip that shows the rebalance amount subtracted. This makes the subtraction automatic and auditable.

---

### Morningstar Category Not Matching

**Problem:** Fund names or Morningstar category values may differ slightly between the FLOW file and the Morningstar reference file (e.g., trailing spaces, capitalization differences). This causes null values after the merge.

**Resolution:** Add a standardization step in Power Query before the merge:

```powerquery
// Trim and uppercase CUSIP before joining
#"Clean CUSIP" = Table.TransformColumns(
    #"Previous Step",
    {
        {"CUSIP",    each Text.Upper(Text.Trim(_)), type text},
        {"Mstar_Cat", each Text.Trim(_), type text}
    }
)
```

Apply the same cleaning to the Dim_Fund table. After the merge, check the count of rows where `Is_SMA_or_529 = null` — these are unmatched CUSIPs that need to be added to the Morningstar reference file.

---

### Month Sorting Alphabetically in Visuals

**Problem:** Month labels like "Apr-25", "Aug-25", "Dec-25" sort alphabetically instead of chronologically.

**Resolution:** In the Dim_Calendar table, use the **Sort by Column** feature in Power BI Desktop:

1. Select the `Month Name` column in the table view.
2. Click **Column Tools → Sort by Column → Month Number**.

This applies globally to all visuals that use the Month Name field. Alternatively, use the `Month_End_Date` (date type) as the X-axis field and format the axis labels as `MMM-yy` — date fields always sort chronologically.

---

### YTD Measures Returning Blank for Prior Year

**Problem:** `PY YTD Gross Sales` returns blank when the date slicer is set to a single month rather than a range.

**Resolution:** `SAMEPERIODLASTYEAR` requires a full date context. Use `TOTALYTD` with `SAMEPERIODLASTYEAR` together:

```dax
PY YTD Gross Sales =
CALCULATE(
    TOTALYTD([Gross Sales], Dim_Calendar[Date]),
    SAMEPERIODLASTYEAR(Dim_Calendar[Date])
)
```

Ensure the Dim_Calendar table is marked as a **Date Table** (right-click → Mark as Date Table → select the Date column). This is required for time intelligence functions to work correctly.

---

### Large File Performance

**Problem:** Monthly FLOW files can be large (hundreds of thousands of rows across 15 months). Power BI Desktop may be slow to refresh.

**Resolutions:**
- In Power Query, fold as many transformation steps as possible before expanding (keep steps that can be pushed to the source).
- Remove columns not needed in the model — especially free-text columns like `MF_NM` that have high cardinality. Keep them in Dim_Fund instead of Fact_Flows.
- Consider **incremental refresh** in Power BI Service: configure it to load only the last 3 months of new data while keeping the historical data frozen.
- Import mode is recommended over DirectQuery for this use case since the source is files (not a live database).

---

## Section 10: Tally File Tabs — Exact Schema (from Excel Screenshots)

This section documents the precise tab structure of both the **Gross Sales Tally** and **Net Sales Tally** Excel workbooks — the files your team builds each month and currently pastes into PowerPoint. Power BI eliminates the need for these workbooks entirely once the automation is live.

---

### Gross Sales Tally File (`March Gross 2026.xlsx`)

**Tabs:** Fund Family | Fund Level | CUSIP | Broad Category | Morningstar Category | FS Rebalances | YTD

#### CUSIP Tab
| Column | Header | Notes |
|--------|--------|-------|
| A | Fund_ID | e.g., FSUSA004DZ — internal fund identifier |
| B | Fund_Legal_Name | Full fund name |
| X | YTD_Gross | Year-to-date gross sales $ |
| AH | March_AUM | Latest month-end AUM $ |
| AK | YTD_Sales_AUM_Pct | = YTD_Gross / March_AUM |

Note: Rows where Fund_ID cannot be matched in Morningstar show `#N/A` in YTD_Sales_AUM_Pct.

#### Broad Category Tab — Reference Values (Q1 2026 Actuals)
| Broad Asset Class | YTD Gross | March AUM | YTD S/AUM % |
|---|---|---|---|
| Allocation | $1,721.7M | $68.3B | 2.52% |
| Alternative | $406.3M | $3.3B | 12.44% |
| Commodities | $185.8M | $5.4B | 3.43% |
| International Equity | $2,269.2M | $49.4B | 4.59% |
| Municipal Bond | $2,534.3M | $33.6B | 7.54% |
| Nontraditional Equity | $260.7M | $3.6B | 7.17% |
| Sector Equity | $369.7M | $12.1B | 3.06% |
| Taxable Bond | $6,726.5M | $94.6B | 7.11% |
| U.S. Equity | $6,717.7M | $161.5B | 4.16% |
| **Total** | **$21,192.5M** | **$431.9B** | **4.91%** |

Note on the tab: "All data excludes 529s, SMA share classes. This tab **includes** exchanges."

#### Morningstar Category Tab — Top Categories by YTD Gross (Q1 2026 Actuals)
| Morningstar Category | YTD Gross | March AUM | YTD S/AUM% |
|---|---|---|---|
| US Fund Large Blend | $1,860.4M | $45.0B | 4.13% |
| US Fund Multisector Bond | $1,587.0M | $17.5B | 9.09% |
| US Fund Large Value | $1,272.6M | $40.8B | 3.12% |
| US Fund Intermediate Core-Plus Bond | $1,090.0M | $17.0B | 6.40% |
| US Fund Large Growth | $1,078.3M | $44.9B | 2.40% |
| US Fund Intermediate Core-Bond | $972.6M | $19.2B | 5.06% |
| US Fund Short-Term Bond | $933.8M | $10.0B | 9.38% |
| US Fund High Yield Muni | $810.3M | $9.4B | 8.58% |
| US Fund Mid-Cap Blend | $704.8M | $5.7B | 12.26% |
| US Fund Moderate Allocation | $657.7M | $8.1B | 8.15% |

#### YTD Tab — Monthly Channel Breakdown (Used for Net Flows Chart on Slide 1)
This tab accumulates month-by-month with columns for each month. Key fields per month column:
- FS gross purchases (from FS Rebalances tab — note: "None of these numbers take out FS rebalances or replacements")
- Pathways gross purchases
- Overall Net Advisory / Brokerage / Total
- PCG Net Advisory / Brokerage / Total
- WBS Net Advisory / Brokerage / Total
- Finet Net Advisory / Brokerage / Total
- WFAS Net Advisory / Brokerage / Total
- Recommended Funds Net Sales (with exchanges)
- Master List Funds Net Sales (with exchanges)

Q1 2026 actual monthly net flows:
| Month | Advisory Net | Brokerage Net | Overall Net |
|---|---|---|---|
| January | -$182.3M | -$473.9M | -$635.3M |
| February | -$239.1M | -$206.0M | -$33.1M |
| March | -$776.2M | -$568.5M | -$1,344.6M |

---

### Net Sales Tally File (`March Net 2026 V2.xlsx`)

**Tabs:** Cusip-Don't Sort | Fund Level | Fund Family | Morningstar Category | Broad Category | March

> **Important:** The "Cusip-Don't Sort" tab must NOT be sorted — rows must stay in original order because other tabs use positional VLOOKUP formulas against it. In Power BI, this constraint disappears; Power BI uses relationship joins, not positional lookups.

#### Fund Family Tab
| Column | Header |
|--------|--------|
| A | Branding_Name |
| N | YTD_Net |
| X | March_AUM |
| AA | YTD_Sales_AUM_Pct |

Top fund families by YTD Net Flows (Q1 2026 actuals):
| Fund Family | YTD Net | March AUM | YTD S/AUM% |
|---|---|---|---|
| Capital Group | -$655.1M | $96.3B | -0.68% |
| PIMCO | +$646.5M | $24.3B | +2.66% |
| JPMorgan | +$261.0M | $17.1B | +1.52% |
| Lord Abbett | +$90.9M | $9.1B | +1.00% |
| Vanguard | -$318.5M | $27.8B | -1.15% |
| T. Rowe Price | -$852.8M | $15.2B | -5.61% |
| MFS | -$685.5M | $12.5B | -5.50% |

#### Morningstar Category Tab
| Column | Header |
|--------|--------|
| A | Morningstar_Category |
| N | YTD_Net |
| Y | March_AUM |
| AB | YTD_Sales_AUM_Pct |

Top net inflows by Morningstar Category (Q1 2026):
| Category | YTD Net | March AUM |
|---|---|---|
| US Fund Large Blend | +$425.5M | $45.0B |
| US Fund Multisector Bond | +$609.4M | $17.5B |
| US Fund Intermediate Core-Plus Bond | +$224.5M | $17.0B |

Largest net outflows:
| Category | YTD Net | March AUM |
|---|---|---|
| US Fund Large Growth | -$1,539.0M | $44.9B |
| US Fund Large Value | -$1,258.7M | $40.8B |

#### Broad Category Tab — Net Flows (includes exchanges)
| Broad Class | Jan Net | Feb Net | Mar Net | YTD Net | March AUM | YTD S/AUM% |
|---|---|---|---|---|---|---|
| Taxable Bond | +$413M | +$668M | +$197M | +$1,278M | $95.0B | +1.34% |
| Municipal Bond | +$243M | +$276M | +$130M | +$649M | $33.6B | +1.93% |
| U.S. Equity | +$951M | -$846M | -$1,285M | -$3,123M | $164.0B | -1.90% |
| Allocation | -$71M | -$79M | -$153M | -$303M | $71.1B | -0.43% |
| **Total (w/ exchanges)** | **+$356M** | **+$880M** | **-$60M** | **+$1,176M** | **$438.6B** | **-6.81%** |

> Note: The "Total with exchanges" of +$1,176M YTD differs significantly from the headline "Overall Net -$1,94B YTD" shown on Slide 1. The difference is the exchange amount (~$3.1B). Always use the **ex-exchanges** number for the headline chart and the **with-exchanges** number for the fund-level tables.

#### March Tab — Top MF Holdings by AUM (Source for Slide 4)
This tab is the source for the "Top MF Holdings by AUM" table shown on Slide 4.

| Column | Description |
|--------|-------------|
| Fund_ID | Internal fund identifier (e.g., FSUSA00R8) |
| Name | Fund name |
| Family | Fund family/brand |
| Category | Morningstar category |
| WFA_AUM_$ | Wells Fargo Advisors AUM in this fund |
| Fund_AUM_$ | Total industry AUM for this fund (from Morningstar) |
| WFA_Ownership_Pct | = WFA_AUM / Fund_AUM — WFA's share of the fund's total assets |
| AUM_Rank | Rank by WFA AUM (1 = largest) |
| Industry_AUM | Same as Fund_AUM |
| Current_Month_Net | This month's net flows in $ |
| YTD_Net | Year-to-date net flows in $ |
| Morningstar_Category | Morningstar category (on the right side of the tab) |

Sample row: American Funds Washington Mutual Investors Fund / Capital Group / Large Value / WFA AUM $11.8B / Fund AUM $329.9B / WFA Ownership 3.95% / Rank 1 / Mar Net -$225.3M

**DAX measure for WFA Ownership % (using Morningstar Net Assets):**

```dax
WFA Ownership % =
DIVIDE(
    [Total AUM],
    SUMX(Dim_Fund, Dim_Fund[Net_Assets_M] * 1000000)
)
```

This requires the `Net_Assets_M` column from the Morningstar file (see updated Morningstar schema below).

---

## Section 11: Updated Morningstar File Schema

The complete Morningstar monthly file has more columns than initially documented. Full column list:

| Column | Type | Description |
|--------|------|-------------|
| CUSIP | Text | 9-char primary key |
| Ticker | Text | SEC ticker symbol |
| Allowable_List | Text | Y/N — on the firm's allowable list |
| Rec | Text | Y/N — Recommended fund |
| ACL | Text | Y/N — Approved Consideration List |
| Fund_Legal_Name | Text | Full legal fund name |
| Fund_ID | Text | Internal fund identifier |
| Branding_Name | Text | Brand/family name displayed to clients |
| US_Category_Group | Text | Broad US category group (e.g., U.S. Equity, Fixed Income) |
| Global_Broad_Category_Group | Text | Morningstar global broad category |
| Morningstar_Category | Text | Detailed Morningstar category (e.g., US Fund Large Blend) |
| Share_Class | Text | A, C, I, Inst, Retirement, etc. |
| Inception_Date | Date | Fund inception date |
| Net_Assets_Date | Date | Date of the net assets figure |
| Net_Assets_M | Decimal | Total fund net assets in millions $ (used for WFA Ownership %) |
| Net_Assets_Currency | Text | Usually USD |
| Management_Fee | Decimal | Annual management fee % |
| Prospectus_12b1 | Decimal | 12b-1 distribution fee % |
| Shareholder_Fee | Decimal | Shareholder servicing fee % |

> **Corrected note:** `Is_SMA_or_529` and `Is_Master_List_Fund` do NOT come from the Morningstar file directly — they come from a separate internal **Master Fund List** maintained by the team. The Morningstar file provides: fund classification, fees, net assets, and the `Allowable_List`, `Rec`, `ACL` flags. In Power BI, load both the Morningstar file and the internal Master Fund List, then merge both to Dim_Fund on CUSIP.

---

## Section 12: Additional DAX Measures for New Schema

```dax
-- WFA Ownership Percentage (requires Net_Assets_M from Morningstar)
WFA Ownership % =
DIVIDE(
    [Total AUM],
    SUMX(Dim_Fund, Dim_Fund[Net_Assets_M] * 1000000),
    0
)

-- Industry AUM (from Morningstar Net Assets)
Industry AUM =
SUMX(Dim_Fund, Dim_Fund[Net_Assets_M] * 1000000)

-- Net Flows WITH Exchanges (for fund-level tables)
Net Flows incl Exchanges =
CALCULATE(
    SUM(Fact_Flows[NET_AMOUNT]),
    Fact_Flows[Is_it_a_MF] = "Y",
    Fact_Flows[CHANNEL] <> "FCCS"
)

-- Net Flows EXCLUDING Exchanges (for headline chart on Slide 1)
-- (same as existing Net Flows ex Exchanges — alias for clarity)
Net Flows Headline =
CALCULATE(
    SUM(Fact_Flows[NET_AMOUNT]),
    Fact_Flows[Is_it_a_MF] = "Y",
    Fact_Flows[CHANNEL] <> "FCCS",
    Fact_Flows[EXCHANGE_IND] = "N"
)

-- Master List Fund AUM
Master List AUM =
CALCULATE([Total AUM], Dim_Fund[Is_Master_List_Fund] = "Y")

Master List AUM % =
DIVIDE([Master List AUM], [Total AUM])

-- Master List Fund Net Flows (with exchanges)
Master List Net Flows =
CALCULATE([Net Flows incl Exchanges], Dim_Fund[Is_Master_List_Fund] = "Y")

-- YTD Net Flows, with and without exchanges (for YTD tab reference)
YTD Net Flows incl Exchanges =
TOTALYTD([Net Flows incl Exchanges], Dim_Calendar[Date])

YTD Net Flows ex Exchanges =
TOTALYTD([Net Flows Headline], Dim_Calendar[Date])

-- FS Gross Purchases (if FS Rebalances table is loaded separately)
FS Gross Purchases =
SUM(Fact_FSRebalances[Purchase_Amount])

Pathways Gross Purchases =
SUM(Fact_FSRebalances[Pathways_Amount])

-- Recommended Fund Net Sales (always with exchanges — firm standard)
Rec Funds YTD Net =
CALCULATE(
    [YTD Net Flows incl Exchanges],
    Dim_Fund[Rec] = "Y"
)

Rec Funds Net % of Overall =
DIVIDE([Rec Funds YTD Net], [YTD Net Flows incl Exchanges])
```

---

## Quick Reference: Which Number to Use Where

| Report Location | Measure | Exchange Treatment |
|---|---|---|
| Slide 1 Net Flows chart | `Net Flows Headline` / `YTD Net Flows ex Exchanges` | **Excludes** exchanges |
| Slide 1 Gross Sales bars | `Gross Sales` / `YTD Gross Sales` | **Excludes** exchanges |
| Slide 2 Net fund/family tables | `Net Flows incl Exchanges` | **Includes** exchanges |
| Slide 3 Gross fund/family tables | `Gross Sales incl Exchanges` | **Includes** exchanges |
| Broad Category tabs | `Gross Sales incl Exchanges` | **Includes** exchanges (noted) |
| YTD Channel breakdown | Both — show headline (ex) for summary, incl for fund tables | Both |
| Recommended Funds Net | `Rec Funds YTD Net` | **Includes** exchanges (firm convention) |
| Master List Funds Net | `Master List Net Flows` | **Includes** exchanges |
