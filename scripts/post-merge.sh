#!/bin/bash
set -e

# Runs automatically after a task is merged. Keep it fast, idempotent, and
# non-interactive (stdin is closed). This is a static Vite + React SPA with no
# database or migrations, so we only need to sync dependencies in case a merge
# changed package.json / package-lock.json.
npm install --no-audit --no-fund
