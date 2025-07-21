#!/bin/bash

# Script pentru debugging aplicației pe VPS

VPS_HOST="64.225.49.128"
VPS_USER="root"
APP_DIR="/var/www/orex.site"

echo "=== Debugging OLX Monitor pe orex.site ==="
echo ""

echo "🔍 Conectare la VPS și verificare status..."
echo ""

# Creează un script temporar pentru a rula pe VPS
cat > temp_debug.sh << 'EOF'
#!/bin/bash

echo "=== Status PM2 ==="
pm2 status

echo ""
echo "=== PM2 Logs (ultimele 20 de linii) ==="
pm2 logs olx-monitor --lines 20

echo ""
echo "=== Verificare Git Status ==="
cd /var/www/orex.site
echo "Branch curent: $(git branch --show-current)"
echo "Ultimul commit: $(git log --oneline -1)"
echo "Status git: $(git status --porcelain)"

echo ""
echo "=== Verificare Node.js și dependențe ==="
echo "Node.js versiune: $(node --version)"
echo "NPM versiune: $(npm --version)"

echo ""
echo "=== Verificare procese Node.js ==="
ps aux | grep node | grep -v grep

echo ""
echo "=== Verificare porturi ==="
echo "Port 3000 (aplicația):"
netstat -tlnp | grep :3000
echo "Port 80 (nginx):"
netstat -tlnp | grep :80

echo ""
echo "=== Status Nginx ==="
systemctl status nginx --no-pager
nginx -t

echo ""
echo "=== Configurare Nginx pentru orex.site ==="
if [ -f /etc/nginx/sites-available/orex.site ]; then
    echo "✅ Configurarea nginx există"
    cat /etc/nginx/sites-available/orex.site
else
    echo "❌ Configurarea nginx lipsește"
fi

echo ""
echo "=== Site-uri nginx activate ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== Verificare DNS și conectivitate ==="
echo "Rezoluție DNS pentru orex.site:"
nslookup orex.site

echo ""
echo "=== Verificare disk space ==="
df -h | head -5

echo ""
echo "=== Ultimele modificări ale fișierelor ==="
find /var/www/orex.site -name "*.js" -o -name "*.json" -o -name "*.ts" | head -10 | xargs ls -la

EOF

# Copiază și execută script-ul pe VPS
scp temp_debug.sh $VPS_USER@$VPS_HOST:/tmp/debug.sh
ssh $VPS_USER@$VPS_HOST "chmod +x /tmp/debug.sh && /tmp/debug.sh && rm /tmp/debug.sh"

# Curăță fișierul temporar local
rm temp_debug.sh

echo ""
echo "=== Comenzi utile pentru debugging manual ==="
echo "Conectare VPS: ssh $VPS_USER@$VPS_HOST"
echo "Navigare la aplicație: cd $APP_DIR"
echo "Restart aplicație: pm2 restart olx-monitor"
echo "Start aplicație: pm2 start npm --name 'olx-monitor' -- start"
echo "Verificare logs aplicație: pm2 logs olx-monitor --follow"
echo "Status PM2: pm2 status"
echo "Restart nginx: systemctl restart nginx"
echo "Verificare nginx config: nginx -t"
echo "Logs nginx: tail -f /var/log/nginx/error.log"