#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(pwd)}"
REPO="${REPO:-eth-pv-planner-aufnahme}"
BRANCH="${BRANCH:-main}"

if ! command -v pkg >/dev/null 2>&1; then
  echo "ERROR: This script is intended for Termux. 'pkg' not found."
  exit 1
fi

pkg update -y
pkg install -y git gh curl jq

if ! gh auth status >/dev/null 2>&1; then
  gh auth login -w
fi

gh auth refresh -h github.com -s repo >/dev/null
GH_OWNER="$(gh api user --jq '.login')"

cd "$APP_DIR"

if [ ! -f index.html ]; then
  echo "ERROR: index.html not found in: $APP_DIR"
  exit 1
fi

touch .nojekyll

if [ ! -d .git ]; then
  git init
fi

git branch -M "$BRANCH"
git config user.name "$GH_OWNER"
git config user.email "$GH_OWNER@users.noreply.github.com"

git add .
if git diff --cached --quiet; then
  echo "No local changes to commit."
else
  git commit -m "Deploy ETH PV Planner Aufnahme PWA"
fi

if gh repo view "$GH_OWNER/$REPO" >/dev/null 2>&1; then
  echo "Repository exists: $GH_OWNER/$REPO"
  gh repo edit "$GH_OWNER/$REPO" \
    --visibility public \
    --accept-visibility-change-consequences

  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "https://github.com/$GH_OWNER/$REPO.git"
  else
    git remote add origin "https://github.com/$GH_OWNER/$REPO.git"
  fi
else
  gh repo create "$GH_OWNER/$REPO" \
    --public \
    --source=. \
    --remote=origin \
    --push
fi

git push -u origin "$BRANCH"

if gh api "/repos/$GH_OWNER/$REPO/pages" >/dev/null 2>&1; then
  gh api \
    --method PUT \
    "/repos/$GH_OWNER/$REPO/pages" \
    -F "source[branch]=$BRANCH" \
    -F "source[path]=/" \
    >/dev/null
else
  gh api \
    --method POST \
    "/repos/$GH_OWNER/$REPO/pages" \
    -F "source[branch]=$BRANCH" \
    -F "source[path]=/" \
    >/dev/null
fi

gh api \
  --method PUT \
  "/repos/$GH_OWNER/$REPO/pages" \
  -F "https_enforced=true" \
  -F "source[branch]=$BRANCH" \
  -F "source[path]=/" \
  >/dev/null || true

PAGE_URL="$(gh api "/repos/$GH_OWNER/$REPO/pages" --jq '.html_url')"

echo
echo "Deployment started."
echo "Repository: https://github.com/$GH_OWNER/$REPO"
echo "PWA URL:    $PAGE_URL"
echo
echo "Waiting for GitHub Pages build..."

for i in $(seq 1 60); do
  STATUS="$(gh api "/repos/$GH_OWNER/$REPO/pages" --jq '.status' 2>/dev/null || echo unknown)"
  HTTP_CODE="$(curl -L -s -o /dev/null -w "%{http_code}" "$PAGE_URL" || echo 000)"
  echo "Status: $STATUS | HTTP: $HTTP_CODE"

  if [ "$STATUS" = "built" ] && [ "$HTTP_CODE" = "200" ]; then
    echo
    echo "Done."
    echo "Open on iPad in Safari:"
    echo "$PAGE_URL"
    echo
    echo "Then: Share → Add to Home Screen → Add"
    exit 0
  fi

  sleep 5
done

echo
echo "GitHub Pages is not fully ready yet. Check later:"
echo "$PAGE_URL"
