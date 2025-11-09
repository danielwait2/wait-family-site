#!/bin/bash
# Simple fix: copy build files to where nginx is serving from

echo "=========================================="
echo "Fixing Nginx to Serve New Build"
echo "=========================================="
echo ""

# Find where nginx is actually serving from
NGINX_ROOT=$(sudo grep -h "root" /etc/nginx/sites-available/*.com /etc/nginx/sites-enabled/* 2>/dev/null | grep -v "#" | grep root | head -1 | awk '{print $2}' | tr -d ';')

if [ -z "$NGINX_ROOT" ]; then
    echo "Could not find nginx root, trying /var/www/html"
    NGINX_ROOT="/var/www/html"
fi

echo "Nginx is serving from: $NGINX_ROOT"
echo "Build is located at: /var/www/wait-family-site/client/dist"
echo ""

# Check if build exists
if [ ! -d "/var/www/wait-family-site/client/dist" ]; then
    echo "ERROR: Build directory not found!"
    exit 1
fi

# Option 1: Copy files to nginx root
echo "Copying new build files to nginx root..."
sudo cp -r /var/www/wait-family-site/client/dist/* "$NGINX_ROOT/"
echo "✓ Files copied"

# Option 2: Or create symlink (commented out - copy is safer)
# echo "Creating symlink..."
# sudo rm -rf "$NGINX_ROOT"/*
# sudo ln -s /var/www/wait-family-site/client/dist/* "$NGINX_ROOT/"

# Reload nginx
echo ""
echo "Reloading nginx..."
sudo systemctl reload nginx
echo "✓ Nginx reloaded"

echo ""
echo "=========================================="
echo "Done! Try refreshing your browser now."
echo "=========================================="

