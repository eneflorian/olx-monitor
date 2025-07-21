#!/bin/bash

# Script complet pentru setup automat VPS orex.site
# Rulează acest script pe VPS pentru a configura totul automat

set -e  # Stop la prima eroare

echo "🚀 SETUP AUTOMAT VPS pentru orex.site"
echo "====================================="
echo ""

# Variabile
DOMAIN="orex.site"
APP_DIR="/var/www/orex.site"
REPO_URL="https://github.com/eneflorian/olx-monitor.git"
NODE_VERSION="18"

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verifică dacă rulează ca root
if [ "$EUID" -ne 0 ]; then
    log_error "Scriptul trebuie rulat ca root. Folosește: sudo $0"
    exit 1
fi

log_info "Începe setup-ul automat..."

# 1. Update sistem
log_info "Actualizare sistem..."
apt update && apt upgrade -y
log_success "Sistem actualizat"

# 2. Instalează Node.js
log_info "Instalare Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    log_success "Node.js instalat: $(node --version)"
else
    log_success "Node.js deja instalat: $(node --version)"
fi

# 3. Instalează nginx
log_info "Instalare nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    log_success "nginx instalat"
else
    log_success "nginx deja instalat"
fi

# 4. Instalează PM2
log_info "Instalare PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    log_success "PM2 instalat"
else
    log_success "PM2 deja instalat"
fi

# 5. Creează directorul aplicației
log_info "Creare director aplicație..."
mkdir -p $APP_DIR
log_success "Director $APP_DIR creat"

# 6. Clone/Update repository
log_info "Clone/Update repository..."
cd $APP_DIR
if [ -d .git ]; then
    log_info "Repository există, se face pull..."
    git pull origin main
else
    log_info "Clone repository nou..."
    git clone $REPO_URL .
fi
log_success "Repository actualizat"

# 7. Instalează dependențele
log_info "Instalare dependențe..."
npm install
log_success "Dependențe instalate"

# 8. Build aplicația
log_info "Build aplicația..."
npm run build
log_success "Aplicația construită"

# 9. Configurează nginx
log_info "Configurare nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_CONFIG'
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINX_CONFIG

# 10. Activează site-ul nginx
log_info "Activare site nginx..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Șterge site-ul default dacă există
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
    log_info "Site default nginx dezactivat"
fi

# 11. Testează configurarea nginx
log_info "Testare configurare nginx..."
if nginx -t; then
    log_success "Configurare nginx validă"
else
    log_error "Configurare nginx invalidă!"
    exit 1
fi

# 12. Restart nginx
log_info "Restart nginx..."
systemctl restart nginx
systemctl enable nginx
log_success "nginx pornit și activat"

# 13. Configurează și pornește aplicația cu PM2
log_info "Configurare PM2..."

# Stop și șterge aplicația dacă există
pm2 stop olx-monitor 2>/dev/null || true
pm2 delete olx-monitor 2>/dev/null || true

# Pornește aplicația
cd $APP_DIR
pm2 start npm --name "olx-monitor" -- start
pm2 save
pm2 startup

log_success "Aplicația pornită cu PM2"

# 14. Verificări finale
echo ""
log_info "VERIFICĂRI FINALE..."
echo "===================="

# Verifică PM2
if pm2 list | grep -q "olx-monitor.*online"; then
    log_success "✅ PM2: olx-monitor rulează"
else
    log_error "❌ PM2: olx-monitor nu rulează"
fi

# Verifică nginx
if systemctl is-active nginx >/dev/null 2>&1; then
    log_success "✅ nginx: activ"
else
    log_error "❌ nginx: inactiv"
fi

# Verifică porturile
if netstat -tlnp | grep -q ":3000"; then
    log_success "✅ Port 3000: aplicația răspunde"
else
    log_warning "⚠️  Port 3000: aplicația nu răspunde"
fi

if netstat -tlnp | grep -q ":80"; then
    log_success "✅ Port 80: nginx răspunde"
else
    log_warning "⚠️  Port 80: nginx nu răspunde"
fi

# Test aplicația direct
log_info "Test aplicația pe localhost:3000..."
if curl -s -f http://localhost:3000 >/dev/null; then
    log_success "✅ Aplicația răspunde pe localhost:3000"
else
    log_warning "⚠️  Aplicația nu răspunde pe localhost:3000"
fi

echo ""
echo "🎉 SETUP COMPLET!"
echo "================="
echo ""
echo "📊 Status servicii:"
echo "PM2 status: $(pm2 list --no-color | grep olx-monitor | awk '{print $18}' || echo 'unknown')"
echo "nginx status: $(systemctl is-active nginx)"
echo ""
echo "🌐 Site-ul ar trebui să fie disponibil la:"
echo "   http://orex.site"
echo "   http://www.orex.site"
echo ""
echo "📋 Comenzi utile:"
echo "pm2 status                    # Status aplicația"
echo "pm2 logs olx-monitor         # Logs aplicația"
echo "pm2 restart olx-monitor      # Restart aplicația"
echo "systemctl status nginx       # Status nginx"
echo "nginx -t                     # Test configurare nginx"
echo ""
echo "🔄 Pentru deployment automat din GitHub:"
echo "1. Setează GitHub Secrets (VPS_HOST, VPS_USERNAME, VPS_PASSWORD)"
echo "2. Push pe main branch"
echo "3. Verifică GitHub Actions"