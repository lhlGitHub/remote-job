const puppeteer = require("puppeteer");

async function launchBrowser() {
  try {
    return await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
        "--headless=new",
      ],
      headless: "new",
    });
  } catch (error) {
    console.error("Failed to launch browser:", error);

    // 备用方案：尝试使用系统 Chromium
    const puppeteerCore = require("puppeteer-core");
    return await puppeteerCore.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
        "--no-zygote",
        "--headless=new",
      ],
      executablePath: "/usr/bin/chromium-browser",
      headless: "new",
    });
  }
}

module.exports = { launchBrowser };
