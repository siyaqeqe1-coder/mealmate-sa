function cartItems() {
  const map = {};
  cart.ids.forEach(id => {
    const r = recipes.find(x => x.id === id);
    if (!r) return;
    (r.recipe_ingredients || []).forEach(i => {
      const name = i.ingredients && i.ingredients.name;
      if (!name) return;
      const unit = i.unit || "";
      const key = name.toLowerCase() + "|" + unit.toLowerCase();
      if (!map[key]) map[key] = { key, name, unit, qty: 0, hasQty: false, optional: true };
      const q = Number(i.quantity);
      if (i.quantity != null && i.quantity !== "" && !isNaN(q)) { map[key].qty += q; map[key].hasQty = true; }
      if (!i.is_optional) map[key].optional = false;
    });
  });
  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}

function showCart() {
  view = "cart";
  const items = cartItems();
  let html = "<h2>Shopping list</h2>";
  if (!cart.ids.length) {
    html += "<p>Your list is empty. Open a recipe and tap <b>+ Add to shopping list</b>.</p>";
    setMain(html);
    return;
  }
  html += "<p class='meta'>Amounts are for each recipe's usual servings. Same ingredients are added together.</p>";
  html += "<h3>Recipes in your list</h3>" + cart.ids.map(id => {
    const r = recipes.find(x => x.id === id);
    return r ? "<div class='rrow'><span>" + esc(r.title) + "</span><button class='danger' data-remove='" + esc(id) + "'>Remove</button></div>" : "";
  }).join("");
  html += "<h3>Things to buy</h3>";
  html += items.map(i => {
    const done = !!cart.checked[i.key];
    const amt = (i.hasQty ? fmt(i.qty) + " " : "") + (i.unit ? i.unit + " " : "");
    return "<label class='item " + (done ? "done" : "") + "'><input type='checkbox' data-key='" + esc(i.key) + "' " + (done ? "checked" : "") + ">" +
      "<span>" + esc(amt + i.name) + (i.optional ? " (optional)" : "") + "</span></label>";
  }).join("");
  html += "<p><button class='light' id='untick'>Untick all</button><button class='danger' id='empty'>Empty list</button></p>";
  setMain(html);
  app.querySelectorAll("[data-remove]").forEach(b => b.addEventListener("click", () => { toggleRecipe(b.dataset.remove); showCart(); }));
  app.querySelectorAll("input[type=checkbox]").forEach(c => c.addEventListener("change", () => {
    cart.checked[c.dataset.key] = c.checked;
    saveCart();
    c.parentElement.classList.toggle("done", c.checked);
  }));
  document.getElementById("untick").addEventListener("click", () => { cart.checked = {}; saveCart(); showCart(); });
  document.getElementById("empty").addEventListener("click", () => {
    if (confirm("Remove everything from your shopping list?")) { cart = { ids: [], checked: {} }; saveCart(); showCart(); }
  });
}

document.getElementById("navHome").addEventListener("click", showList);
document.getElementById("navCart").addEventListener("click", showCart);

load();