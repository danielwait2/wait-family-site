# Database Migration Safety Guide

## Migration Overview

The update adds a `likes` column to the `recipes` table. This migration is **100% safe** and will not affect any existing data.

## Why This Migration is Safe

### 1. Non-Destructive Operation
The migration uses `ALTER TABLE ADD COLUMN`, which:
- ✅ Only **adds** a new column (doesn't modify existing columns)
- ✅ Does **not** delete or modify any existing data
- ✅ Does **not** change existing column types or constraints

### 2. Default Value Protection
```sql
ALTER TABLE recipes ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
```

The `DEFAULT 0` ensures:
- ✅ All existing recipes automatically get `likes = 0`
- ✅ No data loss or corruption
- ✅ The column is immediately usable

### 3. Automatic Migration
The migration runs automatically when the server starts:
- ✅ Checks if the column already exists (safe to run multiple times)
- ✅ Only adds the column if it doesn't exist
- ✅ Logs the migration status for verification

## What Happens to Your Data

### Before Migration:
```
Recipe 1: id=1, title="Grandma's Pie", description="...", ...
Recipe 2: id=2, title="Mom's Cookies", description="...", ...
```

### After Migration:
```
Recipe 1: id=1, title="Grandma's Pie", description="...", ..., likes=0
Recipe 2: id=2, title="Mom's Cookies", description="...", ..., likes=0
```

**All your existing data remains exactly the same!** The only change is that each recipe now has a `likes` field set to 0.

## Backup Strategy

The update script automatically creates a backup before running the migration:
- Location: `/var/backups/wait-family/wait-family-backup-YYYYMMDD-HHMMSS.db`
- Automatic: Backs up before any changes
- Safe: You can restore from backup if needed

## Verifying the Migration

After the server starts, check the logs:

```bash
pm2 logs wait-family-api | grep -i migration
```

You should see:
```
Migrating: Adding likes column to recipes table...
Migration complete: likes column added.
```

## Manual Verification

You can verify the migration worked correctly:

```bash
# Connect to the database
cd /var/www/wait-family-site/server
sqlite3 data/wait-family.db

# Check the table structure
.schema recipes

# Verify the likes column exists
PRAGMA table_info(recipes);

# Check that all recipes have likes = 0
SELECT id, title, likes FROM recipes LIMIT 5;

# Exit
.quit
```

## Restoring from Backup

If you ever need to restore from backup:

```bash
# Stop the server
pm2 stop wait-family-api

# Restore the backup
cp /var/backups/wait-family/wait-family-backup-YYYYMMDD-HHMMSS.db \
   /var/www/wait-family-site/server/data/wait-family.db

# Start the server
pm2 start wait-family-api
```

## Migration Code

The migration is in `server/src/db.js`:

```javascript
const hasLikes = tableInfo.some((col) => col.name === 'likes');
if (!hasLikes) {
  console.log('Migrating: Adding likes column to recipes table...');
  db.exec(`
    ALTER TABLE recipes ADD COLUMN likes INTEGER NOT NULL DEFAULT 0;
  `);
  console.log('Migration complete: likes column added.');
}
```

This code:
1. Checks if the `likes` column already exists
2. Only runs if the column doesn't exist
3. Adds the column with a default value of 0
4. Is idempotent (safe to run multiple times)

## FAQ

**Q: Will I lose any recipe data?**  
A: No. All existing data is preserved. Only a new column is added.

**Q: What if the migration fails?**  
A: The migration is wrapped in a try-catch block. If it fails, the error is logged and the server continues. Your data remains untouched.

**Q: Can I run the migration multiple times?**  
A: Yes. The migration checks if the column exists before adding it, so it's safe to run multiple times.

**Q: What happens to recipes created after the migration?**  
A: New recipes will also have `likes = 0` by default, which is the expected behavior.

**Q: How do I know the migration worked?**  
A: Check the server logs for "Migration complete: likes column added." and verify with a database query.

## Conclusion

This migration is **completely safe** and **non-destructive**. Your existing recipe data will be preserved exactly as it is, with the addition of a new `likes` column set to 0 for all existing recipes.

