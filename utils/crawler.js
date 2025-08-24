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

    const chromium = require("@sparticuz/chromium");
    const puppeteerCore = require("puppeteer-core");

    // 确保 Chromium 已准备就绪
    await chromium.font(
      "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf"
    );

    return await puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }
}

module.exports = { launchBrowser };
