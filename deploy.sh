#!/usr/bin/env bash
set -euo pipefail

SERVER_USER="wc-master"
SERVER_IP="15.235.33.33"
REMOTE_DIR="/home/wc-master/apps/quaxt-client"
PM2_CONFIG_DIR="/home/wc-master/apps"
SSH_KEY="${HOME}/keys/quxta_key"
ENV_FILE=".env.production"
ARCHIVE_NAME="quaxt-client-$(date +%s).tar.gz"

echo "1. Lint & build (production)"
npm run lint

# Temporarily rename .env.local to something Next.js won't recognize
if [ -f ".env.local" ]; then
  echo "Temporarily hiding .env.local..."
  mv .env.local env.local.temp
fi

# Build with .env.production
NODE_ENV=production npm run build

# Restore .env.local
if [ -f "env.local.temp" ]; then
  mv env.local.temp .env.local
fi

echo "2. Create highly compressed deployment archive"
# Use maximum compression (gzip level 9) and exclude more unnecessary files
tar -czf "$ARCHIVE_NAME" \
  --exclude='node_modules' \
  --exclude='*.log' \
  --exclude='*.map' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='.env.development' \
  --exclude='.next/cache' \
  --exclude='*.md' \
  --exclude='.vscode' \
  --exclude='.idea' \
  --exclude='coverage' \
  --exclude='*.test.js' \
  --exclude='*.test.ts' \
  --exclude='*.spec.js' \
  --exclude='*.spec.ts' \
  -I "gzip -9" \
  .next package.json package-lock.json public next.config.mjs \
  $(find . -maxdepth 1 -name "*.js" -o -name "*.ts" -o -name "*.json" | grep -v node_modules) \
  $(find app -type f 2>/dev/null || true) \
  $(find components -type f 2>/dev/null || true) \
  $(find lib -type f 2>/dev/null || true) \
  $(find styles -type f 2>/dev/null || true) \
  $(find utils -type f 2>/dev/null || true)

echo "Archive size: $(du -h "$ARCHIVE_NAME" | cut -f1)"

echo "3. Upload archive to server (optimized for slow networks)"
# Use compression during transfer and show progress
scp -i "$SSH_KEY" \
  -o StrictHostKeyChecking=no \
  -o Compression=yes \
  -o CompressionLevel=9 \
  -C \
  "$ARCHIVE_NAME" "$SERVER_USER@$SERVER_IP:/tmp/"

echo "4. Extract and setup on server"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" bash << EOF
  set -euo pipefail

  # Create directory if it doesn't exist
  mkdir -p "$REMOTE_DIR"

  # Extract archive (overwrites existing files)
  echo "Extracting files..."
  tar -xzf /tmp/$ARCHIVE_NAME -C "$REMOTE_DIR"

  # Install production dependencies
  echo "Installing dependencies..."
  cd "$REMOTE_DIR"
  npm ci --production --omit=dev

  # Cleanup
  rm /tmp/$ARCHIVE_NAME

  echo "Extraction complete"
EOF

echo "5. Copy production env file"
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -o Compression=yes \
  "$ENV_FILE" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/.env"

echo "6. Reload PM2 (Quaxt-Client)"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" \
  "cd $PM2_CONFIG_DIR && pm2 startOrReload ecosystem.config.js && pm2 save"

echo "7. Cleanup local archive"
rm "$ARCHIVE_NAME"

echo "8. ✅ Deploy complete – https://app.quaxt.co.ke"
