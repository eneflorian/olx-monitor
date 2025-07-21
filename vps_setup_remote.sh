#!/bin/bash

DOMAIN="orex.site"
APP_DIR="/var/www/orex.site"
REPO_URL="https://github.com/eneflorian/olx-monitor.git"

echo "=== Setup VPS pentru orex.site ==="
echo ""

# Update system
echo "📦 Actualizare sistem..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Instalare Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install nginx
echo "📦 Instalare nginx..."
apt install -y nginx

# Install PM2 globally
echo "📦 Instalare PM2..."
npm install -g pm2

# Create application directory
echo "📁 Creare directorul aplicației..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
echo "📥 Clone repository..."
if [ -d .git ]; then
    echo "Repository există deja, pulling ultimele modificări..."
    git pull origin main
else
    git clone $REPO_URL .
fi

# Install dependencies
echo "📦 Instalare dependențe..."
npm install

# Build application
echo "🔨 Build aplicația..."
npm run build

# Create nginx configuration
echo "⚙️ Configurare nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_EOF'
server {
    listen 80;
    server_name orex.site www.orex.site;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
    }
}
NGINX_EOF

# Enable site
echo "✅ Activare site nginx..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Remove default nginx site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
echo "🔍 Testare configurare nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configurare nginx OK"
    systemctl restart nginx
    systemctl enable nginx
else
    echo "❌ Eroare în configurarea nginx"
    exit 1
fi

# Start application with PM2
echo "🚀 Pornire aplicație cu PM2..."
pm2 stop olx-monitor || true
pm2 delete olx-monitor || true
pm2 start npm --name "olx-monitor" -- start
pm2 save
pm2 startup

echo ""
echo "=== Setup complet! ==="
echo "✅ VPS configurat pentru orex.site"
echo "✅ Nginx configurat și pornit"
echo "✅ Aplicația pornită cu PM2"
echo ""
echo "🌐 Site disponibil la: http://orex.site"
echo ""
echo "📊 Comenzi utile:"
echo "pm2 status                    # Status aplicația"
echo "pm2 logs olx-monitor         # Logs aplicația"
echo "systemctl status nginx       # Status nginx"
echo "nginx -t                     # Test configurare nginx"

