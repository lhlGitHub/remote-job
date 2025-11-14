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
const proxy = "http://127.0.0.1:7890"; // 本地代理地址
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

/**
 * 验证机器人是否可以访问指定的 chat
 */
async function verifyChatAccess(chatId) {
  try {
    const chat = await bot.getChat(chatId);
    return { success: true, chat };
  } catch (err) {
    return {
      success: false,
      error: err.response?.body?.description || err.message,
    };
  }
}

/**
 * 发送消息到 Telegram，带重试机制
 */
async function sendJobToTelegram(job, retries = 2) {
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await bot.sendMessage(CHAT_ID, message, {
        parse_mode: "MarkdownV2", // 更严格，防止意外格式崩溃
        disable_web_page_preview: false,
      });
      console.log(`✅ 已发送: ${job.title}`);
      return { success: true };
    } catch (err) {
      const errorBody = err.response?.body || {};
      const errorCode = errorBody.error_code;
      const errorDescription = errorBody.description || err.message;

      // 如果是 "chat not found" 错误，先验证 chat 访问权限
      if (errorCode === 400 && errorDescription?.includes("chat not found")) {
        console.warn(
          `⚠️ Chat not found, 验证访问权限... (尝试 ${attempt + 1}/${retries + 1})`
        );
        const verifyResult = await verifyChatAccess(CHAT_ID);
        if (!verifyResult.success) {
          console.error(
            `❌ 无法访问 Chat ID ${CHAT_ID}: ${verifyResult.error}`
          );
          console.error(
            `💡 解决方案：\n` +
              `1. 确保机器人已被添加到群组/频道\n` +
              `2. 如果群组是隐私的，请确保机器人有发送消息权限\n` +
              `3. 考虑使用频道（Channel）而不是群组（Group）\n` +
              `4. 如果使用频道，确保机器人是管理员\n` +
              `5. 检查 CHAT_ID 是否正确（可以使用 @userinfobot 获取）`
          );
          return { success: false, error: verifyResult.error };
        }
      }

      // 如果是最后一次尝试，记录错误
      if (attempt === retries) {
        console.error(`❌ 发送失败: ${job.title}`);
        console.error(errorBody || err.message || err);
        return { success: false, error: errorDescription };
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

module.exports = {
  sendJobToTelegram,
  verifyChatAccess,
};
