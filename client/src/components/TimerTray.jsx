import { useTimers } from "../hooks/useTimers.jsx";
import { formatCountdown } from "../lib/timers.js";
import Icon from "./Icon.jsx";

export default function TimerTray() {
  const { timers, now, removeTimer } = useTimers();
  if (!timers.length) return null;

  return (
    <div className="timer-tray" role="status" aria-live="polite">
      {timers.map((timer) => (
        <div key={timer.id} className={`timer-pill${timer.done ? " done" : ""}`}>
          <Icon name="timer" size={20} />
          <span className="timer-pill-text">
            <strong>{timer.done ? "Time's up!" : formatCountdown(timer.endsAt - now)}</strong>
            <span>
              {timer.label}
              {timer.recipeTitle ? ` · ${timer.recipeTitle}` : ""}
            </span>
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => removeTimer(timer.id)}
            aria-label={timer.done ? "Dismiss timer" : "Cancel timer"}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
