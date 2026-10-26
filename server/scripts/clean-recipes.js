import { all, run } from "../src/db.js";
import { cleanIngredients, cleanSteps } from "../src/lib/cleanRecipeLines.js";

const apply = process.argv.includes("--apply");
const rows = await all("SELECT id, title, ingredients, steps FROM recipes");
let changed = 0;

for (const row of rows) {
  const ingredients = JSON.parse(row.ingredients);
  const steps = JSON.parse(row.steps);
  const nextIngredients = cleanIngredients(ingredients);
  const nextSteps = cleanSteps(steps);
  if (
    JSON.stringify(nextIngredients) === JSON.stringify(ingredients) &&
    JSON.stringify(nextSteps) === JSON.stringify(steps)
  ) {
    continue;
  }
  changed += 1;
  console.log(`\n# ${row.id} ${row.title}`);
  [...ingredients, ...steps].forEach((before, i) => {
    const after = [...ingredients.map((l) => cleanIngredients([l])[0]), ...steps.map((l) => cleanSteps([l])[0])][i];
    if (before !== after) console.log(`  - ${JSON.stringify(before)}\n  + ${JSON.stringify(after ?? "(removed)")}`);
  });
  if (apply) {
    await run("UPDATE recipes SET ingredients = @ingredients, steps = @steps WHERE id = @id", {
      id: row.id,
      ingredients: JSON.stringify(nextIngredients),
      steps: JSON.stringify(nextSteps),
    });
  }
}

console.log(`\n${changed} recipes ${apply ? "updated" : "would change (dry run, pass --apply)"}`);
