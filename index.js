require("dotenv").config();

const { loadJobs, saveJobs, filterNewJobs } = require("./utils/storage");
const { sendJobToTelegram } = require("./utils/telegram");

// 导入爬虫
const crawlBoss = require("./crawlers/boss");
const crawlEleduck = require("./crawlers/eleduck");

async function main() {
  console.log("📦 开始抓取远程岗位...");

  // 所有来源的数据 eleduckJobs
  const [bossJobs, eleduckJobs] = await Promise.all([
    crawlBoss(),
    crawlEleduck(),
  ]);

  const allJobs = [...eleduckJobs, ...bossJobs];
  const oldJobs = loadJobs();
  const newJobs = filterNewJobs(allJobs, oldJobs);

  if (newJobs.length === 0) {
    console.log("⚠️ 无新增岗位");
    return;
  }

  for (const job of newJobs) {
    await sendJobToTelegram(job);
  }

  // // 合并后写入新数据
  saveJobs([...oldJobs, ...newJobs]);
  console.log(`✅ 本次新增 ${newJobs.length} 条岗位`);
}

main();
