import { useEffect, useState } from 'react';
import { apiGet, apiPatch, apiPost, apiDelete } from '../services/api.js';

const RECIPE_CATEGORIES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'salad', label: 'Salad' },
  { value: 'side', label: 'Side Dish' },
  { value: 'snack', label: 'Snack' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'other', label: 'Other' },
];

const emptyFamilyForm = {
  title: '',
  summary: '',
  mediaType: 'article',
  mediaUrl: '',
  content: '',
};

// Check if user is authenticated by calling the check-auth endpoint
const checkAuthStatus = async () => {
  try {
    // Include credentials to send cookies
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5001'}/api/admin/check-auth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    return false;
  }
};

export default function AdminPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [allRecipes, setAllRecipes] = useState([]);
  const [familyEntries, setFamilyEntries] = useState([]);
  const [familyForm, setFamilyForm] = useState(emptyFamilyForm);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeFilter, setRecipeFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const resetFeedback = () => {
    setStatus('');
    setError('');
  };

  // Check authentication status on mount
  useEffect(() => {
    const verifyAuth = async () => {
      setIsCheckingAuth(true);
      const authenticated = await checkAuthStatus();
      setIsAuthenticated(authenticated);
      setIsCheckingAuth(false);
    };
    verifyAuth();
  }, []);

  const loadAdminData = async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      const [recipesResponse, familyResponse] = await Promise.all([
        apiGet('/api/admin/recipes'),
        apiGet('/api/admin/family'),
      ]);
      setAllRecipes(recipesResponse);
      setFamilyEntries(familyResponse);
      resetFeedback();
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
        await handleLogout();
      } else {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      loadAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isCheckingAuth]);

  const handleLoginChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await apiPost('/api/admin/login', credentials);
      setCredentials({ username: '', password: '' });
      setStatus('Signed in');
      setError('');
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
    }
  };

  const clearSession = () => {
    setAllRecipes([]);
    setFamilyEntries([]);
    setStatus('');
    setError('');
    setEditingRecipe(null);
    setDeleteConfirm(null);
    setIsAuthenticated(false);
  };

  const handleLogout = async (notifyServer = false) => {
    if (notifyServer && isAuthenticated) {
      try {
        await apiPost('/api/admin/logout', {});
      } catch (err) {
        // ignore logout errors
      }
    }
    clearSession();
  };

  const updateRecipeStatus = async (id, statusValue) => {
    try {
      await apiPatch(`/api/admin/recipes/${id}`, { status: statusValue });
      setStatus(`Recipe ${statusValue}`);
      await loadAdminData();
      setEditingRecipe(null);
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
      }
      setError(err.message);
    }
  };

  const deleteRecipe = async (id) => {
    try {
      await apiDelete(`/api/admin/recipes/${id}`);
      setStatus('Recipe deleted');
      setDeleteConfirm(null);
      await loadAdminData();
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
      }
      setError(err.message);
      setDeleteConfirm(null);
    }
  };

  const saveRecipeEdit = async (e) => {
    e.preventDefault();
    if (!editingRecipe) return;

    try {
      const updateData = {
        title: editingRecipe.title,
        description: editingRecipe.description,
        category: editingRecipe.category,
        submittedBy: editingRecipe.submittedBy,
        imageUrl: editingRecipe.imageUrl,
        prepTime: editingRecipe.prepTime ? parseInt(editingRecipe.prepTime, 10) : null,
        cookTime: editingRecipe.cookTime ? parseInt(editingRecipe.cookTime, 10) : null,
        serves: editingRecipe.serves ? parseInt(editingRecipe.serves, 10) : null,
        ingredients: editingRecipe.ingredients
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        steps: editingRecipe.steps
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      };

      await apiPatch(`/api/admin/recipes/${editingRecipe.id}`, updateData);
      setStatus('Recipe updated');
      setEditingRecipe(null);
      await loadAdminData();
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
      }
      setError(err.message);
    }
  };

  const startEditing = (recipe) => {
    setEditingRecipe({
      ...recipe,
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '',
      steps: Array.isArray(recipe.steps) ? recipe.steps.join('\n') : '',
      prepTime: recipe.prepTime || '',
      cookTime: recipe.cookTime || '',
      serves: recipe.serves || '',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#d1fae5', color: '#065f46', border: '#10b981' };
      case 'pending':
        return { bg: '#fef3c7', color: '#92400e', border: '#f59e0b' };
      case 'rejected':
        return { bg: '#fee2e2', color: '#7f1d1d', border: '#ef4444' };
      default:
        return { bg: '#f3f4f6', color: '#374151', border: '#9ca3af' };
    }
  };

  const filteredRecipes = recipeFilter === 'all' 
    ? allRecipes 
    : allRecipes.filter((r) => r.status === recipeFilter);

  const handleFamilyFormChange = (e) => {
    setFamilyForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitFamilyEntry = async (e) => {
    e.preventDefault();
    try {
      await apiPost('/api/admin/family', familyForm);
      setStatus('Family story published');
      setFamilyForm(emptyFamilyForm);
      await loadAdminData();
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
      }
      setError(err.message);
    }
  };

  const togglePublish = async (id, isPublished) => {
    try {
      await apiPatch(`/api/admin/family/${id}`, { isPublished });
      await loadAdminData();
    } catch (err) {
      if (err.message === 'Unauthorized') {
        setIsAuthenticated(false);
      }
      setError(err.message);
    }
  };

  return (
    <section className="section-card">
      <div className="hero">
        <div>
          <p className="badge">Admin tools</p>
          <h2>Moderate recipes, publish family content, keep everything feeling curated.</h2>
          <p>Use the private credentials stored on the server to access moderation tools.</p>
        </div>
      </div>

      {isCheckingAuth ? (
        <div className="list-card" style={{ marginTop: '2rem', textAlign: 'center', padding: '3rem 1rem' }}>
          <p className="muted">Checking authentication...</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="list-card" style={{ marginTop: '2rem' }}>
          <h3>Sign in</h3>
          {error ? <p className="status-message error">{error}</p> : null}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleLoginChange}
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleLoginChange}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit">Sign in</button>
          </form>
        </div>
      ) : (
        <>
          <div className="list-card" style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <p className="pill" style={{ marginBottom: '0.75rem' }}>Admin Session</p>
                {status ? <p className="status-message success" style={{ marginTop: '0.5rem' }}>{status}</p> : null}
                {error ? <p className="status-message error" style={{ marginTop: '0.5rem' }}>{error}</p> : null}
              </div>
              <button type="button" className="ghost-btn" onClick={() => handleLogout(true)} style={{ alignSelf: 'flex-start' }}>
                Sign out
              </button>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div className="list-card" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>All Recipes</h3>
                  <p className="muted" style={{ margin: 0 }}>{allRecipes.length} total recipes</p>
                </div>
                <select
                  value={recipeFilter}
                  onChange={(e) => setRecipeFilter(e.target.value)}
                  className="category-filter"
                  style={{ minWidth: '200px' }}
                >
                  <option value="all">All Recipes</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {editingRecipe ? (
                <div className="list-card" style={{ background: 'var(--surface-muted)', border: '2px solid var(--accent)' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Edit Recipe</h3>
                  <form onSubmit={saveRecipeEdit}>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        value={editingRecipe.title}
                        onChange={(e) => setEditingRecipe({ ...editingRecipe, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>History of the recipe / Why you like it / How you found it</label>
                      <textarea
                        value={editingRecipe.description}
                        onChange={(e) => setEditingRecipe({ ...editingRecipe, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={editingRecipe.category}
                        onChange={(e) => setEditingRecipe({ ...editingRecipe, category: e.target.value })}
                        required
                      >
                        {RECIPE_CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Submitted By</label>
                      <input
                        value={editingRecipe.submittedBy || ''}
                        onChange={(e) => setEditingRecipe({ ...editingRecipe, submittedBy: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Image URL</label>
                      <input
                        value={editingRecipe.imageUrl || ''}
                        onChange={(e) => setEditingRecipe({ ...editingRecipe, imageUrl: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Prep Time (minutes)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingRecipe.prepTime || ''}
                          onChange={(e) => setEditingRecipe({ ...editingRecipe, prepTime: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Cook Time (minutes)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingRecipe.cookTime || ''}
                          onChange={(e) => setEditingRecipe({ ...editingRecipe, cookTime: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Serves</label>
                        <input
                          type="number"
                          min="1"
                          value={editingRecipe.serves || ''}
                          onChange={(e) => setEditingRecipe({ ...editingRecipe, serves: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Ingredients (one per line)</label>
                      <textarea
                        value={editingRecipe.ingredients}
                        onChange={(e) => setEditingRecipe({ ...editingRecipe, ingredients: e.target.value })}
                        required
                        style={{ minHeight: '100px' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>Steps (one per line)</label>
                      <textarea
                        value={editingRecipe.steps}
                        onChange={(e) => setEditingRecipe({ ...editingRecipe, steps: e.target.value })}
                        required
                        style={{ minHeight: '120px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit">Save Changes</button>
                      <button type="button" className="secondary" onClick={() => setEditingRecipe(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="table-list">
                  {filteredRecipes.length ? (
                    filteredRecipes.map((recipe) => {
                      const statusStyle = getStatusColor(recipe.status);
                      return (
                        <div key={recipe.id} className="table-item">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                              <strong>{recipe.title}</strong>
                              <div
                                className="pill"
                                style={{
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                  borderColor: statusStyle.border,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {recipe.status.charAt(0).toUpperCase() + recipe.status.slice(1)}
                              </div>
                            </div>
                            <p className="muted" style={{ marginTop: '0.5rem' }}>{recipe.description}</p>
                            {recipe.submittedBy && (
                              <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontStyle: 'italic' }}>
                                Submitted by {recipe.submittedBy}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div className="pill" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'var(--accent)' }}>
                              {recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : 'Dinner'}
                            </div>
                            <div className="pill">{Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0} ingredients</div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                              <button type="button" className="secondary" onClick={() => startEditing(recipe)} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                Edit
                              </button>
                              {recipe.status !== 'approved' && (
                                <button type="button" onClick={() => updateRecipeStatus(recipe.id, 'approved')} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                  Approve
                                </button>
                              )}
                              {recipe.status !== 'rejected' && (
                                <button type="button" className="secondary" onClick={() => updateRecipeStatus(recipe.id, 'rejected')} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                  Reject
                                </button>
                              )}
                              {recipe.status === 'rejected' && (
                                <button type="button" onClick={() => updateRecipeStatus(recipe.id, 'approved')} style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setDeleteConfirm(recipe.id)}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {deleteConfirm === recipe.id && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--error-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--error)' }}>
                              <p style={{ margin: '0 0 1rem 0', color: 'var(--error)', fontWeight: 600 }}>
                                Are you sure you want to delete this recipe? This action cannot be undone.
                              </p>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                  type="button"
                                  onClick={() => deleteRecipe(recipe.id)}
                                  style={{ background: 'var(--error)', color: 'white', border: 'none' }}
                                >
                                  Yes, Delete
                                </button>
                                <button type="button" className="secondary" onClick={() => setDeleteConfirm(null)}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                      <p className="muted" style={{ fontSize: '1rem' }}>
                        No recipes found.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="split-grid" style={{ marginTop: '2rem' }}>
              <div className="stack">
                <div className="list-card">
                  <div className="pill">Family media</div>
                  <h3>Add a new story</h3>
                  <form onSubmit={submitFamilyEntry}>
                    <div className="form-group">
                      <label htmlFor="family-title">Title</label>
                      <input id="family-title" name="title" placeholder="Enter story title" value={familyForm.title} onChange={handleFamilyFormChange} required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="family-summary">Summary</label>
                      <textarea
                        id="family-summary"
                        name="summary"
                        placeholder="Brief description of the story..."
                        value={familyForm.summary}
                        onChange={handleFamilyFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="family-mediaType">Media Type</label>
                      <select id="family-mediaType" name="mediaType" value={familyForm.mediaType} onChange={handleFamilyFormChange}>
                        <option value="article">Article</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="family-mediaUrl">Media URL (Optional)</label>
                      <input
                        id="family-mediaUrl"
                        name="mediaUrl"
                        placeholder="https://example.com/article"
                        value={familyForm.mediaUrl}
                        onChange={handleFamilyFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="family-content">Content (Optional)</label>
                      <textarea
                        id="family-content"
                        name="content"
                        placeholder="Additional details or body text..."
                        value={familyForm.content}
                        onChange={handleFamilyFormChange}
                      />
                    </div>
                    <button type="submit">Publish</button>
                  </form>
                </div>
              </div>

              <div className="stack">
                <div className="list-card">
                  <div className="pill">Published entries</div>
                  <h3>Manage visibility</h3>
                  <div className="table-list">
                    {familyEntries.length ? (
                      familyEntries.map((item) => (
                        <div key={item.id} className="table-item">
                          <div>
                            <strong>{item.title}</strong>
                            <p className="muted" style={{ marginTop: '0.5rem' }}>{item.summary}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <div className="pill">{item.mediaType}</div>
                            <button type="button" onClick={() => togglePublish(item.id, !item.isPublished)} style={{ marginLeft: 'auto' }}>
                              {item.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                        <p className="muted" style={{ fontSize: '1rem' }}>
                          No entries yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
