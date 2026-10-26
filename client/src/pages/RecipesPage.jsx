import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import RecipeCard from "../components/RecipeCard.jsx";
import Icon from "../components/Icon.jsx";
import useRecipes from "../hooks/useRecipes.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { RECIPE_CATEGORIES, matchesSearch, totalMinutes } from "../lib/recipes.js";

const TIME_FILTERS = [
  { value: "30", label: "30 min or less" },
  { value: "60", label: "1 hour or less" },
];

export default function RecipesPage() {
  usePageTitle("Recipes");
  const { recipes, loading, error } = useRecipes();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const category = params.get("category") || "";
  const maxTime = params.get("time") || "";

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const categoryCounts = useMemo(
    () =>
      recipes.reduce((counts, recipe) => {
        counts[recipe.category] = (counts[recipe.category] || 0) + 1;
        return counts;
      }, {}),
    [recipes]
  );

  const visible = useMemo(
    () =>
      recipes.filter(
        (recipe) =>
          (!category || recipe.category === category) &&
          (!maxTime || (totalMinutes(recipe) > 0 && totalMinutes(recipe) <= Number(maxTime))) &&
          matchesSearch(recipe, query)
      ),
    [recipes, category, maxTime, query]
  );

  const hasFilters = Boolean(query || category || maxTime);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Recipes</h1>
          <p className="page-sub">Our shared family cookbook</p>
        </div>
        <Link to="/recipes/add" className="btn btn-soft">
          <Icon name="plus" size={18} />
          Add
        </Link>
      </div>

      <div className="filter-bar">
        <label className="search-field">
          <Icon name="search" size={20} />
          <span className="visually-hidden">Search recipes</span>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Search by name, ingredient, or cook"
            value={query}
            onChange={(event) => updateParam("q", event.target.value)}
          />
          {query ? (
            <button type="button" className="icon-btn" onClick={() => updateParam("q", "")} aria-label="Clear search">
              <Icon name="x" size={18} />
            </button>
          ) : null}
        </label>

        <div className="chip-row" role="group" aria-label="Filter by category">
          <button type="button" className={`chip${!category ? " active" : ""}`} onClick={() => updateParam("category", "")}>
            All
          </button>
          {RECIPE_CATEGORIES.filter((cat) => categoryCounts[cat.value]).map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`chip${category === cat.value ? " active" : ""}`}
              aria-pressed={category === cat.value}
              onClick={() => updateParam("category", category === cat.value ? "" : cat.value)}
            >
              {cat.label}
              <span className="chip-count">{categoryCounts[cat.value]}</span>
            </button>
          ))}
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`chip chip-time${maxTime === filter.value ? " active" : ""}`}
              aria-pressed={maxTime === filter.value}
              onClick={() => updateParam("time", maxTime === filter.value ? "" : filter.value)}
            >
              <Icon name="clock" size={15} />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="status-message error">{error}</p> : null}

      {!loading ? (
        <p className="result-count" aria-live="polite">
          {visible.length} {visible.length === 1 ? "recipe" : "recipes"}
          {hasFilters ? (
            <button type="button" className="link-btn" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          ) : null}
        </p>
      ) : null}

      <div className="recipe-grid">
        {loading
          ? Array.from({ length: 6 }, (_, index) => <div key={index} className="recipe-card skeleton" />)
          : visible.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
      </div>

      {!loading && !visible.length ? (
        <div className="empty-state">
          <p>{hasFilters ? "Nothing matches that yet. Try a different word or clear the filters." : "No recipes yet."}</p>
          <Link to="/recipes/add" className="btn btn-primary">
            Share a recipe
          </Link>
        </div>
      ) : null}
    </div>
  );
}
