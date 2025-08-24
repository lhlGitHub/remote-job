# 爬虫本地运行配置说明

## 问题描述

原代码使用 `chrome-aws-lambda` 包，这是为 AWS Lambda 环境设计的，在本地运行时会出现 `executablePath` 错误。

## 解决方案

代码已更新为自动检测环境，在本地运行时使用系统 Chrome，在生产环境使用 `chrome-aws-lambda`。

## 环境变量配置

### 1. 设置 Chrome 路径（推荐）

在 `.env` 文件中添加：

```bash
# macOS
CHROME_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome

# Windows
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe

# Linux
CHROME_PATH=/usr/bin/google-chrome
```

### 2. 控制浏览器模式

```bash
# 无头模式（默认，适合生产）
HEADLESS=true

# 有界面模式（适合调试）
HEADLESS=false
```

### 3. 环境设置

```bash
# 开发环境
NODE_ENV=development

# 生产环境
NODE_ENV=production
```

## 自动回退机制

如果本地 Chrome 启动失败，系统会自动回退到使用 `chrome-aws-lambda`，确保程序不会崩溃。

## 常见问题

### Q: 如何找到 Chrome 安装路径？

**macOS:**

```bash
# 查找 Chrome 应用
find /Applications -name "Google Chrome.app" -type d

# 或者使用 mdfind
mdfind -name "Google Chrome.app"
```

**Windows:**

```bash
# 通常在以下路径之一
C:\Program Files\Google\Chrome\Application\chrome.exe
C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
```

**Linux:**

```bash
# 查找 Chrome 可执行文件
which google-chrome
which chromium-browser
```

### Q: 仍然遇到权限问题？

确保 Chrome 有执行权限，并且没有沙盒限制。代码中已添加了 `--no-sandbox` 等参数来处理这些问题。

### Q: 想要调试爬虫过程？

设置 `HEADLESS=false` 环境变量，这样浏览器会以有界面的方式运行，你可以看到爬虫的执行过程。
