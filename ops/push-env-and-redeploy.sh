#!/usr/bin/env bash
# Push .env secrets to Vercel + webhook + redeploy. No secret output.
set -euo pipefail
cd "$(dirname "$0")/.."

VERCEL="npx vercel"
APP_URL="${APP_URL:-https://site-pulse-brown.vercel.app}"

echo "==> Push env to Vercel..."
node ops/push-vercel-env.mjs

echo "==> Create Stripe webhook..."
WH_OUT=$(APP_URL="$APP_URL" node ops/setup-webhook.js 2>&1)
WHSEC=$(echo "$WH_OUT" | grep '^STRIPE_WEBHOOK_SECRET=' | cut -d= -f2- || true)
if [[ -n "$WHSEC" ]]; then
  if grep -q '^STRIPE_WEBHOOK_SECRET=' .env; then
    sed -i '' "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WHSEC|" .env
  else
    echo "STRIPE_WEBHOOK_SECRET=$WHSEC" >> .env
  fi
  node ops/push-vercel-env.mjs
else
  echo "○ webhook already exists or skipped"
fi

echo "==> Redeploy..."
$VERCEL --prod --yes 2>&1 | grep -E 'Production|Aliased|Error|error' || true

echo "==> Health:"
curl -sf "$APP_URL/health" | python3 -m json.tool
echo ""
echo "Live: $APP_URL"
