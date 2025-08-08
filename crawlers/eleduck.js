const puppeteer = require("puppeteer");
const { extractFieldsByRegex } = require("../utils/extractFieldsByRegex");

async function crawlEleduck() {
  const url = "https://eleduck.com/search?keyword=远程&sort=new";

  const IS_LOCAL = process.env.LOCAL === "true";
  const browser = await puppeteer.launch({
    executablePath: IS_LOCAL
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined,
    headless: IS_LOCAL ? false : "new", // 或 true
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  // 首页抓取
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector(".post-title a", { timeout: 10000 });

  const jobLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".post-title a"))
      .map((a) => {
        const href = a.href.startsWith("http")
          ? a.href
          : `https://eleduck.com${a.getAttribute("href")}`;
        const title = a.innerText.trim();
        return { href, title };
      })
      .filter(
        ({ href, title }) =>
          href.includes("/posts/") &&
          !title.includes("已暂停") &&
          !title.includes("已结束")
      )
      .slice(0, 5)
      .map(({ href }) => href)
  );

  const jobs = [];

  for (const link of jobLinks) {
    try {
      const detailPage = await browser.newPage();
      await detailPage.goto(link, { waitUntil: "domcontentloaded" });

      // ✅ 等待详情页主要内容加载完成
      await detailPage.waitForSelector(".page-title", { timeout: 10000 });
      await detailPage.waitForSelector(".meta-info span", { timeout: 10000 });
      await detailPage.waitForSelector(".post-contents", { timeout: 10000 });

      const job = await detailPage.evaluate(() => {
        const title =
          document.querySelector(".page-title")?.innerText.trim() || "无标题";
        const company =
          document.querySelector(".meta-info span")?.innerText.trim() ||
          "电鸭公司";
        const content =
          document.querySelector(".post-contents")?.innerText.trim() || "";

        return { title, company, content };
      });

      const extracted = await extractFieldsByRegex(job.content);

      job.tech = extracted.tech;
      job.salary = extracted.salary;
      // job.requirements = extracted.requirements;

      job.id = link;
      job.url = link;
      job.source = "电鸭";
      delete job.content;
      console.log("✅ 抓取成功:", job);

      jobs.push(job);
      await detailPage.close();
    } catch (err) {
      console.warn(`⚠️ 详情页出错: ${link}`, err.message);
    }
  }

  await browser.close();

  console.log(`🦆 电鸭抓取成功，共 ${jobs.length} 条`);
  return jobs;
}

module.exports = crawlEleduck;
