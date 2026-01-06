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
const formatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN"
});
const monthInput = document.getElementById("month-input");
const monthlyTotalDisplay = document.getElementById("monthly-total");
const monthlyCategoryTotalsList =
  document.getElementById("monthly-category-totals");


// Load data from localStorage or start empty
let items = JSON.parse(localStorage.getItem("trackerItems")) || [];

// Save data to localStorage
function saveItems() {
  localStorage.setItem("trackerItems", JSON.stringify(items));
}

// Render items to the page
function renderItems() {
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
    return;
  }

  items.forEach((item, index) => {
    total += item.amount;
    categoryTotals[item.category] =
      (categoryTotals[item.category] || 0) + item.amount;

    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent =
      `${item.name} [${item.category}] (${item.date}) – ${formatter.format(item.amount)}`;

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
  renderMonthlySummary();
});

monthInput.addEventListener("change", renderMonthlySummary);
exportBtn.addEventListener("click", exportToCSV);


// Initial render
renderItems();

