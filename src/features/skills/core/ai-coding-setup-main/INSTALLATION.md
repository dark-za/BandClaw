# 📦 Complete Installation Guide

This guide walks you through setting up the ultimate AI coding environment with 228+ skills, CLI tools, and automated workflows.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Installation](#manual-installation)
4. [CLI Tools Setup](#cli-tools-setup)
5. [Skills Installation](#skills-installation)
6. [Verification](#verification)
7. [Next Steps](#next-steps)

## Prerequisites

### Required

- **Operating System**: macOS or Linux
- **Git**: Version control system
- **Node.js & npm**: Package management
- **Python 3**: For some skill scripts
- **Bash**: Shell scripting

### Check Prerequisites

```bash
# Check OS
uname -s

# Check git
git --version

# Check Node.js
node --version
npm --version

# Check Python
python3 --version

# Check Bash
bash --version
```

## Quick Start

### One-Command Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/ai-coding-setup/main/install.sh | bash
```

This will:
1. Install all CLI tools
2. Install all skills from all sources
3. Sync skills across all AI tools
4. Verify installation
5. Generate configuration files

### What Gets Installed

- ✅ 228+ professional skills
- ✅ GitHub CLI (gh v2.60.0)
- ✅ Supabase CLI (v2.72.7)
- ✅ Superpowers workflow
- ✅ Cross-tool skill sync

## Manual Installation

If you prefer manual setup, follow these steps:

## Step 1: Install CLI Tools

### GitHub CLI

```bash
# For macOS (ARM64)
mkdir -p ~/.local/bin
curl -L https://github.com/cli/cli/releases/download/v2.60.0/gh_2.60.0_macOS_arm64.zip -o /tmp/gh.zip
unzip /tmp/gh.zip -d /tmp
cp /tmp/gh_2.60.0_macOS_arm64/bin/gh ~/.local/bin/
chmod +x ~/.local/bin/gh

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify
gh --version
```

### Supabase CLI

```bash
# For macOS (ARM64)
mkdir -p ~/.local/bin
curl -L https://github.com/supabase/cli/releases/download/v2.72.7/supabase_darwin_arm64.tar.gz -o /tmp/supabase.tar.gz
tar -xzf /tmp/supabase.tar.gz -C /tmp
cp /tmp/supabase ~/.local/bin/
chmod +x ~/.local/bin/supabase

# Verify
supabase --version
```

### npx Skills CLI

```bash
# Install skills CLI globally
npm install -g @modelcontextprotocol/skills

# Verify
npx skills --version
```

## Step 2: Install Skills

### Option A: Install All Skills from Repositories

#### Install from softaworks/agent-toolkit (42 skills)

```bash
npx skills add https://github.com/softaworks/agent-toolkit --all --yes --global
```

#### Install from obra/superpowers (14 skills)

```bash
npx skills add https://github.com/obra/superpowers --all --yes --global
```

#### Install from anthropics/skills (1 skill)

```bash
npx skills add https://github.com/anthropics/skills --skill pdf --yes --global
```

#### Install from callstackincubator/agent-skills (1 skill)

```bash
npx skills add https://github.com/callstackincubator/agent-skills --skill react-native-best-practices --yes --global
```

#### Install from nextlevelbuilder/ui-ux-pro-max-skill

```bash
# Clone and install manually
cd /tmp
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git
python3 ~/.claude/skills/skill-converter/scripts/convert_scripts.py
```

### Option B: Use Skill Converter

For any skill in GitHub:

```bash
python3 ~/.claude/skills/skill-converter/scripts/convert_scripts.py
```

This provides interactive workflow for converting skills.

## Step 3: Sync Skills Across All Tools

By default, skills are installed to central location `~/.agents/skills/` and symlinked to specific tools.

To ensure ALL Claude Code skills are available in all tools:

```bash
# Use the sync script
./scripts/sync-skills.sh
```

Or manually:

```bash
#!/bin/bash
SOURCE_DIR="$HOME/.claude/skills"
TARGET_DIRS=(
    "$HOME/.codex/skills"
    "$HOME/.config/opencode/skills"
    "$HOME/.gemini/antigravity/global_skills"
)

for TARGET_DIR in "${TARGET_DIRS[@]}"; do
    mkdir -p "$TARGET_DIR"
    for skill_dir in "$SOURCE_DIR"/*/; do
        if [ -f "$skill_dir/SKILL.md" ]; then
            skill_name=$(basename "$skill_dir")
            target_path="$TARGET_DIR/$skill_name"
            if [ ! -e "$target_path" ]; then
                cp -r "$skill_dir" "$target_path"
            fi
        fi
    done
done
```

## Step 4: Configure OpenCode Agents (Optional)

If using OpenCode, you may want to assign skills to specific agents:

```bash
# Edit OpenCode config
nano ~/.config/opencode/oh-my-opencode.json
```

Add skills to agent configurations:

```json
{
  "agents": {
    "sisyphus": {
      "skills": ["brainstorming", "writing-plans", "systematic-debugging"]
    },
    "oracle": {
      "skills": ["python-pro", "data-scientist", "database-administrator"]
    }
  }
}
```

## Verification

### Check Installation

```bash
# Run verification script
./scripts/verify-setup.sh
```

### Manual Verification

```bash
# Count skills in each tool
echo "Claude Code: $(ls ~/.claude/skills/*/ | wc -l)"
echo "Codex CLI: $(ls ~/.codex/skills/*/ | wc -l)"
echo "OpenCode: $(ls ~/.config/opencode/skills/*/ | wc -l)"
echo "Gemini CLI: $(ls ~/.gemini/antigravity/global_skills/*/ | wc -l)"
```

Expected output: All tools should show **228** skills.

### Test Skill Activation

```bash
# In Claude Code
# Start a conversation about any topic
# Skills should auto-activate

# Example conversation:
"You: I need to create a REST API"
# Expected: brainstorming skill activates
```

## Troubleshooting

### Skills Not Appearing

1. **Check skill directories exist**:
   ```bash
   ls ~/.claude/skills/
   ls ~/.codex/skills/
   ```

2. **Verify SKILL.md files**:
   ```bash
   for skill in ~/.claude/skills/*/; do
     [ -f "$skill/SKILL.md" ] || echo "Missing: $skill"
   done
   ```

3. **Restart your AI tool**

### CLI Tools Not Found

1. **Check PATH**:
   ```bash
   echo $PATH | grep "$HOME/.local/bin"
   ```

2. **Add to PATH if missing**:
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
   ```

### Permission Denied

```bash
# Make scripts executable
chmod +x ~/.local/bin/gh
chmod +x ~/.local/bin/supabase
```

## Next Steps

1. **Explore Skills**: See [SKILLS.md](SKILLS.md) for complete catalog
2. **Learn Workflows**: See [WORKFLOWS.md](WORKFLOWS.md) for Superpowers guide
3. **Start Coding**: Just start working - skills activate automatically!
4. **Customize**: Add your own custom skills

## Advanced Configuration

### Add Custom Skills

1. Create skill directory:
   ```bash
   mkdir -p ~/.claude/skills/my-custom-skill
   ```

2. Create SKILL.md:
   ```bash
   nano ~/.claude/skills/my-custom-skill/SKILL.md
   ```

3. Sync to other tools:
   ```bash
   ./scripts/sync-skills.sh
   ```

### Update Skills

```bash
# Update from repositories
npx skills add https://github.com/obra/superpowers --all --yes --global

# Sync across tools
./scripts/sync-skills.sh
```

### Remove Skills

```bash
# From all tools
rm -rf ~/.claude/skills/skill-name
rm -rf ~/.codex/skills/skill-name
rm -rf ~/.config/opencode/skills/skill-name
rm -rf ~/.gemini/antigravity/global_skills/skill-name
```

## Support

For issues:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Review main [README.md](README.md)
- Open GitHub issue

---

**Installation typically takes 10-15 minutes**

*Last updated: 2025-01-27*
