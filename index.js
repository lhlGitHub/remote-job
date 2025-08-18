require("dotenv").config();

const { loadJobs, saveJobs, filterNewJobs } = require("./utils/storage");
const { sendJobToTelegram } = require("./utils/telegram");

// 导入爬虫
const crawlBoss = require("./crawlers/boss");
const crawlEleduck = require("./crawlers/eleduck");
const crawlV2ex = require("./crawlers/v2ex");
const crawlRemoteWork = require("./crawlers/yuancheng");

async function main() {
  console.log("📦 开始抓取远程岗位...");

  // 先加载历史，构建已存在ID集合（用于各爬虫在抓详情前过滤）
  const oldJobs = loadJobs();
  const existingIdSet = new Set(oldJobs.map((job) => job.id));

  // 所有来源的数据 eleduckJobs
  const [bossJobs, eleduckJobs, v2exJobs, remoteWorkJobs] = await Promise.all([
    crawlBoss(existingIdSet),
    crawlEleduck(existingIdSet),
    crawlV2ex(existingIdSet),
    crawlRemoteWork(existingIdSet),
  ]);

  const allJobs = [...eleduckJobs, ...bossJobs, ...v2exJobs, ...remoteWorkJobs];
  const newJobs = filterNewJobs(allJobs, oldJobs);

  if (newJobs.length === 0) {
    console.log("⚠️ 无新增岗位");
    return;
  }

  for (const job of newJobs) {
    await sendJobToTelegram(job);
  }

  // 合并后写入新数据
  saveJobs([...oldJobs, ...newJobs]);
  console.log("newJobs", newJobs);
  console.log(`✅ 本次新增 ${newJobs.length} 条岗位`);
}

main();
