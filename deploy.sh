#!/usr/bin/env bash
set -euo pipefail

SERVER_USER="wc-master"
SERVER_IP="15.235.33.33"
REMOTE_DIR="/home/wc-master/apps/quaxt/frontend"
PM2_CONFIG_DIR="/home/wc-master/apps"
SSH_KEY="${HOME}/keys/quxta_key"
ENV_FILE=".env.production"

echo "1. Lint & build (production)"
npm run lint
NODE_ENV=production npm run build

echo "2. Ship source + build + ecosystem file"
rsync -avz --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  --exclude='node_modules' --exclude='*.log' --exclude='.git' --exclude='.next' \
  ./ "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/"

rsync -avz --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  .next/ "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/.next/"

echo "3. Install production dependencies"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
  "cd $REMOTE_DIR && npm ci --production"

echo "4. Copy production env file"
rsync -avz -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$ENV_FILE" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/.env"

echo "5. Reload PM2 (Quaxt-Client)"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
  "cd $PM2_CONFIG_DIR && pm2 startOrReload ecosystem.config.js && pm2 save"

echo "6. ✅ Deploy complete – https://app.quaxt.co.ke"