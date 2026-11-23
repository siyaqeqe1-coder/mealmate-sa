const SUPABASE_URL = "https://vswrxwwbwjosfxqcgxds.supabase.co";
const SUPABASE_KEY = "sb_publishable_0-RQ-3ZNZ0o39VvlklXQxw_1oMMt8Xy";

const STATUS = {
  draft: "Draft",
  ai_assisted_unverified: "AI-assisted, not yet tested",
  kitchen_tested: "Kitchen tested",
  chef_reviewed: "Chef reviewed"
};

let recipes = [];
let view = "list";
let query = "";
let activeCat = "";
const app = document.getElementById("app");

let cart = { ids: [], checked: {} };
try {
  const saved = JSON.parse(localStorage.getItem("mealmate_cart") || "null");
  if (saved && Array.isArray(saved.ids) && saved.checked && typeof saved.checked === "object") cart = saved;
} catch (e) {}
function saveCart() {
  try { localStorage.setItem("mealmate_cart", JSON.stringify(cart)); } catch (e) {}
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function textOf(x) {
  if (x == null) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object") return x.text || x.step || x.instruction || x.description || x.name || JSON.stringify(x);
  return String(x);
}
function listOf(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.map(textOf).filter(Boolean);
  if (typeof x === "object") return Object.entries(x).map(([k, v]) => k + ": " + textOf(v));
  return [textOf(x)];
}
function fmt(n) { return String(Math.round(n * 100) / 100); }
function inCart(id) { return cart.ids.includes(id); }

function setMain(html) {
  app.innerHTML = html;
  document.getElementById("navHome").className = view === "cart" ? "" : "on";
  document.getElementById("navCart").className = view === "cart" ? "on" : "";
  document.getElementById("count").textContent = cart.ids.length ? "(" + cart.ids.length + ")" : "";
}

async function load() {
  const select = "id,title,slug,description,cuisine,difficulty,prep_minutes,cook_minutes,base_servings,instructions,verification_status,allergen_notes,storage_notes,substitutions,recipe_category_links(recipe_categories(*)),recipe_ingredients(quantity,unit,preparation,is_optional,sort_order,ingredients(name))";
  const url = SUPABASE_URL + "/rest/v1/recipes?select=" + select + "&is_published=eq.true&order=title";
  try {
    const res = await fetch(url, { headers: { apikey: SUPABASE_KEY } });
    if (!res.ok) throw new Error("Server said " + res.status + ": " + (await res.text()));
    recipes = await res.json();
    recipes.forEach(r => {
      r.cats = (r.recipe_category_links || []).map(l => l.recipe_categories).filter(Boolean)
        .map(c => ({ slug: c.slug || c.name || c.title, name: c.name || c.title || c.slug }));
    });
    cart.ids = cart.ids.filter(id => recipes.some(r => r.id === id));
    saveCart();
    showList();
  } catch (e) {
    app.innerHTML = "<p>Sorry, recipes could not load.</p><p class='meta'>" + esc(e.message) + "</p>";
  }
}

function badge(r) {
  const ok = r.verification_status === "kitchen_tested" || r.verification_status === "chef_reviewed";
  return "<span class='badge " + (ok ? "ok" : "") + "'>" + esc(STATUS[r.verification_status] || r.verification_status) + "</span>";
}