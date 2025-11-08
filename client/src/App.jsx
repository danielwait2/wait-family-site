import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import RecipesPage from './pages/RecipesPage.jsx';
import RecipeDetailPage from './pages/RecipeDetailPage.jsx';
import AddRecipePage from './pages/AddRecipePage.jsx';
import FamilyPage from './pages/FamilyPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/recipes', label: 'Recipes' },
  { path: '/family', label: 'Learn About Us' },
  { path: '/admin', label: 'Admin' },
];

export default function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>The Wait Family</h1>
        <nav className="nav">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={({ isActive }) => (isActive ? 'active' : undefined)} end={link.path === '/'}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/add" element={<AddRecipePage />} />
          <Route path="/family" element={<FamilyPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
      <footer>© {new Date().getFullYear()} Wait Family • Nourish &amp; Remember</footer>
    </div>
  );
}
