// Select elements
const form = document.getElementById("tracker-form");
const input = document.getElementById("tracker-input");
const list = document.getElementById("tracker-list");
const amountInput = document.getElementById("amount-input");
const totalDisplay = document.getElementById("total");
const formatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN"
});


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

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No expenses yet. Add one above.";
    empty.style.textAlign = "center";
    empty.style.color = "#777";
    list.appendChild(empty);
    totalDisplay.textContent = `Total: ${formatter.format(0)}`;
    return;
  }

  items.forEach((item, index) => {
    total += item.amount;

    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const span = document.createElement("span");
    span.textContent = `${item.name} – ${formatter.format(item.amount)}`;

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
}

// Handle form submission
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = input.value.trim();
  const amount = parseFloat(amountInput.value);

  if (name === "" || isNaN(amount) || amount <= 0) return;

  items.push({
    name,
    amount
  });

  input.value = "";
  amountInput.value = "";

  saveItems();
  renderItems();
});


// Initial render
renderItems();
