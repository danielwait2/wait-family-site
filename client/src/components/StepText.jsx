import { useTimers } from "../hooks/useTimers.jsx";
import { splitTimers } from "../lib/timers.js";
import Icon from "./Icon.jsx";

export default function StepText({ text, recipeTitle }) {
  const { startTimer } = useTimers();

  return splitTimers(text).map((part, index) =>
    typeof part === "string" ? (
      <span key={index}>{part}</span>
    ) : (
      <button
        key={index}
        type="button"
        className="timer-chip"
        onClick={(event) => {
          event.stopPropagation();
          startTimer(part.seconds, part.label, recipeTitle);
        }}
        aria-label={`Start a ${part.label} timer`}
      >
        <Icon name="timer" size={16} />
        {part.text}
      </button>
    )
  );
}
