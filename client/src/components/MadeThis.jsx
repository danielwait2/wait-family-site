import { forwardRef, useState } from "react";
import { apiPost } from "../services/api.js";
import { readJson, writeJson } from "../lib/storage.js";
import Icon from "./Icon.jsx";

const NAME_KEY = "madeThisName";

const formatMonth = (value) => {
  const date = new Date(`${String(value).replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
};

const MadeThis = forwardRef(function MadeThis({ recipe, open, onOpenChange, onCounted }, ref) {
  const [name, setName] = useState(() => readJson(NAME_KEY, ""));
  const [note, setNote] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });
  const notes = recipe.madeThis || [];

  const submit = async (event) => {
    event.preventDefault();
    setState({ status: "saving", message: "" });
    try {
      const result = await apiPost(`/api/recipes/${recipe.id}/made-this`, { name, note });
      writeJson(NAME_KEY, name.trim());
      onCounted(result.likes);
      setNote("");
      onOpenChange(false);
      setState({
        status: "done",
        message: result.notePending
          ? "Thank you! Your note will appear here once it's approved."
          : "Thank you! We counted it.",
      });
    } catch (error) {
      setState({ status: "error", message: error.message || "Something went wrong. Please try again." });
    }
  };

  return (
    <section className="made-this" ref={ref} aria-labelledby="made-this-heading">
      <div className="made-this-head">
        <h2 id="made-this-heading">I made this</h2>
        {recipe.likes > 0 ? (
          <p className="made-this-count">
            <Icon name="heart" size={16} />
            Made {recipe.likes} {recipe.likes === 1 ? "time" : "times"} by the family
          </p>
        ) : (
          <p className="made-this-count">Be the first to make it.</p>
        )}
      </div>

      {notes.length ? (
        <ul className="made-this-notes">
          {notes.map((item) => (
            <li key={item.id}>
              <p className="made-this-who">
                <strong>{item.name || "Someone in the family"}</strong>
                <span>{formatMonth(item.createdAt)}</span>
              </p>
              {item.note ? <p className="made-this-note">{item.note}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}

      {state.status === "done" ? <p className="status-message success">{state.message}</p> : null}

      {open ? (
        <form className="made-this-form" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="made-name">Your name (optional)</label>
            <input
              id="made-name"
              autoComplete="given-name"
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Grandma Sandra"
            />
          </div>
          <div className="form-group">
            <label htmlFor="made-note">How did it go? (optional)</label>
            <textarea
              id="made-note"
              rows={3}
              maxLength={600}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Doubled the garlic, everyone loved it…"
            />
          </div>
          {state.status === "error" ? <p className="status-message error">{state.message}</p> : null}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={state.status === "saving"}>
              {state.status === "saving" ? "Saving…" : "I made it!"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn btn-soft" onClick={() => onOpenChange(true)}>
          <Icon name="heart" size={18} />
          {state.status === "done" ? "Made it again" : "I made this"}
        </button>
      )}
    </section>
  );
});

export default MadeThis;
