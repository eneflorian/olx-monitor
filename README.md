# OLX Monitor

Aplicație Next.js pentru monitorizarea anunțurilor de pe OLX, cu deployment automat pe orex.site.

> **Deployment Status**: Configurat și actualizat la `2024-12-28 - Configurare deployment automat pe main branch`

## 🚀 Deployment Automat

Aplicația se deploie automat pe **orex.site** la fiecare push pe branch-ul `main`.

### Status Deployment
- **URL Producție**: http://orex.site
- **Trigger**: Push pe branch `main`
- **Server**: VPS 64.225.49.128
- **Directorul aplicației**: `/var/www/orex.site`

Pentru detalii complete despre configurarea deployment-ului, vezi [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🛠️ Dezvoltare Locală

### Instalare și rulare

```bash
# Instalează dependențele
npm install

# Rulează serverul de dezvoltare
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser pentru a vedea aplicația.

### Comenzi disponibile

```bash
npm run dev      # Server de dezvoltare cu Turbopack
npm run build    # Build pentru producție
npm run start    # Pornește aplicația în modul producție
npm run lint     # Verifică codul cu ESLint
```

## 🔧 Scripturi Utile

### Configurare Deployment
```bash
./check-vps.sh        # Verificare rapidă status VPS
./setup-secrets.sh    # Afișează instrucțiuni pentru configurarea GitHub Secrets
./setup-vps.sh --local  # Generează script de setup pentru VPS
```

📖 **Setup Complet**: Vezi [SETUP_OBLIGATORIU.md](./SETUP_OBLIGATORIU.md) pentru ghidul pas cu pas

### Debugging VPS
```bash
./debug-vps.sh        # Verifică status aplicației pe VPS
```

## 📁 Structura Proiectului

- `src/` - Codul sursă al aplicației Next.js
- `public/` - Asset-uri statice
- `.github/workflows/` - Configurări GitHub Actions pentru deployment
- `olx-scraper-*.js` - Scripturi pentru scraping OLX

## 🔍 Monitorizare și Debugging

### Verificare status aplicație pe VPS
```bash
ssh root@64.225.49.128
pm2 status
pm2 logs olx-monitor
systemctl status nginx
```

### Verificare deployment în GitHub
1. Mergi la tab-ul **Actions** din repository
2. Verifică status-ul ultimului workflow "Deploy to orex.site"
3. În caz de erori, verifică logs-urile de deployment

## 🏗️ Tehnologii Folosite

- **Framework**: Next.js 15.4.1
- **Runtime**: Node.js 18+
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Process Manager**: PM2 (pe VPS)
- **CI/CD**: GitHub Actions

## 📖 Learn More

Pentru a afla mai multe despre Next.js:

- [Next.js Documentation](https://nextjs.org/docs) - caracteristici și API Next.js
- [Learn Next.js](https://nextjs.org/learn) - tutorial interactiv Next.js

Repository Next.js: [GitHub](https://github.com/vercel/next.js)
