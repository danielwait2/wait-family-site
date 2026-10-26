import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecipeCard from '../components/RecipeCard.jsx';
import Icon from '../components/Icon.jsx';
import InstallTip from '../components/InstallTip.jsx';
import useRecipes from '../hooks/useRecipes.js';
import usePageTitle from '../hooks/usePageTitle.js';
import { RECIPE_CATEGORIES } from '../lib/recipes.js';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function HomePage() {
  usePageTitle('');
  const navigate = useNavigate();
  const { recipes, loading } = useRecipes();
  const [query, setQuery] = useState('');

  const recent = recipes.slice(0, 8);
  const favorites = useMemo(
    () => [...recipes].filter((recipe) => recipe.likes > 0).sort((a, b) => b.likes - a.likes).slice(0, 8),
    [recipes]
  );
  const categories = RECIPE_CATEGORIES.filter((cat) => recipes.some((recipe) => recipe.category === cat.value));

  const surpriseMe = () => {
    if (!recipes.length) return;
    navigate(`/recipes/${recipes[Math.floor(Math.random() * recipes.length)].id}`);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/recipes?q=${encodeURIComponent(query.trim())}` : '/recipes');
  };

  return (
    <div className="page home">
      <section className="home-hero">
        <p className="eyebrow">{greeting()}</p>
        <h1>What&rsquo;s cooking in the Wait kitchen?</h1>
        <form className="search-field search-field-lg" onSubmit={submitSearch} role="search">
          <Icon name="search" size={22} />
          <label htmlFor="home-search" className="visually-hidden">
            Search recipes
          </label>
          <input
            id="home-search"
            type="search"
            enterKeyHint="search"
            placeholder="Find a family recipe"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <div className="chip-row">
          {categories.map((cat) => (
            <Link key={cat.value} to={`/recipes?category=${cat.value}`} className="chip">
              {cat.label}
            </Link>
          ))}
          <button type="button" className="chip chip-accent" onClick={surpriseMe} disabled={loading}>
            <Icon name="shuffle" size={15} />
            Surprise me
          </button>
        </div>
      </section>

      <InstallTip />

      <section className="shelf">
        <div className="shelf-head">
          <h2>Recently added</h2>
          <Link to="/recipes" className="link-arrow">
            All {recipes.length || ''} recipes <Icon name="right" size={16} />
          </Link>
        </div>
        <div className="shelf-scroll">
          {loading
            ? Array.from({ length: 4 }, (_, index) => <div key={index} className="recipe-card skeleton" />)
            : recent.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}
        </div>
      </section>

      {favorites.length ? (
        <section className="shelf">
          <div className="shelf-head">
            <h2>Family favorites</h2>
            <p className="shelf-note">Most made</p>
          </div>
          <div className="shelf-scroll">
            {favorites.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-links">
        <Link to="/recipes/add" className="home-link">
          <Icon name="plus" size={26} />
          <span>
            <strong>Share a recipe</strong>
            <span>Add a family favorite to the cookbook</span>
          </span>
        </Link>
        <Link to="/family" className="home-link">
          <Icon name="users" size={26} />
          <span>
            <strong>Family stories</strong>
            <span>Videos, articles, and little moments</span>
          </span>
        </Link>
        <Link to="/blog" className="home-link">
          <Icon name="feather" size={26} />
          <span>
            <strong>The Wait Room blog</strong>
            <span>Regina&rsquo;s posts since 2008</span>
          </span>
        </Link>
      </section>
    </div>
  );
}
