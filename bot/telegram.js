const TelegramBot = require('node-telegram-bot-api')
const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID
const bot = new TelegramBot(token)

async function sendJobsToTelegram(jobs) {
  for (const job of jobs) {
    const msg = `📌 *${job.title}*\n👨‍💼 ${job.company || ''}\n📝 ${job.desc}\n🔗 [查看职位](${job.link})`
    await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' })
  }
}

module.exports = sendJobsToTelegram