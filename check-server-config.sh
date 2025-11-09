#!/bin/bash
# Check which servers are running and what nginx is configured to use

echo "=========================================="
echo "Server Configuration Check"
echo "=========================================="
echo ""

echo "1. PM2 Processes:"
pm2 list
echo ""

echo "2. Processes listening on port 5000:"
sudo netstat -tlnp | grep 5000 || sudo ss -tlnp | grep 5000
echo ""

echo "3. Nginx configuration - API proxy:"
sudo grep -A 5 "location /api" /etc/nginx/sites-available/*.com 2>/dev/null || sudo grep -A 5 "location /api" /etc/nginx/sites-enabled/* 2>/dev/null
echo ""

echo "4. Nginx configuration - Frontend root:"
sudo grep "root" /etc/nginx/sites-available/*.com 2>/dev/null | grep -v "#" || sudo grep "root" /etc/nginx/sites-enabled/* 2>/dev/null | grep -v "#"
echo ""

echo "5. Check if old server process exists:"
ps aux | grep -i "node.*wait\|node.*family" | grep -v grep
echo ""

echo "6. Test API on port 5000:"
curl -s http://localhost:5000/api/health
echo ""
echo ""

echo "7. Check if there are multiple frontend directories:"
find /var/www -name "dist" -type d 2>/dev/null | head -10
echo ""

echo "8. Check nginx error logs:"
sudo tail -10 /var/log/nginx/error.log 2>/dev/null | tail -5
echo ""

echo "=========================================="

