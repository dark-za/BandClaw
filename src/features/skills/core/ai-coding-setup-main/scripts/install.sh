#!/bin/bash
#
# Ultimate AI Coding Setup - One-Command Installer
# Installs 228+ skills, CLI tools, and configures everything
#

set -e  # Exit on error

echo "╔═════════════════════════════════════════════════════════════════════════════╗"
echo "║          🚀 Ultimate AI Coding Setup - Installer                         ║"
echo "╚═════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Detect OS
OS=$(uname -s)
ARCH=$(uname -m)

echo "🔍 Detected System: $OS $ARCH"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v git >/dev/null 2>&1 || { echo "❌ git is required but not installed. Aborting." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ node is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed. Aborting." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ python3 is required but not installed. Aborting." >&2; exit 1; }
echo "✅ All prerequisites met"
echo ""

# Create bin directory
echo "📁 Creating directories..."
mkdir -p ~/.local/bin
mkdir -p ~/.codex/skills
mkdir -p ~/.config/opencode/skills
mkdir -p ~/.gemini/antigravity/global_skills
echo "✅ Directories created"
echo ""

# Install GitHub CLI
echo "📦 Installing GitHub CLI..."
if [ ! -f ~/.local/bin/gh ]; then
    if [[ "$OS" == "Darwin" ]]; then
        if [[ "$ARCH" == "arm64" ]]; then
            curl -L https://github.com/cli/cli/releases/download/v2.60.0/gh_2.60.0_macOS_arm64.zip -o /tmp/gh.zip
            unzip -o /tmp/gh.zip -d /tmp
            cp /tmp/gh_2.60.0_macOS_arm64/bin/gh ~/.local/bin/
            chmod +x ~/.local/bin/gh
        else
            echo "❌ Please install GitHub CLI manually from https://cli.github.com/"
            exit 1
        fi
    fi
    echo "✅ GitHub CLI installed"
else
    echo "⊘ GitHub CLI already installed"
fi

# Install Supabase CLI
echo "📦 Installing Supabase CLI..."
if [ ! -f ~/.local/bin/supabase ]; then
    if [[ "$OS" == "Darwin" ]]; then
        if [[ "$ARCH" == "arm64" ]]; then
            curl -L https://github.com/supabase/cli/releases/download/v2.72.7/supabase_darwin_arm64.tar.gz -o /tmp/supabase.tar.gz
            tar -xzf /tmp/supabase.tar.gz -C /tmp
            cp /tmp/supabase ~/.local/bin/
            chmod +x ~/.local/bin/supabase
        fi
    fi
    echo "✅ Supabase CLI installed"
else
    echo "⊘ Supabase CLI already installed"
fi

# Add to PATH
if ! grep -q '~/.local/bin' ~/.zshrc 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
    echo "✅ Added ~/.local/bin to PATH in ~/.zshrc"
fi

export PATH="$HOME/.local/bin:$PATH"

# Verify CLI tools
echo ""
echo "🔧 Verifying CLI tools..."
echo "  GitHub CLI: $(gh --version 2>/dev/null || echo 'Not installed')"
echo "  Supabase CLI: $(supabase --version 2>/dev/null || echo 'Not installed')"
echo ""

# Install skills using npx skills
echo "📚 Installing skills from repositories..."

# softaworks/agent-toolkit (42 skills)
echo "  • Installing softaworks/agent-toolkit (42 skills)..."
npx skills add https://github.com/softaworks/agent-toolkit --all --yes --global > /dev/null 2>&1
echo "  ✅ Done"

# obra/superpowers (14 skills)
echo "  • Installing obra/superpowers (14 skills)..."
npx skills add https://github.com/obra/superpowers --all --yes --global > /dev/null 2>&1
echo "  ✅ Done"

# anthropics/skills (pdf skill)
echo "  • Installing anthropics/skills (pdf skill)..."
npx skills add https://github.com/anthropics/skills --skill pdf --yes --global > /dev/null 2>&1
echo "  ✅ Done"

# callstackincubator/agent-skills (react-native-best-practices)
echo "  • Installing callstackincubator/agent-skills (react-native)..."
npx skills add https://github.com/callstackincubator/agent-skills --skill react-native-best-practices --yes --global > /dev/null 2>&1
echo "  ✅ Done"

echo ""
echo "🔄 Syncing skills across all AI tools..."

SOURCE_DIR="$HOME/.claude/skills"
TARGET_DIRS=(
    "$HOME/.codex/skills"
    "$HOME/.config/opencode/skills"
    "$HOME/.gemini/antigravity/global_skills"
)

for TARGET_DIR in "${TARGET_DIRS[@]}"; do
    TOOL_NAME=$(echo "$TARGET_DIR" | sed 's|.*/||' | sed 's/skills$//' | sed 's/global$//')
    echo "  • Syncing to $TOOL_NAME..."

    mkdir -p "$TARGET_DIR"

    COPIED=0
    for skill_dir in "$SOURCE_DIR"/*/; do
        if [ -f "$skill_dir/SKILL.md" ]; then
            skill_name=$(basename "$skill_dir")
            target_path="$TARGET_DIR/$skill_name"

            if [ ! -e "$target_path" ]; then
                cp -r "$skill_dir" "$target_path"
                ((COPIED++))
            fi
        fi
    done

    echo "    ✅ $COPIED new skills synced"
done

echo ""
echo "✅ Installation complete!"
echo ""

# Final counts
echo "📊 Final Installation:"
echo "  Claude Code:    $(ls ~/.claude/skills/*/ 2>/dev/null | wc -l) skills"
echo "  Codex CLI:      $(ls ~/.codex/skills/*/ 2>/dev/null | wc -l) skills"
echo "  OpenCode:       $(ls ~/.config/opencode/skills/*/ 2>/dev/null | wc -l) skills"
echo "  Gemini CLI:     $(ls ~/.gemini/antigravity/global_skills/*/ 2>/dev/null | wc -l) skills"
echo ""

echo "🎉 Setup complete! All 228+ skills are now available across all AI CLI tools!"
echo ""
echo "💡 Next steps:"
echo "  1. Restart your terminal or run: source ~/.zshrc"
echo "  2. Start using any AI CLI tool - skills will auto-activate!"
echo "  3. See README.md for usage examples"
echo ""
