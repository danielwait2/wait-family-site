#!/bin/bash
# Verification script to check if deployment is working correctly

echo "=========================================="
echo "Deployment Verification"
echo "=========================================="
echo ""

# Check PM2 processes
echo "1. Checking PM2 processes:"
pm2 list
echo ""

# Check which port the servers are running on
echo "2. Checking server ports:"
netstat -tlnp 2>/dev/null | grep -E ":(5000|3000)" || ss -tlnp 2>/dev/null | grep -E ":(5000|3000)" || echo "Cannot check ports (netstat/ss not available)"
echo ""

# Check if frontend dist exists
echo "3. Checking frontend build:"
if [ -d "client/dist" ]; then
    echo "✓ Frontend dist directory exists"
    ls -lh client/dist/ | head -10
else
    echo "✗ Frontend dist directory NOT found!"
fi
echo ""

# Check server logs for migration
echo "4. Checking server logs for migration:"
pm2 logs wait-family-api --lines 30 --nostream | grep -i "migration\|likes\|API ready" || echo "Check logs manually: pm2 logs wait-family-api"
echo ""

# Check database for likes column
echo "5. Checking database schema:"
if command -v sqlite3 &> /dev/null && [ -f "server/data/wait-family.db" ]; then
    echo "Checking if 'likes' column exists..."
    sqlite3 server/data/wait-family.db "PRAGMA table_info(recipes);" | grep likes && echo "✓ Likes column exists!" || echo "✗ Likes column NOT found!"
else
    echo "Cannot check database (sqlite3 not available or database not found)"
fi
echo ""

# Check nginx status
echo "6. Checking nginx status:"
if command -v systemctl &> /dev/null; then
    systemctl status nginx --no-pager -l | head -10 || echo "Cannot check nginx status"
else
    echo "Cannot check nginx (systemctl not available)"
fi
echo ""

# Check if API is responding
echo "7. Testing API endpoint:"
curl -s http://localhost:5000/health && echo " ✓ API is responding" || echo "✗ API is NOT responding"
echo ""

echo "=========================================="
echo "Verification complete!"
echo "=========================================="
echo ""
echo "If changes aren't visible:"
echo "1. Check which PM2 process nginx is using"
echo "2. Reload nginx: sudo systemctl reload nginx"
echo "3. Clear browser cache (Ctrl+Shift+R)"
echo "4. Check nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo ""

