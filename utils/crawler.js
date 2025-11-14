const puppeteer = require("puppeteer");

async function launchBrowser() {
  const IS_LOCAL = process.env.LOCAL === "true";
  const browser = await puppeteer.launch({
    executablePath: IS_LOCAL
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "/usr/bin/chromium-browser",  // <- 指向系统 Chromium
    headless: IS_LOCAL ? false : "new",
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browser;
}

module.exports = { launchBrowser };
