#!/usr/bin/env bash
# Push .env secrets to Vercel + webhook + redeploy. No secret output.
set -euo pipefail
cd "$(dirname "$0")/.."

source_env() {
  set -a
  # shellcheck disable=SC1091
  source <(grep -v '^#' .env | grep -v '^$' | sed 's/^/export /')
  set +a
}

source_env
VERCEL="npx vercel"
APP_URL="${APP_URL:-https://site-pulse-brown.vercel.app}"

push_env() {
  local key="$1" val="$2"
  [[ -n "$val" ]] || return 0
  $VERCEL env rm "$key" production -y >/dev/null 2>&1 || true
  printf '%s' "$val" | $VERCEL env add "$key" production >/dev/null
  echo "✓ $key"
}

echo "==> Push env to Vercel..."
push_env STRIPE_SECRET_KEY "$STRIPE_SECRET_KEY"
push_env STRIPE_PRICE_MANAGED "$STRIPE_PRICE_MANAGED"
push_env APP_URL "$APP_URL"

echo "==> Create Stripe webhook..."
WH_OUT=$(APP_URL="$APP_URL" node ops/setup-webhook.js 2>&1)
WHSEC=$(echo "$WH_OUT" | grep '^STRIPE_WEBHOOK_SECRET=' | cut -d= -f2- || true)
if [[ -n "$WHSEC" ]]; then
  if grep -q '^STRIPE_WEBHOOK_SECRET=' .env; then
    sed -i '' "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WHSEC|" .env
  else
    echo "STRIPE_WEBHOOK_SECRET=$WHSEC" >> .env
  fi
  push_env STRIPE_WEBHOOK_SECRET "$WHSEC"
else
  echo "○ webhook already exists or skipped"
fi

echo "==> Redeploy..."
$VERCEL --prod --yes 2>&1 | grep -E 'Production|Aliased|Error|error' || true

echo "==> Health:"
curl -sf "$APP_URL/health" | python3 -m json.tool
echo ""
echo "Live: $APP_URL"
