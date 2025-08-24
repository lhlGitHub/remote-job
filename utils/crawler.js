const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer");
const puppeteerCore = require("puppeteer-core");

async function launchBrowser() {
  // 检测是否为本地环境
  const isLocal =
    process.env.NODE_ENV !== "production" &&
    !process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isLocal) {
    // 本地环境：直接使用 puppeteer，它会自动下载和管理 Chrome
    const browser = await puppeteer.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: false,
      defaultViewport: null,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    return browser;
  } else {
    // 生产环境：使用 chrome-aws-lambda + puppeteer-core
    const browser = await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    return browser;
  }
}

module.exports = {
  launchBrowser,
};
