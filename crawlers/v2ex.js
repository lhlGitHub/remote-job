const puppeteer = require("puppeteer");
const { extractFieldsByRegex } = require("../utils/extractFieldsByRegex");

/**
 * 爬取 V2EX 的远程工作板块
 * @returns {Promise<Array>}
 */
async function crawlV2ex(existingIdSet = new Set()) {
  try {
    const url = "https://www.v2ex.com/go/remote";
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
    await page.waitForSelector("#TopicsNode .cell", { timeout: 10000 });

    // ✅ 修复提取逻辑：只提取 .item_title 下的链接，过滤非招聘帖子
    const postLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".item_title a"))
        .filter((el) => {
          const title = el.textContent.trim();
          // 过滤包含推荐、曝光等非招聘关键词的帖子
          const excludeKeywords = ["推荐", "曝光", "推广", "广告", "软文"];
          return !excludeKeywords.some((keyword) => title.includes(keyword));
        })
        .slice(0, 3) // 抓取前3条
        .map((el) => {
          const href = el.getAttribute("href");
          // 去掉 # 后面的参数
          const cleanHref = href.split("#")[0];
          return `https://www.v2ex.com${cleanHref}`;
        });
    });

    // 在抓详情前先按已存在ID过滤
    const newLinks = postLinks.filter((link) => !existingIdSet.has(link));

    const jobs = [];

    for (const link of newLinks) {
      try {
        const detailPage = await browser.newPage();
        await detailPage.goto(link, { waitUntil: "domcontentloaded" });
        await detailPage.waitForSelector(".header h1", { timeout: 10000 });

        const job = await detailPage.evaluate(() => {
          const title =
            document.querySelector(".header h1")?.innerText.trim() || "无标题";
          const author =
            document.querySelector(".header .gray a")?.innerText.trim() ||
            "未知作者";
          const content =
            document.querySelector(".topic_content")?.innerText.trim() || "";
          return { title, author, content };
        });

        const extracted = await extractFieldsByRegex(job.content);

        job.id = link;
        job.url = link;
        job.source = "V2EX";
        job.tech = extracted.tech;
        job.salary = extracted.salary;
        job.company = job.author;

        delete job.content;
        delete job.author;

        console.log("✅ V2EX 抓取成功:", job);
        jobs.push(job);

        await detailPage.close();
      } catch (err) {
        console.error(`❌ 详情抓取失败: ${link}`, err.message);
      }
    }

    await browser.close();
    console.log(`🎯 抓取V2EX成功，共 ${jobs.length} 条`);
    return jobs;
  } catch (error) {
    console.error("❌ V2EX爬虫发生严重错误:", error.message);
    return [];
  }
}

module.exports = crawlV2ex;
