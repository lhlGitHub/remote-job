const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer");
const puppeteerCore = require("puppeteer-core");

async function launchBrowser() {
  const isLocal =
    process.env.NODE_ENV !== "production" &&
    !process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isLocal) {
    // 本地环境
    return await puppeteer.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: false,
      defaultViewport: null,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } else {
    // Vercel 生产环境
    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: chromium.executablePath, // ✅ 不要 await
      headless: chromium.headless,
    });
  }
}

module.exports = { launchBrowser };
