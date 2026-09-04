# Mutual Fund Product Dashboard — Power BI Build Guide

A complete reference for replicating the 4-slide PowerPoint deck in Power BI Desktop,
built dynamically (no hardcoded years/months) so it rolls forward every month with a data refresh.

> **Context:** Replacing a manual monthly reporting process (Excel VLOOKUPs + pivots + PowerPoint)
> with a Power BI dashboard. Data is sensitive and stays on the work laptop. All source values are in
> full dollars unless noted. Reporting month = the latest month in the `Sales` fact table (`EOM_DT`).

---

## 1. Data Model Overview

| Table | Role | Key columns |
|---|---|---|
| `Sales` | Fact (gross sales, net flows) | `EOM_DT` (end-of-month date), `ACCT_TYP` (BROKERAGE/ADVISORY), `CHANNEL` |
| `Revenue` | Fact (append of Commission + Trail) | `Month` (first-of-month date), `Metric` ("Commission Revenue" / "Trail Revenue"), `Amount`, `Period` |
| `Commission` | Source query → Revenue | Channel, Period, Month, Amount |
| `Trail` | Source query → Revenue | Channel, Period, Month, Amount |
| `Mstar` / `Assets` | AUM data | AUM values, "Is it a MF" flag |
| `Calendar` | Date dimension | `Date`, `Year`, `MonthNo`, `MonthYear`, `MonthYearSort` |
| `Gross Group` | Disconnected dim | `GROUP` = Commission / Advisory / Total |
| `Revenue Group` | Disconnected dim | `Group` = Commission / Trail / Total |
| `MetricPeriod` | Disconnected dim (dynamic labels) | `Period`, `Label`, `Sort` |

**Channel rules:** FCCS excluded from everything; WTRD excluded from Gross/Net but NOT from Slide-1 (S1) measures.
**Commission vs Advisory split:** `ACCT_TYP = "BROKERAGE"` vs `"ADVISORY"`.

---

## 2. Bug Fixes Applied (this session)

### 2.1 Gross Prior YTD — `= mo` → `<= mo`
The prior-year YTD measure used `= mo` (single month) instead of `<= mo` (cumulative). Fixed:
```dax
Gross Prior YTD =
VAR d  = MAX(Sales[EOM_DT])
VAR yr = YEAR(d) - 1
VAR mo = MONTH(d)
RETURN CALCULATE([Gross S1 ex-exch], 'Calendar'[Year] = yr, 'Calendar'[MonthNo] <= mo)
```
**Result:** Prior YTD Total now $32.62B vs Excel target $32.63B (match). Apply the same `<= mo` pattern to every Prior-YTD measure (Gross, Revenue, Net Flows).

### 2.2 Revenue Prior Year was BLANK — missing 2025 monthly data
The Commission/Trail Power Query only pulled 2026 monthly columns. Root cause: the **"Removed Other Columns"** step (step 4) explicitly listed columns and skipped the 2025 monthly columns (Column145–156).

**Permanent dynamic fix** — replace that step's formula with a pattern that keeps Column1 (labels) plus every data column from Column14 onward, so future months/years are picked up automatically:
```powerquery
= Table.SelectColumns(#"Removed Bottom Rows", {"Column1"} & List.Select(Table.ColumnNames(#"Removed Bottom Rows"), each let num = try Number.FromText(Text.AfterDelimiter(_, "Column")) otherwise 0 in num >= 14))
```
- Paste as **one line** in the formula bar.
- Watch for the typo `otherwies` → must be `otherwise`.
- `num >= 14` = keep every data column (first 13 are labels/metadata), permanent — no annual edits.
- Downstream `Table.UnpivotOtherColumns` (step 11) is already dynamic and converts the new columns to rows automatically.
- **Maintenance:** each year, un-collapse (expand) the previous year's grouped columns in the Excel Summary tab before refreshing.

Apply the identical formula to the **Trail** query's equivalent step.

### 2.3 Commission Prior Year not rendering — measure typo
`R Prior YTD (grp)` filtered `Revenue[Metric] = "Commision Revenue"` (missing an "s"). The table stores `"Commission Revenue"`. Corrected:
```dax
R Prior YTD (grp) =
SWITCH( SELECTEDVALUE('Revenue Group'[Group]),
    "Commission", CALCULATE([Revenue Prior YTD], Revenue[Metric] = "Commission Revenue"),
    "Trail",      CALCULATE([Revenue Prior YTD], Revenue[Metric] = "Trail Revenue"),
    "Total",      [Revenue Prior YTD]
)
```
Verify the same double-"s" spelling in **all four** grouped revenue measures (Curr Mo, Curr YTD, Prior Yr Mo, Prior YTD).

### 2.4 Advisory / Total Curr YTD inflation (~$3.36B) — UNRESOLVED
`Total Curr YTD` returns $34.73B vs Excel target $31.37B. User confirmed it is **not** the WTRD channel. Still needs a diagnostic table visual to isolate the source.

---

## 3. Dynamic Year/Month Labels (permanent, no hardcoding)

### 3.1 `MetricPeriod` disconnected table
Create via **Modeling → New table**. Leave it disconnected (no relationships).
```dax
MetricPeriod =
VAR d = CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales))
VAR currYr  = YEAR(d)
VAR priorYr = currYr - 1
RETURN
UNION(
    ROW("Period","Curr YTD","Label", FORMAT(currYr,"0") & " YTD",       "Sort",1),
    ROW("Period","Curr Mo", "Label", FORMAT(d,"MMM-YY"),               "Sort",2),
    ROW("Period","Prior YTD","Label",FORMAT(priorYr,"0") & " YTD",      "Sort",3),
    ROW("Period","Prior Mo","Label", FORMAT(EDATE(d,-12),"MMM-YY"),     "Sort",4)
)
```
Renders **2026 YTD / Jun-26 / 2025 YTD / Jun-25**, rolling forward automatically.

**Sort the labels:** click the `Label` column → **Column tools → Sort by column → `Sort`**. This makes the legend read in PPT order (Curr YTD, Curr Mo, Prior YTD, Prior Mo).

### 3.2 Switcher measures (must be MEASURES, not columns)
> A "Sum of …" prefix in the Y-axis well means it was created as a **column** — wrong. Recreate with **New measure**.

```dax
Gross Value (period) =
SWITCH(SELECTEDVALUE(MetricPeriod[Period]),
    "Curr YTD",  [G Curr YTD (grp)],
    "Curr Mo",   [G Curr Mo (grp)],
    "Prior YTD", [G Prior YTD (grp)],
    "Prior Mo",  [G Prior Yr Mo (grp)])
```
```dax
Revenue Value (period) =
SWITCH(SELECTEDVALUE(MetricPeriod[Period]),
    "Curr YTD",  [R Curr YTD (grp)],
    "Curr Mo",   [R Curr Mo (grp)],
    "Prior YTD", [R Prior YTD (grp)],
    "Prior Mo",  [R Prior Yr Mo (grp)])
```
> **Common bug:** if you copy the Gross measure to make the Revenue one, change every `[G …]` to `[R …]`. Leftover `[G …]` measures use Gross Group and return blank on a Revenue-Group axis.

### 3.3 Rebuild each clustered bar chart
- **Gross MF Sales:** X-axis = `Gross Group[GROUP]`, Legend = `MetricPeriod[Label]`, Y-axis = `[Gross Value (period)]`
- **YTD MF Revenue:** X-axis = `Revenue Group[Group]`, Legend = `MetricPeriod[Label]`, Y-axis = `[Revenue Value (period)]`

> The X-axis Group **must** come from the matching Group table, or the grouped measures return blank.

### 3.4 Colors — lock to position, not label text
Because label text changes each period, key colors to the `Sort` value via **Columns → Colors → fx (conditional formatting)**:

| Sort | Meaning | Hex |
|---|---|---|
| 1 | Curr YTD | `#C00000` (red) |
| 2 | Curr Mo | `#FFC000` (gold) |
| 3 | Prior YTD | `#002060` (navy) |
| 4 | Prior Mo | `#ED7D31` (orange) |

---

## 4. Net MF Flows Chart

### 4.1 Dynamic title with YTD figures
```dax
Net Flows Title =
VAR d       = CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales))
VAR yr      = YEAR(d)
VAR priorYr = yr - 1
VAR mo      = MONTH(d)
VAR currYTD  = CALCULATE([Net Flows (S1)], ALL('Calendar'), 'Calendar'[Year]=yr,      'Calendar'[MonthNo]<=mo) / 1000000000
VAR priorYTD = CALCULATE([Net Flows (S1)], ALL('Calendar'), 'Calendar'[Year]=priorYr, 'Calendar'[MonthNo]<=mo) / 1000000000
RETURN
"Net MF Flows (YTD " & FORMAT(currYTD,"$0.00") & "b vs " & FORMAT(priorYTD,"$0.00") & "b YTD " & priorYr & ")"
```
Bind: chart → Format → **General → Title → fx → Field value → `[Net Flows Title]`**.
`ALL('Calendar')` keeps YTD correct despite the visual's 12-month filter.

### 4.2 Trailing 12 months (dynamic)
Calendar flag column:
```dax
Last 12 Months =
VAR ReportDate = CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales))
VAR MonthsBack = DATEDIFF('Calendar'[Date], ReportDate, MONTH)
RETURN IF(MonthsBack >= 0 && MonthsBack <= 11, 1, 0)
```
Apply as a visual filter: `Last 12 Months is 1`. (Alternative: Top-N filter, Top 12 by `Max of MonthYearSort` — but the flag is cleaner and reusable on the AUM chart.)

### 4.3 X-axis "25-Jul" format (optional)
```dax
MonthLabel = FORMAT('Calendar'[Date], "YY-MMM")
```
Sort `MonthLabel` by `MonthYearSort`, then use on the X-axis.

### 4.4 Currency + colors
- Measure Format = **Currency ($)**, 1 decimal (or format string `$#,##0.0,,,` for `$0.5` with no "bn").
- Axis/data-label Display units = **Billions** (or None with the format string).
- Line color gray `#808080`; markers On, red `#C00000`.

---

## 5. Number Formatting Cheatsheet

| Need | How |
|---|---|
| `$` on values | Select measure → **Measure tools → Format → Currency ($)** |
| `$5.36` (billions, no "bn") | Custom format string `$#,##0.00,,,` (3 commas ÷ billion) + axis Display units = None |
| `$5.36bn` | Currency format + Display units = Billions |
| `$` on axis only, plain numbers in bars | Not possible natively (axis & labels share the measure format) → put `($)` in the **axis title**, keep values plain |
| Bold header row | **Column headers → Text → B** |
| Bold total column | **Column subtotals → Values → B** (header text is styled by Column headers) |
| Column spacing (bar charts) | **Columns → Layout → Space between categories / Space between series** |

---

## 6. Table/Matrix Grids (Gross Sales & Net Sales pages)

### 6.1 Keep full numbers & fit the slide — "rolling year" via Current Year flag
The month-columns matrix grows each month. To show the **full current year** (Jan → current month) with full numbers and a correct YTD total column:
```dax
Current Year =
VAR d = CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales))
RETURN IF(YEAR('Calendar'[Date]) = YEAR(d), 1, 0)
```
Filter the matrix's month field to `Current Year is 1`. The matrix's built-in **Total column = true YTD** automatically. Give the matrix full page width; font 8pt; tight row padding; Auto-size column width Off; horizontal scroll as a safety net for December.

> Alternative (matches the quarterly PPT snapshot exactly): rolling 3-month window via a `Current Quarter` flag + a separate `Gross YTD`/`Net YTD` measure in a twin matrix. Not used — user wanted the full year.

### 6.2 Dynamic grid titles with year
```dax
BA Gross Sales Title = "Broad Asset Class Gross Sales " & YEAR(CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales)))
BA Net Sales Title   = "Broad Asset Class Net Sales "   & YEAR(CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales)))
```
Bind via **General → Title → fx → Field value**.

### 6.3 Dynamic page title
```dax
Gross Page Title =
VAR d = CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales))
VAR q = "Q" & ROUNDUP(MONTH(d)/3, 0)
RETURN "Mutual Fund Product Dashboard – Gross Sales " & q & " " & YEAR(d)
```

---

## 7. Row Numbering on Top-N Grids

A Power Query index won't work on Top-N-filtered visuals. Two options:

**Visual calculation (best, generic — needs the preview feature enabled):**
- File → Options → Preview features → ✓ Visual calculations → restart.
- Select grid → **New visual calculation → Custom**:
```
Row = ROWNUMBER(ORDERBY([Net Flows (S1)], DESC))   -- net grids
Row = ROWNUMBER(ORDERBY([YTD Sales], DESC))        -- gross grids
```
Set the visual calc format to **0 decimals**. Bare `ROWNUMBER()` sorts alphabetically — always include `ORDERBY`. Copy the whole visual to carry the formula + formatting.

**RANKX measure (works without the preview):**
```dax
Row = RANKX(ALLSELECTED('Morningstar Table'[Morningstar Category]), [YTD Sales], , DESC)
```
Swap the category field and value per grid.

---

## 8. Ranked-Table Measures (Gross/Net pages)
```dax
Sales/AUM % = DIVIDE([Gross MF Sales (S1)], [Total AUM])
Flows/AUM % = DIVIDE([Net Flows (S1)],       [Total AUM])
```
Format as Percentage, 2 decimals. Column headers renamed to PPT wording ("YTD Sales", "Current AUM", "Sales/AUM %" / "Flows/AUM%").

---

## 9. Page Layout & Cosmetics

- **Divider lines** (simplest PPT-style separation): Insert → Shapes → Line. One vertical + one horizontal through the center, thin gray `#D9D9D9`. Enable View → Snap to grid; hold Shift for straight lines.
- **Visual borders** (alternative): General → Effects → Visual border → On, square corners, 1–2px. Use Format Painter to copy to all.
- **Title text box:** Insert → Text box → Add dynamic value → bind to the title measure. Serif font, bronze color to match PPT.
- **"INTERNAL USE ONLY":** red bold text box, top-right.
- **Footnotes (static text boxes, italic 7pt gray `#595959`):**
  - Gross: *Gross sales do not include FundSource/Pathways rebalances and replacements, or mutual funds sold level 0*
  - Net Flows: *Net sales do not include mutual funds sold level 0*
  - Revenue: *All revenue figures are derived from WFA Finance Dept.*
  - AUM: *AUM includes mutual funds held level 0*
  - Gross/Net pages: *All MF Sales and AUM information provided by Internal Reports and Morningstar. Data excludes First Clearing and Level 0 assets.*

---

## 10. Excel Target Values (Q2 2026 reference)

**Gross MF Sales:** Commission 2026 YTD $5.35B / Jun-26 $0.75B / 2025 YTD $4.23B / Jun-25 $0.68B ·
Advisory 2026 YTD $26.02B / 2025 YTD $28.40B · Total 2026 YTD $31.37B / 2025 YTD $32.63B (Prior now $32.62B ✔)

**YTD MF Revenue:** Commission $51.96M / $7.69M / $45.36M / $7.54M ·
Trail $253.94M / $44.48M / $246.64M / $41.43M · Total $305.90M / $52.17M / ~$292M / $48.97M

---

## 11. Status & Remaining Work

**Done**
- Gross Prior YTD `<= mo` fix
- Revenue Prior Year data (dynamic Power Query column selection) + Commission typo fix
- Dynamic MetricPeriod labels + switcher measures on Gross MF Sales & YTD MF Revenue
- Net Flows: 12-month rolling filter, currency, dynamic YTD title
- Gross/Net grids: Current Year rolling filter, dynamic titles, row numbering
- Page layout: titles, dividers, footnotes

**Open**
- Advisory/Total Curr YTD ~$3.36B inflation (not WTRD) — needs diagnostic
- Total AUM measure: remove `Mstar[Is it a MF] = "Y"` filter (parked)
- Apply dynamic colors (conditional by Sort) to lock bar colors
- Final validation of all Slide-1 visuals vs Excel targets
- Top MF Holdings page polish

---

## 12. Key Principles Used Throughout
1. **Reporting date is dynamic:** everything anchors to `CALCULATE(MAX(Sales[EOM_DT]), ALL(Sales))` — no hardcoded years/months.
2. **Measures vs columns:** SWITCH/SELECTEDVALUE logic must live in **measures**; a "Sum of …" prefix means you made a column by mistake.
3. **Disconnected dimension pattern:** MetricPeriod / Gross Group / Revenue Group drive grouped SWITCH measures; the axis field must come from the matching table.
4. **Flags for rolling windows:** `Current Year`, `Last 12 Months`, `Current Quarter` calculated columns filter visuals and roll forward automatically.
5. **Dynamic titles:** bind measures to visual/page titles via the **fx → Field value** button.
