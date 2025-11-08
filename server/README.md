# Wait Family Server

Express + SQLite API powering the Wait Family site.

## Environment

Copy `.env.example` to `.env` and adjust settings.

- `PORT`: Port for the API server (default 5001)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Credentials required to approve recipes or post family stories
- `SQLITE_DB_PATH`: Optional path for the SQLite file (defaults to `data/wait-family.db`)

## Database

The server automatically ensures the SQLite database (and schema from `schema.sql`) exists on boot. No manual migration step is required, but you can delete the DB file to reset the data.

## Scripts

```bash
npm install
npm run dev   # nodemon with hot reload
npm start     # production
```

## API overview

- `GET /api/recipes` — public, returns approved recipes
- `POST /api/recipes` — public, submit recipe (status `pending`)
- `GET /api/family` — public, published family stories/videos
- `POST /api/admin/login` — exchange username/password for a bearer token
- `POST /api/admin/logout` — revoke the current token
- `GET /api/admin/recipes?status=pending` — admin only list
- `PATCH /api/admin/recipes/:id` — admin status update (approve/reject)
- `GET /api/admin/family` — admin list of all family entries
- `POST /api/admin/family` — admin add new entry
- `PATCH /api/admin/family/:id` — admin toggle publish state or update metadata

Include an `Authorization: Bearer <token>` header (obtained from the login endpoint) for all admin routes.
