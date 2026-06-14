# Power BI Step-by-Step Build Guide
## Mutual Fund Product Dashboard – Q1 2026

Follow these steps in order. Each step tells you exactly what to click.
Screenshots you should see at each stage are described in [brackets].

---

## PHASE 1 — Load the Data (30 min)

### Step 1 — Open Power BI Desktop
- Launch **Power BI Desktop** (download free at powerbi.microsoft.com if needed)
- Click **"Blank report"**

---

### Step 2 — Load the Flow File (MF_SLS_FLOW)

1. Click **Home → Get Data → Text/CSV**
2. Navigate to your `MF_SLS_FLOW_YYYY-MM-DD.xlsx` file → click **Open**
3. Power BI shows a preview. Click **Transform Data** (NOT Load)
   - [You should see Power Query Editor open with a table of rows]

4. In Power Query Editor, rename this query:
   - Right-click the query name in the left panel → **Rename** → type `Fact_Flows`

5. Fix column types — click **Home → Transform → Detect Data Types**, then manually fix:
   - Click the `EOM_DT` column header → **Transform → Data Type → Date**
   - Click `GROSS_AMOUNT` → **Data Type → Decimal Number**
   - Click `NET_AMOUNT` → **Data Type → Decimal Number**
   - Click `TRD_CNT` → **Data Type → Whole Number**

6. Add a Gross Sales column:
   - Click **Add Column → Custom Column**
   - Name: `Gross_Sales`
   - Formula: `= if [TRADE_SIDE] = "P" then [GROSS_AMOUNT] else 0`
   - Click **OK**

7. Do NOT close Power Query yet — continue to Step 3

---

### Step 3 — Load the AUM File (MF_SLS_POS)

1. In Power Query Editor: **Home → New Source → Text/CSV**
2. Load your `MF_SLS_POS_YYYY-MM-DD.xlsx` file
3. Rename the query: `Fact_AUM`
4. Fix types:
   - `EOM_DT` → Date
   - `POS_MKT_VAL` → Decimal Number
   - `POSITION_COUNT` → Whole Number

---

### Step 4 — Load the Morningstar File

1. **Home → New Source → Text/CSV**
2. Load `Morningstar_monthly_extended_sample.csv` (or your real Morningstar file)
3. Rename query: `Dim_Fund`
4. Fix types:
   - `Net_Assets_M` → Decimal Number
   - `Management_Fee`, `Prospectus_12b1`, `Shareholder_Fee` → Decimal Number
   - `Inception_Date` → Date

---

### Step 5 — Load the Revenue File

1. **Home → New Source → Text/CSV**
2. Load `Revenue_Trails_Commissions_sample.csv`
3. Rename: `Fact_Revenue`
4. Fix types: `Commission_Revenue`, `Trail_Revenue`, `Total_Revenue` → Decimal Number
5. `Month_End_Date` → Date

---

### Step 6 — Load the AUM Summary File

1. **Home → New Source → Text/CSV**
2. Load `AUM_Summary_sample.csv`
3. Rename: `Fact_AUM_Summary`
4. Fix all AUM columns → Decimal Number; `Month_End_Date` → Date

---

### Step 7 — Merge Morningstar into Fact_Flows (replaces VLOOKUP)

1. Click the `Fact_Flows` query in the left panel
2. Click **Home → Merge Queries → Merge Queries**
3. In the dialog:
   - Top table: `Fact_Flows` — click the **CUSIP** column to select it (turns green)
   - Bottom dropdown: select `Dim_Fund`
   - Click the **CUSIP** column in the bottom table
   - Join Kind: **Left Outer** (default) ✓
   - Click **OK**
4. A new `Dim_Fund` column appears at the right. Click the **expand icon** (⊞)
5. Check only these columns: `Is_SMA_or_529`, `Is_Master_List_Fund`, `Allowable_List`, `Broad_Category`, `US_Category_Group`, `Net_Assets_M`
6. Uncheck "Use original column name as prefix" → click **OK**
   - [You should now see those 6 columns appended to the right of Fact_Flows]

---

### Step 8 — Close & Apply

1. Click **Home → Close & Apply**
2. [Power BI loads all tables. The loading spinner runs for 30–60 seconds]
3. [You should see all 5 tables in the Fields panel on the right]

---

## PHASE 2 — Build the Data Model (15 min)

### Step 9 — Open Model View

1. Click the **Model** icon on the left sidebar (looks like a diagram with 3 boxes)
2. [You see all tables floating. They are NOT connected yet]

---

### Step 10 — Create the Calendar Table

1. Click **Home → New Table**
2. Paste this formula exactly:
```
Calendar = 
ADDCOLUMNS(
    CALENDAR(DATE(2024,1,1), DATE(2027,12,31)),
    "Year",         YEAR([Date]),
    "Month Number", MONTH([Date]),
    "Month Name",   FORMAT([Date],"MMMM"),
    "Month Short",  FORMAT([Date],"MMM-yy"),
    "Quarter",      "Q" & FORMAT(ROUNDUP(MONTH([Date])/3,0),"0"),
    "Sort Key",     YEAR([Date])*100 + MONTH([Date])
)
```
3. Press **Enter** (or click the checkmark)
4. In the **Fields** panel: click `Calendar` → click `Month Short` column
5. In the ribbon: **Column Tools → Sort by Column → Sort Key**
   - [This fixes alphabetical month sorting]
6. Repeat for `Month Name` → Sort by → `Month Number`
7. Right-click the `Calendar` table → **Mark as Date Table** → select `Date` → **OK**

---

### Step 11 — Create Relationships

Drag and drop to create these connections in Model view:

| From | Column | To | Column |
|------|--------|-----|--------|
| Fact_Flows | EOM_DT | Calendar | Date |
| Fact_Flows | CUSIP | Dim_Fund | CUSIP |
| Fact_AUM | EOM_DT | Calendar | Date |
| Fact_Revenue | Month_End_Date | Calendar | Date |
| Fact_AUM_Summary | Month_End_Date | Calendar | Date |

**How to drag:** In Model view, click and hold the column name in one table, drag it to the matching column in the other table, then release.

[Each connection appears as a line with a 1 on the dimension side and * on the fact side]

---

### Step 12 — Create a Measures Table

1. Click **Home → Enter Data**
2. Just type the word `Measures` in the Name field at the bottom
3. Click **Load**
4. In Model view, hide the dummy column: right-click the `Column1` column → **Hide**

---

## PHASE 3 — Add DAX Measures (20 min)

Click the `Measures` table in the Fields panel before adding each measure.
**Home → New Measure**, paste the DAX, press Enter.

### Gross Sales Measures

```dax
Gross Sales = 
CALCULATE(
    SUMX(Fact_Flows, IF(Fact_Flows[TRADE_SIDE]="P", Fact_Flows[GROSS_AMOUNT], 0)),
    Fact_Flows[Is_it_a_MF]="Y",
    Fact_Flows[CHANNEL]<>"FCCS",
    Fact_Flows[EXCHANGE_IND]="N"
)
```

```dax
Gross Sales Advisory = 
CALCULATE([Gross Sales], Fact_Flows[ACCT_TYP]="ADVISORY")
```

```dax
Gross Sales Brokerage = 
CALCULATE([Gross Sales], Fact_Flows[ACCT_TYP]="BROKERAGE")
```

```dax
YTD Gross Sales = 
TOTALYTD([Gross Sales], Calendar[Date])
```

```dax
PY YTD Gross Sales = 
CALCULATE([YTD Gross Sales], SAMEPERIODLASTYEAR(Calendar[Date]))
```

```dax
Current Month Gross = 
CALCULATE([Gross Sales],
    Calendar[Month Number] = MONTH(TODAY()),
    Calendar[Year] = YEAR(TODAY())
)
```

```dax
PY Same Month Gross = 
CALCULATE([Gross Sales], SAMEPERIODLASTYEAR(Calendar[Date]))
```

### Net Flow Measures

```dax
Net Flows = 
CALCULATE(
    SUM(Fact_Flows[NET_AMOUNT]),
    Fact_Flows[Is_it_a_MF]="Y",
    Fact_Flows[CHANNEL]<>"FCCS"
)
```

```dax
Net Flows ex Exchanges = 
CALCULATE(
    SUM(Fact_Flows[NET_AMOUNT]),
    Fact_Flows[Is_it_a_MF]="Y",
    Fact_Flows[CHANNEL]<>"FCCS",
    Fact_Flows[EXCHANGE_IND]="N"
)
```

```dax
YTD Net Flows = TOTALYTD([Net Flows], Calendar[Date])
```

```dax
PY YTD Net Flows = 
CALCULATE([YTD Net Flows], SAMEPERIODLASTYEAR(Calendar[Date]))
```

```dax
T12M Net Flows = 
CALCULATE(
    [Net Flows],
    DATESINPERIOD(Calendar[Date], LASTDATE(Calendar[Date]), -12, MONTH)
)
```

### AUM Measures

```dax
Total AUM = SUM(Fact_AUM[POS_MKT_VAL])
```

```dax
Advisory AUM = CALCULATE([Total AUM], Fact_AUM[ACCT_TYP]="ADVISORY")
```

```dax
Brokerage AUM = CALCULATE([Total AUM], Fact_AUM[ACCT_TYP]="BROKERAGE")
```

```dax
Advisory AUM % = DIVIDE([Advisory AUM], [Total AUM])
```

```dax
PCG AUM   = CALCULATE([Total AUM], Fact_AUM[CHANNEL]="PCG")
WBS AUM   = CALCULATE([Total AUM], Fact_AUM[CHANNEL]="WBS")
FINET AUM = CALCULATE([Total AUM], Fact_AUM[CHANNEL]="FINET")
WFAS AUM  = CALCULATE([Total AUM], Fact_AUM[CHANNEL]="WFAS")
```

```dax
Sales AUM Ratio = DIVIDE([YTD Gross Sales], [Total AUM])
```

### Revenue Measures

```dax
YTD Commission Revenue = 
TOTALYTD(SUM(Fact_Revenue[Commission_Revenue]), Calendar[Date])
```

```dax
YTD Trail Revenue = 
TOTALYTD(SUM(Fact_Revenue[Trail_Revenue]), Calendar[Date])
```

```dax
YTD Total Revenue = 
TOTALYTD(SUM(Fact_Revenue[Total_Revenue]), Calendar[Date])
```

```dax
PY YTD Total Revenue = 
CALCULATE([YTD Total Revenue], SAMEPERIODLASTYEAR(Calendar[Date]))
```

### Ranking Measures

```dax
Category Net Rank = 
RANKX(ALLSELECTED(Dim_Fund[Mstar_Cat]), [Net Flows],, DESC, DENSE)
```

```dax
Family Net Rank = 
RANKX(ALLSELECTED(Dim_Fund[Branding_Name]), [Net Flows],, DESC, DENSE)
```

---

## PHASE 4 — Build the Report Pages (30 min)

### Step 13 — Rename Page 1

- Right-click the tab at the bottom → **Rename** → `Executive Overview`

---

### Step 14 — Add KPI Cards (Page 1)

1. In **Visualizations** panel: click the **Card** icon
2. Drag `YTD Net Flows` measure into the **Fields** well
3. Click the card → **Format visual → Callout value → Display units → Billions**
4. Title: type "YTD Net Flows"
5. Repeat to create 3 more cards: `Total AUM`, `Advisory AUM`, `YTD Gross Sales`
6. Arrange them in a row at the top of the canvas

---

### Step 15 — Gross MF Sales Bar Chart

1. Click **Clustered bar chart** in Visualizations
2. Drag to the canvas (upper left)
3. Set fields:
   - **X-axis**: drag `Gross Sales Advisory`, `Gross Sales Brokerage`, `YTD Gross Sales`
   - **Y-axis / Legend**: `ACCT_TYP` from Fact_Flows
   - Actually — better approach: use **Values** with 4 measures and **Axis** as the categories
4. Simpler setup:
   - X-axis (categories): create a new table called `Sales_Categories` with rows: Commission, Advisory, Total
   - Or: use 4 individual measures as the series and put Category as the X-axis

> **Tip:** The exact 4-bar-per-category pattern from your PPT is easiest to build as follows:
> 1. Use a **Clustered column chart**
> 2. X-axis: `Fact_Flows[ACCT_TYP]` (shows Commission/Advisory)
> 3. Values: drag in `YTD Gross Sales` (red), `Current Month Gross` (blue), `PY YTD Gross Sales` (gold), `PY Same Month Gross` (orange)
> 4. Format → Data colors → set each series to the correct color

---

### Step 16 — Net MF Flows Line Chart (trailing 12 months)

1. Click **Line chart** in Visualizations
2. X-axis: `Calendar[Month Short]`
3. Y-axis: `Net Flows ex Exchanges`
4. Apply a **visual-level filter**: Date is in the last 12 months
   - Filters pane → drag `Calendar[Date]` → Filter type: **Relative date** → Last 12 months ✓
5. Format → Data colors → Line color: Red (#C41E3A)
6. Turn on **Data labels** for the line
7. Title: `"Net MF Flows (YTD " & FORMAT([YTD Net Flows]/1000000000,"$#,##0.0B") & " vs PY " & FORMAT([PY YTD Net Flows]/1000000000,"$#,##0.0B") & ")"`

---

### Step 17 — YTD MF Revenue Bar Chart

1. Click **Clustered column chart**
2. X-axis: create a What-if / disconnected table with rows: Commission Revenue, Trail Revenue, Total Revenue
   - Or: just add 4 individual measure cards side by side and label them manually
3. Values: `YTD Commission Revenue`, `YTD Trail Revenue`, `YTD Total Revenue`
4. Use the same 4-color pattern (red, blue, gold, orange) for 2026 YTD / Mar-26 / 2025 YTD / Mar-25

---

### Step 18 — MF AUM Stacked Bar (trailing 12 months)

1. Click **Stacked column chart**
2. X-axis: `Calendar[Month Short]`
3. Values: `Brokerage AUM` (red) and `Advisory AUM` (blue) — stacked
4. Apply relative date filter: Last 12 months
5. Data colors: Brokerage = #C41E3A, Advisory = #1565C0

---

### Step 19 — Add Page 2 (Net Flows Detail)

1. Right-click the page tab → **New page** → rename to `Net Flows Detail`

2. Add a **Table visual** for Morningstar Category Inflows:
   - Rows: `Dim_Fund[Mstar_Cat]`
   - Values: `YTD Net Flows`, `Total AUM`, `Sales AUM Ratio`
   - Sort: click `YTD Net Flows` column header → descending
   - Visual-level filter: `Net Flows > 0`

3. Duplicate the table for Outflows:
   - Ctrl+D to duplicate → change filter to `Net Flows < 0` → sort ascending

4. Repeat for Fund Family tables: replace rows with `Dim_Fund[Branding_Name]`

5. Repeat for Individual Fund tables: replace rows with `Fact_Flows[MF_NM]`

6. Add slicers:
   - Channel slicer: `Fact_Flows[CHANNEL]` → Slicer → Style: Dropdown
   - Year slicer: `Calendar[Year]` → Slicer → Style: Tile

---

### Step 20 — Add Page 3 (Gross Sales Detail)

1. New page → rename `Gross Sales Detail`

2. Add **Table** for Morningstar Category Gross:
   - Rows: `Dim_Fund[Mstar_Cat]`
   - Values: `YTD Gross Sales`, `Total AUM`, `Sales AUM Ratio`
   - Sort by YTD Gross Sales descending

3. Add **Matrix** for Broad Category:
   - Rows: `Dim_Fund[Broad_Category]` (or `Dim_Fund[US_Category_Group]`)
   - Values: `YTD Gross Sales`, measure for Jan gross, Feb gross, Mar gross, `Sales AUM Ratio`

4. Add footnote text box: Insert → Text box → type:
   `"All data excludes 529s and SMA share classes. This tab includes exchanges."`
   Set font size 10, color gray

---

### Step 21 — Add Page 4 (AUM & Holdings)

1. New page → rename `AUM & Holdings`

2. Add 4 **KPI cards**: `Total AUM`, `Advisory AUM`, `Advisory AUM %`, `Brokerage AUM`

3. Add a **Table** for Top Holdings:
   - Rows: `Fact_AUM[MF_NM]` (or create relationship to get holdings from AUM file)
   - Values: `Total AUM` (= WFA AUM), `Sales AUM Ratio`
   - Sort by `Total AUM` descending
   - Add `Fact_AUM[CHANNEL]` as a filter

4. Add **4 channel cards** or a **Matrix**:
   - Rows: `Fact_AUM[CHANNEL]`
   - Values: `Advisory AUM`, `Brokerage AUM`, `Advisory AUM %`

---

## PHASE 5 — Format & Theme (10 min)

### Step 22 — Apply Color Theme

1. **View → Themes → Customize current theme**
2. Set these colors:
   - Color 1: #C41E3A (Red — 2026 YTD, Brokerage, negative values)
   - Color 2: #1565C0 (Blue — Current month, Advisory)
   - Color 3: #E6A817 (Gold — 2025 YTD)
   - Color 4: #E07320 (Orange — Prior year month)
   - Color 5: #2E7D32 (Green — positive values)
3. Click **Apply**

### Step 23 — Dynamic Page Title

1. Add a **Text box** at the top of each page
2. Click the text box → **Format → Title → fx (conditional formatting)**
3. Paste: `"Mutual Fund Product Dashboard – Q1 2026"`
4. Or use a Card with this measure:
```dax
Report Title = 
"Mutual Fund Product Dashboard – " & FORMAT(LASTDATE(Calendar[Date]),"QQ YYYY")
```

---

## PHASE 6 — Publish (5 min)

### Step 24 — Save & Publish

1. **File → Save** → name it `MF_Dashboard_2026-Q1.pbix`
2. **Home → Publish → Select workspace** → click **Select**
3. [Upload takes 30–60 seconds. A link appears when done]
4. Click the link to open in Power BI Service (browser)

### Step 25 — Schedule Refresh

In Power BI Service:
1. Go to your workspace → find the dataset `MF_Dashboard_2026-Q1`
2. Click **⋮ → Settings → Scheduled refresh**
3. Toggle **On** → set time: 7:00 AM daily
4. Click **Apply**

---

## Troubleshooting Checklist

| Problem | Fix |
|---------|-----|
| Month names sort A-Z | Model view → select Month Short column → Sort by Column → Sort Key |
| YTD measure returns blank | Mark Calendar as Date Table (right-click → Mark as Date Table) |
| Merge returns all nulls | Check CUSIP has same format in both tables — trim spaces in Power Query |
| Charts show future dates | Add visual-level filter: Date ≤ TODAY() |
| FCCS appears in charts | All DAX measures already exclude FCCS; also add slicer filter on CHANNEL |
| Revenue chart doubles | Check Fact_Revenue has one row per month — no duplicates in EOM_DT |
| Advisory ≠ Advisory+Brokerage | Verify ACCT_TYP values match exactly: "ADVISORY" not "Advisory" (case sensitive) |
