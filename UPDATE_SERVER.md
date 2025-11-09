# Server Update Guide (Low RAM - 0.5GB)

This guide provides memory-efficient ways to update your server with the latest changes.

## Repository
- GitHub: https://github.com/danielwait2/wait-family-site

## Option 1: Build Locally, Upload to Server (Recommended for 0.5GB RAM)

This minimizes server memory usage by building the frontend on your local machine.

### On Your Local Machine:

1. **Pull latest changes:**
   ```bash
   cd /Users/danielwait/GitHubRepos/NewWaitFamilySite
   git pull origin main
   ```

2. **Build the frontend:**
   ```bash
   cd client
   npm install
   npm run build
   ```
   This creates the `client/dist/` folder with the built files.

3. **Upload built files to server:**
   ```bash
   # Replace 'your-user' and 'your-server' with your actual server details
   scp -r client/dist/* your-user@your-server:/var/www/wait-family/client/dist/
   ```

### On Your Server (SSH):

```bash
# 1. Navigate to project directory
cd /var/www/wait-family

# 2. Pull backend changes only
git pull https://github.com/danielwait2/wait-family-site.git main

# 3. Update backend dependencies (lightweight)
cd server
npm install --production --no-audit --no-fund

# 4. Restart server (database migration runs automatically)
pm2 restart wait-family-api

# 5. Verify server is running
pm2 status
pm2 logs wait-family-api --lines 20
```

---

## Option 2: Build on Server (If you must)

If you need to build on the server, use strict memory limits:

```bash
# 1. Pull changes
cd /var/www/wait-family
git pull https://github.com/danielwait2/wait-family-site.git main

# 2. Stop server to free RAM
pm2 stop wait-family-api
sleep 2

# 3. Update backend (lightweight)
cd server
npm install --production --no-audit --no-fund
cd ..

# 4. Build frontend with memory limits
cd client
NODE_OPTIONS="--max-old-space-size=300" npm install --production --no-audit --no-fund
NODE_OPTIONS="--max-old-space-size=300" npm run build
cd ..

# 5. Restart server
cd server
pm2 start wait-family-api

# 6. Verify
pm2 status
pm2 logs wait-family-api --lines 20
```

The `--max-old-space-size=300` limits Node.js to ~300MB RAM, leaving memory for system processes.

---

## Quick Update Script (Option 2)

You can also use the provided script on your server:

```bash
cd /var/www/wait-family
# Make script executable (first time only)
chmod +x update-server.sh
# Run it
./update-server.sh
```

---

## Database Migration

The database migration for the `likes` column runs automatically when the server starts. No manual database changes needed!

---

## Troubleshooting

### If build fails due to memory:
- Use Option 1 (build locally)
- Or increase swap space on server
- Or stop other services temporarily

### Check server memory:
```bash
free -h
```

### Check server logs:
```bash
pm2 logs wait-family-api
```

### Test API:
```bash
curl http://localhost:5000/health
```

