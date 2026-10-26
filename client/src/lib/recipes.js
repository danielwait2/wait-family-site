export const RECIPE_CATEGORIES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "dessert", label: "Dessert" },
  { value: "salad", label: "Salad" },
  { value: "side", label: "Side Dish" },
  { value: "snack", label: "Snack" },
  { value: "beverage", label: "Beverage" },
  { value: "appetizer", label: "Appetizer" },
  { value: "other", label: "Other" },
];

export const formatCategory = (category = "") =>
  RECIPE_CATEGORIES.find((cat) => cat.value === category)?.label ||
  category.charAt(0).toUpperCase() + category.slice(1);

export const totalMinutes = (recipe) => (recipe.prepTime || 0) + (recipe.cookTime || 0);

export const formatMinutes = (minutes) => {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins} min`;
  return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
};

export const firstName = (name = "") => name.trim().split(/\s+/)[0] || "";

const fold = (text = "") =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .toLowerCase();

export const matchesSearch = (recipe, query) => {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = fold(
    [recipe.title, recipe.description, recipe.submittedBy, ...(recipe.ingredients || [])].join(" ")
  );
  return terms.every((term) => haystack.includes(term));
};

export const isIngredientHeading = (line) => /:\s*$/.test(line) && line.length <= 48 && !/^\d/.test(line);
