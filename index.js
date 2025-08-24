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

    // 先加载历史，构建已存在ID集合（用于各爬虫在抓详情前过滤）
    const oldJobs = await loadJobs();
    const existingIdSet = new Set(oldJobs.map((job) => job.id));
    console.log(`📚 数据库中已有 ${oldJobs.length} 条岗位记录`);

    // 所有来源的数据
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

    // 检查是否有抓取到数据
    if (allJobs.length === 0) {
      console.log("⚠️ 所有平台都未抓取到岗位数据");
      return;
    }

    // 使用新的异步过滤函数
    const newJobs = await filterNewJobs(allJobs);

    if (newJobs.length === 0) {
      console.log("⚠️ 无新增岗位");
      return;
    }

    // // 发送新岗位到Telegram
    // for (const job of newJobs) {
    //   try {
    //     await sendJobToTelegram(job);
    //   } catch (error) {
    //     console.error(`❌ 发送岗位到Telegram失败: ${job.title}`, error.message);
    //   }
    // }

    // 保存新数据到Supabase
    await saveJobs(newJobs);

    // 清理旧数据，保持数据库整洁
    await cleanupOldJobs();

    console.log("newJobs", newJobs);
    console.log(`✅ 本次新增 ${newJobs.length} 条岗位`);
  } catch (error) {
    console.error("❌ 主程序执行错误:", error);
  }
}

main();
