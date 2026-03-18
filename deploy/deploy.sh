#!/usr/bin/env bash
# Deploy solana-ohlc-candlestick-data-api to VM via rsync.
# IMPORTANT: Run this script FROM the solana-ohlc-candlestick-data-api repo.
# The source is the directory that contains this deploy/ folder (SCRIPT_DIR/..).
# Usage: cd /path/to/solana-ohlc-candlestick-data-api && ./deploy/deploy.sh
# Optional: set SSH_PASS in env to avoid embedding password.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REMOTE_USER="root"
REMOTE_HOST="65.109.218.200"
REMOTE_DIR="/root/solana-ohlc-candlestick-data-api"

# Ensure we are in the OHLC candlestick repo, not e.g. historical-trade-data-api
if ! grep -q '"name": "solana-ohlc-candlestick-data-api"' "$PROJECT_DIR/package.json" 2>/dev/null; then
  echo "ERROR: Wrong repo. This script must be run from solana-ohlc-candlestick-data-api." >&2
  echo "  Source dir: $PROJECT_DIR" >&2
  echo "  Run: cd /path/to/solana-ohlc-candlestick-data-api && ./deploy/deploy.sh" >&2
  exit 1
fi

# Prefer env; fallback for convenience (consider using SSH_PASS only)
SSH_PASS="${SSH_PASS:-u4bWeh4VnKrFAbuU7Emg!}"

echo "Source (this repo): $PROJECT_DIR"
echo "Syncing -> ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
sshpass -p "$SSH_PASS" rsync -avz -e "ssh -o StrictHostKeyChecking=no" \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude data \
  "$PROJECT_DIR/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

echo "Done. On the VM run: cd $REMOTE_DIR && npm ci && npm run build && npm run build:frontend && sudo systemctl restart solana-ohlc-candlestick-data-api"
echo "Or install service once: sudo cp $REMOTE_DIR/deploy/solana-ohlc-candlestick-data-api.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now solana-ohlc-candlestick-data-api"
