import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../services/api.js";

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

const emptyForm = {
  title: "",
  description: "",
  ingredients: "",
  steps: "",
  imageUrl: "",
  category: "dinner",
  submittedBy: "",
  prepTime: "",
  cookTime: "",
  serves: "",
};

export default function AddRecipePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await apiPost("/api/recipes", {
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl || undefined,
        category: form.category,
        submittedBy: form.submittedBy.trim() || undefined,
        prepTime: form.prepTime.trim() ? parseInt(form.prepTime, 10) : undefined,
        cookTime: form.cookTime.trim() ? parseInt(form.cookTime, 10) : undefined,
        serves: form.serves.trim() ? parseInt(form.serves, 10) : undefined,
        ingredients: form.ingredients
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        steps: form.steps
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setStatus({
        type: "success",
        message: "Recipe submitted for review. Thank you!",
      });
      setForm(emptyForm);
      // Redirect to recipes page after a short delay
      setTimeout(() => {
        navigate("/recipes");
      }, 2000);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-card">
      <div className="hero">
        <div>
          <p className="badge">Share your recipe</p>
          <h2>Add something new to the Wait table</h2>
          <p>
            Share your favorite family recipe with everyone. Submissions remain
            private until an admin reviews and approves them.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "2.5rem auto 0" }}>
        {status.message ? (
          <p className={`status-message ${status.type}`}>{status.message}</p>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="submittedBy">Your Name</label>
            <input
              id="submittedBy"
              name="submittedBy"
              placeholder="e.g., Sarah Wait"
              value={form.submittedBy}
              onChange={handleChange}
            />
            <p className="muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Optional - helps us know who shared this recipe
            </p>
          </div>
          <div className="form-group">
            <label htmlFor="title">Recipe Title</label>
            <input
              id="title"
              name="title"
              placeholder="e.g., Grandma's Apple Pie"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
              <div className="form-group">
                <label htmlFor="description">History of the recipe / Why you like it / How you found it</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Share the story behind this recipe—where it came from, why you love it, or how you discovered it..."
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              {RECIPE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label htmlFor="prepTime">Prep Time (minutes)</label>
              <input
                id="prepTime"
                name="prepTime"
                type="number"
                min="0"
                placeholder="e.g., 15"
                value={form.prepTime}
                onChange={handleChange}
              />
              <p className="muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Optional
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="cookTime">Cook Time (minutes)</label>
              <input
                id="cookTime"
                name="cookTime"
                type="number"
                min="0"
                placeholder="e.g., 30"
                value={form.cookTime}
                onChange={handleChange}
              />
              <p className="muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Optional
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="serves">Serves</label>
              <input
                id="serves"
                name="serves"
                type="number"
                min="1"
                placeholder="e.g., 4"
                value={form.serves}
                onChange={handleChange}
              />
              <p className="muted" style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Optional
              </p>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="ingredients">Ingredients</label>
            <textarea
              id="ingredients"
              name="ingredients"
              placeholder="One ingredient per line..."
              value={form.ingredients}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="steps">Instructions</label>
            <textarea
              id="steps"
              name="steps"
              placeholder="One step per line..."
              value={form.steps}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL (Optional)</label>
            <input
              id="imageUrl"
              name="imageUrl"
              placeholder="https://example.com/image.jpg"
              value={form.imageUrl}
              onChange={handleChange}
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button
              type="submit"
              disabled={loading}
              className={loading ? "loading" : ""}
            >
              Submit for approval
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => navigate("/recipes")}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

