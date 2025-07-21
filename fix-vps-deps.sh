#!/bin/bash

# Script pentru repararea dependențelor VPS și setup manual
echo "🔧 REPARARE DEPENDENȚE ȘI SETUP MANUAL VPS"
echo "==========================================="

# Culori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. Repară dependențele
log_info "Reparare dependențe broken..."
apt --fix-broken install -y

log_info "Curățare cache apt..."
apt clean
apt autoclean

log_info "Update și upgrade..."
apt update
apt upgrade -y

log_success "Dependențe reparate"

# 2. Instalează Git dacă nu există
log_info "Verificare Git..."
if ! command -v git &> /dev/null; then
    log_info "Instalare Git..."
    apt install -y git
    log_success "Git instalat"
else
    log_success "Git deja instalat"
fi

# 3. Instalează curl dacă nu există
log_info "Verificare curl..."
if ! command -v curl &> /dev/null; then
    log_info "Instalare curl..."
    apt install -y curl
    log_success "curl instalat"
else
    log_success "curl deja instalat"
fi

# 4. Instalează Node.js 18
log_info "Instalare Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

log_success "Node.js instalat: $(node --version)"
log_success "npm instalat: $(npm --version)"

# 5. Instalează nginx
log_info "Instalare nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
log_success "nginx instalat și pornit"

# 6. Instalează PM2
log_info "Instalare PM2..."
npm install -g pm2
log_success "PM2 instalat"

# 7. Setup aplicația
APP_DIR="/var/www/orex.site"
REPO_URL="https://github.com/eneflorian/olx-monitor.git"

log_info "Setup aplicația în $APP_DIR..."

# Creează directorul și navighează
mkdir -p $APP_DIR
cd $APP_DIR

# Șterge conținutul existent dacă există
if [ "$(ls -A .)" ]; then
    log_warning "Director nu este gol, se șterge conținutul..."
    rm -rf ./*
    rm -rf .git
fi

# Clone repository
log_info "Clone repository..."
git clone $REPO_URL .

if [ $? -eq 0 ]; then
    log_success "Repository clonat cu succes"
else
    log_error "Eroare la clonarea repository-ului"
    exit 1
fi

# Instalează dependențele
log_info "Instalare dependențe npm..."
npm install

if [ $? -eq 0 ]; then
    log_success "Dependențe npm instalate"
else
    log_error "Eroare la instalarea dependențelor"
    exit 1
fi

# Build aplicația
log_info "Build aplicația..."
npm run build

if [ $? -eq 0 ]; then
    log_success "Aplicația construită cu succes"
else
    log_error "Eroare la build-ul aplicației"
    exit 1
fi

# 8. Configurează nginx
log_info "Configurare nginx pentru orex.site..."

cat > /etc/nginx/sites-available/orex.site << 'NGINX_CONFIG'
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
NGINX_CONFIG

# Activează site-ul
ln -sf /etc/nginx/sites-available/orex.site /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testează configurarea
log_info "Testare configurare nginx..."
if nginx -t; then
    log_success "Configurare nginx validă"
    systemctl restart nginx
    log_success "nginx restartat"
else
    log_error "Configurare nginx invalidă"
    exit 1
fi

# 9. Pornește aplicația cu PM2
log_info "Pornire aplicația cu PM2..."

# Stop aplicația dacă rulează
pm2 stop olx-monitor 2>/dev/null || true
pm2 delete olx-monitor 2>/dev/null || true

# Pornește aplicația
cd $APP_DIR
pm2 start npm --name "olx-monitor" -- start
pm2 save
pm2 startup

log_success "Aplicația pornită cu PM2"

# 10. Verificări finale
echo ""
log_info "VERIFICĂRI FINALE"
echo "=================="

# Status PM2
PM2_STATUS=$(pm2 list | grep olx-monitor | awk '{print $18}' 2>/dev/null || echo "nu rulează")
echo "PM2 olx-monitor: $PM2_STATUS"

# Status nginx
NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || echo "oprit")
echo "nginx: $NGINX_STATUS"

# Test port 3000
if netstat -tlnp | grep -q ":3000"; then
    echo "Port 3000: ✅ activ"
else
    echo "Port 3000: ❌ inactiv"
fi

# Test port 80
if netstat -tlnp | grep -q ":80"; then
    echo "Port 80: ✅ activ"
else
    echo "Port 80: ❌ inactiv"
fi

echo ""
echo "🎉 SETUP COMPLET!"
echo "================"
echo ""
echo "📋 Comenzi de verificare:"
echo "pm2 status"
echo "pm2 logs olx-monitor"
echo "systemctl status nginx"
echo "curl http://localhost:3000"
echo ""
echo "🌐 Site: http://orex.site"