// Select elements
const form = document.getElementById("tracker-form");
const categoryInput = document.getElementById("category-input");
const categoryTotalsList = document.getElementById("category-totals");
const input = document.getElementById("tracker-input");
const dateInput = document.getElementById("date-input");
const list = document.getElementById("tracker-list");
const amountInput = document.getElementById("amount-input");
const exportBtn = document.getElementById("export-csv");
const totalDisplay = document.getElementById("total");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric"
});
const formatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN"
});
const monthInput = document.getElementById("month-input");
const monthlyTotalDisplay = document.getElementById("monthly-total");
const monthlyCategoryTotalsList =
  document.getElementById("monthly-category-totals");
const chartCanvas = document.getElementById("monthly-chart");
let monthlyChart = null;
const chartSection = document.getElementById("chart-section");
const categoryColors = {
  Food: "#22c55e",
  Transport: "#3b82f6",
  Rent: "#ef4444",
  Utilities: "#f59e0b",
  Entertainment: "#8b5cf6",
  Other: "#6b7280"
};
const chartEmpty = document.getElementById("chart-empty");
const chartWrapper = document.querySelector(".chart-wrapper");
const dailyChartCanvas = document.getElementById("daily-chart");
const dailyChartSection = document.getElementById("daily-chart-section");
const dailyChartEmpty = document.getElementById("daily-chart-empty");
let dailyChart = null;
const dailyChartWrapper = document.querySelector(".daily-wrapper");
const themeToggle = document.getElementById("theme-toggle");
const categoryFilter = document.getElementById("category-filter");

// Load data from localStorage or start empty
let items = JSON.parse(localStorage.getItem("trackerItems")) || [];

// Save data to localStorage
function saveItems() {
  localStorage.setItem("trackerItems", JSON.stringify(items));
}

// Render items to the page
function renderItems() {
  const filter = categoryFilter.value;
  const visibleItems =
  filter === "all"
    ? items
    : items.filter(item => item.category === filter);

  items.sort((a, b) => new Date(a.date) - new Date(b.date));
  list.innerHTML = "";

  let total = 0;
  const categoryTotals = {};

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No expenses yet. Add one above.";
    empty.style.textAlign = "center";
    list.appendChild(empty);

    totalDisplay.textContent = `Total: ${formatter.format(0)}`;
    categoryTotalsList.innerHTML = "";

    renderMonthlySummary();
    renderMonthlyChart();
    renderDailyChart();
    return;
  }

  visibleItems.forEach((item, index) => {
    total += item.amount;
    categoryTotals[item.category] =
      (categoryTotals[item.category] || 0) + item.amount;

    const li = document.createElement("li");
    const span = document.createElement("span");
    span.innerHTML = `
    <div class="expense-category">${item.category}</div>
    <div class="expense-date">${dateFormatter.format(new Date(item.date))}</div>
    <div class="expense-name">
    ${item.name}: ${formatter.format(item.amount)}
    </div>`;

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "✕";

    deleteBtn.addEventListener("click", () => {
      items.splice(index, 1);
      saveItems();
      renderItems();
    });

    li.appendChild(span);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });

  totalDisplay.textContent = `Total: ${formatter.format(total)}`;

  categoryTotalsList.innerHTML = "";
  for (const category in categoryTotals) {
    const li = document.createElement("li");
    li.textContent =
      `${category}: ${formatter.format(categoryTotals[category])}`;
    categoryTotalsList.appendChild(li);
  }

  renderMonthlySummary();
  renderMonthlyChart();
  renderDailyChart();
}

function renderMonthlySummary() {
  const selectedMonth = monthInput.value;

  if (!selectedMonth) {
    monthlyTotalDisplay.textContent =
      `Monthly Total: ${formatter.format(0)}`;
    monthlyCategoryTotalsList.innerHTML = "";
    return;
  }

  let monthlyTotal = 0;
  const monthlyCategoryTotals = {};

  items.forEach((item) => {
    if (!item.date) return;

    const itemMonth = item.date.slice(0, 7);
    if (itemMonth === selectedMonth) {
      monthlyTotal += item.amount;
      monthlyCategoryTotals[item.category] =
        (monthlyCategoryTotals[item.category] || 0) + item.amount;
    }
  });

  monthlyTotalDisplay.textContent =
    `Monthly Total: ${formatter.format(monthlyTotal)}`;

  monthlyCategoryTotalsList.innerHTML = "";
  for (const category in monthlyCategoryTotals) {
    const li = document.createElement("li");
    li.textContent =
      `${category}: ${formatter.format(monthlyCategoryTotals[category])}`;
    monthlyCategoryTotalsList.appendChild(li);
  }
}

function exportToCSV() {
  if (items.length === 0) return;

  const headers = ["Name", "Category", "Date", "Amount (PLN)"];
  const rows = items.map(item => [
    item.name,
    item.category,
    item.date,
    item.amount.toFixed(2)
  ]);

  let csvContent = headers.join(",") + "\n";

  rows.forEach(row => {
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "expenses.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function renderMonthlyChart() {
  const selectedMonth = monthInput.value;

  // Always destroy existing chart
  if (monthlyChart) {
    monthlyChart.destroy();
    monthlyChart = null;
  }

  // Hide chart by default
  chartSection.style.display = "none";
  chartEmpty.style.display = "none";
  chartWrapper.classList.add("hidden");

  if (!selectedMonth) return;

  const categoryTotals = {};

  items.forEach(item => {
    if (!item.date) return;

    const itemMonth = item.date.slice(0, 7);
    if (itemMonth === selectedMonth) {
      categoryTotals[item.category] =
        (categoryTotals[item.category] || 0) + item.amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  // 🚫 No data → no chart
  if (labels.length === 0) {
  chartSection.style.display = "block";
  chartEmpty.style.display = "block";
  chartWrapper.classList.add("hidden");
  return;
  }

  chartSection.style.display = "block";
  chartEmpty.style.display = "none";
  chartWrapper.classList.remove("hidden");

  monthlyChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Spending (PLN)",
          data,
          backgroundColor: labels.map(
          category => categoryColors[category] || "#2563eb"
          ),
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return formatter.format(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `${value} zł`
          }
        }
      },
      animation: {
        duration: 500,
        easing: "easeOutQuart"
      }
    }
  });
}

function renderDailyChart() {
  const selectedMonth = monthInput.value;

  // Always destroy existing chart
  if (dailyChart) {
    dailyChart.destroy();
    dailyChart = null;
  }

  // Reset UI
  dailyChartSection.style.display = "none";
  dailyChartEmpty.style.display = "none";
  dailyChartWrapper.classList.add("hidden");

  if (!selectedMonth) return;

  const dailyTotals = {};

  items.forEach(item => {
    if (!item.date) return;

    const itemMonth = item.date.slice(0, 7);
    if (itemMonth === selectedMonth) {
      const day = new Date(item.date).getDate();
      dailyTotals[day] = (dailyTotals[day] || 0) + item.amount;
    }
  });

  const days = Object.keys(dailyTotals)
    .map(Number)
    .sort((a, b) => a - b);

  // 🚫 No data → show empty message, no space
  if (days.length === 0) {
    dailyChartSection.style.display = "block";
    dailyChartEmpty.style.display = "block";
    return;
  }

  const totals = days.map(day => dailyTotals[day]);

  // ✅ Show chart
  dailyChartSection.style.display = "block";
  dailyChartWrapper.classList.remove("hidden");

  dailyChart = new Chart(dailyChartCanvas, {
    type: "line",
    data: {
      labels: days.map(d => `Day ${d}`),
      datasets: [
        {
          data: totals,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          tension: 0.3,
          fill: true,
          pointRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => formatter.format(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `${value} zł`
          }
        }
      }
    }
  });
}

function applyTheme(theme) {
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
}

themeToggle.addEventListener("click", () => {
  const current = document.body.classList.contains("dark") ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
});

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

// Handle form submission
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = input.value.trim();
  const category = categoryInput.value;
  const amount = parseFloat(amountInput.value);

  if (name === "" || category === "" || isNaN(amount) || amount <= 0) return;

  items.push({
  name,
  category,
  amount,
  date: dateInput.value
});

  input.value = "";
  categoryInput.value = "";
  amountInput.value = "";
  dateInput.value = "";


  saveItems();
  renderItems();
});

monthInput.addEventListener("change", () => {
  renderMonthlySummary();
  renderMonthlyChart();
  renderDailyChart();
});
exportBtn.addEventListener("click", exportToCSV);
categoryFilter.addEventListener("change", renderItems);

// Initial render
renderItems();

