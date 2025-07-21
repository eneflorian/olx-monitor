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
echo "   Valoare: 185.104.183.59"
echo ""

echo "2. VPS_USERNAME"
echo "   Valoare: root"
echo ""

echo "3. VPS_PASSWORD"
echo "   Valoare: 12wq3er4"
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
echo "2. Fă commit și push pe branch-ul main"
echo "3. Verifică tab-ul Actions din GitHub pentru status deployment"
echo "4. Verifică site-ul pe orex.site"