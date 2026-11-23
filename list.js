function showList() {
  view = "list";
  setMain("<input class='search' id='search' placeholder='Search recipes…' value='" + esc(query) + "'>" +
          "<div class='chips' id='chips'></div><div id='results'></div>");
  document.getElementById("search").addEventListener("input", e => { query = e.target.value; drawResults(); });
  drawChips();
  drawResults();
}

function drawChips() {
  const all = {};
  recipes.forEach(r => r.cats.forEach(c => { all[c.slug] = c.name; }));
  const slugs = Object.keys(all).sort((a, b) => all[a].localeCompare(all[b]));
  const box = document.getElementById("chips");
  if (!slugs.length) { box.style.display = "none"; return; }
  box.innerHTML = "<button class='chip " + (activeCat ? "" : "on") + "' data-slug=''>All</button>" +
    slugs.map(s => "<button class='chip " + (activeCat === s ? "on" : "") + "' data-slug='" + esc(s) + "'>" + esc(all[s]) + "</button>").join("");
  box.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    activeCat = b.dataset.slug;
    drawChips();
    drawResults();
  }));
}

function drawResults() {
  const q = query.toLowerCase();
  const shown = recipes.filter(r =>
    (!activeCat || r.cats.some(c => c.slug === activeCat)) &&
    (r.title + " " + (r.description || "") + " " + (r.cuisine || "")).toLowerCase().includes(q));
  let html = "";
  if (!recipes.length) html = "<p>No recipes are published yet. Check back soon!</p>";
  else if (!shown.length) html = "<p>No recipes match your search.</p>";
  html += shown.map(r =>
    "<div class='card' data-id='" + esc(r.id) + "'><h3>" + esc(r.title) + "</h3>" +
    "<div class='meta'>" + esc(r.cuisine || "") + " · " + esc(r.difficulty || "") + " · " +
    ((r.prep_minutes || 0) + (r.cook_minutes || 0)) + " min</div>" + badge(r) +
    (inCart(r.id) ? "<span class='badge cart'>🛒 In your list</span>" : "") + "</div>"
  ).join("");
  const box = document.getElementById("results");
  box.innerHTML = html;
  box.querySelectorAll(".card").forEach(c => c.addEventListener("click", () => showRecipe(c.dataset.id)));
}

function showRecipe(id) {
  const r = recipes.find(x => x.id === id);
  if (!r) return;
  view = "recipe";
  const ings = (r.recipe_ingredients || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  let html = "<button id='back' class='light'>← Back</button>";
  html += "<button id='toggleCart' class='" + (inCart(id) ? "light" : "") + "'>" + (inCart(id) ? "✓ In list – remove" : "+ Add to shopping list") + "</button>";
  html += "<h2>" + esc(r.title) + "</h2>" + badge(r);
  html += "<p>" + esc(r.description || "") + "</p>";
  html += "<p class='meta'>Prep " + (r.prep_minutes ?? "?") + " min · Cook " + (r.cook_minutes ?? "?") + " min · Serves " + (r.base_servings ?? "?") + " · " + esc(r.difficulty || "") + "</p>";
  html += "<h3>Ingredients</h3><ul>" + ings.map(i =>
    "<li>" + esc([i.quantity, i.unit, i.ingredients && i.ingredients.name].filter(x => x != null && x !== "").join(" ")) +
    (i.preparation ? ", " + esc(i.preparation) : "") + (i.is_optional ? " (optional)" : "") + "</li>").join("") + "</ul>";
  html += "<h3>Method</h3><ol>" + listOf(r.instructions).map(s => "<li>" + esc(s) + "</li>").join("") + "</ol>";
  const subs = listOf(r.substitutions);
  if (subs.length) html += "<h3>Substitutions</h3><ul>" + subs.map(s => "<li>" + esc(s) + "</li>").join("") + "</ul>";
  if (r.allergen_notes) html += "<div class='note'><b>Allergens:</b> " + esc(r.allergen_notes) + "</div>";
  if (r.storage_notes) html += "<div class='note'><b>Storage:</b> " + esc(r.storage_notes) + "</div>";
  setMain(html);
  document.getElementById("back").addEventListener("click", showList);
  document.getElementById("toggleCart").addEventListener("click", () => { toggleRecipe(id); showRecipe(id); });
  window.scrollTo(0, 0);
}

function toggleRecipe(id) {
  if (inCart(id)) cart.ids = cart.ids.filter(x => x !== id);
  else cart.ids.push(id);
  saveCart();
}