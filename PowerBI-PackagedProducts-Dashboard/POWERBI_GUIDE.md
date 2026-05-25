# Packaged Products Monthly Dashboard — Power BI Guide

Complete step-by-step guide to build a production-ready monthly sales dashboard using the provided CSV data files.

---

## Files Included

| File | Description | Rows |
|------|-------------|------|
| `packaged_products_sales.csv` | Main fact table — one row per product/region/channel/month | 17,425 |
| `products_master.csv` | Product dimension (name, category, price, cost) | 41 |
| `regions_master.csv` | Region dimension (manager, territory, target multiplier) | 5 |

---

## Step 1 — Import Data into Power BI Desktop

1. Open **Power BI Desktop** → **Home → Get Data → Text/CSV**
2. Import `packaged_products_sales.csv` → click **Transform Data** (do NOT load directly)
3. In **Power Query Editor**, repeat for `products_master.csv` and `regions_master.csv`

### Recommended Power Query transforms (apply to `packaged_products_sales`):

```
1. Select column "date" → change type to Date
2. Select column "year" → change type to Whole Number
3. Select column "month" → change type to Whole Number
4. Select columns: gross_revenue, cogs, gross_profit, net_revenue,
   unit_price, unit_cost → change type to Decimal Number
5. Select columns: units_sold, returns, net_units → change type to Whole Number
6. Select column "gross_margin_pct" → change type to Decimal Number
7. Rename query to: Sales
```

Rename the other queries:
- `products_master` → **Products**
- `regions_master` → **Regions**

Click **Close & Apply**.

---

## Step 2 — Create a Date Table (Calendar)

In Power BI Desktop → **Modeling → New Table**, paste this DAX:

```dax
Calendar =
ADDCOLUMNS(
    CALENDAR(DATE(2024, 1, 1), DATE(2025, 5, 31)),
    "Year",           YEAR([Date]),
    "Month Number",   MONTH([Date]),
    "Month Name",     FORMAT([Date], "MMMM"),
    "Month Short",    FORMAT([Date], "MMM"),
    "Quarter",        "Q" & FORMAT(ROUNDUP(MONTH([Date]) / 3, 0), "0"),
    "Year-Month",     FORMAT([Date], "MMM YYYY"),
    "Sort Key",       YEAR([Date]) * 100 + MONTH([Date])
)
```

Then set the **Sort By Column**:
- Select `Month Name` column → **Column Tools → Sort by Column → Month Number**
- Select `Month Short` column → **Column Tools → Sort by Column → Month Number**
- Select `Year-Month` column → **Column Tools → Sort by Column → Sort Key**

---

## Step 3 — Define Relationships (Data Model)

Go to **Model View** and create these relationships:

| From Table | From Column | To Table | To Column | Cardinality |
|------------|-------------|----------|-----------|-------------|
| Sales | date | Calendar | Date | Many-to-One ★ |
| Sales | product_name | Products | product_name | Many-to-One |
| Sales | region | Regions | region | Many-to-One |

> ★ Mark the **Calendar** table as a Date Table: right-click → **Mark as Date Table → Date column = Date**

Cross-filter direction for all relationships: **Single**

---

## Step 4 — Create DAX Measures

Create a dedicated **Measures** table for organisation:
**Modeling → New Table** → `Measures = ROW("x", 1)` → hide the `x` column.

Paste each measure below into **Modeling → New Measure** (select the Measures table first):

### Revenue & Volume
```dax
Total Revenue =
SUM(Sales[gross_revenue])

Net Revenue =
SUM(Sales[net_revenue])

Total Units Sold =
SUM(Sales[units_sold])

Net Units =
SUM(Sales[net_units])

Total Returns =
SUM(Sales[returns])

Return Rate % =
DIVIDE([Total Returns], [Total Units Sold], 0) * 100
```

### Cost & Profit
```dax
Total COGS =
SUM(Sales[cogs])

Gross Profit =
SUM(Sales[gross_profit])

Gross Margin % =
DIVIDE([Gross Profit], [Total Revenue], 0) * 100
```

### Month-over-Month (MoM)
```dax
Revenue PreviousMonth =
CALCULATE(
    [Total Revenue],
    DATEADD(Calendar[Date], -1, MONTH)
)

Revenue MoM Change =
[Total Revenue] - [Revenue PreviousMonth]

Revenue MoM % =
DIVIDE([Revenue MoM Change], [Revenue PreviousMonth], 0) * 100

Units PreviousMonth =
CALCULATE(
    [Total Units Sold],
    DATEADD(Calendar[Date], -1, MONTH)
)

Units MoM % =
DIVIDE(
    [Total Units Sold] - [Units PreviousMonth],
    [Units PreviousMonth],
    0
) * 100
```

### Year-over-Year (YoY)
```dax
Revenue PY =
CALCULATE(
    [Total Revenue],
    SAMEPERIODLASTYEAR(Calendar[Date])
)

Revenue YoY % =
DIVIDE(
    [Total Revenue] - [Revenue PY],
    [Revenue PY],
    0
) * 100
```

### Running Totals (YTD)
```dax
Revenue YTD =
TOTALYTD([Total Revenue], Calendar[Date])

Units YTD =
TOTALYTD([Total Units Sold], Calendar[Date])
```

### Rankings
```dax
Product Revenue Rank =
RANKX(
    ALLSELECTED(Sales[product_name]),
    [Total Revenue],
    ,
    DESC,
    DENSE
)

Category Revenue Rank =
RANKX(
    ALLSELECTED(Sales[category]),
    [Total Revenue],
    ,
    DESC,
    DENSE
)
```

### Formatting helpers
```dax
Revenue Label =
"$" & FORMAT([Total Revenue] / 1000, "#,##0.0") & "K"

Margin Label =
FORMAT([Gross Margin %], "0.0") & "%"
```

---

## Step 5 — Dashboard Layout (3 Pages)

### Page 1 — Executive Overview

**Rename page:** "Executive Overview"
**Canvas size:** 1280 × 720 (default)

| Visual | Type | Fields / Config |
|--------|------|-----------------|
| **KPI — Total Revenue** | Card | Value: `Total Revenue` Format: $#,##0 |
| **KPI — Gross Margin %** | Card | Value: `Gross Margin %` Format: 0.00% |
| **KPI — Total Units** | Card | Value: `Total Units Sold` Format: #,##0 |
| **KPI — MoM Revenue %** | Card | Value: `Revenue MoM %` Conditional color: green if >0, red if <0 |
| **Revenue by Month** | Line chart | X-axis: `Calendar[Year-Month]`, Values: `Total Revenue`, `Revenue PreviousMonth` |
| **Revenue by Category** | Clustered bar | Y-axis: `category`, X-axis: `Total Revenue` Sort descending |
| **Revenue by Region** | Filled map / Donut | Location/Legend: `region`, Values: `Total Revenue` |
| **Top 10 Products** | Bar chart | Y-axis: `product_name`, X-axis: `Total Revenue`, Filter: `Product Revenue Rank <= 10` |
| **Units vs Revenue trend** | Line + Column combo | Column: `Total Units Sold`, Line: `Total Revenue`, X-axis: `Year-Month` |
| **Slicer — Year** | Slicer (Tile) | Field: `Calendar[Year]` |
| **Slicer — Month** | Slicer (Dropdown) | Field: `Calendar[Month Name]` |

#### Layout tips
```
Row 1 (top): 4 KPI cards side-by-side, height ~120px
Row 2:       Revenue by Month (60% width) | Revenue by Category (40%)
Row 3:       Top 10 Products (50%) | Region donut (25%) | Units combo (25%)
Slicers:     Top-right corner, above KPI row
```

---

### Page 2 — Category & Product Drill-Down

**Rename page:** "Category Deep Dive"

| Visual | Type | Fields / Config |
|--------|------|-----------------|
| **Category matrix** | Matrix | Rows: `category` → `product_name`, Columns: `Calendar[Month Short]`, Values: `Total Revenue`, `Gross Margin %` Enable conditional formatting on Revenue (data bars) |
| **Category MoM trend** | Small multiples line chart | X: `Year-Month`, Y: `Total Revenue`, Small multiples: `category` |
| **Margin by Category** | Clustered bar | Y: `category`, X: `Gross Margin %` Sort descending |
| **Return Rate by Product** | Horizontal bar | Y: `product_name`, X: `Return Rate %` Highlight threshold with reference line at 2% |
| **Channel mix** | 100% stacked bar | X: `Year-Month`, Y: `Total Revenue`, Legend: `channel` |
| **Slicer — Category** | Slicer (multi-select) | Field: `category` |
| **Slicer — Channel** | Slicer (dropdown) | Field: `channel` |

---

### Page 3 — Regional Performance

**Rename page:** "Regional Performance"

| Visual | Type | Fields / Config |
|--------|------|-----------------|
| **Region revenue table** | Table | Columns: `region`, `region_manager`, `Total Revenue`, `Gross Margin %`, `Revenue YoY %` Add conditional formatting icons on YoY % |
| **Revenue by Region & Month** | Matrix | Rows: `region`, Columns: `Month Short`, Values: `Total Revenue` |
| **Region performance vs prior year** | Clustered column | X: `region`, Values: `Total Revenue`, `Revenue PY` |
| **Customer Segment breakdown** | Stacked bar | X: `region`, Y: `Total Revenue`, Legend: `customer_segment` |
| **YTD Revenue gauge** | Gauge | Value: `Revenue YTD`, Target: calculate manually or use `Revenue PY` as max |
| **Slicer — Region** | Slicer (multi-select) | Field: `region` |
| **Slicer — Year** | Slicer (tile) | Field: `Calendar[Year]` |

---

## Step 6 — Formatting & Theming

### Recommended Color Palette
```
Primary Blue:    #1565C0
Accent Teal:     #00ACC1
Positive Green:  #2E7D32
Negative Red:    #C62828
Neutral Gray:    #757575
Background:      #F5F7FA
Card Background: #FFFFFF
```

To apply a custom theme:
1. **View → Themes → Customize current theme**
2. Set the above colors for the Data colors sequence and sentinel values

### Conditional Formatting — MoM Card
1. Select the MoM % card → **Format visual → Callout value → fx**
2. Rules: value > 0 → Green (`#2E7D32`), value < 0 → Red (`#C62828`), else Gray

### Report-level background
1. **View → Canvas background** → Set color to `#F5F7FA`, transparency 0%

### Cross-report filtering
Enable **Edit Interactions** on each page to control which visuals filter others. Recommended:
- Slicers → filter ALL visuals
- Category bar → filter product table and trend line
- Region donut → filter all regional visuals

---

## Step 7 — Publish & Share

1. **File → Publish → Publish to Power BI**
2. Choose your workspace
3. In Power BI Service:
   - **Pin visuals** from each page to a unified Dashboard
   - Set **Scheduled Refresh** if connected to a live data source
   - Share via workspace or **Publish to Web** for external embedding

---

## Quick Reference — Key Columns

| Column | Type | Description |
|--------|------|-------------|
| `date` | Date | First day of the month |
| `period` | Text | "Jan 2024" label for display |
| `year` / `month` | Integer | Numeric year and month |
| `product_name` | Text | Product display name |
| `category` | Text | 8 categories (Snacks, Beverages, etc.) |
| `region` | Text | North / South / East / West / Central |
| `channel` | Text | Sales channel (Supermarket, Online, etc.) |
| `customer_segment` | Text | Buyer profile |
| `units_sold` | Integer | Gross units before returns |
| `returns` | Integer | Units returned |
| `net_units` | Integer | `units_sold - returns` |
| `gross_revenue` | Decimal | `units_sold × unit_price` |
| `cogs` | Decimal | `units_sold × unit_cost` |
| `gross_profit` | Decimal | `gross_revenue - cogs` |
| `net_revenue` | Decimal | `net_units × unit_price` |
| `gross_margin_pct` | Decimal | `(gross_profit / gross_revenue) × 100` |

---

## Common Issues & Fixes

**Slicers not cross-filtering**
→ Check Edit Interactions; ensure the slicer → visual arrow is set to "Filter" not "None"

**DATEADD / SAMEPERIODLASTYEAR returns blank**
→ Confirm the `Calendar` table is marked as a Date Table and the relationship to `Sales[date]` is active

**Month Name sorts alphabetically**
→ Select `Month Name` column in the Data view → Column Tools → Sort by Column → `Month Number`

**Totals in matrix look wrong**
→ Use `SUMX` instead of `SUM` for any calculated columns used as values; prefer explicit measures

**Revenue MoM % shows wrong values after filtering**
→ Replace `DATEADD` context with `CALCULATE([Total Revenue], PREVIOUSMONTH(Calendar[Date]))` for better filter context handling
