#!/usr/bin/env bash
# One-shot: deploy SitePulse + Stripe webhook. Run from site-pulse/
set -euo pipefail
cd "$(dirname "$0")/.."

[[ -f .env ]] || { echo "Missing .env"; exit 1; }

VERCEL="npx vercel"
export $(grep -v '^#' .env | xargs)

echo "==> Deploy (creates/links Vercel project if needed)..."
DEPLOY_OUT=$($VERCEL --prod --yes 2>&1)
echo "$DEPLOY_OUT"

APP_URL=$(echo "$DEPLOY_OUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -1)
if [[ -z "$APP_URL" ]]; then
  echo "Could not parse deploy URL. Set APP_URL manually in .env"
  exit 1
fi

echo "==> APP_URL=$APP_URL"
if grep -q '^APP_URL=' .env; then
  sed -i '' "s|^APP_URL=.*|APP_URL=$APP_URL|" .env
else
  echo "APP_URL=$APP_URL" >> .env
fi

echo "==> Push env vars..."
for key in STRIPE_SECRET_KEY STRIPE_PRICE_MANAGED STRIPE_WEBHOOK_SECRET APP_URL; do
  val=$(grep "^${key}=" .env | cut -d= -f2- || true)
  [[ -n "$val" ]] || continue
  $VERCEL env rm "$key" production -y 2>/dev/null || true
  echo "$val" | $VERCEL env add "$key" production
done

echo "==> Stripe webhook..."
WH_OUT=$(APP_URL="$APP_URL" node ops/setup-webhook.js 2>&1) || WH_OUT=""
echo "$WH_OUT"
WHSEC=$(echo "$WH_OUT" | grep '^STRIPE_WEBHOOK_SECRET=' | cut -d= -f2- || true)
if [[ -n "$WHSEC" ]]; then
  sed -i '' "s|^STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$WHSEC|" .env
  echo "$WHSEC" | $VERCEL env rm STRIPE_WEBHOOK_SECRET production -y 2>/dev/null || true
  echo "$WHSEC" | $VERCEL env add STRIPE_WEBHOOK_SECRET production
  $VERCEL --prod --yes
fi

echo "==> Health: $APP_URL/health"
curl -sf "$APP_URL/health" | python3 -m json.tool
echo ""
echo "Live: $APP_URL"
echo "Dashboard: $APP_URL/dashboard"
