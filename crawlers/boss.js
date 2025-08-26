const fs = require("fs");
const path = require("path");
const { extractFieldsByRegex } = require("../utils/extractFieldsByRegex");

/**
 * 爬取 BOSS直聘远程岗位（含详情页）
 * @returns {Promise<Array>}
 */
async function crawlBoss(browser, existingIdSet = new Set()) {
  try {
    const url = "https://www.zhipin.com/web/geek/job?query=远程&city=100010000";

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector(".job-card-box", { timeout: 15000 });
    } catch (err) {
      console.error("❌ BOSS直聘列表页加载失败:", err.message);

      // 保存截图 + HTML 调试
      const debugDir = path.resolve(__dirname, "../debug");
      if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
      await page.screenshot({
        path: path.join(debugDir, "boss_list.png"),
        fullPage: true,
      });
      const html = await page.content();
      fs.writeFileSync(path.join(debugDir, "boss_list.html"), html, "utf-8");

      await page.close();
      return [];
    }

    // 获取前10条职位链接
    const jobLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".job-card-box"))
        .slice(0, 10)
        .map((item) => {
          const titleEl = item.querySelector(".job-name");
          const href = titleEl?.getAttribute("href");
          return href ? `https://www.zhipin.com${href}` : null;
        })
        .filter(Boolean);
    });

    // 去重
    const newLinks = jobLinks.filter((link) => !existingIdSet.has(link));

    const jobs = [];

    for (const link of newLinks) {
      try {
        const detailPage = await browser.newPage();
        await detailPage.goto(link, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await detailPage.waitForSelector(".job-primary", { timeout: 15000 });

        const job = await detailPage.evaluate(() => {
          const title =
            document.querySelector(".name h1")?.innerText.trim() || "无标题";
          const company =
            document.querySelector(".company-info a")?.innerText.trim() ||
            "未知公司";
          const salary =
            document.querySelector(".salary")?.innerText.trim() || "薪资面议";
          const content =
            document.querySelector(".job-sec-text")?.innerText.trim() || "";
          return { title, company, salary, content };
        });

        const extracted = await extractFieldsByRegex(job.content);
        job.tech = extracted.tech;
        job.salary = extracted.salary || job.salary;

        job.id = link;
        job.url = link;
        job.source = "BOSS直聘";
        delete job.content;

        console.log("✅ boss抓取成功:", job);
        jobs.push(job);

        await detailPage.close();
      } catch (error) {
        console.error(`❌ 抓取失败: ${link}`, error.message);

        // 保存失败页面调试
        const debugDir = path.resolve(__dirname, "../debug");
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);
        await detailPage.screenshot({
          path: path.join(debugDir, `boss_detail.png`),
          fullPage: true,
        });
        const html = await detailPage.content();
        fs.writeFileSync(
          path.join(debugDir, `boss_detail.html`),
          html,
          "utf-8"
        );
      }
    }

    await page.close();
    console.log(`🧧 抓取BOSS直聘成功，共 ${jobs.length} 条`);
    return jobs;
  } catch (error) {
    console.error("❌ BOSS直聘爬虫发生严重错误:", error.message);
    return [];
  }
}

module.exports = crawlBoss;
