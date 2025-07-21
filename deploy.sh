#!/bin/bash

# Script de deployment local pentru olx-monitor
# Utilizare: ./deploy.sh [host] [user]

set -e

# Configurări default
DEFAULT_HOST="185.104.183.59"
DEFAULT_USER="root"
DEFAULT_PATH="/root/olx-monitor"

HOST=${1:-$DEFAULT_HOST}
USER=${2:-$DEFAULT_USER}
REMOTE_PATH=${3:-$DEFAULT_PATH}

echo "🚀 Starting deployment to $HOST..."

# Funcție pentru logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Verifică dacă avem acces SSH
log "Checking SSH connection..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$USER@$HOST" exit 2>/dev/null; then
    log "❌ SSH connection failed. Please check your SSH key or password."
    exit 1
fi

log "✅ SSH connection successful"

# Execută deployment pe server
log "Executing deployment commands on remote server..."
ssh "$USER@$HOST" << EOF
    set -e
    
    echo "🚀 Starting remote deployment..."
    
    # Backup current version
    cd /root
    if [ -d "olx-monitor-backup" ]; then
        rm -rf olx-monitor-backup
    fi
    if [ -d "olx-monitor" ]; then
        cp -r olx-monitor olx-monitor-backup
        echo "✅ Backup created"
    fi
    
    # Update code
    cd $REMOTE_PATH
    echo "📥 Pulling latest changes..."
    git fetch --all
    git reset --hard origin/main
    git pull origin main
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install --omit=dev --production
    
    # Restart services
    echo "🔄 Restarting services..."
    pm2 restart all || pm2 start ecosystem.config.js || echo "⚠️ PM2 restart failed, trying alternative start"
    
    # Verify deployment
    sleep 5
    if pm2 status | grep -q "online"; then
        echo "✅ Deployment successful!"
        pm2 status
    else
        echo "❌ Deployment may have issues, check PM2 status"
        pm2 status
        exit 1
    fi
    
    echo "🎉 Remote deployment completed!"
EOF

log "✅ Deployment completed successfully!"
log "You can check the application status with: ssh $USER@$HOST 'pm2 status'"