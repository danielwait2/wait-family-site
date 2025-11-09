import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../services/api.js";

const RECIPE_CATEGORIES = [
  { value: "", label: "All Categories" },
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

const TIME_FILTERS = [
  { value: "", label: "Any Time" },
  { value: "15", label: "15 minutes or less" },
  { value: "30", label: "30 minutes or less" },
  { value: "45", label: "45 minutes or less" },
  { value: "60", label: "1 hour or less" },
  { value: "90", label: "1.5 hours or less" },
  { value: "120", label: "2 hours or less" },
  { value: "180", label: "3 hours or less" },
];

const formatCategory = (category) => {
  return (
    RECIPE_CATEGORIES.find((cat) => cat.value === category)?.label ||
    category.charAt(0).toUpperCase() + category.slice(1)
  );
};

export default function RecipesPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMaxTime, setSelectedMaxTime] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadRecipes = async (category = "", search = "", maxTotalTime = "") => {
    try {
      setIsSearching(true);
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search.trim()) params.append("search", search.trim());
      if (maxTotalTime) params.append("maxTotalTime", maxTotalTime);

      const queryString = params.toString();
      const url = `/api/recipes${queryString ? `?${queryString}` : ""}`;
      const data = await apiGet(url);
      setRecipes(data);
      setFilteredRecipes(data);
    } catch (error) {
      console.error("Error loading recipes:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadRecipes(selectedCategory, debouncedSearchQuery, selectedMaxTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, debouncedSearchQuery, selectedMaxTime]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleMaxTimeChange = (e) => {
    setSelectedMaxTime(e.target.value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedMaxTime("");
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory || selectedMaxTime;

  return (
    <section className="section-card">
      <div className="hero">
        <div>
          <p className="badge">Our shared cookbook</p>
          <h2>Approved recipes to bring back that Wait family feeling.</h2>
          <p>
            Every dish here was submitted by family and lovingly approved so the
            memories, aromas, and flavors live on.
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search recipes by name, ingredients, or description..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          {isSearching && <div className="search-loading"></div>}
        </div>
        <div className="filter-container">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="category-filter"
          >
            {RECIPE_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            value={selectedMaxTime}
            onChange={handleMaxTimeChange}
            className="category-filter"
          >
            {TIME_FILTERS.map((timeFilter) => (
              <option key={timeFilter.value} value={timeFilter.value}>
                {timeFilter.label}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="filter-results">
            <p className="muted">
              {filteredRecipes.length}{" "}
              {filteredRecipes.length === 1 ? "recipe" : "recipes"} found
              {selectedCategory && ` in ${formatCategory(selectedCategory)}`}
              {selectedMaxTime &&
                ` with total time ${
                  TIME_FILTERS.find((f) => f.value === selectedMaxTime)?.label
                    .split(" or less")[0] || ""
                }`}
              {debouncedSearchQuery.trim() &&
                ` matching "${debouncedSearchQuery}"`}
            </p>
          </div>
        )}
      </div>

      <div className="recipes-container">
        <div className="recipes-header">
          <div>
            <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>
              {filteredRecipes.length}{" "}
              {filteredRecipes.length === 1 ? "Recipe" : "Recipes"}
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              {hasActiveFilters
                ? "Filtered results"
                : "All approved family recipes"}
            </p>
          </div>
          <Link to="/recipes/add" className="primary-btn">
            Add a Recipe
          </Link>
        </div>

        <div className="recipes-grid" style={{ marginTop: "2rem" }}>
          {filteredRecipes.length ? (
            filteredRecipes.map((recipe) => (
              <article
                key={recipe.id}
                className="recipe-card-preview"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                {recipe.imageUrl ? (
                  <div className="recipe-card-image">
                    <img src={recipe.imageUrl} alt={recipe.title} />
                  </div>
                ) : (
                  <div className="recipe-card-image-placeholder">
                    <span>🍳</span>
                  </div>
                )}
                <div className="recipe-card-content">
                  <div
                    className="pill category-pill"
                    style={{
                      backgroundColor: "var(--accent-soft)",
                      color: "var(--accent)",
                      borderColor: "var(--accent)",
                      marginBottom: "0.75rem",
                      display: "inline-block",
                    }}
                  >
                    {formatCategory(recipe.category || "dinner")}
                  </div>
                  <h3 style={{ margin: "0.5rem 0", fontSize: "1.5rem" }}>
                    {recipe.title}
                  </h3>
                  {recipe.submittedBy && (
                    <p
                      className="muted"
                      style={{
                        fontSize: "0.875rem",
                        fontStyle: "italic",
                        marginTop: "0.25rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Shared by {recipe.submittedBy}
                    </p>
                  )}
                  {(recipe.prepTime || recipe.cookTime || recipe.serves) && (
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginBottom: "0.75rem",
                        fontSize: "0.875rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {recipe.prepTime && (
                        <span className="muted">
                          Prep: <strong>{recipe.prepTime} min</strong>
                        </span>
                      )}
                      {recipe.cookTime && (
                        <span className="muted">
                          Cook: <strong>{recipe.cookTime} min</strong>
                        </span>
                      )}
                      {recipe.serves && (
                        <span className="muted">
                          Serves: <strong>{recipe.serves}</strong>
                        </span>
                      )}
                    </div>
                  )}
                  <p
                    className="muted"
                    style={{
                      fontSize: "0.9375rem",
                      lineHeight: "1.6",
                      marginBottom: "1rem",
                    }}
                  >
                    {recipe.description.length > 120
                      ? `${recipe.description.substring(0, 120)}...`
                      : recipe.description}
                  </p>
                  <div className="recipe-card-footer">
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <span className="muted" style={{ fontSize: "0.875rem" }}>
                        {recipe.ingredients?.length || 0} ingredients
                      </span>
                      {recipe.likes > 0 && (
                        <span className="muted" style={{ fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <span>❤️</span>
                          <span>{recipe.likes}</span>
                        </span>
                      )}
                    </div>
                    <span className="recipe-card-arrow">→</span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 1rem",
                background: "var(--surface-muted)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--line)",
              }}
            >
              <p
                className="muted"
                style={{ fontSize: "1.0625rem", marginBottom: "1.5rem" }}
              >
                {hasActiveFilters
                  ? "No recipes found matching your search. Try adjusting your filters."
                  : "No recipes published yet—be the first to submit one!"}
              </p>
              {!hasActiveFilters && (
                <Link to="/recipes/add" className="primary-btn">
                  Add the First Recipe
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
