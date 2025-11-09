#!/bin/bash
# Find where the active server is running from and ensure it has latest code

echo "=========================================="
echo "Finding Active Server Location"
echo "=========================================="
echo ""

echo "1. PM2 Process Details:"
pm2 describe waitfamily-backend
echo ""

echo "2. PM2 Process Info (cwd and script):"
pm2 show waitfamily-backend | grep -E "script path|cwd|exec mode"
echo ""

echo "3. Actual process working directory:"
PID=$(pm2 pid waitfamily-backend)
if [ ! -z "$PID" ] && [ "$PID" != "0" ]; then
    echo "Process ID: $PID"
    sudo ls -la /proc/$PID/cwd 2>/dev/null | tail -1
    echo "Real path:"
    sudo readlink -f /proc/$PID/cwd 2>/dev/null || echo "Cannot read process directory"
else
    echo "Process not running or PID not found"
fi
echo ""

echo "4. Check if that directory has latest code:"
SERVER_DIR=$(pm2 show waitfamily-backend | grep "cwd" | awk '{print $4}' | head -1)
if [ ! -z "$SERVER_DIR" ]; then
    echo "Server directory: $SERVER_DIR"
    cd "$SERVER_DIR/.." 2>/dev/null || cd "$SERVER_DIR" 2>/dev/null
    if [ -d ".git" ]; then
        echo "Git status:"
        git status --short
        echo ""
        echo "Latest commit:"
        git log --oneline -1
        echo ""
        echo "Checking if up to date with remote:"
        git fetch origin main 2>/dev/null
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse origin/main 2>/dev/null)
        if [ "$LOCAL" = "$REMOTE" ]; then
            echo "✓ Up to date with remote"
        else
            echo "✗ NOT up to date - needs git pull"
            echo "Local:  $LOCAL"
            echo "Remote: $REMOTE"
        fi
    else
        echo "Not a git repository"
    fi
else
    echo "Cannot determine server directory"
fi
echo ""

echo "5. All directories with wait-family code:"
find /var/www -name "wait-family*" -type d 2>/dev/null
echo ""

echo "=========================================="

