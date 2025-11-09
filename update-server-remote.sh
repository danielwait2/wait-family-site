#!/bin/bash
# Update server by building locally and uploading build files
# This minimizes server memory usage

echo "This script will help you update the server with minimal memory usage."
echo "You'll build the frontend locally and upload just the build files."
echo ""
echo "Steps:"
echo "1. Build frontend locally: cd client && npm run build"
echo "2. Upload client_build/ to server: scp -r client_build/* user@server:/var/www/wait-family/client/dist/"
echo "3. On server, pull backend changes and restart:"
echo "   cd /var/www/wait-family"
echo "   git pull origin main"
echo "   cd server && npm install --production"
echo "   pm2 restart wait-family-api"
echo ""
echo "Or use the automated script if you prefer."

