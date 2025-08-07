const TelegramBot = require("node-telegram-bot-api");
const { HttpsProxyAgent } = require("https-proxy-agent");

const TOKEN = "7441478747:AAGcSIqIM4MawJQCxQyzCeFboSbnoO6fulU"; // 替换为你的 Token
const CHAT_ID = "@WorkRemotoChannel"; // 或者 '-100xxxxxxxxxx'

// 替换为你的代理地址（来自 clash、v2ray 等）
const proxy = "http://127.0.0.1:7897";

const bot = new TelegramBot(TOKEN, {
  polling: false,
  request: {
    agent: new HttpsProxyAgent(proxy),
  },
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
  const summary = escapeMarkdown(job.summary);
  const url = job.url;

  const message = `
📢 *${title}*
📅 ${date}
📌 来源: ${source}
📝 ${summary}
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
