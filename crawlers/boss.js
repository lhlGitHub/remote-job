const fs = require("fs");
const path = require("path");
const { extractFieldsByRegex } = require("../utils/extractFieldsByRegex");

/**
 * 爬取 BOSS直聘远程岗位（含详情页）
 * 自动检测身份验证/滑块验证
 */
async function crawlBoss(browser, existingIdSet = new Set()) {
  const debugDir = path.resolve(__dirname, "../debug");
  if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir);

  const cookiesPath = path.resolve(__dirname, "../cookies.json");
  let cookies = [];
  if (fs.existsSync(cookiesPath)) {
    cookies = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
  } else {
    console.warn("⚠️ cookies.json 不存在，请先导出有效 Cookie");
  }

  const checkValidation = async (page) => {
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body.innerText);
    return (
      title.includes("身份验证") ||
      bodyText.includes("请按照指示完成网站访客验证")
    );
  };

  try {
    const url = "https://www.zhipin.com/web/geek/job?query=远程&city=100010000";
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    if (cookies.length) await page.setCookie(...cookies);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

      if (await checkValidation(page)) {
        console.error("❌ 列表页触发身份验证，请更新 cookies.json");
        await page.screenshot({
          path: path.join(debugDir, "boss_validation.png"),
          fullPage: true,
        });
        fs.writeFileSync(
          path.join(debugDir, "boss_validation.html"),
          await page.content(),
          "utf-8"
        );
        await page.close();
        return [];
      }

      await page.waitForSelector(".job-card-box", { timeout: 15000 });
    } catch (err) {
      console.error("❌ BOSS直聘列表页加载失败:", err.message);
      await page.screenshot({
        path: path.join(debugDir, "boss_list.png"),
        fullPage: true,
      });
      fs.writeFileSync(
        path.join(debugDir, "boss_list.html"),
        await page.content(),
        "utf-8"
      );
      await page.close();
      return [];
    }

    const jobLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".job-card-box"))
        .slice(0, 10)
        .map((item) => {
          const titleEl = item.querySelector(".job-name");
          const href = titleEl?.getAttribute("href");
          return href ? `https://www.zhipin.com${href}` : null;
        })
        .filter(Boolean)
    );

    const newLinks = jobLinks.filter((link) => !existingIdSet.has(link));
    const jobs = [];

    for (const link of newLinks) {
      let detailPage;
      try {
        detailPage = await browser.newPage();
        if (cookies.length) await detailPage.setCookie(...cookies);

        await detailPage.goto(link, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        if (await checkValidation(detailPage)) {
          console.error(`❌ 详情页触发身份验证: ${link}`);
          await detailPage.screenshot({
            path: path.join(debugDir, "boss_detail_validation.png"),
            fullPage: true,
          });
          fs.writeFileSync(
            path.join(debugDir, "boss_detail_validation.html"),
            await detailPage.content(),
            "utf-8"
          );
          await detailPage.close();
          continue;
        }

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
        if (detailPage) {
          await detailPage.screenshot({
            path: path.join(debugDir, `boss_detail_error.png`),
            fullPage: true,
          });
          fs.writeFileSync(
            path.join(debugDir, `boss_detail_error.html`),
            await detailPage.content(),
            "utf-8"
          );
          await detailPage.close();
        }
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
