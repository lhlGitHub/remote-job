const TelegramBot = require("node-telegram-bot-api");
const { HttpsProxyAgent } = require("https-proxy-agent");

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
if (!TOKEN || !CHAT_ID) {
  console.error("❌ EFATAL: Telegram Token or Chat ID not provided!");
  process.exit(1);
}
// 只在本地启用代理（例如通过环境变量判断）
const IS_LOCAL = process.env.LOCAL === "true";
const proxy = "http://127.0.0.1:7890";
console.log("IS_LOCAL", IS_LOCAL);
const bot = new TelegramBot(TOKEN, {
  polling: false,
  request: IS_LOCAL
    ? {
        agent: new HttpsProxyAgent(proxy),
      }
    : {}, // GitHub Actions 不使用代理
});

/**
 * 处理 Telegram Markdown 中的特殊字符
 */
function escapeMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/_/g, "\\_")
    .replace(/\*/g, "\\*")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/~/g, "\\~")
    .replace(/`/g, "\\`")
    .replace(/>/g, "\\>")
    .replace(/#/g, "\\#")
    .replace(/\+/g, "\\+")
    .replace(/-/g, "\\-")
    .replace(/=/g, "\\=")
    .replace(/\|/g, "\\|")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\./g, "\\.")
    .replace(/!/g, "\\!");
}

async function sendJobToTelegram(job) {
  const title = escapeMarkdown(job.title);
  const date = escapeMarkdown(job.date);
  const source = escapeMarkdown(job.source);
  const tech = escapeMarkdown(job.tech);
  const salary = escapeMarkdown(job.salary);
  const url = job.url;

  const message = `
📢 *${title}*
📌 来源: ${source}
📝 摘要: ${tech} ${salary}
🔗 [查看详情](${url})
  `.trim();

  try {
    await bot.sendMessage(CHAT_ID, message, {
      parse_mode: "MarkdownV2", // 更严格，防止意外格式崩溃
      disable_web_page_preview: false,
    });
    console.log(`✅ 已发送: ${job.title}`);
  } catch (err) {
    console.error(`❌ 发送失败: ${job.title}`);
    console.error(err.response?.body || err.message || err);
  }
}

module.exports = {
  sendJobToTelegram,
};
