#!/bin/bash

# Script rapid pentru verificarea VPS orex.site

VPS_HOST="64.225.49.128"
VPS_USER="root"

echo "🔍 VERIFICARE RAPIDĂ VPS orex.site"
echo "=================================="
echo ""

# Test conectivitate
echo "1. Test conectivitate la VPS..."
if ping -c 1 $VPS_HOST > /dev/null 2>&1; then
    echo "✅ VPS accesibil"
else
    echo "❌ VPS nu răspunde"
    exit 1
fi

# Verifică GitHub Secrets
echo ""
echo "2. Verifică GitHub Secrets:"
echo "   📝 IMPORTANT: Trebuie să verifici manual în GitHub!"
echo "   Repository → Settings → Secrets and variables → Actions → tab 'Secrets'"
echo "   Trebuie să vezi: VPS_HOST, VPS_USERNAME, VPS_PASSWORD"

# Test SSH și status VPS
echo ""
echo "3. Verifică status VPS..."

ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST << 'VPS_CHECK'
echo "✅ Conectare SSH reușită"
echo ""

echo "📁 Verificare directorul aplicației:"
if [ -d "/var/www/orex.site" ]; then
    echo "✅ /var/www/orex.site există"
    cd /var/www/orex.site
    if [ -f "package.json" ]; then
        echo "✅ Aplicația clonată"
    else
        echo "❌ Aplicația NU este clonată"
    fi
else
    echo "❌ /var/www/orex.site NU există"
fi

echo ""
echo "🔧 Verificare servicii:"

# Node.js
if command -v node > /dev/null 2>&1; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js NU este instalat"
fi

# nginx
if command -v nginx > /dev/null 2>&1; then
    echo "✅ nginx instalat"
    if systemctl is-active nginx > /dev/null 2>&1; then
        echo "✅ nginx activ"
    else
        echo "❌ nginx NU este activ"
    fi
else
    echo "❌ nginx NU este instalat"
fi

# PM2
if command -v pm2 > /dev/null 2>&1; then
    echo "✅ PM2 instalat"
    if pm2 list | grep -q "olx-monitor"; then
        echo "✅ olx-monitor rulează în PM2"
    else
        echo "❌ olx-monitor NU rulează în PM2"
    fi
else
    echo "❌ PM2 NU este instalat"
fi

echo ""
echo "🌐 Verificare porturi:"
if netstat -tlnp | grep -q ":3000"; then
    echo "✅ Port 3000 (aplicația) activ"
else
    echo "❌ Port 3000 (aplicația) NU este activ"
fi

if netstat -tlnp | grep -q ":80"; then
    echo "✅ Port 80 (nginx) activ"
else
    echo "❌ Port 80 (nginx) NU este activ"
fi

VPS_CHECK

echo ""
echo "🌍 Test site:"
if curl -s -o /dev/null -w "%{http_code}" http://orex.site | grep -q "200"; then
    echo "✅ Site orex.site răspunde (HTTP 200)"
else
    echo "❌ Site orex.site NU răspunde sau eroare"
fi

echo ""
echo "📋 CONCLUZIE:"
echo "============="
echo "Dacă vezi ❌ la oricare dintre verificări, consultă SETUP_OBLIGATORIU.md"
echo ""
echo "Următorii pași:"
echo "1. Dacă VPS nu este configurat → Rulează setup-ul din SETUP_OBLIGATORIU.md"
echo "2. Dacă Secrets lipsesc → Configurează în GitHub"
echo "3. Dacă totul e OK → Testează deployment cu un push pe main"