#!/usr/bin/env bash
# Copies the production module files (compiled CSS included) from dev into main.
# It never pushes: publishing to GitHub is a separate, explicit step.

set -euo pipefail

PATHS=(module.json README.md assets lang scripts styles templates)
ORIGINAL_BRANCH="$(git symbolic-ref --short HEAD)"

if [[ "$ORIGINAL_BRANCH" != "dev" ]]; then
  echo "error: run this script from the dev branch." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is not clean. Commit or discard your changes first." >&2
  git status --short >&2
  exit 1
fi

npm run build --prefix build

if ! git diff --quiet -- styles/wod5e-hud.css; then
  echo "error: compiled CSS changed. Commit styles/wod5e-hud.css on dev first." >&2
  exit 1
fi

VERSION="$(node -p "require('./module.json').version")"

cleanup() {
  git checkout -q "$ORIGINAL_BRANCH" || true
}
trap cleanup EXIT

git checkout -q main
git checkout dev -- "${PATHS[@]}"

if git diff --cached --quiet; then
  echo "main is already in sync with dev (v$VERSION)."
  exit 0
fi

git commit -q -m "Release v$VERSION"
echo "main updated to v$VERSION (not pushed)."
