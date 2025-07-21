# Deployment Guide pentru olx-monitor

Acest ghid explică cum să configurați și să utilizați sistemul de deployment automat pentru repository-ul olx-monitor.

## 🚀 Configurare GitHub Actions (Recomandat)

### 1. Configurare Secrets în GitHub

Pentru securitate, credentialele VPS-ului sunt stocate ca GitHub Secrets. Accesați:
- Repository → Settings → Secrets and variables → Actions
- Adăugați următoarele secrets:

```
VPS_HOST=185.104.183.59
VPS_USERNAME=root
VPS_SSH_KEY=[cheia SSH privată]
VPS_PORT=22
```

### 2. Generare cheie SSH (dacă nu aveți)

Pe mașina locală:
```bash
ssh-keygen -t rsa -b 4096 -C "deploy@olx-monitor"
```

Copiați cheia publică pe VPS:
```bash
ssh-copy-id root@185.104.183.59
```

Copiați cheia privată în GitHub Secret `VPS_SSH_KEY`.

### 3. Deployment automat

Workflow-ul se execută automat la:
- Push pe branch-ul `master`
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

### 2. Clonare repository pe VPS

```bash
cd /root
git clone https://github.com/[username]/olx-monitor.git
cd olx-monitor
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
   - Testați conexiunea manual: `ssh root@185.104.183.59`

2. **PM2 restart failed**
   - Verificați logs: `pm2 logs olx-monitor`
   - Restart manual: `pm2 restart olx-monitor`

3. **Git pull failed**
   - Verificați permisiunile pe VPS
   - Reset hard: `git reset --hard origin/master`

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

1. **Push pe master** → GitHub Actions se activează
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