#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🐺 BandClaw — Quick Start / Restart Script
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\n🐺 BandClaw — Starting...\n"

# Verify .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Run install.sh first."
  exit 1
fi

# Build
echo "🔨 Building TypeScript..."
npm run build 2>&1 | tail -3
echo "✅ Build complete"

# Create logs dir
mkdir -p logs

# Start or restart with PM2
if pm2 describe bandclaw > /dev/null 2>&1; then
  echo "♻️  Restarting BandClaw..."
  pm2 restart ecosystem.config.cjs
else
  echo "🚀 Starting BandClaw..."
  pm2 start ecosystem.config.cjs
fi

pm2 save > /dev/null 2>&1
echo ""
echo "✅ BandClaw is running!"
echo ""
echo "  pm2 logs bandclaw    — View logs"
echo "  pm2 status           — Check status"
echo "  pm2 stop bandclaw    — Stop"
echo "  pm2 restart bandclaw — Restart"
echo ""
