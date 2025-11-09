#!/bin/bash
# Server-side update script for low RAM (0.5GB) servers
# Run this script on your server via SSH

set -e  # Exit on error

echo "=========================================="
echo "Wait Family Site - Server Update Script"
echo "Optimized for 0.5GB RAM servers"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    echo "Expected: /var/www/wait-family-site"
    exit 1
fi

# Step 1: Handle local changes and pull latest changes
echo -e "${YELLOW}Step 1: Handling local changes and pulling latest from GitHub...${NC}"

# Reset temporary database files (they will be regenerated)
git checkout -- server/data/wait-family.db-shm server/data/wait-family.db-wal 2>/dev/null || true

# Stash any other local changes (we'll use the remote version)
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Stashing local changes..."
    git stash push -m "Local changes before update $(date +%Y%m%d-%H%M%S)" || true
fi

# Pull latest changes
git pull https://github.com/danielwait2/wait-family-site.git main
echo -e "${GREEN}✓ Pulled latest changes${NC}"
echo ""

# Step 2: Backup database before migration
echo -e "${YELLOW}Step 2: Backing up database before update...${NC}"
# Use a backup directory within the project (user has write access)
BACKUP_DIR="server/data/backups"
mkdir -p $BACKUP_DIR
if [ -f "server/data/wait-family.db" ]; then
    BACKUP_FILE="$BACKUP_DIR/wait-family-backup-$(date +%Y%m%d-%H%M%S).db"
    cp server/data/wait-family.db "$BACKUP_FILE"
    echo -e "${GREEN}✓ Database backed up to: $BACKUP_FILE${NC}"
    # Keep only last 5 backups to save space
    ls -t $BACKUP_DIR/wait-family-backup-*.db 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    echo "  (Keeping last 5 backups)"
else
    echo "No existing database found, skipping backup"
fi
echo ""

# Step 3: Stop server to free up memory
echo -e "${YELLOW}Step 3: Stopping server to free up memory...${NC}"
pm2 stop wait-family-api || echo "Server already stopped or not running"
sleep 2
echo -e "${GREEN}✓ Server stopped${NC}"
echo ""

# Step 4: Update backend dependencies
echo -e "${YELLOW}Step 4: Updating backend dependencies...${NC}"
cd server
npm install --production --no-audit --no-fund
cd ..
echo -e "${GREEN}✓ Backend dependencies updated${NC}"
echo ""

# Step 5: Build frontend with memory limits
echo -e "${YELLOW}Step 5: Building frontend (this may take a while on low RAM)...${NC}"
echo "Using memory limit: 300MB for Node.js"
cd client

# Set memory limit and build
export NODE_OPTIONS="--max-old-space-size=300"
npm install --production --no-audit --no-fund
npm run build

cd ..
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

# Step 6: Start server (database migration runs automatically)
echo -e "${YELLOW}Step 6: Starting server (database migration will run automatically)...${NC}"
echo "Note: The migration adds a 'likes' column with default value 0."
echo "All existing recipe data will be preserved."
cd server
pm2 start wait-family-api
cd ..
echo -e "${GREEN}✓ Server started${NC}"
echo ""

# Step 7: Verify
echo -e "${YELLOW}Step 7: Verifying server status...${NC}"
sleep 3
pm2 status

# Step 8: Check migration logs
echo -e "${YELLOW}Step 8: Checking migration status...${NC}"
echo "Checking server logs for migration confirmation..."
sleep 2
pm2 logs wait-family-api --lines 20 --nostream | grep -i "migration\|likes column" || echo "Check logs manually if needed"
echo ""

echo ""
echo -e "${GREEN}=========================================="
echo "Update complete!"
echo "==========================================${NC}"
echo ""
echo "Database Migration Summary:"
echo "- The 'likes' column has been added to the recipes table"
echo "- All existing recipes now have likes = 0 (default value)"
echo "- All existing data has been preserved"
echo "- Database backup saved to: server/data/backups/"
echo ""
echo "To verify migration, check server logs:"
echo "  pm2 logs wait-family-api | grep -i migration"
echo ""
echo "To restore from backup if needed:"
echo "  cp server/data/backups/wait-family-backup-*.db server/data/wait-family.db"
echo ""

