import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiGet } from "../services/api.js";

const RECIPE_CATEGORIES = [
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

const formatCategory = (category) => {
  return (
    RECIPE_CATEGORIES.find((cat) => cat.value === category)?.label ||
    category.charAt(0).toUpperCase() + category.slice(1)
  );
};

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const recipes = await apiGet("/api/recipes");
        const foundRecipe = recipes.find((r) => r.id === parseInt(id, 10));
        if (foundRecipe) {
          setRecipe(foundRecipe);
        } else {
          setError("Recipe not found");
        }
      } catch (err) {
        setError(err.message || "Failed to load recipe");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadRecipe();
    }
  }, [id]);

  const buildShareUrl = () => {
    if (typeof window === "undefined" || !recipe) {
      return "";
    }
    return `${window.location.origin}/recipes/${recipe.id}`;
  };

  const shareRecipe = async (method = "native") => {
    if (!recipe) return;

    const shareUrl = buildShareUrl();
    const shareSubject = `Check out this recipe: ${recipe.title}`;
    const shareBody = `${recipe.title}\n\n${recipe.description}\n\nIngredients:\n${recipe.ingredients?.map((ing) => `- ${ing}`).join("\n")}\n\nInstructions:\n${recipe.steps?.map((step, idx) => `${idx + 1}. ${step}`).join("\n")}\n\nView online: ${shareUrl}`;

    try {
      switch (method) {
        case "native":
          if (navigator.share) {
            await navigator.share({
              title: recipe.title,
              text: recipe.description,
              url: shareUrl,
            });
          } else {
            // Fallback to clipboard
            await navigator.clipboard?.writeText(shareUrl);
            alert("Recipe link copied to clipboard!");
          }
          break;

        case "email":
          window.location.href = `mailto:?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(shareBody)}`;
          break;

        case "copy":
          await navigator.clipboard?.writeText(shareUrl);
          alert("Recipe link copied to clipboard!");
          break;

        default:
          break;
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error sharing recipe:", err);
        alert("Unable to share recipe. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <section className="section-card">
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p className="muted">Loading recipe...</p>
        </div>
      </section>
    );
  }

  if (error || !recipe) {
    return (
      <section className="section-card">
        <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <p className="muted" style={{ fontSize: "1.0625rem", marginBottom: "1.5rem" }}>
            {error || "Recipe not found"}
          </p>
          <Link to="/recipes" className="primary-btn">
            Back to Recipes
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card">
      <div style={{ marginBottom: "2rem" }}>
        <button
          type="button"
          onClick={() => navigate("/recipes")}
          className="ghost-btn"
          style={{ marginBottom: "1.5rem" }}
        >
          ← Back to Recipes
        </button>

        <div
          className="pill category-pill"
          style={{
            backgroundColor: "var(--accent-soft)",
            color: "var(--accent)",
            borderColor: "var(--accent)",
            marginBottom: "1rem",
            display: "inline-block",
          }}
        >
          {formatCategory(recipe.category || "dinner")}
        </div>

        <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", margin: "0.5rem 0", fontFamily: "'Lora', serif", fontWeight: 600 }}>
          {recipe.title}
        </h1>

        {recipe.submittedBy && (
          <p
            className="muted"
            style={{
              fontSize: "1rem",
              fontStyle: "italic",
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            Shared by {recipe.submittedBy}
          </p>
        )}

        {(recipe.prepTime || recipe.cookTime || recipe.serves) && (
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            {recipe.prepTime && (
              <div>
                <span className="muted" style={{ fontSize: "0.9375rem" }}>Prep: </span>
                <strong style={{ fontSize: "0.9375rem" }}>{recipe.prepTime} min</strong>
              </div>
            )}
            {recipe.cookTime && (
              <div>
                <span className="muted" style={{ fontSize: "0.9375rem" }}>Cook: </span>
                <strong style={{ fontSize: "0.9375rem" }}>{recipe.cookTime} min</strong>
              </div>
            )}
            {recipe.serves && (
              <div>
                <span className="muted" style={{ fontSize: "0.9375rem" }}>Serves: </span>
                <strong style={{ fontSize: "0.9375rem" }}>{recipe.serves}</strong>
              </div>
            )}
          </div>
        )}

        <p className="muted" style={{ fontSize: "1.125rem", lineHeight: "1.8", marginBottom: "2rem" }}>
          {recipe.description}
        </p>

        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            style={{
              width: "100%",
              borderRadius: "var(--radius-lg)",
              marginBottom: "2rem",
              boxShadow: "var(--shadow-md)",
            }}
          />
        )}

        <div className="share-section">
          <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Share Recipe</h3>
          <div className="share-buttons">
            {navigator.share && (
              <button
                type="button"
                onClick={() => shareRecipe("native")}
                className="share-btn"
              >
                Share
              </button>
            )}
            <button
              type="button"
              onClick={() => shareRecipe("email")}
              className="share-btn"
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => shareRecipe("copy")}
              className="share-btn"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      <div className="recipe-content">
        <div className="recipe-section">
          <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem", fontFamily: "'Lora', serif", fontWeight: 600 }}>
            Ingredients
          </h2>
          <ul className="recipe-list">
            {recipe.ingredients?.map((item, index) => (
              <li key={`ingredient-${index}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="recipe-section">
          <h2 style={{ fontSize: "1.75rem", marginBottom: "1rem", fontFamily: "'Lora', serif", fontWeight: 600 }}>
            Instructions
          </h2>
          <ol className="recipe-list">
            {recipe.steps?.map((item, index) => (
              <li key={`step-${index}`}>{item}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

