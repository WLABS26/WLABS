#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

cd "$CLAUDE_PROJECT_DIR"

# --- 1. Start PostgreSQL if not already running ---
if ! pg_lsclusters 2>/dev/null | grep -q "online"; then
  pg_ctlcluster 16 main start || true
  # Wait for PostgreSQL to become ready
  for i in $(seq 1 15); do
    pg_lsclusters 2>/dev/null | grep -q "online" && break
    sleep 1
  done
fi

# --- 2. Install/update Node dependencies ---
npm install --prefer-offline 2>/dev/null || npm install

# --- 3. Generate Prisma client and apply migrations ---
npx prisma generate
npx prisma migrate deploy

# --- 4. Start the Next.js dev server (background) ---
pkill -f "next dev" 2>/dev/null || true
sleep 1
nohup npm run dev > /tmp/nextjs-dev.log 2>&1 &
echo "Dev server started (PID $!). Logs: /tmp/nextjs-dev.log"
