#!/bin/bash

# Script pentru debugging aplicației pe VPS

VPS_HOST="185.104.183.59"
VPS_USER="root"
APP_DIR="/root/olx-monitor"

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
cd /root/olx-monitor
echo "Branch curent: $(git branch --show-current)"
echo "Ultimul commit: $(git log --oneline -1)"
echo "Status git: $(git status --porcelain)"

echo ""
echo "=== Verificare Node.js și dependențe ==="
echo "Node.js versiune: $(node --version)"
echo "NPM versiune: $(npm --version)"

echo ""
echo "=== Verificare procese ==="
ps aux | grep node | grep -v grep

echo ""
echo "=== Verificare porturi ==="
netstat -tlnp | grep :3000

echo ""
echo "=== Verificare disk space ==="
df -h | head -5

echo ""
echo "=== Verificare ultimele modificări ale fișierelor ==="
find /root/olx-monitor -name "*.js" -o -name "*.json" -o -name "*.ts" | head -10 | xargs ls -la

EOF

# Copiază și execută script-ul pe VPS
scp temp_debug.sh $VPS_USER@$VPS_HOST:/tmp/debug.sh
ssh $VPS_USER@$VPS_HOST "chmod +x /tmp/debug.sh && /tmp/debug.sh && rm /tmp/debug.sh"

# Curăță fișierul temporar local
rm temp_debug.sh

echo ""
echo "=== Comenzi utile pentru debugging manual ==="
echo "Conectare VPS: ssh $VPS_USER@$VPS_HOST"
echo "Restart aplicație: pm2 restart olx-monitor"
echo "Start aplicație: pm2 start npm --name 'olx-monitor' -- start"
echo "Verificare logs live: pm2 logs olx-monitor --follow"
echo "Status PM2: pm2 status"