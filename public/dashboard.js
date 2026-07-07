const statusLabel = {
  healthy: { text: "Healthy", class: "status-ok" },
  down: { text: "Down", class: "status-down" },
  ssl_warning: { text: "SSL expiring", class: "status-warn" },
  unknown: { text: "Checking…", class: "status-unknown" }
};

const formatLatency = (ms) => (ms ? `${ms}ms` : "—");
const formatSsl = (ssl) => {
  if (!ssl || ssl.daysLeft === null) return "SSL: unknown";
  return `SSL: ${ssl.daysLeft}d left`;
};

async function loadSummary() {
  const res = await fetch("/api/summary");
  const data = await res.json();
  const pill = document.getElementById("summary-pill");
  pill.textContent = `${data.healthy} healthy · ${data.down} down · ${data.sslWarning} SSL warnings`;
}

async function loadSites() {
  const res = await fetch("/api/sites");
  const data = await res.json();
  const list = document.getElementById("sites-list");

  if (!data.sites.length) {
    list.innerHTML = `<div class="card empty">No sites yet. Click <strong>Add site</strong> to monitor your first client.</div>`;
    return;
  }

  list.innerHTML = data.sites
    .map((site) => {
      const s = statusLabel[site.status] || statusLabel.unknown;
      const check = site.latest;
      return `
        <article class="card site-card">
          <div class="site-top">
            <div>
              <h3>${escapeHtml(site.clientName)}</h3>
              <a href="${escapeAttr(site.url)}" target="_blank" rel="noopener">${escapeHtml(site.url)}</a>
            </div>
            <span class="pill ${s.class}">${s.text}</span>
          </div>
          <div class="site-meta">
            <span>${check ? formatLatency(check.uptime.latencyMs) : "—"}</span>
            <span>${check ? formatSsl(check.ssl) : "SSL: —"}</span>
            <span>${check ? `Checked ${timeAgo(check.checkedAt)}` : "Pending first check"}</span>
          </div>
          ${site.notes ? `<p class="notes">${escapeHtml(site.notes)}</p>` : ""}
          <div class="site-actions">
            <a class="btn btn-ghost btn-sm" href="/status/${site.id}" target="_blank">Status page</a>
            <button class="btn btn-ghost btn-sm" data-delete="${site.id}">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Remove this site from monitoring?")) return;
      await fetch(`/api/sites/${btn.dataset.delete}`, { method: "DELETE" });
      await refresh();
    });
  });
}

async function refresh() {
  await Promise.all([loadSummary(), loadSites()]);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

const form = document.getElementById("add-form");
const addBtn = document.getElementById("add-site-btn");
const cancelBtn = document.getElementById("cancel-add");

addBtn.addEventListener("click", () => form.classList.remove("hidden"));
cancelBtn.addEventListener("click", () => form.classList.add("hidden"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const body = Object.fromEntries(fd.entries());
  const res = await fetch("/api/sites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json();
    alert(err.error || "Failed to add site");
    return;
  }
  form.reset();
  form.classList.add("hidden");
  await refresh();
});

refresh();
setInterval(refresh, 30000);
