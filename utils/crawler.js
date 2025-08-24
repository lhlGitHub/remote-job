const { chromium } = require("playwright-core");

async function launchBrowser() {
  try {
    return await chromium.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
        "--headless=new",
      ],
      headless: true,
    });
  } catch (error) {
    console.error("Playwright launch failed:", error);
    throw new Error(`浏览器启动失败: ${error.message}`);
  }
}

module.exports = { launchBrowser };
