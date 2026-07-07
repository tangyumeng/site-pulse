# Launch Checklist

## Pre-launch (1 day)

- [x] Docker compose + `.env.example`
- [x] Public status page per client
- [x] Stripe Managed checkout + webhook
- [x] Commercial terms doc
- [ ] README with screenshot/GIF of add-site flow

## Reddit launch (r/selfhosted)

**Title:** `[Self-hosted] SitePulse — monitor client site uptime + SSL expiry (Docker, no signup)`

**Body template:**
> I built this because I manage ~15 client WordPress sites and kept finding out about downtime from angry emails.
>
> SitePulse: add client name + URL → get Telegram/email when down or SSL expiring.
>
> - Single Docker container, SQLite-ish JSON store
> - No agents on client servers
> - MIT licensed
>
> GitHub: [link]
>
> Happy to add features if there's interest — status pages per client is next.

**Rules:** No link-only post. Include screenshot. Respond to every comment in 24h.

## Twitter/X thread

1. Pain: "Client site went down. They emailed before my monitor did."
2. Demo GIF: 10-second add flow
3. Self-hosted vs managed pricing
4. Ask: "How many client sites do you monitor?"

## Indie Hackers

Post as "Building in public" — share week-1 metrics honestly (even if $0).

## Post-launch cron

```bash
0 9 * * * cd /path/to/site-pulse && npm run daily-report >> data/reports.log
```

Review weekly: signups, GitHub stars, conversion to paid.
