const puppeteerCore = require("puppeteer-core");

async function launchBrowser() {
  const isLocal =
    process.env.NODE_ENV !== "production" &&
    !process.env.AWS_LAMBDA_FUNCTION_NAME;

  if (isLocal) {
    // 本地环境
    const puppeteer = require("puppeteer");
    return await puppeteer.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: false,
      defaultViewport: null,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } else {
    // 生产环境 (Vercel)
    return await puppeteer.launch({
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: chrome.headless,
      ignoreHTTPSErrors: true,
    });
  }
}

module.exports = { launchBrowser };
