---
name: launch-self-hosted-product
description: Launch and monetize a self-hosted open-core product. Use when building, deploying, or marketing self-hosted SaaS in the earn-money or self-hosted directories.
---

# Launch Self-Hosted Product

Reusable workflow for open-core products: free self-hosted + paid managed tier.

## When to use

- Creating a new project in `self-hosted/`
- Preparing Reddit/r/selfhosted launch
- Setting up unattended ops for a side-income product

## Product selection criteria

Pick ideas that pass ALL four:

1. **Audience ≥ 10k** — freelancers, homelabbers, small agencies (not "AI automation agencies only")
2. **Onboarding ≤ 60 seconds** — no API keys, no HMAC, no agent install on client infra
3. **Pain is emotional** — client embarrassment, lost revenue, angry emails
4. **Self-hostable in one Docker container** — data sovereignty sells on r/selfhosted

Reject ideas that fail criteria 1 or 2 (e.g. webhook debuggers, AI cost guardrails for n8n).

## Standard project scaffold

```
project-name/
├── src/server.js          # Express API
├── public/                # Static landing + dashboard (no build step)
├── ops/
│   ├── check-setup.js     # One-shot validation
│   └── daily-report.js    # Cron-friendly JSON output
├── docker-compose.yml
├── .env.example
├── GOAL.md                # $10/day math
├── docs/MONETIZATION.md
├── docs/LAUNCH.md
└── skills/                # Project-specific skills
```

## Monetization template (open-core)

| Tier | Price | Purpose |
|------|-------|---------|
| Self-hosted MIT | $0 | Distribution, GitHub stars |
| Managed cloud | $5–15/mo | Convenience |
| Setup bundle (Gumroad) | $19–49 once | Templates + config |

## Launch sequence

1. **Day 1–2**: MVP + Docker + README GIF
2. **Day 3**: Post to r/selfhosted (Show style, not ads)
3. **Day 4–5**: Value posts in niche subs (r/freelance, r/webdev)
4. **Day 6**: Stripe/Gumroad live
5. **Day 7**: Review metrics, one messaging experiment

## Reddit post rules

- Title includes `[Self-hosted]` and concrete benefit
- Body: pain story → what it does → Docker one-liner → GitHub link
- Never link-only; include screenshot or GIF
- Reply to every comment within 24h

## Unattended ops checklist

```bash
npm run check          # exits 1 if sites unhealthy
npm run daily-report   # JSON for cron
```

Optional cron:
```
0 9 * * * cd /path/to/project && npm run daily-report >> data/reports.log
```

## Anti-patterns (learned from earn-money projects)

| Project | Problem | Lesson |
|---------|---------|--------|
| HookBin | Crowded market, low willingness to pay | Avoid commoditized dev tools |
| Agent Cost Guard | Tiny audience, API-first onboarding | Don't require integration before value |
| Dev Automation Pack | No distribution channel | Product without launch plan = $0 |

## Revenue tracking

After any sale:
```bash
# In earn-money root
python3 scripts/track-revenue.py add --amount 9 --source site-pulse --note "managed sub"
```

## Next project ideas (validated pain, low barrier)

- Invoice reminder for freelancers (not full accounting)
- SSL + domain expiry for client portfolios (SitePulse core)
- Backup proof ping ("did my backup script run?") — heartbeat only, no restore
