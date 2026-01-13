#!/usr/bin/env python3
"""
Bulk Apply Dark Mode Fix to LARC HTML Pages

This script automatically adds:
1. theme-init.js script to <head>
2. pan-theme-provider to end of <body>
3. Updates CSS @media queries to use :not([data-theme="light"])
"""

import os
import re
import sys
from pathlib import Path

# Configuration
LARC_ROOT = Path(__file__).parent.parent
THEME_INIT_TEMPLATE = '  <!-- CRITICAL: Load theme BEFORE CSS to prevent flash -->\n  <script src="{theme_path}"></script>\n'

# Statistics
stats = {
    'fixed': 0,
    'skipped': 0,
    'errors': 0
}

def calculate_relative_path(file_path, larc_root):
    """Calculate relative path from file to playground/theme-init.js"""
    try:
        file_dir = file_path.parent
        theme_file = larc_root / 'playground' / 'theme-init.js'
        rel_path = os.path.relpath(theme_file, file_dir)
        return rel_path
    except Exception as e:
        print(f"    ⚠ Warning: Could not calculate path: {e}")
        return "../playground/theme-init.js"

def has_theme_init(content):
    """Check if file already has theme-init.js"""
    return 'theme-init.js' in content

def has_head_tag(content):
    """Check if file has <head> tag"""
    return bool(re.search(r'<head[>\s]', content, re.IGNORECASE))

def has_body_tag(content):
    """Check if file has <body> tag"""
    return bool(re.search(r'<body[>\s]', content, re.IGNORECASE))

def add_theme_init(content, theme_path):
    """Add theme-init.js script to <head>"""
    script_tag = THEME_INIT_TEMPLATE.format(theme_path=theme_path)

    # Try to add after <meta charset>
    if '<meta charset=' in content.lower():
        content = re.sub(
            r'(<meta\s+charset=["\'][^"\']*["\'][^>]*>)',
            r'\1\n' + script_tag,
            content,
            flags=re.IGNORECASE,
            count=1
        )
    # Otherwise add after <head>
    elif '<head>' in content.lower():
        content = re.sub(
            r'(<head>)',
            r'\1\n  <meta charset="UTF-8">\n' + script_tag,
            content,
            flags=re.IGNORECASE,
            count=1
        )

    return content

def add_theme_provider(content):
    """Add pan-theme-provider before </body>"""
    if 'pan-theme-provider' in content:
        return content

    # Add before </body>
    content = re.sub(
        r'(</body>)',
        r'  <pan-theme-provider></pan-theme-provider>\n\1',
        content,
        flags=re.IGNORECASE,
        count=1
    )

    return content

def ensure_pan_bus(content):
    """Add pan-bus if not present"""
    if 'pan-bus' in content:
        return content

    # Add before </body>
    content = re.sub(
        r'(</body>)',
        r'  <pan-bus debug="false"></pan-bus>\n\1',
        content,
        flags=re.IGNORECASE,
        count=1
    )

    return content

def update_media_query(content):
    """Update @media (prefers-color-scheme: dark) to use :not([data-theme="light"])"""
    # Look for media query patterns
    pattern = r'(@media\s+\(prefers-color-scheme:\s*dark\)\s*\{\s*)(:root\s*\{)'
    replacement = r'\1:root:not([data-theme="light"]) {'

    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

    return content

def process_file(file_path, larc_root, dry_run=False):
    """Process a single HTML file"""
    try:
        # Read file
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if already fixed
        if has_theme_init(content):
            print(f"  ⊘ SKIP: {file_path.relative_to(larc_root)} (already fixed)")
            stats['skipped'] += 1
            return

        # Check if valid HTML
        if not has_head_tag(content):
            print(f"  ⊘ SKIP: {file_path.relative_to(larc_root)} (no <head> tag)")
            stats['skipped'] += 1
            return

        # Backup
        if not dry_run:
            backup_path = str(file_path) + '.bak'
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)

        # Calculate relative path
        theme_path = calculate_relative_path(file_path, larc_root)

        # Apply fixes
        content = add_theme_init(content, theme_path)
        content = update_media_query(content)

        if has_body_tag(content):
            content = ensure_pan_bus(content)
            content = add_theme_provider(content)

        # Write file
        if not dry_run:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

        print(f"  ✓ FIXED: {file_path.relative_to(larc_root)}")
        stats['fixed'] += 1

    except Exception as e:
        print(f"  ✗ ERROR: {file_path.relative_to(larc_root)} - {e}")
        stats['errors'] += 1

def find_html_files(root_dir, exclude_dirs=None):
    """Find all HTML files recursively"""
    if exclude_dirs is None:
        exclude_dirs = {'node_modules', '.git', 'test', 'tests', 'build', 'dist', '__pycache__'}

    html_files = []
    for root, dirs, files in os.walk(root_dir):
        # Remove excluded directories from search
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            if file.endswith('.html'):
                html_files.append(Path(root) / file)

    return html_files

def main():
    import argparse

    parser = argparse.ArgumentParser(description='Bulk apply dark mode fix to HTML files')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--dir', type=str, help='Specific directory to process (default: all public pages)')
    args = parser.parse_args()

    print("🌙 LARC Dark Mode Bulk Fixer")
    print("=" * 50)
    print()

    if args.dry_run:
        print("DRY RUN MODE - No files will be modified")
        print()

    # Determine directories to process
    if args.dir:
        target_dirs = [LARC_ROOT / args.dir]
    else:
        target_dirs = [
            LARC_ROOT / 'apps',
            LARC_ROOT / 'examples' / 'tutorials',
            LARC_ROOT / 'docs' / 'site',
        ]

    # Process each directory
    for target_dir in target_dirs:
        if not target_dir.exists():
            print(f"⊘ Directory not found: {target_dir}")
            continue

        print(f"\nProcessing: {target_dir.relative_to(LARC_ROOT)}")
        print("-" * 50)

        html_files = find_html_files(target_dir)
        print(f"Found {len(html_files)} HTML files")
        print()

        for file_path in sorted(html_files):
            process_file(file_path, LARC_ROOT, dry_run=args.dry_run)

    # Summary
    print()
    print("=" * 50)
    print(f"✓ Fixed: {stats['fixed']} files")
    print(f"⊘ Skipped: {stats['skipped']} files")
    if stats['errors'] > 0:
        print(f"✗ Errors: {stats['errors']} files")
    print()

    if not args.dry_run and stats['errors'] == 0:
        print("Cleaning up backup files...")
        for backup in LARC_ROOT.rglob('*.html.bak'):
            backup.unlink()
        print("✓ Done!")
    elif not args.dry_run and stats['errors'] > 0:
        print("⚠ Errors occurred. Backup files (.bak) were kept.")

    return 0 if stats['errors'] == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
