const puppeteer = require("puppeteer");

async function crawlEleduck() {
  const url = "https://eleduck.com/";
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

  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector(".post-item", { timeout: 10000 });

  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".post-item")).map((item) => {
      const titleEl = item.querySelector(".post-title");
      const href = item.querySelector("a")?.getAttribute("href");
      const company =
        item.querySelector(".meta-info span")?.textContent.trim() || "电鸭公司";
      const dateText =
        item
          .querySelector(".meta-info")
          ?.textContent.match(/\d+天前|\d+小时前|\d+分钟前|刚刚/)?.[0] ||
        "未知时间";

      return {
        id: `https://eleduck.com${href}`,
        title: titleEl?.textContent.trim() || "无标题",
        date: `发布: ${dateText}`,
        source: "电鸭",
        summary: `${company}，远程岗位`,
        url: `https://eleduck.com${href}`,
      };
    });
  });

  await browser.close();

  console.log(`🦆 电鸭抓取成功，共 ${jobs.length} 条`);
  return jobs;
}

module.exports = crawlEleduck;
