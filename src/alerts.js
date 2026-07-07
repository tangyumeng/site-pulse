import { config } from "./config.js";
import { recordAlert } from "./store.js";

const sendTelegram = async (message) => {
  if (!config.telegram.botToken || !config.telegram.chatId) return false;
  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.telegram.chatId,
      text: message,
      parse_mode: "HTML"
    })
  });
  return res.ok;
};

const sendEmail = async (subject, body) => {
  // MVP: log email intent. Users can wire nodemailer or external SMTP relay.
  if (!config.smtp.host || !config.alertEmail) return false;
  console.log(`[email] to=${config.alertEmail} subject=${subject}`);
  console.log(body);
  return true;
};

export const dispatchAlert = async ({ site, check, reason }) => {
  const message = [
    `<b>SitePulse Alert</b>`,
    `Site: ${site.clientName} — ${site.url}`,
    `Reason: ${reason}`,
    `Status: ${check.uptime.up ? "UP" : "DOWN"} (${check.uptime.status || "n/a"})`,
    check.ssl.daysLeft !== null ? `SSL expires in ${check.ssl.daysLeft} days` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const channels = [];
  if (await sendTelegram(message)) channels.push("telegram");
  if (await sendEmail(`SitePulse: ${site.clientName}`, message)) channels.push("email");

  recordAlert({
    id: `alert_${Date.now()}`,
    siteId: site.id,
    reason,
    channels: channels.length ? channels : ["console"],
    sentAt: new Date().toISOString()
  });

  if (!channels.length) {
    console.log(`[alert] ${message.replace(/<[^>]+>/g, "")}`);
  }
};
