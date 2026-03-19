#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  🐺 BandClaw — One-Line Installer
#  Usage: curl -fsSL https://raw.githubusercontent.com/<user>/bandclaw/main/install.sh | bash
# ═══════════════════════════════════════════════════════════════

set -e

# ─── Colors & Helpers ──────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

REPO_URL="https://github.com/dark-za/BandClaw.git"
INSTALL_DIR="$HOME/bandclaw"

log()    { echo -e "${GREEN}✅ $1${NC}"; }
warn()   { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()    { echo -e "${RED}❌ $1${NC}"; exit 1; }
info()   { echo -e "${CYAN}ℹ️  $1${NC}"; }
header() { echo -e "\n${BOLD}${CYAN}── $1 ──${NC}\n"; }

# ─── Root / Sudo Check ────────────────────────────────────────

need_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo &> /dev/null; then
      SUDO="sudo"
    else
      err "This script requires root privileges. Run with sudo or as root."
    fi
  else
    SUDO=""
  fi
}

# ─── Banner ────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║        🐺  BandClaw Installer            ║"
echo "  ║     Personal AI Agent · Local · Secure   ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════
#  STEP 1: System Dependencies
# ═══════════════════════════════════════════════════════════════

header "Step 1/6 — Checking System Dependencies"
need_sudo

# ─── Git ───────────────────────────────────────────────────────

if command -v git &> /dev/null; then
  log "Git $(git --version | awk '{print $3}') found"
else
  info "Installing Git..."
  $SUDO apt-get update -qq && $SUDO apt-get install -y -qq git > /dev/null 2>&1
  log "Git installed"
fi

# ─── Node.js ──────────────────────────────────────────────────

install_node() {
  info "Installing Node.js 20 LTS via NodeSource..."
  $SUDO apt-get update -qq
  $SUDO apt-get install -y -qq ca-certificates curl gnupg > /dev/null 2>&1
  $SUDO mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | $SUDO gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg 2>/dev/null
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | $SUDO tee /etc/apt/sources.list.d/nodesource.list > /dev/null
  $SUDO apt-get update -qq && $SUDO apt-get install -y -qq nodejs > /dev/null 2>&1
  log "Node.js $(node -v) installed"
}

if command -v node &> /dev/null; then
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    log "Node.js $(node -v) found"
  else
    warn "Node.js $(node -v) is too old (need 18+)"
    install_node
  fi
else
  install_node
fi

# ─── npm sanity ────────────────────────────────────────────────

if ! command -v npm &> /dev/null; then
  err "npm not found even after Node.js install. Something went wrong."
fi

# ─── PM2 ──────────────────────────────────────────────────────

if command -v pm2 &> /dev/null; then
  log "PM2 $(pm2 -v) found"
else
  info "Installing PM2 globally..."
  $SUDO npm install -g pm2 > /dev/null 2>&1
  log "PM2 installed"
fi

# ═══════════════════════════════════════════════════════════════
#  STEP 2: Clone / Pull Repository
# ═══════════════════════════════════════════════════════════════

header "Step 2/6 — Repository"

if [ -d "$INSTALL_DIR/.git" ]; then
  info "Existing installation found at $INSTALL_DIR"
  info "Pulling latest changes..."
  cd "$INSTALL_DIR"
  git pull --ff-only || { warn "Git pull failed, continuing with existing code..."; }
  log "Repository updated"
else
  if [ -d "$INSTALL_DIR" ]; then
    warn "$INSTALL_DIR exists but is not a git repo. Backing up..."
    mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%s)"
  fi
  info "Cloning BandClaw..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  log "Repository cloned to $INSTALL_DIR"
fi

# ═══════════════════════════════════════════════════════════════
#  STEP 3: Install Dependencies
# ═══════════════════════════════════════════════════════════════

header "Step 3/6 — Installing Dependencies"
cd "$INSTALL_DIR"
npm install --production=false 2>&1 | tail -1
log "Dependencies installed"

# ═══════════════════════════════════════════════════════════════
#  STEP 4: Build Project
# ═══════════════════════════════════════════════════════════════

header "Step 4/6 — Building TypeScript"
npm run build 2>&1 | tail -3
log "Build complete"

# Create required directories
mkdir -p safe_scripts logs

# ═══════════════════════════════════════════════════════════════
#  STEP 5: Interactive .env Configuration
# ═══════════════════════════════════════════════════════════════

header "Step 5/6 — Configuration"

if [ -f "$INSTALL_DIR/.env" ]; then
  warn ".env already exists. Skipping configuration."
  info "Edit manually: $INSTALL_DIR/.env"
else
  info "Let's set up your environment.\n"

  # ── Telegram Bot Token ──
  echo -e "${BOLD}1) Telegram Bot Token${NC}"
  echo -e "   Get one from ${CYAN}@BotFather${NC} on Telegram"
  read -rp "   Token: " TELEGRAM_TOKEN < /dev/tty
  if [ -z "$TELEGRAM_TOKEN" ]; then
    err "Telegram Bot Token is required."
  fi

  # ── Allowed User IDs ──
  echo ""
  echo -e "${BOLD}2) Allowed Telegram User IDs${NC}"
  echo -e "   Comma-separated list of numeric IDs authorized to use the bot"
  echo -e "   Find yours via ${CYAN}@userinfobot${NC} on Telegram"
  read -rp "   User IDs: " ALLOWED_IDS < /dev/tty
  if [ -z "$ALLOWED_IDS" ]; then
    err "At least one user ID is required."
  fi

  # ── LLM URL ──
  echo ""
  echo -e "${BOLD}3) Local LLM API URL${NC}"
  echo -e "   Your LM Studio API endpoint"
  read -rp "   URL [http://192.168.1.124:1234/v1]: " LLM_URL < /dev/tty
  LLM_URL="${LLM_URL:-http://192.168.1.124:1234/v1}"

  # ── Default Model ──
  echo ""
  echo -e "${BOLD}4) Default Model${NC}"
  echo -e "   Available:"
  echo -e "     1) deepseek/deepseek-r1-0528-qwen3-8b"
  echo -e "     2) qwen2.5-7b-instruct-tool-planning-v0.1"
  echo -e "     3) qwen3.5-9b-uncensored-hauhaucs-aggressive"
  read -rp "   Choose [3]: " MODEL_CHOICE < /dev/tty
  MODEL_CHOICE="${MODEL_CHOICE:-3}"
  case "$MODEL_CHOICE" in
    1) DEFAULT_MODEL="deepseek/deepseek-r1-0528-qwen3-8b" ;;
    2) DEFAULT_MODEL="qwen2.5-7b-instruct-tool-planning-v0.1" ;;
    *) DEFAULT_MODEL="qwen3.5-9b-uncensored-hauhaucs-aggressive" ;;
  esac

  # ── Write .env ──
  cat > "$INSTALL_DIR/.env" << ENVEOF
TELEGRAM_BOT_TOKEN="${TELEGRAM_TOKEN}"
ALLOWED_USER_IDS="${ALLOWED_IDS}"
LOCAL_LLM_URL="${LLM_URL}"
DEFAULT_MODEL="${DEFAULT_MODEL}"
DB_PATH="./memory.db"
WEBHOOK_PORT="3000"

# Optional fallback APIs
# GROQ_API_KEY=""
# GEMINI_API_KEY=""
ENVEOF

  log ".env created successfully"
fi

# ═══════════════════════════════════════════════════════════════
#  STEP 6: Start with PM2
# ═══════════════════════════════════════════════════════════════

header "Step 6/6 — Starting BandClaw"

cd "$INSTALL_DIR"

# Stop existing instance if running
if pm2 describe bandclaw > /dev/null 2>&1; then
  info "Stopping existing BandClaw process..."
  pm2 stop bandclaw > /dev/null 2>&1 || true
  pm2 delete bandclaw > /dev/null 2>&1 || true
fi

# Start via ecosystem config
pm2 start ecosystem.config.cjs
log "BandClaw started with PM2"

# Setup PM2 startup on boot
info "Configuring PM2 startup on boot..."
PM2_STARTUP_CMD=$(pm2 startup 2>&1 | grep -oP 'sudo .*' || true)
if [ -n "$PM2_STARTUP_CMD" ]; then
  eval "$PM2_STARTUP_CMD" > /dev/null 2>&1 || warn "Could not configure auto-startup. Run manually: pm2 startup"
fi
pm2 save > /dev/null 2>&1
log "PM2 configured for auto-start on boot"

# ═══════════════════════════════════════════════════════════════
#  Done!
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}${GREEN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     🐺 BandClaw — Installation Complete  ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}Location:${NC}    $INSTALL_DIR"
echo -e "  ${BOLD}Status:${NC}      Running via PM2"
echo -e "  ${BOLD}Logs:${NC}        pm2 logs bandclaw"
echo -e "  ${BOLD}Stop:${NC}        pm2 stop bandclaw"
echo -e "  ${BOLD}Restart:${NC}     pm2 restart bandclaw"
echo -e "  ${BOLD}Webhook:${NC}     http://localhost:3000"
echo ""
echo -e "  ${CYAN}Send /start to your bot on Telegram to begin! 🚀${NC}"
echo ""
