# Deployment Guide for Google Cloud + Nginx

This application is compatible with Google Cloud deployment using nginx as a reverse proxy.

## Architecture

```
Internet → Nginx (Port 80/443) → Express API (Port 5000) → SQLite Database
                ↓
         React Frontend (Static Files)
```

## Prerequisites

1. Google Cloud VM instance (e.g., Compute Engine)
2. Domain name (thewaitfamily.com) pointed to your server IP
3. SSL certificate (Let's Encrypt recommended)
4. Node.js 18+ installed on the server
5. Nginx installed on the server

## Server Setup

### 1. Install Dependencies

```bash
# On your Google Cloud VM
sudo apt update
sudo apt install -y nginx nodejs npm
sudo npm install -g pm2
```

### 2. Clone and Build

```bash
# Clone your repository
git clone https://github.com/danielwait2/wait-family-site.git /var/www/wait-family-site
cd /var/www/wait-family-site

# Build frontend
cd client
npm install
npm run build
cd ..

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure Environment Variables

Create `/var/www/wait-family-site/server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Admin Credentials
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_secure_password

# CORS Origins (comma-separated)
CORS_ORIGINS=https://thewaitfamily.com,https://www.thewaitfamily.com

# Database (optional, defaults to data/wait-family.db)
SQLITE_DB_PATH=/var/www/wait-family-site/server/data/wait-family.db
```

Create `/var/www/wait-family-site/client/.env.production`:

```env
VITE_API_BASE_URL=https://thewaitfamily.com
```

Then rebuild the frontend:
```bash
cd client
npm run build
```

### 4. Create Database Directory

```bash
mkdir -p /var/www/wait-family-site/server/data
chmod 755 /var/www/wait-family-site/server/data
```

### 5. Start Backend with PM2

```bash
cd /var/www/wait-family-site/server
pm2 start src/index.js --name wait-family-api
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

## Nginx Configuration

Create `/etc/nginx/sites-available/thewaitfamily.com`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name thewaitfamily.com www.thewaitfamily.com;
    
    # For Let's Encrypt certificate validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name thewaitfamily.com www.thewaitfamily.com;

    # SSL Configuration (adjust paths for your certificate)
    ssl_certificate /etc/letsencrypt/live/thewaitfamily.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thewaitfamily.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Root directory for static files (React build)
    root /var/www/wait-family-site/client/dist;
    index index.html;

    # API Proxy - Forward all /api requests to Express server
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Important for cookies to work
        proxy_cookie_path / /;
    }

    # Serve React static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/thewaitfamily.com /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d thewaitfamily.com -d www.thewaitfamily.com
# Follow the prompts to complete setup
```

Certbot will automatically update your nginx configuration and set up auto-renewal.

## Firewall Configuration

Ensure your Google Cloud firewall allows:
- Port 80 (HTTP)
- Port 443 (HTTPS)
- Port 22 (SSH)

You can configure this in Google Cloud Console or via gcloud CLI.

## Process Management

PM2 commands:

```bash
# View status
pm2 status

# View logs
pm2 logs wait-family-api

# Restart
pm2 restart wait-family-api

# Stop
pm2 stop wait-family-api
```

## Database Backups

SQLite database is located at `/var/www/wait-family-site/server/data/wait-family.db`.

Set up regular backups:

```bash
# Create backup script
sudo nano /usr/local/bin/backup-wait-family-db.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/wait-family"
mkdir -p $BACKUP_DIR
cp /var/www/wait-family-site/server/data/wait-family.db \
   $BACKUP_DIR/wait-family-$(date +%Y%m%d-%H%M%S).db
# Keep only last 30 days of backups
find $BACKUP_DIR -name "wait-family-*.db" -mtime +30 -delete
```

Make executable:
```bash
sudo chmod +x /usr/local/bin/backup-wait-family-db.sh
```

Add to crontab (daily backup at 2 AM):
```bash
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-wait-family-db.sh
```

## Troubleshooting

### Check if backend is running
```bash
pm2 status
curl http://localhost:5000/health
```

### Check nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check backend logs
```bash
pm2 logs wait-family-api
```

### Test API endpoint
```bash
curl https://thewaitfamily.com/api/health
```

## Important Notes

1. **SQLite in Production**: SQLite works well for small to medium traffic. For high traffic, consider PostgreSQL or MySQL.

2. **Cookie Security**: The app automatically uses `secure: true` and `sameSite: 'none'` in production mode for HTTPS.

3. **Database Permissions**: Ensure the database file and directory are writable by the Node.js process:
   ```bash
   sudo chown -R $USER:$USER /var/www/wait-family-site/server/data
   ```

4. **Port Configuration**: The backend runs on port 5000 internally. Nginx proxies requests from port 443 to 5000.

5. **Environment Variables**: Never commit `.env` files to git. Keep them secure on the server.

## Updating the Application

### Quick Update (using script)

```bash
cd /var/www/wait-family-site
git pull
chmod +x update-on-server.sh
./update-on-server.sh
```

### Manual Update

```bash
cd /var/www/wait-family-site
git pull
cd client
npm install
npm run build
cd ../server
npm install
pm2 restart waitfamily-backend
```

**Note for Low RAM Servers (0.5GB):** The update script automatically sets memory limits for the build process. If building manually, use: `NODE_OPTIONS="--max-old-space-size=300" npm run build`

## Monitoring

Consider setting up:
- Google Cloud Monitoring for server resources
- PM2 monitoring: `pm2 monit`
- Uptime monitoring service (e.g., UptimeRobot)

