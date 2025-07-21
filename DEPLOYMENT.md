# Deployment Guide pentru olx-monitor

Acest ghid explică cum să configurați și să utilizați sistemul de deployment automat pentru repository-ul olx-monitor pe domeniul **orex.site** (VPS IP: 185.104.183.59).

## 🚀 Configurare GitHub Actions (Recomandat)

### 1. Configurare Secrets în GitHub

Pentru securitate, credentialele VPS-ului sunt stocate ca GitHub Secrets. Accesați:
- Repository → Settings → Secrets and variables → Actions
- Adăugați următoarele secrets:

```
VPS_HOST=185.104.183.59    # IP-ul serverului orex.site
VPS_USERNAME=root
VPS_SSH_KEY=[cheia SSH privată completă]
VPS_PORT=22
```

### 2. Generare cheie SSH (dacă nu aveți)

Pe mașina locală:
```bash
ssh-keygen -t rsa -b 4096 -C "deploy@olx-monitor"
```

Copiați cheia publică pe VPS (orex.site):
```bash
ssh-copy-id root@185.104.183.59
# sau direct pe domeniu:
ssh-copy-id root@orex.site
```

Copiați cheia privată în GitHub Secret `VPS_SSH_KEY`.

### 3. Deployment automat

Workflow-ul se execută automat la:
- Push pe branch-ul `main`
- Poate fi executat manual din GitHub Actions tab

## 🛠️ Deployment manual cu script

### Utilizare script local

```bash
# Deployment cu configurări default
./deploy.sh

# Deployment cu parametri personalizați
./deploy.sh [host] [user] [remote_path]
```

### Exemplu:
```bash
./deploy.sh 185.104.183.59 root /root/olx-monitor
```

## 🌐 Informații server

**Domeniu țintă**: orex.site  
**IP Server**: 185.104.183.59  
**Utilizator**: root  
**Port SSH**: 22  
**Path aplicație**: /root/olx-monitor  

## 📋 Configurare VPS (Setup inițial)

### 1. Instalare dependențe pe VPS

```bash
# Update sistem
apt update && apt upgrade -y

# Instalare Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalare PM2
npm install -g pm2

# Setup PM2 pentru autostart
pm2 startup
# Urmăriți instrucțiunile afișate
```

### 2. Clonare repository pe VPS (orex.site)

```bash
# Conectare la server
ssh root@185.104.183.59
# sau ssh root@orex.site

# Clonare repository
cd /root
git clone https://github.com/[username]/olx-monitor.git
cd olx-monitor
git checkout main  # Asigură-te că ești pe branch-ul main
npm install --omit=dev
```

### 3. Configurare PM2

```bash
# Start aplicația cu PM2
pm2 start ecosystem.config.js

# Salvare configurația PM2
pm2 save
```

## 📊 Monitoring și Management

### Comenzi utile PM2

```bash
# Status aplicații
pm2 status

# Logs
pm2 logs olx-monitor

# Restart
pm2 restart olx-monitor

# Stop
pm2 stop olx-monitor

# Monitoring în timp real
pm2 monit
```

### Verificare deployment

După fiecare deployment, verificați:
1. Status PM2: `pm2 status`
2. Logs pentru erori: `pm2 logs olx-monitor --lines 50`
3. Funcționalitatea aplicației

## 🔧 Troubleshooting

### Probleme comune

1. **SSH connection failed**
   - Verificați că cheia SSH este corectă în GitHub Secrets
   - Testați conexiunea manual: 
     ```bash
     ssh root@185.104.183.59
     # sau
     ssh root@orex.site
     ```

2. **PM2 restart failed**
   - Verificați logs: `pm2 logs olx-monitor`
   - Restart manual: `pm2 restart olx-monitor`

3. **Git pull failed**
   - Verificați permisiunile pe VPS
   - Reset hard: `git reset --hard origin/main`

### Rollback în caz de probleme

```bash
# Pe VPS
cd /root
rm -rf olx-monitor
mv olx-monitor-backup olx-monitor
cd olx-monitor
pm2 restart all
```

## 🔐 Securitate

- **Nu** commitați credentialele în repository
- Utilizați doar GitHub Secrets pentru informații sensibile
- Schimbați regulat parolele și cheile SSH
- Considerați utilizarea unui user non-root pe VPS

## 📝 Logs

Logs-urile aplicației sunt stocate în:
- `/root/olx-monitor/logs/out.log` - Output normal
- `/root/olx-monitor/logs/err.log` - Erori
- `/root/olx-monitor/logs/combined.log` - Combinat

## 🔄 Workflow-ul de deployment

1. **Push pe main** → GitHub Actions se activează
2. **Checkout code** → Se descarcă codul recent
3. **SSH to VPS** → Conectare la server
4. **Backup** → Se creează backup pentru rollback
5. **Git pull** → Se actualizează codul
6. **Install deps** → Se instalează dependențele
7. **Restart PM2** → Se restart aplicația
8. **Verify** → Se verifică că deployment-ul a reușit

## ✅ Best Practices

- Testați modificările local înainte de push
- Verificați logs-urile după fiecare deployment
- Mențineți backup-uri regulate
- Monitorizați performanța aplicației
- Actualizați regular dependențele