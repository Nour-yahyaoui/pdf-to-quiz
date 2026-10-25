#!/usr/bin/env bash
# secrets-management skill: verify no high-confidence secret is tracked in git.
# .env.local is gitignored; this scans what git actually tracks.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "Scanning git-tracked files for secret patterns..."

PATTERNS='gsk_[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sb_secret_[A-Za-z0-9]{10,}'

if git grep -n -I -E "$PATTERNS" -- . ':(exclude)scripts/secret-scan.sh' ':(exclude).env.example' 2>/dev/null; then
  echo ""
  echo "SECRET SCAN FAILED — rotate the exposed credential and remove it from history."
  exit 1
fi

echo "OK: no secrets tracked in git."
