import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../services/api.js';

export default function HomePage() {
  const [stats, setStats] = useState({
    recipeCount: 0,
    storyCount: 0,
    loading: true,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [recipes, stories] = await Promise.all([
          apiGet('/api/recipes'),
          apiGet('/api/family'),
        ]);
        setStats({
          recipeCount: recipes.length || 0,
          storyCount: stories.length || 0,
          loading: false,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
        setStats({
          recipeCount: 0,
          storyCount: 0,
          loading: false,
        });
      }
    };

    loadStats();
  }, []);

  const displayStats = [
    { 
      label: 'Family recipes documented', 
      value: stats.loading ? '...' : stats.recipeCount.toString(), 
      copy: 'Seasonal staples, heirloom dishes, and new favorites.' 
    },
    { 
      label: 'Stories & videos shared', 
      value: stats.loading ? '...' : stats.storyCount.toString(), 
      copy: 'Moments, videos, and letters captured for everyone.' 
    },
  ];

  return (
    <section className="section-card">
      <div className="hero">
        <div>
          <p className="badge">Family first</p>
          <h2>Memories plated, stories shared, traditions kept alive.</h2>
          <p>
            A hub for all things Wait Family—bringing together our favorite recipes, stories, and wisdom in one place.
          </p>
          <div className="hero-cta">
            <Link className="primary-btn" to="/recipes">
              Browse recipes
            </Link>
            <Link className="ghost-btn" to="/family">
              Learn about us
            </Link>
          </div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: '2.5rem' }}>
        {displayStats.map((item) => (
          <article key={item.label} className="stat-card">
            <p className="pill muted">{item.label}</p>
            <p className="stat-value">{item.value}</p>
            <p className="muted">{item.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
