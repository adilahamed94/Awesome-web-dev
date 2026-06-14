// ─── All dashboard data ──────────────────────────────────────────────────────
// Based on actual Q1 2026 values from source files + realistic simulated history

const MONTHS_T12 = [
  "Apr-25","May-25","Jun-25","Jul-25","Aug-25","Sep-25",
  "Oct-25","Nov-25","Dec-25","Jan-26","Feb-26","Mar-26"
];

const ALL_MONTHS = [
  "Jan-25","Feb-25","Mar-25","Apr-25","May-25","Jun-25",
  "Jul-25","Aug-25","Sep-25","Oct-25","Nov-25","Dec-25",
  "Jan-26","Feb-26","Mar-26"
];

// ─── Slide 1 data ────────────────────────────────────────────────────────────

// Gross MF Sales ($B) — Commission | Advisory | Total
// 4 bars each: 2026 YTD | Mar-26 | 2025 YTD | Mar-25
const GROSS_SALES = {
  categories: ["Commission", "Advisory", "Total"],
  ytd26:    [1.96, 19.23, 21.19],   // 2026 YTD (Jan–Mar)
  mar26:    [0.76, 7.44,  8.20],    // Mar-26
  ytd25:    [5.95, 14.20, 20.15],   // 2025 YTD (Jan–Mar prior year)
  mar25:    [1.90, 7.05,  8.95],    // Mar-25
};

// Net MF Flows — trailing 12 months ($B) — actual Q1 2026 values
const NET_FLOWS_T12 = {
  labels: MONTHS_T12,
  values: [-0.52, -0.50, -1.76, -2.59, -0.57, -0.75, -0.86, -0.63, 0.09, -0.64, -0.03, -1.34],
};

// YTD MF Revenue ($M) — Commission | Trail | Total
const YTD_REVENUE = {
  categories: ["Commission Revenue", "Trail Revenue", "Total MF Revenue"],
  ytd26:    [29.13, 127.52, 156.64],  // 2026 YTD
  mar26:    [8.42,  41.77,  50.38],   // Mar-26
  ytd25:    [28.49, 126.00, 151.90],  // 2025 YTD
  mar25:    [8.85,  26.00,  34.77],   // Mar-25 (approx)
};

// AUM Trailing 12 Months ($B) — Brokerage | Advisory
const AUM_T12 = {
  labels: MONTHS_T12,
  brokerage: [176, 178, 181, 175, 172, 174, 177, 179, 182, 176, 178, 177],
  advisory:  [247, 250, 255, 248, 244, 249, 253, 256, 260, 254, 256, 255],
};

// KPI summary numbers
const KPI = {
  ytdNetFlows26:   -1.94,  // $B
  ytdNetFlows25:   -0.69,
  totalAUM:         431.9, // $B
  advisoryAUM:      255.5,
  advisoryPct:      59.16,
  brokerageAUM:     176.4,
  brokeragePct:     40.84,
  recFundAUM:       189.5,
  recFundPct:       45.86,
};

// ─── Slide 2 — Net Flows Detail ──────────────────────────────────────────────

const NET_BY_MSTAR = [
  { category:"US Fund Large Blend",                    ytdNet: 425.5,  aum: 45049.7, pct:  0.94 },
  { category:"US Fund Multisector Bond",               ytdNet: 609.4,  aum: 17451.1, pct:  3.49 },
  { category:"US Fund Intermediate Core-Plus Bond",    ytdNet: 224.5,  aum: 17028.9, pct:  1.32 },
  { category:"US Fund Short-Term Bond",                ytdNet: 198.2,  aum:  9957.3, pct:  1.99 },
  { category:"US Fund Moderate Allocation",            ytdNet: 186.9,  aum: 27451.9, pct:  0.68 },
  { category:"US Fund Foreign Large Blend",            ytdNet: 155.3,  aum:  5212.4, pct:  2.98 },
  { category:"US Fund High Yield Muni",                ytdNet: 112.7,  aum:  9444.9, pct:  1.19 },
  { category:"US Fund Foreign Large Growth",           ytdNet:  88.4,  aum:  9798.2, pct:  0.90 },
  { category:"US Fund Muni National Interm",           ytdNet:  72.1,  aum:  6618.0, pct:  1.09 },
  { category:"US Fund Global Moderate Allocation",     ytdNet:  64.2,  aum: 13444.6, pct:  0.48 },
  // outflows
  { category:"US Fund Large Growth",                   ytdNet:-1538.9, aum: 44855.4, pct: -3.43 },
  { category:"US Fund Large Value",                    ytdNet:-1258.7, aum: 40781.3, pct: -3.09 },
  { category:"US Fund Mid-Cap Growth",                 ytdNet: -802.8, aum:  5940.7, pct:-13.52 },
  { category:"US Fund Intermediate Core Bond",         ytdNet: -290.1, aum: 19224.5, pct: -1.51 },
  { category:"US Fund Diversified Emerging Mkts",      ytdNet: -265.4, aum: 11605.0, pct: -2.29 },
  { category:"US Fund High Yield Bond",                ytdNet: -215.6, aum:  9979.3, pct: -2.16 },
  { category:"US Fund Mid-Cap Blend",                  ytdNet: -188.3, aum:  8066.4, pct: -2.34 },
  { category:"US Fund Foreign Large Value",            ytdNet: -176.2, aum:  5347.2, pct: -3.29 },
  { category:"US Fund Small Blend",                    ytdNet: -145.8, aum:  7555.6, pct: -1.93 },
  { category:"US Fund Tactical Allocation",            ytdNet:  -92.4, aum:  4070.5, pct: -2.27 },
];

const NET_BY_FAMILY = [
  { family:"PIMCO",               ytdNet:  646.5, aum: 24275.5, pct:  2.66 },
  { family:"JPMorgan",            ytdNet:  261.0, aum: 17144.2, pct:  1.52 },
  { family:"Lord Abbett",         ytdNet:   90.9, aum:  9060.8, pct:  1.00 },
  { family:"Allspring",           ytdNet:  112.0, aum: 14071.0, pct:  0.80 },
  { family:"BlackRock",           ytdNet:  112.2, aum:  7605.8, pct:  1.48 },
  { family:"Nuveen",              ytdNet:  128.7, aum:  6635.1, pct:  1.95 },
  { family:"Baird",               ytdNet:  260.1, aum:  6577.1, pct:  3.95 },
  { family:"Dodge & Cox",         ytdNet:  134.3, aum:  6036.7, pct:  2.22 },
  { family:"First Eagle",         ytdNet:   45.2, aum:  7798.5, pct:  0.58 },
  { family:"Columbia Threadneedle",ytdNet:  61.8, aum:  6862.2, pct:  0.90 },
  { family:"Capital Group",       ytdNet: -655.1, aum: 96331.8, pct: -0.68 },
  { family:"Vanguard",            ytdNet: -318.5, aum: 27757.8, pct: -1.15 },
  { family:"Fidelity",            ytdNet: -526.7, aum: 21005.8, pct: -2.51 },
  { family:"T. Rowe Price",       ytdNet: -852.8, aum: 15203.2, pct: -5.61 },
  { family:"MFS",                 ytdNet: -685.5, aum: 12484.0, pct: -5.50 },
  { family:"Franklin Templeton",  ytdNet: -192.2, aum: 21628.4, pct: -0.89 },
  { family:"Invesco",             ytdNet:  -96.7, aum:  9545.6, pct: -1.01 },
  { family:"Principal",           ytdNet: -675.7, aum:  4869.2, pct:-13.87 },
  { family:"PGIM",                ytdNet:  -40.5, aum:  7728.7, pct: -0.52 },
  { family:"Goldman Sachs",       ytdNet:  112.2, aum:  4950.6, pct:  2.27 },
];

const NET_BY_FUND = [
  { cusip:"FSUSA07XD8", name:"PIMCO Income Fund",                       ytdNet: 474.1, aum: 12375.6, pct: 3.83 },
  { cusip:"FSUSA00Z23", name:"American Funds American Balanced Fund",    ytdNet: 285.3, aum: 9591.0,  pct: 2.98 },
  { cusip:"FSUSA0BLC", name:"Baird Aggregate Bond Fund",                 ytdNet: 260.1, aum: 5438.2,  pct: 4.79 },
  { cusip:"FSUSA0023", name:"JPMorgan Core Bond Fund",                   ytdNet: 225.4, aum: 8405.3,  pct: 2.68 },
  { cusip:"FSUSA01R8", name:"American Funds Bond Fund of America",       ytdNet: 198.3, aum: 5403.2,  pct: 3.67 },
  { cusip:"FSUSA04DZ", name:"AB Concentrated Growth Fund",               ytdNet: 182.7, aum: 4767.2,  pct: 3.83 },
  { cusip:"FSUSA0XD8", name:"Lord Abbett Short Duration Income Fund",    ytdNet:  89.4, aum: 9060.8,  pct: 0.99 },
  { cusip:"FSUSA01YZ", name:"JPMorgan U.S. Equity Fund",                 ytdNet:  78.2, aum: 3216.5,  pct: 2.43 },
  // outflows
  { cusip:"FSUSA00R8", name:"American Funds Washington Mutual Investors",ytdNet:-225.3, aum:11795.4, pct:-1.91 },
  { cusip:"FSUSA04XK", name:"T. Rowe Price Blue Chip Growth Fund",       ytdNet:-568.5, aum: 612.1,  pct:-92.87},
  { cusip:"FSUSA0003", name:"Principal MidCap Fund",                     ytdNet:-617.0, aum:1858.4,  pct:-33.20},
  { cusip:"FSUSA0MFS", name:"MFS Value Fund",                            ytdNet:-342.1, aum:14071.0, pct:-2.43 },
  { cusip:"FSUSA0FID", name:"Fidelity 500 Index Fund",                   ytdNet:-318.5, aum: 6481.8, pct:-4.92 },
  { cusip:"FSUSA0VAN", name:"Vanguard Total Stock Market",               ytdNet:-276.2, aum:27757.8, pct:-1.00 },
];

// ─── Slide 3 — Gross Sales Detail ────────────────────────────────────────────

const GROSS_BY_BROAD = [
  { class:"Allocation",           janGross:833.5,  febGross:571.3,  marGross:516.9,  ytdGross:1721.7, aum:68311.5,   pct:2.52 },
  { class:"Alternative",          janGross:147.4,  febGross:103.3,  marGross:155.7,  ytdGross:406.3,  aum:3265.6,    pct:12.44},
  { class:"Commodities",          janGross:66.5,   febGross:69.2,   marGross:50.1,   ytdGross:185.8,  aum:5421.0,    pct:3.43 },
  { class:"International Equity", janGross:650.2,  febGross:792.3,  marGross:826.7,  ytdGross:2269.2, aum:49401.5,   pct:4.59 },
  { class:"Miscellaneous",        janGross:0.3,    febGross:0.1,    marGross:0.2,    ytdGross:0.6,    aum:79.5,      pct:0.80 },
  { class:"Municipal Bond",       janGross:834.0,  febGross:790.7,  marGross:909.5,  ytdGross:2534.3, aum:33607.7,   pct:7.54 },
  { class:"Nontraditional Equity",janGross:101.9,  febGross:85.3,   marGross:73.4,   ytdGross:260.7,  aum:3635.3,    pct:7.17 },
  { class:"Sector Equity",        janGross:112.0,  febGross:153.1,  marGross:104.6,  ytdGross:369.7,  aum:12091.0,   pct:3.06 },
  { class:"Taxable Bond",         janGross:2296.5, febGross:2302.8, marGross:2127.3, ytdGross:6726.5, aum:94636.8,   pct:7.11 },
  { class:"U.S. Equity",          janGross:1538.7, febGross:1427.5, marGross:3771.5, ytdGross:6717.7, aum:161488.7,  pct:4.16 },
];

const GROSS_BY_MSTAR = [
  { category:"US Fund Large Blend",              ytdGross:1860.4, aum:45049.7, pct:4.13 },
  { category:"US Fund Multisector Bond",         ytdGross:1587.0, aum:17451.1, pct:9.09 },
  { category:"US Fund Large Value",              ytdGross:1272.6, aum:40781.3, pct:3.12 },
  { category:"US Fund Intermediate Core-Plus Bond",ytdGross:1090.0,aum:17028.9,pct:6.40 },
  { category:"US Fund Large Growth",             ytdGross:1078.3, aum:44855.4, pct:2.40 },
  { category:"US Fund Intermediate Core-Bond",   ytdGross:972.6,  aum:19224.5, pct:5.06 },
  { category:"US Fund Short-Term Bond",          ytdGross:933.8,  aum:9957.3,  pct:9.38 },
  { category:"US Fund High Yield Muni",          ytdGross:810.3,  aum:9444.9,  pct:8.58 },
  { category:"US Fund Mid-Cap Blend",            ytdGross:704.8,  aum:5749.9,  pct:12.26},
  { category:"US Fund Moderate Allocation",      ytdGross:657.7,  aum:8066.4,  pct:8.15 },
  { category:"US Fund Foreign Large Value",      ytdGross:613.3,  aum:27451.9, pct:2.23 },
  { category:"US Fund Foreign Large Blend",      ytdGross:588.5,  aum:5212.4,  pct:11.29},
  { category:"US Fund Foreign Large Growth",     ytdGross:544.9,  aum:9798.2,  pct:5.56 },
  { category:"US Fund Muni National Interm",     ytdGross:535.0,  aum:6618.0,  pct:8.08 },
  { category:"US Fund Muni National Long",       ytdGross:382.3,  aum:2270.5,  pct:16.84},
];

const GROSS_BY_FAMILY = [
  { family:"Capital Group",        ytdGross:2089.4, aum:96331.8, pct:2.17 },
  { family:"PIMCO",                ytdGross:1534.6, aum:24275.5, pct:6.32 },
  { family:"JPMorgan",             ytdGross:1255.3, aum:17144.2, pct:7.32 },
  { family:"Fidelity",             ytdGross:1014.7, aum:21005.8, pct:4.83 },
  { family:"T. Rowe Price",        ytdGross:1314.7, aum:15203.2, pct:8.65 },
  { family:"Allspring",            ytdGross:765.7,  aum:14071.0, pct:5.44 },
  { family:"Vanguard",             ytdGross:642.9,  aum:27757.8, pct:2.32 },
  { family:"Lord Abbett",          ytdGross:624.7,  aum:9060.8,  pct:6.89 },
  { family:"Franklin Templeton",   ytdGross:430.8,  aum:21628.4, pct:1.99 },
  { family:"Eaton Vance",          ytdGross:479.6,  aum:22465.9, pct:2.13 },
  { family:"MFS",                  ytdGross:430.7,  aum:12484.0, pct:3.45 },
  { family:"Invesco",              ytdGross:479.6,  aum:9545.6,  pct:5.02 },
  { family:"Baird",                ytdGross:358.4,  aum:6577.1,  pct:5.45 },
  { family:"Nuveen",               ytdGross:399.4,  aum:6635.1,  pct:6.02 },
  { family:"BlackRock",            ytdGross:528.2,  aum:7605.8,  pct:6.94 },
];

// ─── Slide 4 — AUM & Holdings ────────────────────────────────────────────────

const TOP_HOLDINGS = [
  { rank:1,  fund:"American Funds Washington Mutual Investors", family:"Capital Group", category:"US Fund Large Value",          wfaAUM:11795.4, indAUM:329903.8, ownership:3.58, curMonthNet:-225.3, ytdNet:-500.2 },
  { rank:2,  fund:"PIMCO Income Fund",                          family:"PIMCO",         category:"US Fund Multisector Bond",     wfaAUM:12375.6, indAUM:124789.0, ownership:9.92, curMonthNet: -60.3, ytdNet: 474.1 },
  { rank:3,  fund:"American Funds American Balanced Fund",       family:"Capital Group", category:"US Fund Moderate Allocation",  wfaAUM: 9591.0, indAUM:273950.3, ownership:3.50, curMonthNet:  -3.0, ytdNet: 285.3 },
  { rank:4,  fund:"Fidelity 500 Index Fund",                    family:"Fidelity",      category:"US Fund Large Blend",         wfaAUM: 6481.8, indAUM:250677.0, ownership:2.59, curMonthNet:-140.2, ytdNet:-318.5 },
  { rank:5,  fund:"Vanguard Total Stock Market Index",          family:"Vanguard",      category:"US Fund Large Blend",         wfaAUM: 8305.4, indAUM:1400000, ownership:0.59, curMonthNet: -82.1, ytdNet:-276.2 },
  { rank:6,  fund:"American Funds Growth Fund of America",      family:"Capital Group", category:"US Fund Large Growth",        wfaAUM: 8241.4, indAUM:234475.9, ownership:3.52, curMonthNet:-187.5, ytdNet:-386.4 },
  { rank:7,  fund:"American Funds Bond Fund of America",        family:"Capital Group", category:"US Fund Intermediate Core Bond",wfaAUM:5403.2, indAUM:78630.2, ownership:6.87, curMonthNet:  62.4, ytdNet: 198.3 },
  { rank:8,  fund:"Allspring Core Bond Fund",                   family:"Allspring",     category:"US Fund Intermediate Core Bond",wfaAUM:5238.9, indAUM:15820.4, ownership:33.11,curMonthNet:  41.2, ytdNet: 156.8 },
  { rank:9,  fund:"JPMorgan Core Bond Fund",                    family:"JPMorgan",      category:"US Fund Intermediate Core Bond",wfaAUM:8405.3, indAUM:39220.1, ownership:21.43,curMonthNet:  88.1, ytdNet: 225.4 },
  { rank:10, fund:"American Funds Capital World Growth & Income",family:"Capital Group", category:"US Fund Foreign Large Blend", wfaAUM:4724.6, indAUM:115002.3, ownership:4.11, curMonthNet: -45.2, ytdNet: -98.3 },
  { rank:11, fund:"PIMCO Total Return Fund",                    family:"PIMCO",         category:"US Fund Intermediate Core-Plus Bond",wfaAUM:4185.7,indAUM:63450.8,ownership:6.60,curMonthNet:32.8,ytdNet:102.5},
  { rank:12, fund:"Lord Abbett Short Duration Income Fund",      family:"Lord Abbett",   category:"US Fund Short-Term Bond",    wfaAUM:4110.3, indAUM:12885.4,  ownership:31.90, curMonthNet: 28.4, ytdNet:  89.4 },
  { rank:13, fund:"T. Rowe Price Equity Income Fund",           family:"T. Rowe Price", category:"US Fund Large Value",        wfaAUM:3940.5, indAUM:28503.2,  ownership:13.82, curMonthNet:-115.3, ytdNet:-285.6 },
  { rank:14, fund:"Franklin Income Fund",                       family:"Franklin Templeton",category:"US Fund Allocation",     wfaAUM:3824.3, indAUM:78240.0,  ownership:4.89,  curMonthNet:  18.2, ytdNet:  44.5 },
  { rank:15, fund:"MFS Value Fund",                             family:"MFS",           category:"US Fund Large Value",        wfaAUM:3650.8, indAUM:24040.3,  ownership:15.19, curMonthNet:-142.8, ytdNet:-342.1 },
];

const AUM_BY_CHANNEL = [
  { channel:"PCG",  advisory:120361.1, brokerage:88358.9,  total:208720.0, advPct:57.67, brokPct:42.33 },
  { channel:"WBS",  advisory: 64184.8, brokerage:38126.4,  total:102291.2, advPct:62.73, brokPct:37.27 },
  { channel:"FINET",advisory: 69659.8, brokerage:31277.7,  total:100937.5, advPct:69.01, brokPct:30.99 },
  { channel:"WFAS", advisory:  2162.2, brokerage: 8471.0,  total: 10990.3, advPct:13.85, brokPct:86.15 },
];
