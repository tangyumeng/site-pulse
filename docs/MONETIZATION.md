# Monetization Playbook

## Open-core model (proven on r/selfhosted)

1. **Free self-hosted** = distribution (GitHub stars, Reddit posts, word of mouth)
2. **Paid managed cloud** = convenience (no Docker, no SMTP setup)
3. **Paid consulting** = setup for agencies ($50–200 one-time)

## Pricing rationale

- **$9/mo** sits below UptimeRobot Pro ($7–15) and Cronitor ($18+)
- Freelancers with 10 clients × $9/mo = cheaper than one hour of emergency fix
- Self-hosted free tier (50 sites) is generous enough to get stars, tight enough to convert power users

## Conversion triggers

| Free limit | Upgrade prompt |
|------------|----------------|
| 50 sites | "Upgrade for unlimited" |
| No status page | Managed-only feature |
| Manual SMTP setup | "We handle alerts for you" |

## Revenue channels

### A. Managed SaaS ($9/mo)
Deploy to Railway/Fly.io. Same codebase, multi-tenant later.

### B. Gumroad "Pro Docker Bundle" ($29 one-time)
- Pre-configured docker-compose with Telegram alerts
- 5 client onboarding email templates
- White-label status page theme

### C. Reddit/community inbound
Monitor these phrases with F5Bot:
- "monitor client websites"
- "ssl expiry alert"
- "freelancer uptime"

Reply value-first, link to GitHub not sales page.

## 30-day target

| Week | Goal |
|------|------|
| 1 | GitHub public + r/selfhosted post, 50 stars |
| 2 | 3 paying managed users ($27 MRR) |
| 3 | Gumroad bundle live, 5 sales ($145) |
| 4 | $100+ MRR or $300 one-time revenue |
