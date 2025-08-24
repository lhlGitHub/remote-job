const chromium = require("chrome-aws-lambda");
const puppeteerCore = require("puppeteer-core");

async function launchBrowser() {
  const isLocal = process.env.NODE_ENV !== "production";

  if (isLocal) {
    const puppeteer = require("puppeteer");
    return await puppeteer.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      defaultViewport: null,
    });
  } else {
    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(), // ⚠️ 注意这里要加 ()
      headless: chromium.headless,
    });
  }
}

module.exports = { launchBrowser };
