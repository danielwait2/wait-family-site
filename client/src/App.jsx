import { useEffect } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import RecipesPage from './pages/RecipesPage.jsx';
import RecipeDetailPage from './pages/RecipeDetailPage.jsx';
import AddRecipePage from './pages/AddRecipePage.jsx';
import FamilyPage from './pages/FamilyPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import Icon from './components/Icon.jsx';
import TimerTray from './components/TimerTray.jsx';
import { TimerProvider } from './hooks/useTimers.jsx';

const navLinks = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/recipes', label: 'Recipes', icon: 'book' },
  { path: '/family', label: 'Stories', icon: 'users' },
  { path: '/blog', label: 'Blog', icon: 'feather' },
];

const navClass = ({ isActive }) => (isActive ? 'active' : undefined);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <TimerProvider>
      <ScrollToTop />
      <div className="app-shell">
        <header className="site-header">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">W</span>
            <span className="brand-name">The Wait Family</span>
          </Link>
          <nav className="top-nav" aria-label="Main">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} className={navClass} end={link.path === '/'}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <TimerTray />

        <main id="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/recipes/add" element={<AddRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/family" element={<FamilyPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        <footer className="site-footer">
          <p>© {new Date().getFullYear()} The Wait Family · Nourish &amp; Remember</p>
          <Link to="/admin">Admin</Link>
        </footer>

        <nav className="tab-bar" aria-label="Main">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} className={navClass} end={link.path === '/'}>
              <Icon name={link.icon} size={24} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </TimerProvider>
  );
}
