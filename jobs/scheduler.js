const cron = require("node-cron");
const { crawlBossJobs } = require("../crawlers/boss");
const { crawlTolokaJobs } = require("../crawlers/toloka");
const sendJobs = require("../bot/telegram");

// console.log("toloka", toloka);
cron.schedule("0 9 * * *", async () => {
  const [bossJobs, tolokaJobs] = await Promise.all([
    crawlBossJobs(),
    crawlTolokaJobs(),
  ]);
  const jobs = [...bossJobs, ...tolokaJobs];
  await sendJobs(jobs);
  console.log(`推送了 ${jobs.length} 条远程岗位`);
});
