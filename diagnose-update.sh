#!/bin/bash
# Diagnose why the update isn't showing

echo "=========================================="
echo "Update Diagnosis"
echo "=========================================="
echo ""

echo "1. Check if frontend build has like button code:"
grep -o "I made this" client/dist/assets/*.js 2>/dev/null | head -1 && echo "✓ Like button code found" || echo "✗ Like button code NOT in build"
echo ""

echo "2. Check frontend build timestamp:"
ls -lh client/dist/assets/*.js | head -1
echo ""

echo "3. Check server status:"
pm2 status
echo ""

echo "4. Check if API returns likes:"
curl -s http://localhost:5000/api/recipes 2>/dev/null | head -200 | grep -o '"likes":[0-9]*' | head -3 && echo "✓ API has likes" || echo "✗ API missing likes"
echo ""

echo "5. Check nginx root directory:"
sudo grep "root" /etc/nginx/sites-available/*.com 2>/dev/null | grep -v "#" | head -1
echo ""

echo "6. Check what nginx is actually serving:"
NGINX_ROOT=$(sudo grep "root" /etc/nginx/sites-available/*.com 2>/dev/null | grep -v "#" | head -1 | awk '{print $2}' | tr -d ';')
if [ ! -z "$NGINX_ROOT" ]; then
    echo "Nginx root: $NGINX_ROOT"
    if [ -f "$NGINX_ROOT/index.html" ]; then
        echo "✓ index.html exists"
        ls -lh "$NGINX_ROOT/index.html"
    else
        echo "✗ index.html NOT found at nginx root"
    fi
    if [ -d "$NGINX_ROOT/assets" ]; then
        echo "✓ assets directory exists"
        ls -lh "$NGINX_ROOT/assets"/*.js 2>/dev/null | head -1
    else
        echo "✗ assets directory NOT found"
    fi
else
    echo "Cannot determine nginx root"
fi
echo ""

echo "7. Check server logs for migration:"
pm2 logs waitfamily-backend --lines 50 --nostream | grep -i "migration\|likes\|API ready" | tail -5
echo ""

echo "8. Test API health:"
curl -s http://localhost:5000/api/health && echo " ✓" || echo " ✗ API not responding"
echo ""

echo "=========================================="
echo "Quick Fixes to Try:"
echo "1. Restart server: pm2 restart waitfamily-backend"
echo "2. Reload nginx: sudo systemctl reload nginx"
echo "3. Hard refresh browser: Ctrl+Shift+R"
echo "4. Check if frontend needs rebuild: cd client && npm run build"
echo "=========================================="

