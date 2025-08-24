const { extractFieldsByRegex } = require("../utils/extractFieldsByRegex");
/**
 * 爬取 远程.work 的远程工作（列表页直接获取 title + 提要）
 * @returns {Promise<Array>}
 */
async function crawlRemoteWork(browser, existingIdSet = new Set()) {
  try {
    const url = "https://yuancheng.work/";

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".job", { timeout: 10000 });

    // ✅ 直接在列表页提取岗位信息
    const jobs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".job"))
        .filter((el) => {
          const company =
            el.querySelector(".job-company a")?.innerText.trim() || "";
          // 过滤掉 foya传媒 公司
          return !company.includes("foya传媒");
        })
        .slice(0, 5)
        .map((el) => {
          const title =
            el.querySelector(".job-title")?.innerText.trim() || "无标题";
          const url =
            el.querySelector(".job-title")?.getAttribute("href") || "";
          const company =
            el.querySelector(".job-company a")?.innerText.trim() || "未知公司";
          const salary =
            el.querySelector(".job-salary")?.innerText.trim() || "未标注";
          const summary = el
            .querySelector(".job-detail .typo")
            ?.innerText.trim();

          return {
            title,
            id: url,
            url,
            company,
            salary,
            summary,
            source: "远程.work",
          };
        });
    });

    // 在列表阶段按已存在ID(=url)过滤
    const filtered = jobs.filter(
      (job) => job.url && !existingIdSet.has(job.url)
    );

    // 🔍 结合正则抽取工具
    const result = [];
    for (const job of filtered) {
      const extracted = await extractFieldsByRegex(job.summary);
      delete job.summary;
      job.tech = extracted.tech;
      job.salary = job.salary === "未标注" ? extracted.salary : job.salary;

      result.push(job);
    }

    await page.close();
    console.log(`🎯 抓取远程.work成功，共 ${result.length} 条`);
    return result;
  } catch (error) {
    console.error("❌ 远程.work爬虫发生严重错误:", error.message);
    return [];
  }
}

module.exports = crawlRemoteWork;
