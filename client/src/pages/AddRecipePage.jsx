import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { RECIPE_CATEGORIES } from "../lib/recipes.js";
import { apiPost } from "../services/api.js";

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
  usePageTitle("Share a recipe");
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
        prepTime: form.prepTime.trim()
          ? parseInt(form.prepTime, 10)
          : undefined,
        cookTime: form.cookTime.trim()
          ? parseInt(form.cookTime, 10)
          : undefined,
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
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    setStatus({ type: "", message: "" });
    setForm(emptyForm);
  };

  return (
    <div className="page page-narrow">
      <Link to="/recipes" className="back-link">
        <Icon name="left" size={20} />
        Recipes
      </Link>
      <div className="page-head">
        <div>
          <h1>Share a recipe</h1>
          <p className="page-sub">
            Add a family favorite to the cookbook. An admin takes a quick look before it goes up.
          </p>
        </div>
      </div>

      <div>
        {status.type === "success" ? (
          <div className="empty-state">
            <p className={`status-message ${status.type}`}>
              {status.message}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddAnother}
            >
              Share another
            </button>
          </div>
        ) : (
          <>
            {status.message && status.type === "error" ? (
              <p className={`status-message ${status.type}`}>
                {status.message}
              </p>
            ) : null}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="submittedBy">Your name</label>
                <input
                  id="submittedBy"
                  name="submittedBy"
                  placeholder="e.g., Sarah Wait"
                  value={form.submittedBy}
                  onChange={handleChange}
                />
                <p className="field-hint">So everyone knows whose kitchen it came from.</p>
              </div>
              <div className="form-group">
                <label htmlFor="title">Recipe name</label>
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
                <label htmlFor="description">The story behind it</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Where it came from, why you love it, who made it first…"
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
              <div className="form-row-3">
                <div className="form-group">
                  <label htmlFor="prepTime">Prep (min)</label>
                  <input
                    id="prepTime"
                    name="prepTime"
                    type="number"
                    min="0"
                    max="4320"
                    placeholder="e.g., 15"
                    value={form.prepTime}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cookTime">Cook (min)</label>
                  <input
                    id="cookTime"
                    name="cookTime"
                    type="number"
                    min="0"
                    max="4320"
                    placeholder="e.g., 30"
                    value={form.cookTime}
                    onChange={handleChange}
                  />
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
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="ingredients">Ingredients</label>
                <p className="field-hint">One per line. Paste straight from a website and we&rsquo;ll tidy it up.</p>
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
                <label htmlFor="steps">Steps</label>
                <p className="field-hint">One step per line.</p>
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
                <label htmlFor="imageUrl">Photo link (optional)</label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  placeholder="https://example.com/image.jpg"
                  value={form.imageUrl}
                  onChange={handleChange}
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                >
                  {loading ? "Sending…" : "Submit recipe"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={() => navigate("/recipes")}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
