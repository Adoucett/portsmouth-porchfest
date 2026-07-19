#!/usr/bin/env bash
# ============================================================
# go-live.sh — legacy helper (site is already live on main)
#
# Day-to-day: commit + push on `main`. Vercel deploys automatically.
#
# This script remains only as a one-shot rescue if `dev` ever drifts
# ahead of `main` again: it merges dev → main and pushes.
# ============================================================
set -e

REMOTE="origin"
PROD="main"
STAGING="dev"

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
echo "🚀  Promoting '$STAGING' → '$PROD' (rescue merge)"
echo "    Prefer shipping on main directly going forward."
echo ""
read -p "    Type YES to continue: " confirm
if [ "$confirm" != "YES" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "→  Switching to $PROD..."
git checkout "$PROD"

echo "→  Merging $STAGING into $PROD (prefer incoming)..."
git merge -X theirs "$STAGING" --no-edit

echo "→  Pushing to $REMOTE/$PROD..."
git push "$REMOTE" "$PROD"

echo "→  Returning to $PROD for day-to-day work..."
git checkout "$PROD"

echo ""
echo "✅  Done. Vercel is deploying to portsmouthporchfest.org now."
echo ""
