# Reddit Launch — Ready to Post

## r/selfhosted

**Title:**
```
[Self-hosted] SitePulse — monitor client site uptime + SSL expiry (Docker, no signup)
```

**Body:**
```
I manage a handful of client WordPress sites and kept finding out about downtime from angry emails instead of my monitor.

Built SitePulse to fix that:

- Add client name + URL in ~10 seconds
- Uptime + SSL expiry checks every 5 minutes
- Telegram/email alerts (optional)
- Public status page per client: /status/{id}
- Single Docker container, JSON file storage
- MIT licensed, free for up to 50 sites

Quick start:
```
docker compose up -d
# open http://localhost:4050/dashboard
```

GitHub: https://github.com/tangyumeng/site-pulse

Managed hosting ($9/mo) is live at https://site-pulse-brown.vercel.app — self-hosted stays free. Happy to take feature requests.
```

**Attach:** screenshot of dashboard with 2–3 client sites

---

## r/freelance (value post, not ad)

**Title:**
```
How I stopped learning about client downtime from angry emails
```

**Body:**
```
Freelancer tip that saved me awkward calls:

1. List every client site in one dashboard (name + URL only)
2. Check uptime + SSL expiry automatically
3. Get Telegram alert before the client notices

I self-host a tiny monitor (SitePulse) — takes 10 seconds per site, no agent on client servers.

What's your stack for monitoring client sites?
```

---

## Indie Hackers

**Title:** Building SitePulse — client site monitor for freelancers ($0 self-hosted, $9 managed)

Share: Day 1 metrics, tech stack (Node + Docker), goal $10/day side income.
