# olx-monitor

Un sistem automat de monitorizare și scraping pentru anunțurile OLX din categoriile imobiliare.

## 🚀 Funcționalități

- Scraping automat al anunțurilor OLX din multiple orașe
- Monitorizare categorii imobiliare (apartamente, case, terenuri, etc.)
- Detectare anunțuri noi și expirate
- Salvare date în format JSON
- Deployment automat pe VPS prin GitHub Actions

## 🛠️ Tehnologii

- Node.js
- Puppeteer pentru web scraping
- PM2 pentru process management
- GitHub Actions pentru CI/CD

## 📋 Setup și Deployment

Pentru informații complete despre configurarea și deployment-ul aplicației, consultați [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Start

1. **Clone repository**
   ```bash
   git clone https://github.com/[username]/olx-monitor.git
   cd olx-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run scraper**
   ```bash
   node olx-scraper-intelligent.js
   ```

## 🔄 Deployment automat

Acest repository are configurat deployment automat pe VPS prin GitHub Actions:

- **Push pe main** → Deployment automat pe VPS
- **Manual deployment** → Rulare manuală din GitHub Actions
- **Script local** → `./deploy.sh` pentru deployment manual

## 📊 Monitoring

Aplicația rulează pe VPS cu PM2 și poate fi monitorizată prin:
```bash
pm2 status
pm2 logs olx-monitor
pm2 monit
```

## 📁 Structura proiectului

```
olx-monitor/
├── .github/workflows/    # GitHub Actions
├── src/
│   ├── data/            # Date scraped
│   └── app/             # Aplicația principală
├── logs/                # PM2 logs
├── ecosystem.config.js  # Configurație PM2
├── deploy.sh           # Script deployment manual
└── DEPLOYMENT.md       # Ghid deployment complet
```

## 🔐 Securitate

- Credentialele sunt stocate în GitHub Secrets
- SSH key authentication pentru deployment
- Backup automat înainte de fiecare deployment