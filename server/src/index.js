import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { all, run } from "./db.js";

dotenv.config();

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:3000,http://localhost:5173,https://thewaitfamily.com,https://www.thewaitfamily.com"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const RECIPE_STATUSES = ["pending", "approved", "rejected"];
const RECIPE_CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "salad",
  "side",
  "snack",
  "beverage",
  "appetizer",
  "other",
];
const activeTokens = new Map();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

const requireAdmin = (req, res, next) => {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res
      .status(500)
      .json({ message: "Admin credentials missing on server" });
  }
  // Check for token in cookie first, then Authorization header (for backward compatibility)
  const tokenFromCookie = req.cookies?.adminToken;
  const authHeader = req.header("authorization") || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const token = tokenFromCookie || tokenFromHeader;

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

const sanitizeArray = (value, label) => {
  if (!Array.isArray(value) || !value.length) {
    throw new Error(`${label} must be a non-empty array`);
  }
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const parseJson = (value) => {
  if (value == null) {
    return value;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
  return value;
};

const mapRecipe = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  ingredients: parseJson(row.ingredients),
  steps: parseJson(row.steps),
  imageUrl: row.image_url,
  category: row.category || "dinner",
  submittedBy: row.submitted_by || null,
  prepTime: row.prep_time || null,
  cookTime: row.cook_time || null,
  serves: row.serves || null,
  status: row.status,
  createdAt: row.created_at,
});

const mapFamilyItem = (row) => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  content: row.content,
  mediaType: row.media_type,
  mediaUrl: row.media_url,
  isPublished: Boolean(Number(row.is_published)),
  createdAt: row.created_at,
});

const fieldMap = {
  title: "title",
  summary: "summary",
  content: "content",
  mediaType: "media_type",
  mediaUrl: "media_url",
  isPublished: "is_published",
};

const toNullableString = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text || null;
};

const toBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return Boolean(value);
};

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Check authentication status endpoint (public, but returns auth status)
app.get("/api/admin/check-auth", (req, res) => {
  const tokenFromCookie = req.cookies?.adminToken;
  const authHeader = req.header("authorization") || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const token = tokenFromCookie || tokenFromHeader;

  const isAuthenticated = token && activeTokens.has(token);
  res.json({ authenticated: isAuthenticated });
});

app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return res
      .status(500)
      .json({ message: "Admin credentials missing on server" });
  }
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = crypto.randomBytes(48).toString("hex");
  activeTokens.set(token, Date.now());

  // Set HTTP-only cookie for persistent authentication
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("adminToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  });

  return res.json({ token, message: "Signed in successfully" });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  const tokenFromCookie = req.cookies?.adminToken;
  const authHeader = req.header("authorization") || "";
  const tokenFromHeader = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const token = tokenFromCookie || tokenFromHeader;

  if (token) {
    activeTokens.delete(token);
  }

  // Clear the cookie
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res.json({ message: "Logged out" });
});

app.get("/api/recipes", (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = `SELECT id, title, description, ingredients, steps, image_url, category, submitted_by, prep_time, cook_time, serves, status, created_at
                 FROM recipes
                 WHERE status = @status`;
    const params = { status: "approved" };

    // Filter by category
    if (category && RECIPE_CATEGORIES.includes(category)) {
      query += " AND category = @category";
      params.category = category;
    }

    // Search functionality
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ` AND (
        title LIKE @search
        OR description LIKE @search
        OR ingredients LIKE @search
      )`;
      params.search = searchTerm;
    }

    query += " ORDER BY datetime(created_at) DESC";

    const rows = all(query, params);
    res.json(rows.map(mapRecipe));
  } catch (error) {
    next(error);
  }
});

app.post("/api/recipes", (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    const ingredients = sanitizeArray(req.body.ingredients, "Ingredients");
    const steps = sanitizeArray(req.body.steps, "Steps");

    const imageUrl = req.body.imageUrl
      ? String(req.body.imageUrl).trim()
      : null;
    const category = (req.body.category || "dinner").toLowerCase();
    const submittedBy = req.body.submittedBy
      ? String(req.body.submittedBy).trim()
      : null;
    const prepTime = req.body.prepTime ? parseInt(req.body.prepTime, 10) : null;
    const cookTime = req.body.cookTime ? parseInt(req.body.cookTime, 10) : null;
    const serves = req.body.serves ? parseInt(req.body.serves, 10) : null;

    if (!RECIPE_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (prepTime !== null && (isNaN(prepTime) || prepTime < 0)) {
      return res
        .status(400)
        .json({ message: "Prep time must be a positive number" });
    }

    if (cookTime !== null && (isNaN(cookTime) || cookTime < 0)) {
      return res
        .status(400)
        .json({ message: "Cook time must be a positive number" });
    }

    if (serves !== null && (isNaN(serves) || serves < 1)) {
      return res
        .status(400)
        .json({ message: "Serves must be a positive number" });
    }

    const result = run(
      `INSERT INTO recipes (title, description, ingredients, steps, image_url, category, submitted_by, prep_time, cook_time, serves)
       VALUES (@title, @description, @ingredients, @steps, @image_url, @category, @submitted_by, @prep_time, @cook_time, @serves)`,
      {
        title,
        description,
        ingredients: JSON.stringify(ingredients),
        steps: JSON.stringify(steps),
        image_url: imageUrl,
        category,
        submitted_by: submittedBy,
        prep_time: prepTime,
        cook_time: cookTime,
        serves: serves,
      }
    );

    res.status(201).json({
      message: "Recipe submitted for review",
      recipeId: result.lastInsertRowid,
      status: "pending",
    });
  } catch (error) {
    if (
      error.message.includes("Ingredients") ||
      error.message.includes("Steps")
    ) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

app.get("/api/family", (_req, res, next) => {
  try {
    const rows = all(
      `SELECT id, title, summary, content, media_type, media_url, is_published, created_at
       FROM family_items
       WHERE is_published = 1
       ORDER BY datetime(created_at) DESC`
    );
    res.json(rows.map(mapFamilyItem));
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/recipes", requireAdmin, (req, res, next) => {
  const { status } = req.query;
  try {
    let filter = "";
    const params = {};
    if (status) {
      if (!RECIPE_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      filter = "WHERE status = @status";
      params.status = status;
    }
    const rows = all(
      `SELECT id, title, description, ingredients, steps, image_url, category, submitted_by, prep_time, cook_time, serves, status, created_at
       FROM recipes
       ${filter}
       ORDER BY datetime(created_at) DESC`,
      params
    );
    res.json(rows.map(mapRecipe));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/recipes/:id", requireAdmin, (req, res, next) => {
  const recipeId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(recipeId)) {
    return res.status(400).json({ message: "Invalid recipe id" });
  }

  try {
    const updates = [];
    const params = { id: recipeId };

    // Handle status update
    if (req.body.status !== undefined) {
      const status = req.body.status;
      if (!RECIPE_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      updates.push("status = @status");
      params.status = status;
    }

    // Handle other field updates
    if (req.body.title !== undefined) {
      updates.push("title = @title");
      params.title = String(req.body.title).trim();
    }
    if (req.body.description !== undefined) {
      updates.push("description = @description");
      params.description = String(req.body.description).trim();
    }
    if (req.body.ingredients !== undefined) {
      const ingredients = sanitizeArray(req.body.ingredients, "Ingredients");
      updates.push("ingredients = @ingredients");
      params.ingredients = JSON.stringify(ingredients);
    }
    if (req.body.steps !== undefined) {
      const steps = sanitizeArray(req.body.steps, "Steps");
      updates.push("steps = @steps");
      params.steps = JSON.stringify(steps);
    }
    if (req.body.imageUrl !== undefined) {
      updates.push("image_url = @image_url");
      params.image_url = req.body.imageUrl
        ? String(req.body.imageUrl).trim()
        : null;
    }
    if (req.body.category !== undefined) {
      const category = String(req.body.category).toLowerCase();
      if (!RECIPE_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: "Invalid category" });
      }
      updates.push("category = @category");
      params.category = category;
    }
    if (req.body.submittedBy !== undefined) {
      updates.push("submitted_by = @submitted_by");
      params.submitted_by = req.body.submittedBy
        ? String(req.body.submittedBy).trim()
        : null;
    }
    if (req.body.prepTime !== undefined) {
      const prepTime = req.body.prepTime
        ? parseInt(req.body.prepTime, 10)
        : null;
      if (prepTime !== null && (isNaN(prepTime) || prepTime < 0)) {
        return res
          .status(400)
          .json({ message: "Prep time must be a positive number" });
      }
      updates.push("prep_time = @prep_time");
      params.prep_time = prepTime;
    }
    if (req.body.cookTime !== undefined) {
      const cookTime = req.body.cookTime
        ? parseInt(req.body.cookTime, 10)
        : null;
      if (cookTime !== null && (isNaN(cookTime) || cookTime < 0)) {
        return res
          .status(400)
          .json({ message: "Cook time must be a positive number" });
      }
      updates.push("cook_time = @cook_time");
      params.cook_time = cookTime;
    }
    if (req.body.serves !== undefined) {
      const serves = req.body.serves ? parseInt(req.body.serves, 10) : null;
      if (serves !== null && (isNaN(serves) || serves < 1)) {
        return res
          .status(400)
          .json({ message: "Serves must be a positive number" });
      }
      updates.push("serves = @serves");
      params.serves = serves;
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const result = run(
      `UPDATE recipes SET ${updates.join(", ")} WHERE id = @id`,
      params
    );
    if (!result.changes) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json({ id: recipeId, message: "Recipe updated" });
  } catch (error) {
    if (
      error.message.includes("Ingredients") ||
      error.message.includes("Steps")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

app.delete("/api/admin/recipes/:id", requireAdmin, (req, res, next) => {
  const recipeId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(recipeId)) {
    return res.status(400).json({ message: "Invalid recipe id" });
  }

  try {
    const result = run("DELETE FROM recipes WHERE id = @id", { id: recipeId });
    if (!result.changes) {
      return res.status(404).json({ message: "Recipe not found" });
    }
    res.json({ message: "Recipe deleted", id: recipeId });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/family", requireAdmin, (_req, res, next) => {
  try {
    const rows = all(
      `SELECT id, title, summary, content, media_type, media_url, is_published, created_at
       FROM family_items
       ORDER BY datetime(created_at) DESC`
    );
    res.json(rows.map(mapFamilyItem));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/family", requireAdmin, (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const summary = String(req.body.summary || "").trim();
    const mediaType = (req.body.mediaType || "article").toLowerCase();

    if (!title || !summary) {
      return res
        .status(400)
        .json({ message: "Title and summary are required" });
    }
    if (!["video", "article"].includes(mediaType)) {
      return res.status(400).json({ message: "Invalid media type" });
    }

    const result = run(
      `INSERT INTO family_items (title, summary, content, media_type, media_url, is_published)
       VALUES (@title, @summary, @content, @media_type, @media_url, 1)`,
      {
        title,
        summary,
        content: toNullableString(req.body.content),
        media_type: mediaType,
        media_url: toNullableString(req.body.mediaUrl),
      }
    );

    res
      .status(201)
      .json({ message: "Entry published", id: result.lastInsertRowid });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/family/:id", requireAdmin, (req, res, next) => {
  const entryId = Number.parseInt(req.params.id, 10);
  if (Number.isNaN(entryId)) {
    return res.status(400).json({ message: "Invalid entry id" });
  }

  const updates = [];
  const params = { id: entryId };

  Object.entries(fieldMap).forEach(([key, column]) => {
    if (req.body[key] === undefined) {
      return;
    }
    const paramKey = `${column}_${updates.length}`;
    if (key === "mediaType") {
      const normalizedType = String(req.body[key]).toLowerCase();
      if (!["video", "article"].includes(normalizedType)) {
        throw new Error("Invalid media type");
      }
      updates.push(`${column} = @${paramKey}`);
      params[paramKey] = normalizedType;
      return;
    }
    updates.push(`${column} = @${paramKey}`);
    params[paramKey] =
      key === "isPublished"
        ? toBoolean(req.body[key])
          ? 1
          : 0
        : toNullableString(req.body[key]);
  });

  if (!updates.length) {
    return res.status(400).json({ message: "No valid fields supplied" });
  }

  try {
    const result = run(
      `UPDATE family_items SET ${updates.join(", ")} WHERE id = @id`,
      params
    );
    if (!result.changes) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Entry updated" });
  } catch (error) {
    if (error.message === "Invalid media type") {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API ready on port ${PORT}`);
});
