// ─── Table builders ───────────────────────────────────────────────────────────

function fmt$M(v)  { return (v >= 0 ? "" : "") + "$" + Math.abs(v).toLocaleString("en-US", {minimumFractionDigits:1,maximumFractionDigits:1}) + "M"; }
function fmt$B(v)  { return "$" + Math.abs(v).toLocaleString("en-US", {minimumFractionDigits:1,maximumFractionDigits:1}) + "B"; }
function fmtPct(v) { return (v >= 0 ? "+" : "") + v.toFixed(2) + "%"; }
function valClass(v) { return v >= 0 ? "val-pos" : "val-neg"; }

// Net flows tables (Slide 2) ─────────────────────────────────────────────────

function buildNetMstarTable() {
  const sorted = [...NET_BY_MSTAR].sort((a,b) => b.ytdNet - a.ytdNet);
  const inflows  = sorted.filter(r => r.ytdNet > 0).slice(0,8);
  const outflows = sorted.filter(r => r.ytdNet < 0).sort((a,b) => a.ytdNet - b.ytdNet).slice(0,8);

  document.getElementById("tblNetMstarIn").innerHTML  = netRows(inflows, "aum");
  document.getElementById("tblNetMstarOut").innerHTML = netRows(outflows, "aum");
}

function buildNetFamilyTable() {
  const sorted = [...NET_BY_FAMILY].sort((a,b) => b.ytdNet - a.ytdNet);
  const inflows  = sorted.filter(r => r.ytdNet > 0).slice(0,8);
  const outflows = sorted.filter(r => r.ytdNet < 0).sort((a,b) => a.ytdNet - b.ytdNet).slice(0,8);

  document.getElementById("tblNetFamIn").innerHTML  = netRows(inflows, "aum", "family");
  document.getElementById("tblNetFamOut").innerHTML = netRows(outflows, "aum", "family");
}

function buildNetFundTable() {
  const inflows  = [...NET_BY_FUND].filter(r=>r.ytdNet>0).sort((a,b)=>b.ytdNet-a.ytdNet).slice(0,6);
  const outflows = [...NET_BY_FUND].filter(r=>r.ytdNet<0).sort((a,b)=>a.ytdNet-b.ytdNet).slice(0,6);

  document.getElementById("tblNetFundIn").innerHTML  = netRows(inflows,  "aum", "fund");
  document.getElementById("tblNetFundOut").innerHTML = netRows(outflows, "aum", "fund");
}

function netRows(rows, aumKey, nameKey="category") {
  const maxAbs = Math.max(...rows.map(r => Math.abs(r.ytdNet)));
  return rows.map((r,i) => {
    const name = r[nameKey] || r.category || r.family || r.name || "";
    const barW = (Math.abs(r.ytdNet)/maxAbs*100).toFixed(1);
    const barColor = r.ytdNet >= 0 ? "#2E7D32" : "#C41E3A";
    const aum = r.aum >= 1000 ? fmt$B(r.aum/1000) : fmt$M(r.aum);
    return `<tr>
      <td class="rank">${i+1}</td>
      <td class="name">${name}</td>
      <td class="right bar-cell">
        <div class="bar-bg" style="width:${barW}%;background:${barColor}"></div>
        <span class="${valClass(r.ytdNet)}">${fmt$M(r.ytdNet)}</span>
      </td>
      <td class="right">${aum}</td>
      <td class="right ${valClass(r.pct)}">${fmtPct(r.pct)}</td>
    </tr>`;
  }).join("");
}

// Gross sales tables (Slide 3) ───────────────────────────────────────────────

function buildGrossMstarTable() {
  const rows = [...GROSS_BY_MSTAR].sort((a,b) => b.ytdGross-a.ytdGross);
  const maxG = Math.max(...rows.map(r=>r.ytdGross));
  document.getElementById("tblGrossMstar").innerHTML = rows.map((r,i) => {
    const barW = (r.ytdGross/maxG*100).toFixed(1);
    const aum = r.aum >= 1000 ? fmt$B(r.aum/1000) : fmt$M(r.aum);
    return `<tr>
      <td class="rank">${i+1}</td>
      <td class="name">${r.category}</td>
      <td class="right bar-cell">
        <div class="bar-bg" style="width:${barW}%;background:#1565C0"></div>
        <span>${fmt$M(r.ytdGross)}</span>
      </td>
      <td class="right">${aum}</td>
      <td class="right">${r.pct.toFixed(2)}%</td>
    </tr>`;
  }).join("");
}

function buildGrossFamilyTable() {
  const rows = [...GROSS_BY_FAMILY].sort((a,b) => b.ytdGross-a.ytdGross);
  const maxG = Math.max(...rows.map(r=>r.ytdGross));
  document.getElementById("tblGrossFamily").innerHTML = rows.map((r,i) => {
    const barW = (r.ytdGross/maxG*100).toFixed(1);
    const aum = r.aum >= 1000 ? fmt$B(r.aum/1000) : fmt$M(r.aum);
    return `<tr>
      <td class="rank">${i+1}</td>
      <td class="name">${r.family}</td>
      <td class="right bar-cell">
        <div class="bar-bg" style="width:${barW}%;background:#1565C0"></div>
        <span>${fmt$M(r.ytdGross)}</span>
      </td>
      <td class="right">${aum}</td>
      <td class="right">${r.pct.toFixed(2)}%</td>
    </tr>`;
  }).join("");
}

function buildBroadCategoryTable() {
  document.getElementById("tblBroadCat").innerHTML = GROSS_BY_BROAD.map(r => {
    const aum = r.aum >= 1000 ? fmt$B(r.aum/1000) : fmt$M(r.aum);
    return `<tr>
      <td class="name">${r.class}</td>
      <td class="right">${fmt$M(r.janGross)}</td>
      <td class="right">${fmt$M(r.febGross)}</td>
      <td class="right">${fmt$M(r.marGross)}</td>
      <td class="right" style="font-weight:700">${fmt$M(r.ytdGross)}</td>
      <td class="right">${aum}</td>
      <td class="right">${r.pct.toFixed(2)}%</td>
    </tr>`;
  }).join("");

  // Total row
  const tot = GROSS_BY_BROAD.reduce((acc,r)=>({
    janGross:acc.janGross+r.janGross,
    febGross:acc.febGross+r.febGross,
    marGross:acc.marGross+r.marGross,
    ytdGross:acc.ytdGross+r.ytdGross,
    aum:acc.aum+r.aum,
  }),{janGross:0,febGross:0,marGross:0,ytdGross:0,aum:0});
  const pctTot = (tot.ytdGross/tot.aum*1000*100).toFixed(2);
  document.getElementById("tblBroadCatTotal").innerHTML = `
    <tr style="font-weight:700;background:#f8f9fb">
      <td>Total</td>
      <td class="right">${fmt$M(tot.janGross)}</td>
      <td class="right">${fmt$M(tot.febGross)}</td>
      <td class="right">${fmt$M(tot.marGross)}</td>
      <td class="right">${fmt$M(tot.ytdGross)}</td>
      <td class="right">${fmt$B(tot.aum/1000)}</td>
      <td class="right">${pctTot}%</td>
    </tr>`;
}

// Top Holdings table (Slide 4) ────────────────────────────────────────────────

function buildTopHoldingsTable() {
  document.getElementById("tblTopHoldings").innerHTML = TOP_HOLDINGS.map(r => {
    const curColor = valClass(r.curMonthNet);
    const ytdColor = valClass(r.ytdNet);
    return `<tr>
      <td class="rank">${r.rank}</td>
      <td class="name" style="max-width:220px">${r.fund}</td>
      <td>${r.family}</td>
      <td style="max-width:160px;font-size:11px;color:var(--subtext)">${r.category}</td>
      <td class="right">${fmt$B(r.wfaAUM/1000)}</td>
      <td class="right">${fmt$B(r.indAUM/1000)}</td>
      <td class="right">${r.ownership.toFixed(2)}%</td>
      <td class="right ${curColor}">${fmt$M(r.curMonthNet)}</td>
      <td class="right ${ytdColor}">${fmt$M(r.ytdNet)}</td>
    </tr>`;
  }).join("");
}

function buildChannelCards() {
  const el = document.getElementById("channelCards");
  el.innerHTML = AUM_BY_CHANNEL.map(r => `
    <div class="channel-card">
      <div class="channel-name">${r.channel}</div>
      <div class="channel-row">
        <span class="channel-label">Total AUM</span>
        <span class="channel-val">$${(r.total/1000).toFixed(1)}B</span>
      </div>
      <div class="channel-row">
        <span class="channel-label">Advisory</span>
        <span class="channel-val" style="color:var(--blue)">$${(r.advisory/1000).toFixed(1)}B (${r.advPct}%)</span>
      </div>
      <div class="channel-row">
        <span class="channel-label">Brokerage</span>
        <span class="channel-val" style="color:var(--red)">$${(r.brokerage/1000).toFixed(1)}B (${r.brokPct}%)</span>
      </div>
      <div class="channel-bar">
        <div class="channel-fill" style="width:${r.advPct}%"></div>
      </div>
    </div>`).join("");
}
