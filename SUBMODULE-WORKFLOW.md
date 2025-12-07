# Git Submodules Workflow Guide

This document explains how to work with the LARC meta repository and its submodules effectively.

## Repository Structure

```
larc/ (meta repo)
├── apps/ (submodule -> github.com/larcjs/apps)
│   ├── components/ (nested submodule -> github.com/larcjs/components)
│   └── core/ (nested submodule -> github.com/larcjs/core)
├── site/ (submodule -> github.com/larcjs/site)
├── core/ (submodule -> github.com/larcjs/core)
├── ui/ (submodule -> github.com/larcjs/components)
├── examples/ (submodule -> github.com/larcjs/examples)
├── devtools/ (submodule -> github.com/larcjs/devtools)
├── components-types/ (submodule)
└── core-types/ (submodule)
```

---

## Understanding Git Submodules

### The Key Concept
**A submodule reference is just a pointer to a specific commit SHA in another repo.**

When the meta repo has changes like:
```
modified:   apps (new commits)
```

This means the `apps` submodule has moved to a different commit than what the meta repo expects.

### Why Detached HEAD?
When you enter a submodule directory, git checks out the **exact commit SHA** that the parent repo points to, not a branch. This is by design to ensure reproducibility. You're in "detached HEAD" state because you're viewing a specific point in history, not following a branch.

---

## Essential Commands

### 1. Pulling Latest Updates (All Repos)

Use the provided script:
```bash
# From meta repo root
./pull-updates.sh
```

Or manually:
```bash
# Pull meta repo
git pull

# Update all submodules to their latest remote main branches
git submodule update --init --recursive --remote

# OR use the combined command
git pull --recurse-submodules && git submodule update --init --recursive --remote
```

**What this does:**
- Pulls latest changes in the meta repo
- Updates ALL submodules (including nested ones) to their latest remote `main` branch
- Initializes any new submodules that were added

---

## Common Workflows

### Workflow 1: Making Changes to a Submodule (e.g., apps, components)

**Scenario:** You want to edit files in `apps/` or `apps/components/`

#### Step 1: Enter the submodule and switch to a branch
```bash
cd apps
git checkout main  # Get off detached HEAD!
git pull           # Get latest changes
```

#### Step 2: Make your changes and commit
```bash
# Edit files...
git add .
git commit -m "Your commit message"
```

#### Step 3: Push your changes to the submodule's remote
```bash
git push origin main
```

#### Step 4: Update the meta repo to point to your new commit
```bash
cd ..  # Back to meta repo root
git add apps
git commit -m "Update apps submodule to latest version"
git push
```

**Important:** The meta repo must be updated to "know" about the new commit in the submodule!

---

### Workflow 2: Making Changes to Nested Submodules (e.g., apps/components)

**Scenario:** You want to edit `apps/components/`

#### Step 1: Navigate to nested submodule and switch to branch
```bash
cd apps/components
git checkout main
git pull
```

#### Step 2: Make changes and commit
```bash
# Edit files...
git add .
git commit -m "Enhance components"
git push origin main
```

#### Step 3: Update the parent submodule (apps)
```bash
cd ..  # Now in apps/
git add components
git commit -m "Update components submodule to latest version"
git push origin main
```

#### Step 4: Update the meta repo
```bash
cd ..  # Now in meta repo root
git add apps
git commit -m "Update apps submodule (which includes updated components)"
git push
```

**You must update TWO levels:** first the intermediate repo (`apps`), then the meta repo.

---

### Workflow 3: Syncing Production with Latest Changes

**Scenario:** You've pushed changes to submodule repos and want production to get them.

#### On your production server:
```bash
cd /path/to/larc
./pull-updates.sh

# Verify everything is on correct branches
git submodule foreach --recursive 'git checkout main || true'
```

---

### Workflow 4: Someone Else Updated a Submodule

**Scenario:** A teammate pushed changes to `apps` or `components`.

#### Step 1: Pull meta repo
```bash
git pull
```

You'll see:
```
modified:   apps (new commits)
```

#### Step 2: Update submodules
```bash
git submodule update --init --recursive
```

This checks out the exact commits the meta repo now points to.

**Optional:** If you want submodules on their `main` branches:
```bash
git submodule foreach --recursive 'git checkout main && git pull'
```

---

## Preventing Detached HEAD Issues

### Always Work on Branches
When you enter a submodule to make changes:

```bash
cd apps
git checkout main  # DO THIS FIRST!
```

### Create a Helper Script
Create `work-on-submodule.sh`:
```bash
#!/bin/bash
# Usage: ./work-on-submodule.sh apps

SUBMODULE=$1
cd "$SUBMODULE" || exit 1
git checkout main
git pull
echo "Ready to work on $SUBMODULE (on main branch)"
```

---

## Quick Reference Commands

### Status Check
```bash
# See which submodules have uncommitted changes or are on different commits
git status

# See status of all submodules
git submodule status

# Recursively check status of nested submodules
git submodule foreach --recursive 'echo "=== $name ===" && git status'
```

### Fix Detached HEAD
```bash
# If you're in a submodule in detached HEAD:
git checkout main
git pull
```

### View Submodule Changes
```bash
# See which commit the submodule moved to
git diff apps

# See the actual code changes in a submodule
cd apps && git log
```

### Update Single Submodule
```bash
# Update just one submodule to its latest remote main
git submodule update --remote apps
```

---

## Best Practices

### 1. Always commit submodule changes first, meta repo second
```bash
# ❌ WRONG ORDER
cd meta-repo
git add apps
git commit -m "Update apps"  # But apps changes aren't pushed yet!

# ✅ CORRECT ORDER
cd apps
git push                      # Push submodule changes first
cd ..
git add apps
git commit -m "Update apps"   # Then update meta repo pointer
git push
```

### 2. Use descriptive commit messages in meta repo
```bash
# ❌ Vague
git commit -m "Update submodules"

# ✅ Descriptive
git commit -m "Update apps submodule to include new routing features"
```

### 3. Verify before pushing
```bash
# Check submodule commits are pushed
cd apps && git log origin/main..HEAD  # Should be empty
cd ../site && git log origin/main..HEAD  # Should be empty

# Then push meta repo
cd .. && git push
```

### 4. Document nested submodule changes
When updating nested submodules, your commit chain should be:
1. Commit in `apps/components` with message about component changes
2. Commit in `apps` with message "Update components submodule: [reason]"
3. Commit in meta repo with message "Update apps submodule: [reason]"

---

## Troubleshooting

### "I'm stuck in detached HEAD!"
```bash
git checkout main
git pull
```

### "My changes are missing after submodule update!"
If you made commits while in detached HEAD, they're not lost:
```bash
git reflog  # Find your commit SHA
git checkout main
git cherry-pick <commit-sha>  # Apply your changes to main
```

### "Submodule conflicts after pull"
```bash
# Option 1: Take remote version
git submodule update --init --recursive --remote

# Option 2: Keep your version (don't update submodules)
git submodule update --init --recursive

# Option 3: Manually resolve
cd problem-submodule
git checkout main
git pull
cd ..
git add problem-submodule
```

### "I can't push - authentication failed"
Check your git remote URL:
```bash
git remote -v
```

If it shows `https://github.com/...`, you may need to:
1. Set up SSH keys and use `git@github.com:...`
2. Or use GitHub personal access token
3. Or configure credential helper

---

## Automation Tips

### Git Aliases
Add to `~/.gitconfig`:
```ini
[alias]
  sup = submodule update --init --recursive --remote
  spull = !git pull && git submodule update --init --recursive --remote
  spush = push --recurse-submodules=on-demand
```

Usage:
```bash
git spull   # Pull everything
git spush   # Push with submodule safety check
```

### Pre-commit Hook
Create `.git/hooks/pre-commit` in meta repo:
```bash
#!/bin/bash
# Check if any submodule has unpushed commits
git submodule foreach --quiet --recursive '
  if [ $(git log origin/$(git rev-parse --abbrev-ref HEAD)..HEAD --oneline | wc -l) -gt 0 ]; then
    echo "Error: Submodule $name has unpushed commits!"
    exit 1
  fi
'
```

---

## Summary Cheatsheet

| Action | Commands |
|--------|----------|
| Pull all updates | `./pull-updates.sh` |
| Work on submodule | `cd apps && git checkout main` |
| Commit submodule change | `git add . && git commit && git push` |
| Update meta repo pointer | `cd .. && git add apps && git commit -m "Update apps"` |
| Fix detached HEAD | `git checkout main` |
| Check all status | `git submodule foreach --recursive git status` |
| Sync to specific commit | `git submodule update --init --recursive` |
| Sync to latest remote | `git submodule update --init --recursive --remote` |

---

## Deploy to Production Checklist

- [ ] All submodule changes committed and pushed
- [ ] Meta repo updated to point to new submodule commits
- [ ] Meta repo changes pushed
- [ ] On production server: `git pull`
- [ ] On production server: `./pull-updates.sh`
- [ ] Verify: `git submodule status` shows expected commits
- [ ] Test application functionality

---

*Last updated: 2025-12-06*
