import { useState } from "react";
import { Link } from "react-router-dom";
import { firstName, formatMinutes, totalMinutes } from "../lib/recipes.js";
import Icon from "./Icon.jsx";

export default function RecipeCard({ recipe }) {
  const [imageFailed, setImageFailed] = useState(false);
  const minutes = totalMinutes(recipe);
  const showImage = recipe.imageUrl && !imageFailed;

  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-media">
        {showImage ? (
          <img src={recipe.imageUrl} alt="" loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
        ) : (
          <span className="recipe-card-fallback" aria-hidden="true">
            {recipe.title.replace(/[^\p{L}]/gu, "").charAt(0) || "W"}
          </span>
        )}
      </div>
      <div className="recipe-card-body">
        <h3 className="recipe-card-title">{recipe.title}</h3>
        <p className="recipe-card-meta">
          {minutes ? (
            <span>
              <Icon name="clock" size={15} />
              {formatMinutes(minutes)}
            </span>
          ) : null}
          {recipe.submittedBy ? <span>{firstName(recipe.submittedBy)}</span> : null}
          {recipe.likes > 0 ? (
            <span className="recipe-card-made" title={`Made ${recipe.likes} times`}>
              <Icon name="heart" size={14} />
              {recipe.likes}
            </span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}
