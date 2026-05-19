#!/usr/bin/env bash
# Lekkal — git repo bootstrap
# Run once from /Users/manoj/u01/projects/lekkal/ to initialize git and make the first commit.

set -euo pipefail

cd "$(dirname "$0")"

echo "→ Cleaning any partial .git state..."
rm -rf .git

echo "→ Initializing repo on main branch..."
git init -b main >/dev/null

# Use existing global git config if present; otherwise set sensible defaults
if [ -z "$(git config --global user.name 2>/dev/null || true)" ]; then
  git config user.name "Manoj Kottam"
fi
if [ -z "$(git config --global user.email 2>/dev/null || true)" ]; then
  git config user.email "manoj.kottam@gmail.com"
fi

echo "→ Staging files..."
git add .

echo "→ Creating initial commit..."
git commit -m "Initial commit: Lekkal v0.1

Free finance & bookkeeping tools that run in the browser.

Includes:
- Landing page with full SEO scaffolding (Open Graph, Twitter cards,
  JSON-LD Organization + WebSite + FAQ schema)
- Invoice generator with live preview and jsPDF download
- Marketing ROI calculator (CAC, LTV, ROAS, payback)
- Shared design system (styles.css) with light/dark theme
- robots.txt with explicit allow-list for Google, ClaudeBot, GPTBot,
  PerplexityBot
- sitemap.xml ready for Search Console submission
" >/dev/null

echo ""
echo "✓ Repo initialized at $(pwd)"
echo ""
git log --oneline --decorate
echo ""
echo "Tracked files: $(git ls-files | wc -l | tr -d ' ')"
echo "Branch: $(git branch --show-current)"
echo ""
echo "Next steps:"
echo "  git remote add origin git@github.com:manojkottam/lekkal.git"
echo "  git push -u origin main"
