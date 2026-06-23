#!/usr/bin/env bash
# ============================================================
# go-live.sh — promote staging (dev) to production (main)
#
# Usage: ./scripts/go-live.sh
#
# What it does:
#   1. Confirms you're on the dev branch
#   2. Checks there's nothing uncommitted
#   3. Merges dev into main and pushes
#   4. Returns you to dev
#
# Vercel auto-deploys main to portsmouthporchfest.org within ~60 seconds.
# ============================================================
set -e

REMOTE="origin"
PROD="main"
STAGING="dev"

# -- preflight checks --
current=$(git branch --show-current)
if [ "$current" != "$STAGING" ]; then
  echo "❌  Must be on '$STAGING' branch (currently on '$current'). Aborting."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌  Uncommitted changes detected. Commit or stash them first. Aborting."
  exit 1
fi

echo ""
echo "🚀  Promoting '$STAGING' → '$PROD'"
echo "    This will make the current staging build live at portsmouthporchfest.org"
echo ""
read -p "    Type YES to continue: " confirm
if [ "$confirm" != "YES" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "→  Switching to $PROD..."
git checkout "$PROD"

echo "→  Merging $STAGING into $PROD..."
git merge "$STAGING" --no-edit

echo "→  Pushing to $REMOTE/$PROD..."
git push "$REMOTE" "$PROD"

echo "→  Returning to $STAGING..."
git checkout "$STAGING"

echo ""
echo "✅  Done. Vercel is deploying to portsmouthporchfest.org now."
echo "    Watch progress at: https://vercel.com/adoucetts-projects/portsmouth-porchfest"
echo ""
