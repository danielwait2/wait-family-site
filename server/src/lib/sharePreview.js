import { get } from "../db.js";

const SITE_NAME = "The Wait Family";
const META_BLOCK = /<!--meta-->[\s\S]*<!--\/meta-->/;
const SHELL_TTL = 5 * 60 * 1000;
let shellCache = { html: null, fetchedAt: 0 };

const escapeHtml = (text = "") =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const originOf = (req) => `${req.get("x-forwarded-proto") || req.protocol}://${req.get("host")}`;

// The SPA shell is a static asset on the same deployment, so fetch it rather
// than bundling it into the function.
const loadShell = async (origin) => {
  if (shellCache.html && Date.now() - shellCache.fetchedAt < SHELL_TTL) {
    return shellCache.html;
  }
  try {
    const response = await fetch(`${origin}/index.html`);
    if (!response.ok) throw new Error(`Shell fetch failed: ${response.status}`);
    shellCache = { html: await response.text(), fetchedAt: Date.now() };
  } catch (error) {
    if (!shellCache.html) throw error;
  }
  return shellCache.html;
};

const buildMeta = ({ title, description, image, url }) =>
  [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join("\n    ");

const summarize = (text = "", max = 180) => {
  const flat = String(text).replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trim()}…` : flat;
};

export const renderRecipeSharePage = async (req) => {
  const origin = originOf(req);
  const shell = await loadShell(origin);
  const recipeId = Number.parseInt(req.params.id, 10);
  const recipe = Number.isNaN(recipeId)
    ? null
    : await get(
        `SELECT title, description, image_url, submitted_by FROM recipes WHERE id = @id AND status = 'approved'`,
        { id: recipeId }
      );
  if (!recipe) {
    return shell;
  }

  const byline = recipe.submitted_by ? `Shared by ${recipe.submitted_by}. ` : "";
  const image = /^https?:\/\//i.test(recipe.image_url || "")
    ? recipe.image_url
    : `${origin}/og-default.png`;

  return shell.replace(
    META_BLOCK,
    `<!--meta-->\n    ${buildMeta({
      title: `${recipe.title} · ${SITE_NAME}`,
      description: summarize(`${byline}${recipe.description || ""}`),
      image,
      url: `${origin}/recipes/${recipeId}`,
    })}\n    <!--/meta-->`
  );
};
