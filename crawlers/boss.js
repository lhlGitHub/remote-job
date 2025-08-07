const puppeteer = require("puppeteer");
// const { parseBossDateText } = require("../utils/time");

/**
 * 爬取 BOSS直聘远程岗位
 * @returns {Promise<Array>}
 */
async function crawlBoss() {
  const url = "https://www.zhipin.com/web/geek/job?query=远程&city=100010000";

  const browser = await puppeteer.launch({ headless: "new" });

  // const browser = await puppeteer.launch({
  //   executablePath:
  //     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  //   headless: false,
  //   defaultViewport: null,
  //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
  // });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.goto(url);
  await page.waitForSelector(".job-card-box", { timeout: 10000 });

  const jobs = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll(".job-card-box"));
    return items.map((item) => {
      const titleEl = item.querySelector(".job-name");
      const salaryEl = item.querySelector(".job-salary");
      const companyEl = item.querySelector(".boss-name");
      const locEl = item.querySelector(".company-location");
      const dateEl = item.querySelector(".job-card-footer span:last-of-type");

      const url = titleEl?.getAttribute("href") || "";
      const salary =
        salaryEl?.textContent.replace(/[\uE000-\uF8FF]/g, "") || "薪资面议";
      const title = titleEl?.textContent.trim() || "未知职位";
      const company = companyEl?.textContent.trim() || "未知公司";
      const location = locEl?.textContent.trim() || "远程";
      const date = dateEl?.textContent.trim() || "刚刚";

      return {
        id: `https://www.zhipin.com${url}`,
        title,
        date: `发布: ${date}`,
        source: "BOSS直聘",
        summary: `${title}，${salary}，${company}`,
        url: `https://www.zhipin.com${url}`,
      };
    });
  });

  await browser.close();
  console.log(`🧧 抓取BOSS直聘成功，共 ${jobs.length} 条`);
  return jobs;
}

module.exports = crawlBoss;
