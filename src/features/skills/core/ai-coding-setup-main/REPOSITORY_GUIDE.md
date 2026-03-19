# 📚 Repository Documentation: What's Inside & How to Use It

## 🎯 Quick Overview

This repository (`ai-coding-setup`) is your **complete AI coding environment** documentation and automation. It contains everything needed to replicate your ultimate setup with 228+ skills across all AI CLI tools.

**Repository**: https://github.com/404kidwiz/ai-coding-setup

---

## 📂 What's Inside the Repository

### 📄 Core Files

#### 1. README.md (Main Documentation)
**Purpose**: Complete overview of the setup

**Contents**:
- Feature overview
- Skills breakdown (228 total)
- Quick start guide
- Usage examples
- Installation instructions

**Use when**: You want to understand what this setup is

#### 2. INSTALLATION.md (Setup Guide)
**Purpose**: Step-by-step installation instructions

**Contents**:
- Prerequisites checklist
- Quick start (one-command install)
- Manual installation steps
- CLI tools setup (GitHub CLI, Supabase CLI)
- Skills installation from all sources
- Verification steps
- Troubleshooting

**Use when**: Setting up on a new machine or for others

#### 3. WORKFLOWS.md (Superpowers Guide)
**Purpose**: Complete guide to the Superpowers workflow

**Contents**:
- Superpowers methodology
- All 14 workflow stages
- Skill activation triggers
- Examples for each stage
- Best practices
- Common mistakes to avoid

**Use when**: Learning how to use the Superpowers workflow

### 🔧 Scripts Directory

#### scripts/install.sh
**Purpose**: One-command complete installation

**What it does**:
1. Checks prerequisites (git, node, npm, python)
2. Installs GitHub CLI (gh)
3. Installs Supabase CLI
4. Installs 228+ skills from all repositories
5. Syncs skills across all AI tools
6. Verifies installation

**How to use**:
```bash
cd ai-coding-setup
chmod +x scripts/install.sh
./scripts/install.sh
```

**Use when**: First-time setup or complete reinstall

#### scripts/sync-skills.sh
**Purpose**: Sync all Claude Code skills to other tools

**What it does**:
- Copies all 228 skills from ~/.claude/skills/
- To Codex CLI, OpenCode, Gemini CLI
- Preserves existing skills
- Reports what was synced

**How to use**:
```bash
cd ai-coding-setup
chmod +x scripts/sync-skills.sh
./scripts/sync-skills.sh
```

**Use when**: Adding new skills or ensuring parity

### 📁 Other Directories

#### config/
**Purpose**: Configuration files (future use)

Will contain:
- OpenCode agent configurations
- Tool-specific settings
- Custom skill templates

#### skills-inventory/
**Purpose**: Generated lists of all skills

Will contain:
- Complete skills catalog
- Categorized lists
- Tool-specific inventories

---

## 🚀 How to Use This Repository

### Use Case 1: Set Up on a New Machine

**Goal**: Replicate your complete AI coding environment

**Steps**:
1. Clone the repository:
   ```bash
   git clone https://github.com/404kidwiz/ai-coding-setup.git
   cd ai-coding-setup
   ```

2. Run the installer:
   ```bash
   chmod +x scripts/install.sh
   ./scripts/install.sh
   ```

3. Verify installation:
   ```bash
   # Check skills in each tool
   ls ~/.claude/skills/      # Should show 228+ skills
   ls ~/.codex/skills/       # Should show 228+ skills
   ls ~/.config/opencode/skills/    # Should show 228+ skills
   ls ~/.gemini/antigravity/global_skills/  # Should show 228+ skills
   ```

**Time**: 15-20 minutes (mostly automated)

### Use Case 2: Learn About Your Skills

**Goal**: Understand what skills you have available

**Steps**:
1. Read [README.md](README.md)
2. Check the skills breakdown section
3. Browse by category (Planning, Development, Security, etc.)

**Key Sections**:
- "Skills Breakdown" - All 228 skills categorized
- "Usage Examples" - How skills auto-activate
- "Sample Skills" - Examples by category

### Use Case 3: Learn Superpowers Workflow

**Goal**: Master the enterprise-grade development workflow

**Steps**:
1. Read [WORKFLOWS.md](WORKFLOWS.md)
2. Understand the 7 workflow stages
3. Review examples
4. Apply in your next coding session

**Key Concepts**:
- Skills auto-activate
- Evidence before assertions
- Test-driven development
- Systematic debugging
- Verification before completion

### Use Case 4: Troubleshoot Issues

**Goal**: Fix problems with your setup

**Steps**:
1. Check [INSTALLATION.md](INSTALLATION.md) - "Troubleshooting" section
2. Run verification script:
   ```bash
   ./scripts/verify-setup.sh  # (if created)
   ```
3. Sync skills if missing:
   ```bash
   ./scripts/sync-skills.sh
   ```

### Use Case 5: Update Your Setup

**Goal**: Add new skills or update existing ones

**Steps**:
1. Install new skills from repositories:
   ```bash
   npx skills add https://github.com/repo/skills --all --yes --global
   ```

2. Sync to all tools:
   ```bash
   ./scripts/sync-skills.sh
   ```

3. Verify:
   ```bash
   ls ~/.codex/skills/ | wc -l  # Should be 228+
   ```

---

## 📖 Documentation Guide

### For Beginners

1. **Start with README.md**
   - Read the overview
   - Check the quick start section
   - Review examples

2. **Then Read INSTALLATION.md**
   - Follow quick start (one command)
   - Or follow manual steps

3. **Finally Read WORKFLOWS.md**
   - Understand how skills work together
   - Learn the Superpowers methodology

### For Advanced Users

1. **Modify scripts/** directory
   - Customize install.sh for your needs
   - Add new automation scripts

2. **Add to config/** directory
   - Add your OpenCode agent configs
   - Create skill templates

3. **Contribute to repo**
   - Update documentation
   - Share your custom scripts
   - Document new skills

---

## 🎯 Common Tasks

### Task 1: List All Your Skills

```bash
# All Claude Code skills
ls ~/.claude/skills/

# All Codex CLI skills
ls ~/.codex/skills/

# Count skills
ls ~/.claude/skills/ | wc -l
```

### Task 2: Check if a Specific Skill Exists

```bash
# Check if python-pro-skill exists
ls ~/.claude/skills/ | grep python
```

### Task 3: Update Skills from Repositories

```bash
# Update all skills from obra/superpowers
npx skills add https://github.com/obra/superpowers --all --yes --global

# Sync to all tools
cd ai-coding-setup
./scripts/sync-skills.sh
```

### Task 4: Share Your Setup with Others

```bash
# Just share the GitHub repo link!
# https://github.com/404kidwiz/ai-coding-setup

# They can run:
git clone https://github.com/404kidwiz/ai-coding-setup.git
cd ai-coding-setup
./scripts/install.sh
```

---

## 📊 Repository Contents Summary

```
ai-coding-setup/
├── README.md                    # 📖 Main overview
├── INSTALLATION.md               # 📦 Setup guide
├── WORKFLOWS.md                  # 🔄 Superpowers guide
├── LICENSE                       # ⚖️  MIT License
├── .gitignore                    # 🚫 Git ignore rules
├── scripts/
│   ├── install.sh                # 🚀 One-command installer
│   └── sync-skills.sh            # 🔄 Skill sync script
├── config/                       # ⚙️  Configurations (future)
└── skills-inventory/             # 📚 Generated catalogs
```

---

## 💡 Tips & Best Practices

### For Setup

1. **Always use the install script** - It's tested and automated
2. **Run verification after install** - Make sure everything works
3. **Keep the repo updated** - Pull changes for improvements

### For Usage

1. **Let skills auto-activate** - Don't try to manually invoke them
2. **Follow the Superpowers workflow** - It ensures quality
3. **Read documentation when stuck** - WORKFLOWS.md has answers

### For Maintenance

1. **Sync skills periodically** - Ensures parity across tools
2. **Update repositories** - Get latest skills from sources
3. **Contribute back** - Share improvements with community

---

## 🎓 Learning Path

### Beginner

1. Read README.md sections 1-3
2. Follow INSTALLATION.md "Quick Start"
3. Try a simple coding task
4. Watch skills auto-activate

### Intermediate

1. Read WORKFLOWS.md completely
2. Understand skill activation triggers
3. Practice with different project types
4. Customize OpenCode agents

### Advanced

1. Contribute new skills
2. Modify scripts for your needs
3. Create custom skill templates
4. Document your workflows

---

## 🔗 Links

- **Repository**: https://github.com/404kidwiz/ai-coding-setup
- **Issues**: Report bugs or request features
- **Pull Requests**: Contribute improvements

---

## 📞 Support

For questions or issues:
1. Check existing documentation (README.md, INSTALLATION.md, WORKFLOWS.md)
2. Review troubleshooting sections
3. Open an issue on GitHub

---

**Last Updated**: 2025-01-27

**Made with ❤️ for the AI development community**
