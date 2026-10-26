import { all, get, run } from "../db.js";

export const MADE_THIS_STATUSES = ["pending", "approved", "rejected"];

const NAME_MAX = 60;
const NOTE_MAX = 600;

const mapNote = (row) => ({
  id: row.id,
  recipeId: row.recipe_id,
  recipeTitle: row.recipe_title,
  name: row.name,
  note: row.note,
  status: row.status,
  createdAt: row.created_at,
});

const clip = (value, max) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, max) : null;
};

export const listApprovedNotes = async (recipeId) =>
  (
    await all(
      `SELECT id, recipe_id, name, note, status, created_at
       FROM made_this
       WHERE recipe_id = @recipeId AND status = 'approved'
       ORDER BY datetime(created_at) DESC`,
      { recipeId }
    )
  ).map(mapNote);

// Every "I made this" bumps the public counter right away; a name or note
// becomes a story that waits for admin approval.
export const recordMadeThis = async (recipeId, { name, note }) => {
  const recipe = await get(`SELECT id, status FROM recipes WHERE id = @id`, { id: recipeId });
  if (!recipe || recipe.status !== "approved") {
    return null;
  }
  await run(`UPDATE recipes SET likes = likes + 1 WHERE id = @id`, { id: recipeId });

  const cleanName = clip(name, NAME_MAX);
  const cleanNote = clip(note, NOTE_MAX);
  if (cleanName || cleanNote) {
    await run(
      `INSERT INTO made_this (recipe_id, name, note) VALUES (@recipeId, @name, @note)`,
      { recipeId, name: cleanName, note: cleanNote }
    );
  }

  const updated = await get(`SELECT likes FROM recipes WHERE id = @id`, { id: recipeId });
  return { likes: updated.likes, notePending: Boolean(cleanName || cleanNote) };
};

export const listNotesForAdmin = async (status) =>
  (
    await all(
      `SELECT m.id, m.recipe_id, r.title AS recipe_title, m.name, m.note, m.status, m.created_at
       FROM made_this m
       JOIN recipes r ON r.id = m.recipe_id
       ${status ? "WHERE m.status = @status" : ""}
       ORDER BY datetime(m.created_at) DESC`,
      status ? { status } : {}
    )
  ).map(mapNote);

export const setNoteStatus = async (id, status) =>
  (await run(`UPDATE made_this SET status = @status WHERE id = @id`, { id, status })).rowsAffected;

export const deleteNote = async (id) =>
  (await run(`DELETE FROM made_this WHERE id = @id`, { id })).rowsAffected;
