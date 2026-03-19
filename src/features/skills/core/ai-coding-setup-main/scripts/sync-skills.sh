#!/bin/bash
#
# Sync all Claude Code skills to other AI CLI tools
#

SOURCE_DIR="$HOME/.claude/skills"
TARGET_DIRS=(
    "$HOME/.codex/skills"
    "$HOME/.config/opencode/skills"
    "$HOME/.gemini/antigravity/global_skills"
)

echo "=== Syncing All Claude Code Skills to Other CLI Tools ==="
echo ""

# Count total skills
TOTAL_SKILLS=0
for skill_dir in "$SOURCE_DIR"/*/; do
    if [ -f "$skill_dir/SKILL.md" ]; then
        ((TOTAL_SKILLS++))
    fi
done

echo "📊 Source: $TOTAL_SKILLS valid skills in Claude Code"
echo ""

# Process each target directory
for TARGET_DIR in "${TARGET_DIRS[@]}"; do
    TOOL_NAME=$(echo "$TARGET_DIR" | sed 's|.*/||' | sed 's/skills$//' | sed 's/global$//')
    echo "🔄 Syncing to: $TOOL_NAME"

    mkdir -p "$TARGET_DIR"

    COPIED=0
    SKIPPED=0

    for skill_dir in "$SOURCE_DIR"/*/; do
        if [ -f "$skill_dir/SKILL.md" ]; then
            skill_name=$(basename "$skill_dir")
            target_path="$TARGET_DIR/$skill_name"

            if [ -e "$target_path" ]; then
                ((SKIPPED++))
            else
                cp -r "$skill_dir" "$target_path"
                ((COPIED++))
            fi
        fi
    done

    echo "  ✓ Copied: $COPIED new skills"
    echo "  ⊘ Skipped: $SKIPPED (already exists)"
    echo "  📁 Total: $((COPIED + SKIPPED)) skills"
    echo ""
done

echo "=== Sync Complete ==="
