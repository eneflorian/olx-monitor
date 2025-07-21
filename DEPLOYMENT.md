# Configurare Deployment Automat pe orex.site

## Descriere
Acest proiect este configurat să se deploye automat pe VPS-ul orex.site ori de câte ori se face push pe branch-ul `main`.

## Configurare GitHub Secrets

Pentru ca deployment-ul să funcționeze, trebuie să configurezi următoarele secrets în repository-ul GitHub:

1. Mergi la: `Settings` → `Secrets and variables` → `Actions`
2. Adaugă următoarele secrets:

### VPS_HOST
- **Nume**: `VPS_HOST`
- **Valoare**: `185.104.183.59`

### VPS_USERNAME
- **Nume**: `VPS_USERNAME`
- **Valoare**: `root`

### VPS_PASSWORD
- **Nume**: `VPS_PASSWORD`
- **Valoare**: `12wq3er4`

## Cum funcționează deployment-ul

1. **Trigger**: Se activează automat la fiecare push pe branch-ul `main`
2. **Build local**: Se construiește aplicația Next.js pe runner-ul GitHub
3. **Verificare**: Se verifică că build-ul este reușit
4. **Deploy pe VPS**: Se conectează la VPS și:
   - Trage ultimele modificări din Git
   - Instalează dependențele de producție
   - Construiește aplicația pe server
   - Restartează sau pornește aplicația cu PM2

## Verificare status deployment

Pentru a verifica dacă deployment-ul funcționează:

1. Fă un commit pe branch-ul `main`
2. Mergi la tab-ul `Actions` din GitHub repository
3. Vei vedea workflow-ul "Deploy to orex.site" în execuție
4. După finalizare, verifică site-ul pe orex.site

## Troubleshooting

### Aplicația nu se vede pe site
```bash
# Conectează-te la VPS
ssh root@185.104.183.59

# Verifică status PM2
pm2 status

# Verifică logs
pm2 logs olx-monitor

# Restart manual dacă e necesar
pm2 restart olx-monitor
```

### Build eșuează
- Verifică logs-urile în GitHub Actions
- Asigură-te că toate dependențele sunt instalate corect
- Verifică că nu există erori de TypeScript/ESLint

## Securitate

⚠️ **Important**: Password-ul VPS este stocat ca secret în GitHub. Pentru securitate maximă, consideră:
- Folosirea SSH keys în loc de password
- Crearea unui user dedicat pentru deployment (nu root)
- Configurarea unui firewall pe VPS