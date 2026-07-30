// ─── Chart renderers ─────────────────────────────────────────────────────────

function buildGrossSalesChart() {
  const ctx = document.getElementById("chartGross").getContext("2d");
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: GROSS_SALES.categories,
      datasets: [
        { label: "2026 YTD",     data: GROSS_SALES.ytd26, backgroundColor: "#C41E3A" },
        { label: "Mar-26",       data: GROSS_SALES.mar26, backgroundColor: "#1565C0" },
        { label: "2025 YTD",     data: GROSS_SALES.ytd25, backgroundColor: "#E6A817" },
        { label: "Mar-25",       data: GROSS_SALES.mar25, backgroundColor: "#E07320" },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}B` }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: v => `$${v}B` },
          title: { display: true, text: "Sales in Billions", font: { size: 11 } }
        }
      }
    }
  });
}

function buildNetFlowsChart() {
  const ctx = document.getElementById("chartNetFlows").getContext("2d");
  const data = NET_FLOWS_T12.values;
  const colors = data.map(v => v >= 0 ? "#2E7D32" : "#C41E3A");
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: NET_FLOWS_T12.labels,
      datasets: [{
        label: "Net MF Flows ($B)",
        data,
        borderColor: "#C41E3A",
        backgroundColor: "rgba(196,30,58,0.08)",
        pointBackgroundColor: colors,
        pointBorderColor: colors,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ` $${ctx.parsed.y.toFixed(2)}B` }
        }
      },
      scales: {
        x: { grid: { color: "#f0f0f0" } },
        y: {
          ticks: { callback: v => `$${v}B` },
          title: { display: true, text: "Flows in Billions", font: { size: 11 } }
        }
      }
    }
  });
}

function buildRevenueChart() {
  const ctx = document.getElementById("chartRevenue").getContext("2d");
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: YTD_REVENUE.categories,
      datasets: [
        { label: "2026 YTD",  data: YTD_REVENUE.ytd26, backgroundColor: "#C41E3A" },
        { label: "Mar-26",    data: YTD_REVENUE.mar26, backgroundColor: "#1565C0" },
        { label: "2025 YTD",  data: YTD_REVENUE.ytd25, backgroundColor: "#E6A817" },
        { label: "Mar-25",    data: YTD_REVENUE.mar25, backgroundColor: "#E07320" },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toFixed(1)}M` }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: v => `$${v}M` },
          title: { display: true, text: "Revenue in Millions", font: { size: 11 } }
        }
      }
    }
  });
}

function buildAUMChart() {
  const ctx = document.getElementById("chartAUM").getContext("2d");
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels: AUM_T12.labels,
      datasets: [
        { label: "Brokerage", data: AUM_T12.brokerage, backgroundColor: "#C41E3A", stack: "aum" },
        { label: "Advisory",  data: AUM_T12.advisory,  backgroundColor: "#1565C0", stack: "aum" },
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y}B` }
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: {
          stacked: true,
          ticks: { callback: v => `$${v}B` },
          title: { display: true, text: "AUM in Billions", font: { size: 11 } }
        }
      }
    }
  });
}

function buildBroadGrossChart() {
  const ctx = document.getElementById("chartBroadGross").getContext("2d");
  const labels = GROSS_BY_BROAD.map(r => r.class);
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Jan-26",  data: GROSS_BY_BROAD.map(r => r.janGross),  backgroundColor: "#E6A817" },
        { label: "Feb-26",  data: GROSS_BY_BROAD.map(r => r.febGross),  backgroundColor: "#1565C0" },
        { label: "Mar-26",  data: GROSS_BY_BROAD.map(r => r.marGross),  backgroundColor: "#C41E3A" },
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { font: { size: 11 }, boxWidth: 12 } },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.x.toFixed(0)}M` }
        }
      },
      scales: {
        x: { ticks: { callback: v => `$${v}M` } },
        y: { grid: { display: false } }
      }
    }
  });
}
