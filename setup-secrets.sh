#!/bin/bash

# Script pentru configurarea GitHub Secrets
# ATENȚIE: Acest script este doar pentru referință - secrets-urile trebuie configurate manual în GitHub UI

echo "=== GitHub Secrets Configuration ==="
echo ""
echo "Pentru a configura deployment-ul automat, adaugă următoarele secrets în GitHub:"
echo ""
echo "Repository Settings → Secrets and variables → Actions → New repository secret"
echo ""

echo "1. VPS_HOST"
echo "   Valoare: 64.225.49.128"
echo ""

echo "2. VPS_USERNAME"
echo "   Valoare: root"
echo ""

echo "3. VPS_PASSWORD"
echo "   Valoare: 12wqe34"
echo ""

echo "=== Configurare VPS ==="
echo "Domeniu: orex.site"
echo "Directorul aplicației: /var/www/orex.site"
echo "Port aplicație: 3000"
echo "Proxy nginx: localhost:3000 → orex.site"
echo ""

echo "=== Verificare configurare curentă ==="
echo ""

# Verifică dacă suntem pe branch-ul main
current_branch=$(git branch --show-current)
echo "Branch curent: $current_branch"

if [ "$current_branch" != "main" ]; then
    echo "⚠️  ATENȚIE: Nu ești pe branch-ul main. Deployment-ul se activează doar pentru branch-ul main."
else
    echo "✅ Ești pe branch-ul main - deployment-ul se va activa la următorul push."
fi

echo ""
echo "=== Pasii următori ==="
echo "1. Configurează secrets-urile în GitHub (vezi mai sus)"
echo "2. Asigură-te că VPS-ul are directorul /var/www/orex.site"
echo "3. Fă commit și push pe branch-ul main"
echo "4. Verifică tab-ul Actions din GitHub pentru status deployment"
echo "5. Verifică site-ul pe http://orex.site"