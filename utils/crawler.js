const puppeteer = require("puppeteer");

async function launchBrowser() {
  const IS_LOCAL = process.env.LOCAL === "true";

  // 服务器上使用系统 Chromium
  const executablePath = IS_LOCAL
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "/usr/bin/chromium"; // Ubuntu 安装 Chromium 的路径

  const browser = await puppeteer.launch({
    executablePath,
    headless: IS_LOCAL ? false : "new", // 本地显示界面，服务器无头
    defaultViewport: null,
    args: [
      "--no-sandbox", 
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // 服务器常用，防止 /dev/shm 空间不足
    ],
  });

  return browser;
}

module.exports = { launchBrowser };
