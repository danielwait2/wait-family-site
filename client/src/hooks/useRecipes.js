import { useEffect, useState } from "react";
import { apiGet } from "../services/api.js";

let cache = null;
let inflight = null;

const fetchRecipes = () => {
  inflight =
    inflight ||
    apiGet("/api/recipes")
      .then((data) => {
        cache = data;
        return data;
      })
      .finally(() => {
        inflight = null;
      });
  return inflight;
};

// Shared across pages so going back to the list is instant; refreshed
// quietly on every mount.
export default function useRecipes() {
  const [recipes, setRecipes] = useState(cache);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchRecipes()
      .then((data) => active && setRecipes(data))
      .catch((err) => active && !cache && setError(err.message || "Could not load recipes"));
    return () => {
      active = false;
    };
  }, []);

  return { recipes: recipes || [], loading: !recipes && !error, error };
}

export const getCachedRecipe = (id) => cache?.find((recipe) => recipe.id === id) || null;
