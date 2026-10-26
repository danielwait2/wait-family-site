const UNICODE_FRACTIONS = {
  "½": 1 / 2, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 1 / 4, "¾": 3 / 4, "⅕": 1 / 5,
  "⅖": 2 / 5, "⅗": 3 / 5, "⅘": 4 / 5, "⅙": 1 / 6, "⅚": 5 / 6, "⅛": 1 / 8,
  "⅜": 3 / 8, "⅝": 5 / 8, "⅞": 7 / 8,
};
const GLYPHS = Object.keys(UNICODE_FRACTIONS).join("");

const NUMBER = `(?:\\d+\\s+\\d+\\s*[\\/⁄]\\s*\\d+|\\d+\\s*[\\/⁄]\\s*\\d+|\\d*[${GLYPHS}]|\\d+(?:\\.\\d+)?)`;
const LEADING_QUANTITY = new RegExp(`^(${NUMBER})(?:(\\s*(?:-|–|to)\\s*)(${NUMBER}))?`);

const parseNumber = (token) => {
  const text = token.replace(/⁄/g, "/").replace(/\s+/g, " ").trim();
  const glyph = text.slice(-1);
  if (UNICODE_FRACTIONS[glyph] !== undefined) {
    return (Number(text.slice(0, -1)) || 0) + UNICODE_FRACTIONS[glyph];
  }
  const mixed = text.match(/^(\d+) (\d+) ?\/ ?(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = text.match(/^(\d+) ?\/ ?(\d+)$/);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : NaN;
  return Number(text);
};

const NICE_FRACTIONS = [
  [0, ""], [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"],
  [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"], [1, ""],
];

export const formatQuantity = (value) => {
  if (value >= 20) return String(Math.round(value));
  let whole = Math.floor(value);
  const remainder = value - whole;
  const [fracValue, glyph] = NICE_FRACTIONS.reduce((best, candidate) =>
    Math.abs(candidate[0] - remainder) < Math.abs(best[0] - remainder) ? candidate : best
  );
  if (fracValue === 1) whole += 1;
  if (!whole && !glyph) return value > 0 ? "⅛" : "0";
  return `${whole || ""}${glyph}`;
};

export const scaleIngredient = (line, factor) => {
  if (factor === 1) return { text: line, scaled: false };
  const match = line.match(LEADING_QUANTITY);
  if (!match) return { text: line, scaled: false };
  const [whole, first, separator, second] = match;
  const low = parseNumber(first);
  if (!Number.isFinite(low)) return { text: line, scaled: false };
  let amount = formatQuantity(low * factor);
  if (second) {
    const high = parseNumber(second);
    if (Number.isFinite(high)) amount += `${separator.trim() === "to" ? " to " : "–"}${formatQuantity(high * factor)}`;
  }
  return { text: amount + line.slice(whole.length), amount, rest: line.slice(whole.length), scaled: true };
};
