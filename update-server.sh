#!/bin/bash
# Memory-efficient server update script for low RAM servers (0.5GB)

set -e  # Exit on error

echo "Starting memory-efficient server update..."

# Step 1: Pull latest changes
echo "Step 1: Pulling latest changes from GitHub..."
cd /var/www/wait-family
git pull https://github.com/danielwait2/wait-family-site.git main

# Step 2: Stop the server to free up memory
echo "Step 2: Stopping server to free up memory..."
pm2 stop wait-family-api
sleep 2  # Wait a moment for processes to fully stop

# Step 3: Update backend dependencies (minimal memory)
echo "Step 3: Updating backend dependencies..."
cd server
npm install --production --no-audit --no-fund
cd ..

# Step 4: Update frontend dependencies and build (this uses the most memory)
echo "Step 4: Building frontend (this may take a while on low RAM)..."
cd client

# Use node with memory limits
NODE_OPTIONS="--max-old-space-size=384" npm install --production --no-audit --no-fund
NODE_OPTIONS="--max-old-space-size=384" npm run build

cd ..

# Step 5: Start the server
echo "Step 5: Starting server..."
cd server
pm2 start wait-family-api

# Step 6: Verify
echo "Step 6: Verifying server is running..."
sleep 2
pm2 status

echo "Update complete!"
echo "The database migration will run automatically on server start."

