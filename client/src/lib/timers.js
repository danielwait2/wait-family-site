const DURATION = /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(?:more\s+)?(hours?|hrs?|minutes?|mins?|seconds?|secs?)\b/gi;

const UNIT_SECONDS = { h: 3600, m: 60, s: 1 };

const formatLabel = (seconds) => {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    return mins ? `${hours} hr ${mins} min` : `${hours} hr`;
  }
  if (seconds >= 60) return `${Math.round(seconds / 60)} min`;
  return `${seconds} sec`;
};

// Splits step text into plain strings and { seconds, label, text } timer
// tokens. Ranges ("20 to 25 minutes") start at the low end so you check early.
export const splitTimers = (text) => {
  const parts = [];
  let lastIndex = 0;
  for (const match of text.matchAll(DURATION)) {
    const seconds = Math.round(Number(match[1]) * UNIT_SECONDS[match[3][0].toLowerCase()]);
    if (!seconds || seconds > 24 * 3600) continue;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push({ seconds, label: formatLabel(seconds), text: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

export const formatCountdown = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(mins).padStart(2, "0")}:${secs}` : `${mins}:${secs}`;
};
