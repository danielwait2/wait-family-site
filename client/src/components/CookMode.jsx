import { useEffect, useRef, useState } from "react";
import useWakeLock, { wakeLockSupported } from "../hooks/useWakeLock.js";
import Icon from "./Icon.jsx";
import IngredientList from "./IngredientList.jsx";
import StepText from "./StepText.jsx";

const SWIPE_DISTANCE = 60;

export default function CookMode({ recipe, startStep, factor, checked, onToggleIngredient, onClose, onFinish }) {
  const [step, setStep] = useState(startStep);
  const [showIngredients, setShowIngredients] = useState(false);
  const wakeLocked = useWakeLock(true);
  const touchStart = useRef(null);
  const closeRef = useRef(null);
  const steps = recipe.steps || [];
  const isLast = step === steps.length - 1;

  const go = (delta) => setStep((current) => Math.min(steps.length - 1, Math.max(0, current + delta)));

  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const onTouchStart = (event) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="cook-mode" role="dialog" aria-modal="true" aria-label={`Cooking ${recipe.title}`}>
      <div className="cook-top">
        <button ref={closeRef} type="button" className="icon-btn icon-btn-lg" onClick={onClose} aria-label="Exit cook mode">
          <Icon name="x" size={26} />
        </button>
        <div className="cook-title">
          <strong>{recipe.title}</strong>
          <span>
            {wakeLocked ? (
              <>
                <Icon name="sun" size={14} /> Screen stays on
              </>
            ) : wakeLockSupported ? (
              "Keeping screen on…"
            ) : (
              "Tip: turn off auto lock while you cook"
            )}
          </span>
        </div>
        <button
          type="button"
          className={`btn btn-soft btn-sm${showIngredients ? " active" : ""}`}
          onClick={() => setShowIngredients((open) => !open)}
          aria-expanded={showIngredients}
        >
          <Icon name="list" size={18} />
          Ingredients
        </button>
      </div>

      <div className="cook-progress" aria-hidden="true">
        {steps.map((_, index) => (
          <span key={index} className={index <= step ? "on" : undefined} />
        ))}
      </div>

      {showIngredients ? (
        <div className="cook-ingredients">
          <IngredientList
            ingredients={recipe.ingredients || []}
            factor={factor}
            checked={checked}
            onToggle={onToggleIngredient}
          />
        </div>
      ) : (
        <div className="cook-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite">
          <p className="cook-step-label">
            Step {step + 1} of {steps.length}
          </p>
          <p className="cook-step-text">
            <StepText text={steps[step] || ""} recipeTitle={recipe.title} />
          </p>
        </div>
      )}

      <div className="cook-nav">
        <button type="button" className="btn btn-ghost btn-lg" onClick={() => go(-1)} disabled={step === 0}>
          <Icon name="left" size={22} />
          Back
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary btn-lg" onClick={onFinish}>
            <Icon name="check" size={22} />
            Done
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-lg" onClick={() => go(1)}>
            Next
            <Icon name="right" size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
