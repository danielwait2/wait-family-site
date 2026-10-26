import { isIngredientHeading } from "../lib/recipes.js";
import { scaleIngredient } from "../lib/quantities.js";
import Icon from "./Icon.jsx";

export default function IngredientList({ ingredients, factor, checked, onToggle }) {
  return (
    <ul className="ingredient-list">
      {ingredients.map((line, index) => {
        if (isIngredientHeading(line)) {
          return (
            <li key={index} className="ingredient-heading">
              {line.replace(/:\s*$/, "")}
            </li>
          );
        }
        const scaled = scaleIngredient(line, factor);
        const isChecked = checked.includes(index);
        return (
          <li key={index}>
            <button
              type="button"
              className={`check-row${isChecked ? " checked" : ""}`}
              role="checkbox"
              aria-checked={isChecked}
              onClick={() => onToggle(index)}
            >
              <span className="check-box" aria-hidden="true">
                {isChecked ? <Icon name="check" size={16} strokeWidth={3} /> : null}
              </span>
              <span className="check-text">
                {scaled.scaled ? (
                  <>
                    <strong className="scaled-amount">{scaled.amount}</strong>
                    {scaled.rest}
                  </>
                ) : (
                  line
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
