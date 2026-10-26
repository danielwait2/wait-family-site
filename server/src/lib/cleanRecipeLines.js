const BULLET_PREFIX = /^(?:[▢☐□•·*\-–—]+[\s ]*)+/;
const STEP_NUMBER_PREFIX = /^(?:step\s*)?\d+\s*[.):]\s*/i;
const DIVIDER_ONLY = /^[\s⸻—–_\-=*~]*$/;

const cleanLine = (line, { isStep }) => {
  let text = String(line)
    .replace(/ /g, " ")
    .replace(/,{2,}/g, ",")
    .replace(/\s+/g, " ")
    .trim()
    .replace(BULLET_PREFIX, "");
  if (isStep) {
    text = text.replace(STEP_NUMBER_PREFIX, "");
  }
  text = text.trim();
  return DIVIDER_ONLY.test(text) ? "" : text;
};

export const cleanIngredients = (lines) =>
  lines.map((line) => cleanLine(line, { isStep: false })).filter(Boolean);

export const cleanSteps = (lines) =>
  lines.map((line) => cleanLine(line, { isStep: true })).filter(Boolean);
