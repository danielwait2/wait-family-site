import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import CookMode from "../components/CookMode.jsx";
import Icon from "../components/Icon.jsx";
import IngredientList from "../components/IngredientList.jsx";
import MadeThis from "../components/MadeThis.jsx";
import StepText from "../components/StepText.jsx";
import { getCachedRecipe } from "../hooks/useRecipes.js";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiGet } from "../services/api.js";
import { readJson, writeJson } from "../lib/storage.js";
import { formatCategory, formatMinutes, totalMinutes } from "../lib/recipes.js";

const emptyProgress = { ingredients: [], steps: [] };

const toggle = (list, index) => (list.includes(index) ? list.filter((i) => i !== index) : [...list, index]);

export default function RecipeDetailPage() {
  const { id } = useParams();
  return <RecipeDetail key={id} recipeId={Number.parseInt(id, 10)} />;
}

function RecipeDetail({ recipeId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [recipe, setRecipe] = useState(() => getCachedRecipe(recipeId));
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [tab, setTab] = useState("ingredients");
  const [scale, setScale] = useState(1);
  const [progress, setProgress] = useState(() => readJson(`recipeProgress:${recipeId}`, emptyProgress));
  const [cookStep, setCookStep] = useState(null);
  const [madeThisOpen, setMadeThisOpen] = useState(false);
  const [toast, setToast] = useState("");
  const madeThisRef = useRef(null);

  usePageTitle(recipe?.title);

  useEffect(() => {
    let active = true;
    apiGet(`/api/recipes/${recipeId}`)
      .then((data) => active && setRecipe(data))
      .catch((err) => active && setError(err.message || "Recipe not found"));
    return () => {
      active = false;
    };
  }, [recipeId]);

  useEffect(() => {
    writeJson(`recipeProgress:${recipeId}`, progress);
  }, [recipeId, progress]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  if (!recipe) {
    return (
      <div className="page">
        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <Link to="/recipes" className="btn btn-primary">
              Back to recipes
            </Link>
          </div>
        ) : (
          <div className="recipe-skeleton" aria-label="Loading recipe">
            <div className="skeleton skeleton-hero" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        )}
      </div>
    );
  }

  const ingredients = recipe.ingredients || [];
  const steps = recipe.steps || [];
  const minutes = totalMinutes(recipe);
  const servings = recipe.serves ? Math.max(1, Math.round(recipe.serves * scale)) : null;
  const factor = recipe.serves ? servings / recipe.serves : scale;
  const hasProgress = progress.ingredients.length > 0 || progress.steps.length > 0;

  const changeScale = (direction) => {
    setScale((current) => {
      if (!recipe.serves) return Math.max(0.5, current + direction * 0.5);
      return Math.max(1, Math.round(recipe.serves * current) + direction) / recipe.serves;
    });
  };

  const goBack = () => (location.key !== "default" ? navigate(-1) : navigate("/recipes"));

  const share = async () => {
    const url = `${window.location.origin}/recipes/${recipe.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
    } catch (err) {
      if (err.name !== "AbortError") setToast("Couldn't share. Try copying the address.");
    }
  };

  const startCooking = () => {
    const firstUndone = steps.findIndex((_, index) => !progress.steps.includes(index));
    setCookStep(firstUndone === -1 ? 0 : firstUndone);
  };

  const finishCooking = () => {
    setCookStep(null);
    setMadeThisOpen(true);
    requestAnimationFrame(() => madeThisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const facts = [
    recipe.prepTime && { label: "Prep", value: formatMinutes(recipe.prepTime) },
    recipe.cookTime && { label: "Cook", value: formatMinutes(recipe.cookTime) },
    recipe.prepTime && recipe.cookTime && { label: "Total", value: formatMinutes(minutes) },
    recipe.serves && { label: "Serves", value: recipe.serves },
  ].filter(Boolean);

  return (
    <article className="page recipe" data-tab={tab}>
      <button type="button" className="back-link" onClick={goBack}>
        <Icon name="left" size={20} />
        Recipes
      </button>

      <div className="recipe-intro">
        {recipe.imageUrl && !imageFailed ? (
          <div className="recipe-hero">
            <img src={recipe.imageUrl} alt={recipe.title} onError={() => setImageFailed(true)} />
          </div>
        ) : null}

        <header className="recipe-header">
          <Link to={`/recipes?category=${recipe.category}`} className="eyebrow eyebrow-link">
            {formatCategory(recipe.category)}
          </Link>
          <h1>{recipe.title}</h1>
          {recipe.submittedBy ? <p className="recipe-byline">From {recipe.submittedBy}&rsquo;s kitchen</p> : null}
          {recipe.description ? <p className="recipe-description">{recipe.description}</p> : null}

          {facts.length ? (
            <dl className="recipe-facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="recipe-actions">
            {steps.length ? (
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={startCooking}>
                <Icon name="chef" size={22} />
                Start cooking
              </button>
            ) : null}
            <div className="recipe-actions-row">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setMadeThisOpen(true);
                  madeThisRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Icon name="heart" size={18} />
                Made it{recipe.likes ? ` · ${recipe.likes}` : ""}
              </button>
              <button type="button" className="btn btn-ghost" onClick={share}>
                <Icon name="share" size={18} />
                Share
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                <Icon name="printer" size={18} />
                Print
              </button>
            </div>
          </div>
        </header>
      </div>

      <div className="recipe-tabs" role="tablist" aria-label="Recipe sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "ingredients"}
          className={tab === "ingredients" ? "active" : undefined}
          onClick={() => setTab("ingredients")}
        >
          Ingredients <span>{ingredients.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "steps"}
          className={tab === "steps" ? "active" : undefined}
          onClick={() => setTab("steps")}
        >
          Steps <span>{steps.length}</span>
        </button>
      </div>

      <div className="recipe-body">
        <section className="recipe-panel panel-ingredients" aria-labelledby="ingredients-heading">
          <div className="panel-head">
            <h2 id="ingredients-heading">Ingredients</h2>
            <div className="scaler" aria-label="Adjust servings">
              <button type="button" className="icon-btn" onClick={() => changeScale(-1)} aria-label="Fewer servings" disabled={recipe.serves ? servings <= 1 : scale <= 0.5}>
                <Icon name="minus" size={18} />
              </button>
              <span className="scaler-value">
                {recipe.serves ? (
                  <>
                    <strong>{servings}</strong> servings
                  </>
                ) : (
                  <>
                    <strong>{scale}×</strong> batch
                  </>
                )}
              </span>
              <button type="button" className="icon-btn" onClick={() => changeScale(1)} aria-label="More servings">
                <Icon name="plus" size={18} />
              </button>
            </div>
          </div>
          {factor !== 1 ? (
            <p className="scaler-note">
              Amounts adjusted.{" "}
              <button type="button" className="link-btn" onClick={() => setScale(1)}>
                Reset to original
              </button>
            </p>
          ) : null}
          <IngredientList
            ingredients={ingredients}
            factor={factor}
            checked={progress.ingredients}
            onToggle={(index) => setProgress((p) => ({ ...p, ingredients: toggle(p.ingredients, index) }))}
          />
        </section>

        <section className="recipe-panel panel-steps" aria-labelledby="steps-heading">
          <div className="panel-head">
            <h2 id="steps-heading">Steps</h2>
          </div>
          <ol className="step-list">
            {steps.map((step, index) => {
              const done = progress.steps.includes(index);
              return (
                <li key={index} className={done ? "done" : undefined}>
                  <button
                    type="button"
                    className="step-number"
                    onClick={() => setProgress((p) => ({ ...p, steps: toggle(p.steps, index) }))}
                    aria-label={done ? `Mark step ${index + 1} not done` : `Mark step ${index + 1} done`}
                    aria-pressed={done}
                  >
                    {done ? <Icon name="check" size={18} strokeWidth={3} /> : index + 1}
                  </button>
                  <p>
                    <StepText text={step} recipeTitle={recipe.title} />
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      {hasProgress ? (
        <p className="progress-reset">
          <button type="button" className="link-btn" onClick={() => setProgress(emptyProgress)}>
            Clear checkmarks
          </button>
        </p>
      ) : null}

      <MadeThis
        ref={madeThisRef}
        recipe={recipe}
        open={madeThisOpen}
        onOpenChange={setMadeThisOpen}
        onCounted={(likes) => setRecipe((current) => ({ ...current, likes }))}
      />

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}

      {cookStep !== null ? (
        <CookMode
          recipe={recipe}
          startStep={cookStep}
          factor={factor}
          checked={progress.ingredients}
          onToggleIngredient={(index) => setProgress((p) => ({ ...p, ingredients: toggle(p.ingredients, index) }))}
          onClose={() => setCookStep(null)}
          onFinish={finishCooking}
        />
      ) : null}
    </article>
  );
}
