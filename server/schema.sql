CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  steps TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'dinner' CHECK (category IN ('breakfast', 'lunch', 'dinner', 'dessert', 'salad', 'side', 'snack', 'beverage', 'appetizer', 'other')),
  submitted_by TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  serves INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS family_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'article')),
  media_url TEXT,
  is_published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS recipes_status_idx ON recipes (status);
CREATE INDEX IF NOT EXISTS recipes_category_idx ON recipes (category);
CREATE INDEX IF NOT EXISTS family_items_published_idx ON family_items (is_published);
