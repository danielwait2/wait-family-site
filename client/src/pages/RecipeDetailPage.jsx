import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiGet, apiPost } from "../services/api.js";

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
  const [hasLiked, setHasLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        setLoading(true);
        const recipes = await apiGet("/api/recipes");
        const foundRecipe = recipes.find((r) => r.id === parseInt(id, 10));
        if (foundRecipe) {
          setRecipe(foundRecipe);
          // Check if user has already liked this recipe
          const likedRecipes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
          setHasLiked(likedRecipes.includes(foundRecipe.id));
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

  const handleLike = async () => {
    if (!recipe || liking) return;

    try {
      setLiking(true);
      const isLiking = !hasLiked;
      const endpoint = isLiking 
        ? `/api/recipes/${recipe.id}/like`
        : `/api/recipes/${recipe.id}/unlike`;
      
      const response = await apiPost(endpoint, {});
      
      // Update recipe likes count
      setRecipe((prev) => ({
        ...prev,
        likes: response.likes,
      }));

      // Update localStorage
      const likedRecipes = JSON.parse(localStorage.getItem("likedRecipes") || "[]");
      if (isLiking) {
        // Add to liked recipes
        if (!likedRecipes.includes(recipe.id)) {
          likedRecipes.push(recipe.id);
          localStorage.setItem("likedRecipes", JSON.stringify(likedRecipes));
        }
        setHasLiked(true);
      } else {
        // Remove from liked recipes
        const updated = likedRecipes.filter((id) => id !== recipe.id);
        localStorage.setItem("likedRecipes", JSON.stringify(updated));
        setHasLiked(false);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      // Don't show error to user, just log it
    } finally {
      setLiking(false);
    }
  };

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

        {/* Like Button - data attributes prevent crawler interaction */}
        <div 
          style={{ 
            marginBottom: "2rem", 
            display: "flex", 
            alignItems: "center", 
            gap: "1rem",
            flexWrap: "wrap"
          }}
          data-noindex="true"
          data-nocrawl="true"
        >
          <button
            type="button"
            onClick={handleLike}
            disabled={liking}
            data-noindex="true"
            data-nocrawl="true"
            aria-label={hasLiked ? "Remove like" : "I made this recipe"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: hasLiked ? "var(--accent)" : "transparent",
              color: hasLiked ? "white" : "var(--accent)",
              border: "1px solid var(--accent)",
              borderRadius: "var(--radius-md)",
              cursor: liking ? "not-allowed" : "pointer",
              fontSize: "0.9375rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
              opacity: liking ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!liking) {
                if (hasLiked) {
                  e.currentTarget.style.backgroundColor = "var(--error)";
                  e.currentTarget.style.borderColor = "var(--error)";
                } else {
                  e.currentTarget.style.backgroundColor = "var(--accent-soft)";
                }
              }
            }}
            onMouseLeave={(e) => {
              if (!liking) {
                if (hasLiked) {
                  e.currentTarget.style.backgroundColor = "var(--accent)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                } else {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "18px",
                height: "18px",
                marginRight: "4px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={hasLiked ? "#000000" : "none"}
                stroke="#000000"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  width: "100%",
                  height: "100%",
                }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </span>
            <span>
              {hasLiked ? "I made this too" : "I made this!"}
            </span>
          </button>
          {recipe.likes > 0 && (
            <span 
              className="muted" 
              style={{ 
                fontSize: "0.9375rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem"
              }}
              data-noindex="true"
              data-nocrawl="true"
            >
              <span>{recipe.likes}</span>
              <span>{recipe.likes === 1 ? 'person has' : 'people have'} made this</span>
            </span>
          )}
        </div>

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

