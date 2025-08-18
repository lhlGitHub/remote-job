const puppeteer = require("puppeteer");
const { extractFieldsByRegex } = require("../utils/extractFieldsByRegex");

/**
 * 爬取 BOSS直聘远程岗位（含详情页）
 * @returns {Promise<Array>}
 */
async function crawlBoss() {
  const url = "https://www.zhipin.com/web/geek/job?query=远程&city=100010000";

  const IS_LOCAL = process.env.LOCAL === "true";
  const browser = await puppeteer.launch({
    executablePath: IS_LOCAL
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined,
    headless: IS_LOCAL ? false : "new",
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".job-card-box", { timeout: 10000 });

  // 获取前5条职位链接
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

  console.log("🔍 获取到的职位链接:", jobLinks);
  const jobs = [];

  for (const link of jobLinks) {
    try {
      const detailPage = await browser.newPage();
      await detailPage.goto(link, { waitUntil: "domcontentloaded" });

      await detailPage.waitForSelector(".job-primary", { timeout: 10000 });

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
    }
  }

  await browser.close();
  console.log(`🧧 抓取BOSS直聘成功，共 ${jobs.length} 条`);
  return jobs;
}

module.exports = crawlBoss;
