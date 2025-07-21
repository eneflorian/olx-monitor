# Configurare Deployment Automat pe orex.site

## Descriere
Acest proiect este configurat să se deploye automat pe VPS-ul orex.site ori de câte ori se face push pe branch-ul `main`.

## Configurare GitHub Secrets

Pentru ca deployment-ul să funcționeze, trebuie să configurezi următoarele secrets în repository-ul GitHub:

1. Mergi la: `Settings` → `Secrets and variables` → `Actions`
2. Adaugă următoarele secrets:

### VPS_HOST
- **Nume**: `VPS_HOST`
- **Valoare**: `64.225.49.128`

### VPS_USERNAME
- **Nume**: `VPS_USERNAME`
- **Valoare**: `root`

### VPS_PASSWORD
- **Nume**: `VPS_PASSWORD`
- **Valoare**: `12wqe34`

## Structura VPS

- **IP VPS**: `64.225.49.128`
- **Domeniu**: `orex.site`
- **Directorul aplicației**: `/var/www/orex.site`
- **Port aplicație**: `3000`
- **Proxy**: nginx → localhost:3000

## Cum funcționează deployment-ul

1. **Trigger**: Se activează automat la fiecare push pe branch-ul `main`
2. **Build local**: Se construiește aplicația Next.js pe runner-ul GitHub
3. **Verificare**: Se verifică că build-ul este reușit
4. **Deploy pe VPS**: Se conectează la VPS și:
   - Navighează în `/var/www/orex.site`
   - Trage ultimele modificări din Git
   - Instalează dependențele de producție
   - Construiește aplicația pe server
   - Configurează nginx pentru domeniul orex.site (dacă nu există)
   - Restartează aplicația cu PM2

## Configurarea Nginx

Workflow-ul creează automat configurarea nginx:

```nginx
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
```

## Verificare status deployment

Pentru a verifica dacă deployment-ul funcționează:

1. Fă un commit pe branch-ul `main`
2. Mergi la tab-ul `Actions` din GitHub repository
3. Vei vedea workflow-ul "Deploy to orex.site" în execuție
4. După finalizare, verifică site-ul pe http://orex.site

## Troubleshooting

### Aplicația nu se vede pe site
```bash
# Conectează-te la VPS
ssh root@64.225.49.128

# Verifică status PM2
pm2 status

# Verifică logs aplicația
pm2 logs olx-monitor

# Verifică nginx
nginx -t
systemctl status nginx

# Verifică că portul 3000 este activ
netstat -tlnp | grep :3000

# Restart manual dacă e necesar
pm2 restart olx-monitor
systemctl reload nginx
```

### Probleme nginx
```bash
# Verifică configurarea nginx
nginx -t

# Verifică site-urile activate
ls -la /etc/nginx/sites-enabled/

# Restart nginx
systemctl restart nginx

# Verifică logs nginx
tail -f /var/log/nginx/error.log
```

### Build eșuează
- Verifică logs-urile în GitHub Actions
- Asigură-te că toate dependențele sunt instalate corect
- Verifică că nu există erori de TypeScript/ESLint

## Setup Inițial VPS (pentru referință)

Dacă VPS-ul nu este configurat, următoarele comenzi trebuie rulate manual:

```bash
# Creează directorul aplicației
mkdir -p /var/www/orex.site
cd /var/www/orex.site

# Clone repository
git clone https://github.com/eneflorian/olx-monitor.git .

# Instalează dependențele
npm install

# Instalează PM2 global dacă nu există
npm install -g pm2

# Asigură-te că nginx este instalat
apt update && apt install -y nginx

# Start și enable nginx
systemctl start nginx
systemctl enable nginx
```

## Securitate

⚠️ **Important**: Password-ul VPS este stocat ca secret în GitHub. Pentru securitate maximă, consideră:
- Folosirea SSH keys în loc de password
- Crearea unui user dedicat pentru deployment (nu root)
- Configurarea unui firewall pe VPS
- Instalarea certificatului SSL pentru HTTPS