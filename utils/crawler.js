const puppeteerCore = require("puppeteer-core");
const fs = require("fs").promises;

async function launchBrowser() {
  try {
    // 尝试多个可能的 Chromium 路径
    const possiblePaths = [
      "/usr/bin/chromium", // Ubuntu/Debian
      "/usr/bin/chromium-browser", // 一些系统
      "/usr/bin/google-chrome", // Google Chrome
      "/usr/bin/google-chrome-stable", // Google Chrome Stable
      "/opt/chrome/chrome", // 一些容器环境
      "/tmp/chromium", // @sparticuz/chromium 的路径
    ];

    let executablePath;

    // 检查每个路径是否存在
    for (const path of possiblePaths) {
      try {
        await fs.access(path);
        executablePath = path;
        console.log("Found browser at:", path);
        break;
      } catch (error) {
        // 路径不存在，继续尝试下一个
        console.log("Path not found:", path);
      }
    }

    if (!executablePath) {
      // 如果都没找到，尝试使用 which 命令查找
      try {
        const { execSync } = require("child_process");
        const result = execSync(
          "which chromium chromium-browser google-chrome | head -1",
          {
            encoding: "utf-8",
            timeout: 5000,
          }
        ).trim();

        if (result) {
          executablePath = result;
          console.log("Found browser via which:", result);
        }
      } catch (error) {
        console.log("which command failed:", error.message);
      }
    }

    if (!executablePath) {
      throw new Error("No Chromium browser found in known locations");
    }

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
      executablePath,
      headless: "new",
    });
  } catch (error) {
    console.error("Browser launch failed:", error);
    throw new Error(`浏览器启动失败: ${error.message}`);
  }
}

module.exports = { launchBrowser };
