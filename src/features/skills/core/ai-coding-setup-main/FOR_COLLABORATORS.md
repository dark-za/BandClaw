# 👥 Collaborators Guide: Getting All Skills

Complete guide for collaborators to get the complete AI coding setup with all 228+ skills.

## 🎯 Overview

Collaborators don't need to manually copy skill files! The repository contains **automated scripts** that will:
1. Install CLI tools (GitHub CLI, Supabase CLI)
2. Download all 228 skills from their original sources
3. Sync skills across all AI tools (Claude Code, Codex, OpenCode, Gemini CLI)
4. Verify everything works

## 📦 Quick Start (One Command)

### Step 1: Clone This Repository

```bash
git clone https://github.com/404kidwiz/ai-coding-setup.git
cd ai-coding-setup
```

### Step 2: Run the Installer

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

### Step 3: Verify Installation

```bash
# Check skills in Claude Code
ls ~/.claude/skills/ | wc -l
# Should show: 228

# Check skills in Codex
ls ~/.codex/skills/ | wc -l
# Should show: 228

# Check skills in OpenCode
ls ~/.config/opencode/skills/ | wc -l
# Should show: 228

# Check skills in Gemini CLI
ls ~/.gemini/antigravity/global_skills/ | wc -l
# Should show: 228
```

**That's it!** They now have all 228+ skills installed.

---

## 📖 Detailed Installation

### Prerequisites Check

Make sure you have:
```bash
# Check git
git --version

# Check node & npm
node --version
npm --version

# Check python
python3 --version

# Check bash
bash --version
```

Install missing prerequisites:
```bash
# macOS
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Linux
sudo apt-get update
sudo apt-get install -y git nodejs npm python3
```

### What the Installer Does

The `scripts/install.sh` script automates everything:

#### 1. Installs CLI Tools (~2 minutes)

**GitHub CLI** (v2.60.0):
- Downloads for your OS/architecture
- Installs to `~/.local/bin/`
- Adds to PATH in `~/.zshrc`

**Supabase CLI** (v2.72.7):
- Downloads for your OS/architecture
- Installs to `~/.local/bin/`
- Adds to PATH in `~/.zshrc`

#### 2. Installs Skills Using npx skills (~5 minutes)

Automatically installs skills from these repositories:

| Repository | Skills Count | Command |
|-----------|--------------|---------|
| softaworks/agent-toolkit | 42 | `npx skills add https://github.com/softaworks/agent-toolkit --all --yes --global` |
| obra/superpowers | 14 | `npx skills add https://github.com/obra/superpowers --all --yes --global` |
| anthropics/skills | 1 | `npx skills add https://github.com/anthropics/skills --skill pdf --yes --global` |
| callstackincubator/agent-skills | 1 | `npx skills add https://github.com/callstackincubator/agent-skills --skill react-native-best-practices --yes --global` |

#### 3. Syncs Skills to All Tools (~1 minute)

Copies all 228 skills from Claude Code to:
- Codex CLI (`~/.codex/skills/`)
- OpenCode (`~/.config/opencode/skills/`)
- Gemini CLI (`~/.gemini/antigravity/global_skills/`)

#### 4. Verification

Shows final count of skills in each tool.

---

## 🔧 Manual Installation (If Script Fails)

If the automated script doesn't work, collaborators can install manually:

### Step 1: Install CLI Tools

```bash
# Create bin directory
mkdir -p ~/.local/bin

# Install GitHub CLI
curl -L https://github.com/cli/cli/releases/download/v2.60.0/gh_2.60.0_macOS_arm64.zip -o /tmp/gh.zip
unzip /tmp/gh.zip -d /tmp
cp /tmp/gh_2.60.0_macOS_arm64/bin/gh ~/.local/bin/
chmod +x ~/.local/bin/gh

# Install Supabase CLI
curl -L https://github.com/supabase/cli/releases/download/v2.72.7/supabase_darwin_arm64.tar.gz -o /tmp/supabase.tar.gz
tar -xzf /tmp/supabase.tar.gz -C /tmp
cp /tmp/supabase ~/.local/bin/
chmod +x ~/.local/bin/supabase

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 2: Install Skills Manually

```bash
# From softaworks/agent-toolkit (42 skills)
npx skills add https://github.com/softaworks/agent-toolkit --all --yes --global

# From obra/superpowers (14 skills)
npx skills add https://github.com/obra/superpowers --all --yes --global

# From anthropics/skills (pdf skill)
npx skills add https://github.com/anthropics/skills --skill pdf --yes --global

# From callstackincubator/agent-skills (react-native)
npx skills add https://github.com/callstackincubator/agent-skills --skill react-native-best-practices --yes --global
```

### Step 3: Sync Skills

```bash
cd ai-coding-setup
chmod +x scripts/sync-skills.sh
./scripts/sync-skills.sh
```

---

## 📊 Understanding Skill Installation

### Where Skills Come From

Skills are **downloaded from original repositories**, not copied from your machine:

```
Original Repositories (upstream)
        ↓
npx skills add <repo-url>
        ↓
Central Location (~/.agents/skills/)
        ↓
Symlinked to Tools:
  ├── ~/.claude/skills/          → 228 skills
  ├── ~/.codex/skills/          → 228 skills
  ├── ~/.config/opencode/skills/ → 228 skills
  └── ~/.gemini/antigravity/global_skills/ → 228 skills
```

### Why This Approach?

**Benefits**:
- ✅ Always get latest version from original authors
- ✅ No manual copying required
- ✅ Automatic updates available
- ✅ Smaller repository size
- ✅ No license/permission issues

**Your Repository** provides:
- Documentation on what skills exist
- Automation to install everything
- Guides on how to use them

---

## 🎯 After Installation

### Verify Skills Are Working

```bash
# Check a few specific skills
ls ~/.claude/skills/python-pro-skill/
ls ~/.claude/skills/brainstorming/
ls ~/.claude/skills/systematic-debugging/
```

Each should show:
```
SKILL.md
scripts/
references/
```

### Test Skill Activation

Start a conversation in any AI CLI tool:

```
You: "I need to create a REST API"

Expected: brainstorming skill should auto-activate
```

---

## 🔄 Keeping Skills Updated

### Update All Skills

```bash
cd ai-coding-setup

# Re-run installer (updates everything)
./scripts/install.sh
```

### Update Specific Skills

```bash
# Update superpowers
npx skills add https://github.com/obra/superpowers --all --yes --global

# Update agent-toolkit
npx skills add https://github.com/softaworks/agent-toolkit --all --yes --global
```

### Sync to All Tools

```bash
./scripts/sync-skills.sh
```

---

## 🆘 Troubleshooting

### Problem: "Command not found: npx"

**Solution**: Install npm/node
```bash
# macOS
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node
```

### Problem: "Permission denied"

**Solution**: Make scripts executable
```bash
chmod +x scripts/*.sh
```

### Problem: "Skills not appearing"

**Solution**: Check installation
```bash
# Check if skills were installed
ls ~/.agents/skills/

# If empty, run installer
./scripts/install.sh
```

### Problem: "Only some skills installed"

**Solution**: Sync skills
```bash
./scripts/sync-skills.sh
```

---

## 📞 Getting Help

If collaborators have issues:

1. Check [INSTALLATION.md](https://github.com/404kidwiz/ai-coding-setup/blob/main/INSTALLATION.md)
2. Check [TROUBLESHOOTING.md](https://github.com/404kidwiz/ai-coding-setup/blob/main/TROUBLESHOOTING.md)
3. Open an issue on GitHub

---

## 🎓 Summary for Collaborators

### What They Get

- ✅ **228+ professional skills**
- ✅ **GitHub CLI** (gh)
- ✅ **Supabase CLI**
- ✅ **Superpowers workflow**
- ✅ **Complete documentation**

### How They Get It

1. **Clone repo**: `git clone https://github.com/404kidwiz/ai-coding-setup.git`
2. **Run installer**: `./scripts/install.sh`
3. **Start coding**: Skills auto-activate!

### Time Required

- **Fast internet**: 10-15 minutes
- **Slow internet**: 20-30 minutes

---

## 💡 Pro Tips for Collaborators

### Tip 1: Read First

Before installing, collaborators should read:
- [README.md](https://github.com/404kidwiz/ai-coding-setup/blob/main/README.md) - Overview
- [INSTALLATION.md](https://github.com/404kidwiz/ai-coding-setup/blob/main/INSTALLATION.md) - Setup guide

### Tip 2: Verify Installation

Always verify after installing:
```bash
ls ~/.claude/skills/ | wc -l  # Should be 228+
ls ~/.codex/skills/ | wc -l   # Should be 228+
```

### Tip 3: Update Regularly

Keep setup updated:
```bash
cd ai-coding-setup
git pull origin main      # Get latest scripts
./scripts/install.sh        # Reinstall
```

---

**Collaborators will have the exact same setup as you!** 🎉

---

*Last updated: 2025-01-27*
