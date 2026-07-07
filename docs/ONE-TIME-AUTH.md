# One-Time Setup (Managed Cloud)

Run once. After this, self-hosted + managed billing runs unattended.

## 1. Stripe

```bash
cp .env.example .env
# Add STRIPE_SECRET_KEY=sk_...

npm run setup-stripe
```

Copy output into `.env`:
- `STRIPE_PRICE_MANAGED=price_...`

Create webhook in Stripe Dashboard:
- URL: `https://YOUR_DOMAIN/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`
- Copy `STRIPE_WEBHOOK_SECRET=whsec_...`

Set `APP_URL=https://YOUR_DOMAIN` for checkout redirects.

## 2. Alerts (pick one)

**Telegram:**
```
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

**Email:** configure SMTP_* and ALERT_EMAIL

## 3. Validate

```bash
npm run check-auth
npm run check
```

## 4. Cron (optional)

```
0 9 * * * cd /path/to/site-pulse && npm run daily-report >> data/reports/cron.log
0 9 * * 1 cd /path/to/self-hosted && bash scripts/daily-ops.sh >> site-pulse/data/reports/ops.log
```
