# Git Submodule Helper Scripts

This directory contains helper scripts to make working with git submodules easier.

## Available Scripts

### 1. `pull-updates.sh` - Pull Latest Changes

Updates the meta repository and all submodules.

**Usage:**
```bash
# Update everything to latest remote branches (default)
./pull-updates.sh

# Just check status, don't make changes
./pull-updates.sh --check

# Update to exact commits specified by meta repo (no branch checkout)
./pull-updates.sh --exact
```

**When to use:**
- Starting your day / syncing with team changes
- After someone updates submodules
- Before deploying to production

---

### 2. `work-on-submodule.sh` - Prepare Submodule for Work

Safely prepares a submodule for editing by checking out main branch and pulling latest.

**Usage:**
```bash
# Work on a top-level submodule
./work-on-submodule.sh apps

# Work on a nested submodule
./work-on-submodule.sh apps/components
```

**What it does:**
- Detects if you're in detached HEAD and switches to main
- Pulls latest changes
- Shows recent commits
- Shows any uncommitted changes
- Provides next-step instructions

**When to use:**
- Before editing any files in a submodule
- When you see "detached HEAD" warnings

---

### 3. `push-submodule-changes.sh` - Smart Push

Intelligently pushes changes in the correct order: submodules first, then meta repo.

**Usage:**
```bash
# Interactive mode (asks for confirmation)
./push-submodule-changes.sh

# Auto-push everything without prompts
./push-submodule-changes.sh --force
```

**What it does:**
1. Checks all submodules for unpushed commits
2. Shows what needs pushing
3. Pushes submodules first (in correct order)
4. Updates meta repo to point to new commits
5. Pushes meta repo

**When to use:**
- After making changes to submodules
- Before asking teammates to pull your changes
- Before deploying

---

## Quick Workflow Examples

### Example 1: Editing a Submodule

```bash
# 1. Prepare the submodule
./work-on-submodule.sh apps

# 2. Make your changes
cd apps
# ... edit files ...

# 3. Commit
git add .
git commit -m "Add new feature"

# 4. Push everything (from meta repo root)
cd ..
./push-submodule-changes.sh
```

---

### Example 2: Syncing with Team

```bash
# Check what's out of date
./pull-updates.sh --check

# Pull all updates
./pull-updates.sh

# If it says "Meta repo has changes", commit them
git add -A
git commit -m "Update submodules to latest versions"
git push
```

---

### Example 3: Nested Submodule (e.g., apps/components)

```bash
# 1. Prepare nested submodule
./work-on-submodule.sh apps/components

# 2. Make changes
cd apps/components
# ... edit files ...
git add .
git commit -m "Enhance drag-drop component"
git push

# 3. Update parent submodule (apps)
cd ..  # now in apps/
git add components
git commit -m "Update components submodule"
git push

# 4. Update meta repo
cd ..  # now in meta repo
git add apps
git commit -m "Update apps submodule with component enhancements"
git push
```

Or use the smart push script:
```bash
# After step 2 above, from meta repo root:
./push-submodule-changes.sh
# This handles steps 3-4 automatically!
```

---

### Example 4: Deploying to Production

```bash
# On production server
cd /path/to/larc

# Pull all updates
./pull-updates.sh

# Verify everything is correct
./pull-updates.sh --check

# Restart services, run build, etc.
```

---

## Troubleshooting with Scripts

### "I'm stuck in detached HEAD"
```bash
./work-on-submodule.sh <submodule-name>
```

### "I don't know what needs pushing"
```bash
./pull-updates.sh --check
# or
./push-submodule-changes.sh  # will show what needs pushing
```

### "Someone updated submodules, how do I sync?"
```bash
./pull-updates.sh
```

### "I want exact commits, not latest"
```bash
./pull-updates.sh --exact
```

---

## Understanding the Output

### Color Codes
- 🟢 Green ✓ = Success / Good status
- 🟡 Yellow ⚠ = Warning / Needs attention
- 🔴 Red ✗ = Error
- 🔵 Blue = Section headers

### Common Warnings

**"DETACHED HEAD"**
- The submodule is not on a branch
- Fix: Use `./work-on-submodule.sh <name>` before editing

**"unpushed commits"**
- You have local commits not pushed to remote
- Fix: Use `./push-submodule-changes.sh`

**"Meta repo has changes (submodules moved to newer commits)"**
- Submodules are at different commits than meta repo expects
- Fix: Commit the changes:
  ```bash
  git add -A
  git commit -m "Update submodules to latest versions"
  git push
  ```

---

## Manual Commands (if scripts aren't available)

If you can't use the scripts, here are the manual commands:

```bash
# Pull everything
git pull --recurse-submodules
git submodule update --init --recursive --remote

# Fix detached HEAD in a submodule
cd submodule-name
git checkout main
git pull

# Push with submodule safety
git push --recurse-submodules=on-demand
```

---

## See Also

- [SUBMODULE-WORKFLOW.md](./SUBMODULE-WORKFLOW.md) - Comprehensive submodule workflow guide
- [Official Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)

---

*Last updated: 2025-12-06*
