# 🔄 Superpowers Workflow Guide

Complete guide to the Superpowers development methodology - now available across all your AI CLI tools!

## 📖 Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Workflow Stages](#workflow-stages)
4. [Skill Activation](#skill-activation)
5. [Examples](#examples)
6. [Best Practices](#best-practices)

## Overview

Superpowers is a **complete software development workflow** that transforms how AI agents work. Instead of immediately jumping into code, it follows a structured process that ensures quality, maintainability, and alignment with requirements.

### The Problem It Solves

❌ **Without Superpowers:**
- Agent jumps straight to coding
- Misunderstands requirements
- Writes untested code
- Forgets edge cases
- No verification

✅ **With Superpowers:**
- Thorough requirements gathering
- Clear design approval
- Written implementation plan
- Test-driven development
- Continuous verification
- Structured completion

## Core Principles

### 1. Skills Must Be Used

**Critical Rule**: If a skill applies to the task, the agent **MUST** use it. This is not optional.

### 2. Evidence Before Assertions

Never claim code works without:
- Running tests
- Checking output
- Verifying behavior
- Providing evidence

### 3. Test-Driven Development

**Always** write tests before implementation:
- Red (failing test)
- Green (make it pass)
- Refactor (improve)

### 4. Small Chunks

Present information in digestible pieces:
- Show 2-3 sentences at a time
- Wait for confirmation
- Proceed gradually

## Workflow Stages

### Stage 1: Brainstorming 🧠

**Skill**: `brainstorming`

**When**: Before any creative work

**What happens**:
- Agent asks clarifying questions
- Explores user intent
- Identifies requirements
- Discusses approaches

**Example**:
```
You: "Add user authentication"
Agent: [brainstorming activates]
     "What kind of authentication do you need?
      • Email/password?
      • OAuth (Google, GitHub)?
      • Magic links?
      • Phone/SMS?"
```

### Stage 2: Writing Plans 📝

**Skill**: `writing-plans`

**When**: Requirements are clear

**What happens**:
- Creates detailed implementation plan
- Breaks down into tasks
- Identifies dependencies
- Estimates complexity

**Plan Structure**:
```markdown
# Feature: User Authentication

## Tasks
1. Set up database schema
2. Implement authentication endpoints
3. Create session management
4. Add OAuth providers
5. Write tests

## Dependencies
- Task 2 depends on Task 1
- Task 5 parallels Task 2
```

### Stage 3: Test-Driven Development 🧪

**Skill**: `test-driven-development`

**When**: Implementing features

**What happens**:
- Write test first (must fail)
- Implement minimal code
- Make test pass
- Refactor

**Process**:
```python
# 1. Write failing test
def test_login():
    assert login("user", "pass") == True

# 2. Run test (fails)
# 3. Implement
def login(user, pass):
    return authenticate(user, pass)

# 4. Test passes
# 5. Refactor if needed
```

### Stage 4: Executing Plans 🚀

**Skill**: `executing-plans` or `subagent-driven-development`

**When**: Plan is approved

**What happens**:
- Agent follows the plan step-by-step
- May spawn subagents for parallel tasks
- Reviews work at checkpoints
- Ensures quality throughout

### Stage 5: Systematic Debugging 🔍

**Skill**: `systematic-debugging`

**When**: Bugs or failures occur

**What happens**:
- Don't guess the fix
- Gather evidence first
- Form hypotheses
- Test systematically
- Verify root cause

**Process**:
1. Gather information
2. Identify symptoms
3. Form hypothesis
4. Test hypothesis
5. Verify fix

### Stage 6: Verification Before Completion ✓

**Skill**: `verification-before-completion`

**When**: Claiming work is done

**What happens**:
- Run all tests
- Check actual output
- Verify requirements met
- Provide evidence

**Never say**: "It should work"
**Always say**: "I ran the tests, here's the output: ..."

### Stage 7: Requesting Code Review 👀

**Skill**: `requesting-code-review`

**When**: Task complete, before merge

**What happens**:
- Creates pull request
- Documents changes
- Requests review
- Addresses feedback

## Skill Activation

Skills activate **automatically** based on context. You don't need to manually invoke them!

### Activation Triggers

| Trigger | Activated Skill |
|---------|----------------|
| "Add feature..." | brainstorming |
| "Create a plan..." | writing-plans |
| "Implement this..." | test-driven-development |
| "This bug..." | systematic-debugging |
| "I'm done..." | verification-before-completion |
| "Review my code..." | receiving-code-review |

### Examples

#### Example 1: Feature Development

```
You: "I need a user login system"

→ brainstorming activates
Agent: "What login methods do you want? Email, OAuth?"

You: "Email and Google OAuth"

→ writing-plans activates
Agent: Creates detailed plan with tasks, dependencies

You: "Looks good, go ahead"

→ test-driven-development activates
Agent: Writes tests first, then implementation

→ verification-before-completion activates
Agent: Runs tests, shows output, verifies working

→ requesting-code-review activates
Agent: Creates PR with documentation
```

#### Example 2: Bug Fix

```
You: "The login isn't working"

→ systematic-debugging activates
Agent: "Let me gather information first..."
     "What error message do you see?"
     "What are the exact steps to reproduce?"

→ After gathering info, forms hypothesis

→ test-driven-development may activate
Agent: Writes test to reproduce bug, then fixes

→ verification-before-completion activates
Agent: Verifies fix works

```

## Best Practices

### For Users

1. **Be Patient**: Let the process unfold
2. **Answer Questions**: Help clarify requirements
3. **Review Plans**: Don't skip planning stage
4. **Trust the Process**: Superpowers ensures quality

### For Developers

1. **Never Skip Skills**: If a skill applies, use it
2. **Evidence First**: Always verify, never assert
3. **Test-Driven**: Always write tests first
4. **Small Batches**: Present information gradually
5. **Continuous Review**: Check work frequently

### Common Mistakes

❌ **Don't**:
- Skip brainstorming for "simple" features
- Write code without tests
- Guess at bug fixes
- Claim it works without testing
- Implement without a plan

✅ **Do**:
- Always brainstorm first
- Write tests first
- Debug systematically
- Verify everything
- Follow the plan

## Workflow Diagram

```
User Request
    ↓
[brainstorming] → Understand requirements
    ↓
[writing-plans] → Create implementation plan
    ↓
User approves plan
    ↓
[subagent-driven-development] → Execute with subagents
    ↓
[test-driven-development] → Tests first, then code
    ↓
[systematic-debugging] → If bugs occur
    ↓
[verification-before-completion] → Prove it works
    ↓
[requesting-code-review] → Get review
    ↓
[finishing-a-development-branch] → Merge decisions
```

## Advanced Features

### Parallel Execution

**Skill**: `dispatching-parallel-agents`

**When**: Multiple independent tasks

**Example**:
```
Plan:
1. Set up database (independent)
2. Create UI mockups (independent)
3. Write documentation (independent)

→ dispatching-parallel-agents activates
→ Spawns 3 subagents working in parallel
→ All work completes simultaneously
```

### Git Worktrees

**Skill**: `using-git-worktrees`

**When**: Feature isolation needed

**Benefits**:
- Work on multiple features simultaneously
- Isolate experimental changes
- Keep main branch clean

### Receiving Code Review

**Skill**: `receiving-code-review`

**When**: Getting code feedback

**What happens**:
- Evaluates feedback technically
- Doesn't blindly implement
- Asks clarifying questions
- Verifies suggestions are valid

## Summary

Superpowers transforms AI coding from:

```
❌ Haphazard coding
❌ Unverified assumptions
❌ No testing
❌ Mystery bugs
❌ "It should work"
```

To:

```
✅ Structured process
✅ Evidence-based decisions
✅ Test-driven development
✅ Systematic debugging
✅ Verified working
```

### Key Takeaways

1. **Skills auto-activate** - No manual selection needed
2. **Process matters** - Quality comes from following the workflow
3. **Evidence is king** - Never assert without proof
4. **Tests first** - TDD prevents bugs
5. **Think before coding** - Planning saves time

---

**Start using Superpowers today and transform your development workflow!** 🚀

*Last updated: 2025-01-27*
