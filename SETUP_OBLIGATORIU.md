# 🚨 PAȘI OBLIGATORII PENTRU FUNCȚIONARE - orex.site

## Situația Actuală
- ✅ Código actualizat în GitHub
- ❌ VPS gol, fără aplicație
- ✅ GitHub Actions Variables setate

## 📋 PAȘII OBLIGATORII (în ordine)

### PASUL 1: Verificare GitHub Secrets (CRITIC!)
**⚠️ IMPORTANT**: Actions Variables ≠ Secrets! Trebuie să folosești **Secrets**, nu Variables!

1. Mergi la GitHub repository: https://github.com/eneflorian/olx-monitor
2. Click `Settings` → `Secrets and variables` → `Actions`
3. Click pe tab-ul **`Secrets`** (NU Variables!)
4. Adaugă următoarele 3 secrets:

```
Nume: VPS_HOST
Valoare: 64.225.49.128

Nume: VPS_USERNAME  
Valoare: root

Nume: VPS_PASSWORD
Valoare: 12wqe34
```

### PASUL 2: Setup Inițial VPS (obligatoriu prima dată)

**Conectează-te la VPS și rulează comenzile:**

```bash
# 1. Conectează-te la VPS
ssh root@64.225.49.128

# 2. Actualizează sistemul
apt update && apt upgrade -y

# 3. Instalează Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. Instalează nginx
apt install -y nginx

# 5. Instalează PM2
npm install -g pm2

# 6. Creează directorul aplicației
mkdir -p /var/www/orex.site
cd /var/www/orex.site

# 7. Clone repository-ul
git clone https://github.com/eneflorian/olx-monitor.git .

# 8. Instalează dependențele
npm install

# 9. Build aplicația
npm run build

# 10. Configurează nginx
cat > /etc/nginx/sites-available/orex.site << 'EOF'
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
EOF

# 11. Activează site-ul
ln -sf /etc/nginx/sites-available/orex.site /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 12. Testează nginx
nginx -t

# 13. Restart nginx
systemctl restart nginx
systemctl enable nginx

# 14. Pornește aplicația cu PM2
pm2 start npm --name "olx-monitor" -- start
pm2 save
pm2 startup

# 15. Verifică că totul funcționează
pm2 status
systemctl status nginx
```

### PASUL 3: Test Manual
După setup, testează:
```bash
# Pe VPS
curl http://localhost:3000  # Testează aplicația direct
curl http://orex.site       # Testează prin nginx
```

### PASUL 4: Test Deployment Automat
1. Fă o mică modificare în cod (ex: în README.md)
2. Commit și push pe main:
   ```bash
   git add .
   git commit -m "Test deployment automat"
   git push origin main
   ```
3. Verifică GitHub Actions tab pentru a vedea dacă deployment-ul rulează

## 🔍 VERIFICĂRI

### Verifică Secrets GitHub:
- Mergi la repository → Settings → Secrets and variables → Actions → tab **Secrets**
- Trebuie să vezi: VPS_HOST, VPS_USERNAME, VPS_PASSWORD

### Verifică VPS:
```bash
ssh root@64.225.49.128

# Verifică aplicația
cd /var/www/orex.site
ls -la                    # Trebuie să vezi fișierele proiectului
pm2 status               # Trebuie să vezi "olx-monitor" running

# Verifică nginx
nginx -t                 # Trebuie să zică "syntax is ok"
systemctl status nginx   # Trebuie să fie "active (running)"

# Verifică porturile
netstat -tlnp | grep :3000  # Aplicația pe port 3000
netstat -tlnp | grep :80    # Nginx pe port 80
```

### Verifică site-ul:
- Deschide http://orex.site în browser
- Trebuie să vezi interfața aplicației

## ❌ PROBLEME COMUNE

### Deployment nu se activează:
- **Cauză**: Secrets în Variables în loc de Secrets
- **Soluție**: Mută din Variables în Secrets

### Site nu se încarcă:
- **Verifică**: `pm2 status` - aplicația trebuie să fie "online"
- **Verifică**: `systemctl status nginx` - trebuie să fie "active"
- **Verifică**: `nginx -t` - trebuie să zică "syntax is ok"

### Aplicația nu pornește:
```bash
cd /var/www/orex.site
npm install
npm run build
pm2 restart olx-monitor
```

## 📞 COMENZI DE DEBUGGING

```bash
# Status complet
./debug-vps.sh

# Sau manual pe VPS:
pm2 logs olx-monitor
tail -f /var/log/nginx/error.log
```

## ✅ CHECKLIST FINAL

- [ ] GitHub Secrets configurate (NU Variables!)
- [ ] VPS setup complet executat
- [ ] Aplicația rulează pe VPS (`pm2 status`)
- [ ] Nginx configurat și pornit
- [ ] Site accesibil pe http://orex.site
- [ ] Test deployment automat funcționează