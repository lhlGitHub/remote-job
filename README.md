# Remote Job Bot

一个自动爬取和推送远程工作职位的 Telegram 机器人，支持从多个平台抓取职位信息并通过 Telegram 实时推送。

## ✨ 功能特性

- 🕷️ **多平台爬取**：支持从 BOSS 直聘、电鸭、V2EX、远程.work 等多个平台抓取远程职位
- 📱 **Telegram 推送**：新职位自动推送到 Telegram 频道/群组
- 💾 **数据持久化**：使用 Supabase 存储职位数据，支持去重和历史查询
- 🔄 **自动去重**：智能识别已存在的职位，避免重复推送
- 🧹 **自动清理**：定期清理 30 天前的旧数据，保持数据库整洁
- ⏰ **定时任务**：支持通过 cron 定时执行爬取任务
- 🌐 **代理支持**：本地开发时可配置代理，生产环境自动禁用

## 📋 支持的平台

- **BOSS 直聘** - 国内主流招聘平台
- **电鸭 (eleduck.com)** - 专注远程工作的社区
- **V2EX** - 技术社区远程工作板块
- **远程.work** - 远程工作职位聚合平台

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- pnpm (推荐) 或 npm

### 安装依赖

```bash
pnpm install
# 或
npm install
```

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram 配置
TELEGRAM_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# 本地开发配置（可选）
LOCAL=true  # 设置为 true 时启用代理
```

### 数据库初始化

执行数据库迁移脚本：

```bash
# 在 Supabase SQL Editor 中执行
cat database/schema.sql
```

### 运行项目

```bash
# 本地运行
pnpm start

# 或使用 PM2 运行
pm2 start ecosystem.config.js
```

## 📁 项目结构

```
remote-job-bot-node/
├── api/                 # API 接口（用于 Vercel/Serverless）
│   └── cron.js         # Cron 任务入口
├── crawlers/           # 爬虫模块
│   ├── boss.js        # BOSS直聘爬虫
│   ├── eleduck.js     # 电鸭爬虫
│   ├── v2ex.js        # V2EX 爬虫
│   └── yuancheng.js   # 远程.work 爬虫
├── database/           # 数据库相关
│   ├── schema.sql     # 数据库表结构
│   └── migrate.sql    # 数据库迁移脚本
├── utils/              # 工具函数
│   ├── crawler.js     # 浏览器启动工具
│   ├── extractFieldsByRegex.js  # 字段提取工具
│   ├── storage.js     # Supabase 存储操作
│   └── telegram.js    # Telegram Bot 操作
├── config.js          # 配置文件
├── index.js           # 主入口文件
└── package.json       # 项目依赖
```

## 🔧 配置说明

### Supabase 配置

1. 在 Supabase 控制台创建项目
2. 获取项目 URL 和 Service Role Key
3. 执行 `database/schema.sql` 创建数据表
4. 配置 RLS 策略（已在 schema.sql 中包含）

### Telegram Bot 配置

1. 在 Telegram 中搜索 `@BotFather`
2. 创建新机器人并获取 Token
3. 获取频道/群组的 Chat ID（可通过 `@userinfobot` 获取）
4. 将机器人添加到频道/群组并授予管理员权限

**⚠️ 重要提示：隐私群组问题**

如果群组设置为隐私后出现 `chat not found` 错误：
- **推荐方案**：使用频道（Channel）而不是群组，频道更适合机器人推送
- **替代方案**：确保机器人已添加到隐私群组并授予发送消息权限
- 详细解决方案请参考 [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md)

### 代理配置

本地开发时如需使用代理：

```env
LOCAL=true
```

默认代理地址：`http://127.0.0.1:7890`（可在 `utils/telegram.js` 中修改）

## 📊 数据模型

### Jobs 表结构

```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,           -- 职位唯一标识（通常为 URL）
  title TEXT NOT NULL,            -- 职位标题
  company TEXT,                   -- 公司名称
  salary TEXT,                    -- 薪资范围
  tech TEXT[],                    -- 技术栈数组
  url TEXT,                       -- 职位链接
  source TEXT,                    -- 来源平台
  created_at TIMESTAMP,           -- 创建时间
  updated_at TIMESTAMP            -- 更新时间
);
```

## 🔄 工作流程

1. **启动浏览器**：使用 Puppeteer 启动无头浏览器
2. **加载已有数据**：从 Supabase 加载已存在的职位 ID
3. **并行爬取**：同时从多个平台抓取职位信息
4. **去重过滤**：过滤掉已存在的职位
5. **推送通知**：将新职位推送到 Telegram
6. **保存数据**：将新职位保存到 Supabase
7. **清理旧数据**：删除 30 天前的旧记录

## ⏰ 定时任务

### 使用 Vercel Cron

在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### 使用 PM2

```bash
pm2 start ecosystem.config.js
```

### 使用 node-cron

在代码中添加：

```javascript
const cron = require("node-cron");
cron.schedule("0 */6 * * *", () => {
  main();
});
```

## 🛠️ 开发指南

### 添加新爬虫

1. 在 `crawlers/` 目录创建新文件
2. 实现爬虫函数，接收 `browser` 和 `existingIdSet` 参数
3. 返回职位数组，格式如下：

```javascript
{
  id: "unique_id",      // 唯一标识（通常为 URL）
  title: "职位标题",
  company: "公司名",
  salary: "薪资范围",
  tech: "技术栈",
  url: "职位链接",
  source: "来源平台"
}
```

4. 在 `index.js` 中导入并调用

### 字段提取

使用 `extractFieldsByRegex` 工具从职位描述中提取技术栈和薪资信息：

```javascript
const { extractFieldsByRegex } = require("../utils/extractFieldsByRegex");
const extracted = await extractFieldsByRegex(jobContent);
// extracted.tech - 技术栈
// extracted.salary - 薪资
```

## 🐛 故障排查

### 爬虫失败

- 检查网络连接和代理配置
- 查看目标网站是否更新了页面结构
- 检查 User-Agent 是否正确设置

### Telegram 推送失败

- 验证 Token 和 Chat ID 是否正确
- 检查机器人是否被添加到频道/群组
- 查看消息格式是否符合 MarkdownV2 规范

### Supabase 连接失败

- 验证 URL 和 Service Role Key
- 检查 RLS 策略是否正确配置
- 确认网络可以访问 Supabase

## 📝 注意事项

- ⚠️ 请遵守各网站的爬虫协议（robots.txt）
- ⚠️ 合理控制爬取频率，避免对目标网站造成压力
- ⚠️ 生产环境建议使用无头浏览器（headless mode）
- ⚠️ 定期清理旧数据，避免数据库过大

## ⚖️ 免责声明

**本项目仅供个人学习、研究使用。使用者需自行承担使用本项目的所有风险和责任。**

- 本项目仅提供技术实现，不承担任何因使用本项目而产生的法律责任
- 请遵守相关网站的服务条款和使用协议
- 任何商业用途或商业行为均由使用者自行负责
- 作者不对因使用本项目而导致的任何损失或损害承担责任

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
