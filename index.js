require("dotenv").config();

const {
  loadJobs,
  saveJobs,
  filterNewJobs,
  cleanupOldJobs,
} = require("./utils/storage");
const { sendJobToTelegram } = require("./utils/telegram");

// 导入爬虫
const crawlBoss = require("./crawlers/boss");
const crawlEleduck = require("./crawlers/eleduck");
const crawlV2ex = require("./crawlers/v2ex");
const crawlRemoteWork = require("./crawlers/yuancheng");

async function main() {
  try {
    console.log("📦 开始抓取远程岗位...");

    const oldJobs = await loadJobs();
    const existingIdSet = new Set(oldJobs.map((job) => job.id));
    console.log(`📚 数据库中已有 ${oldJobs.length} 条岗位记录`);

    const [bossJobs, eleduckJobs, v2exJobs, remoteWorkJobs] = await Promise.all(
      [
        crawlBoss(existingIdSet),
        crawlEleduck(existingIdSet),
        crawlV2ex(existingIdSet),
        crawlRemoteWork(existingIdSet),
      ]
    );

    const allJobs = [
      ...eleduckJobs,
      ...bossJobs,
      ...v2exJobs,
      ...remoteWorkJobs,
    ];

    console.log(
      `🕷️ 各平台抓取结果: BOSS(${bossJobs.length}), 电鸭(${eleduckJobs.length}), V2EX(${v2exJobs.length}), 远程.work(${remoteWorkJobs.length})`
    );

    if (allJobs.length === 0) {
      console.log("⚠️ 所有平台都未抓取到岗位数据");
      return [];
    }

    const newJobs = await filterNewJobs(allJobs);

    if (newJobs.length === 0) {
      console.log("⚠️ 无新增岗位");
      return [];
    }

    for (const job of newJobs) {
      try {
        await sendJobToTelegram(job);
      } catch (error) {
        console.error(`❌ 发送岗位到Telegram失败: ${job.title}`, error.message);
      }
    }

    await saveJobs(newJobs);
    await cleanupOldJobs();

    console.log(`✅ 本次新增 ${newJobs.length} 条岗位`);
    return newJobs;
  } catch (error) {
    console.error("❌ 主程序执行错误:", error);
    throw error;
  }
}

// 仅在本地直接运行时执行
if (require.main === module) {
  main();
}

module.exports = { main };
