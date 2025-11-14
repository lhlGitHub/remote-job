# Telegram Bot 配置指南

## 问题排查：隐私群组发送失败

如果遇到 `Bad Request: chat not found` 错误，通常是因为群组设置为隐私后，机器人无法访问。

## 解决方案

### 方案 1：使用频道（Channel）⭐ 推荐

**频道比群组更适合机器人推送消息：**

1. 创建一个新的 Telegram 频道（Channel）
2. 将机器人添加为频道管理员
3. 获取频道 Chat ID：
   - 将频道设置为公开，使用 `@your_channel_name` 作为 Chat ID
   - 或使用 `@userinfobot` 获取数字 Chat ID
4. 更新环境变量 `TELEGRAM_CHAT_ID`

**优点：**
- ✅ 频道专为机器人推送设计
- ✅ 不需要处理隐私设置
- ✅ 支持公开和私有频道
- ✅ 更好的消息推送性能

### 方案 2：修复隐私群组访问

如果必须使用群组，请按以下步骤操作：

#### 步骤 1：确保机器人已添加到群组

1. 打开群组设置
2. 点击"添加成员"
3. 搜索你的机器人（通过 @BotFather 创建时获得的用户名）
4. 添加机器人到群组

#### 步骤 2：授予机器人发送消息权限

1. 在群组中，点击机器人
2. 选择"管理员权限"或"权限设置"
3. 确保机器人有"发送消息"权限
4. 如果群组是隐私的，确保机器人有"发布消息"权限

#### 步骤 3：验证 Chat ID

1. 在群组中发送任意消息
2. 使用 `@userinfobot` 获取群组的 Chat ID
3. 更新环境变量 `TELEGRAM_CHAT_ID`

**注意：** 隐私群组的 Chat ID 通常是负数，例如：`-1001234567890`

#### 步骤 4：测试机器人访问

运行以下命令测试机器人是否可以访问群组：

```javascript
// 在 Node.js 中运行
const { verifyChatAccess } = require('./utils/telegram');
verifyChatAccess(process.env.TELEGRAM_CHAT_ID).then(console.log);
```

## 常见错误及解决方案

### 错误 1: `Bad Request: chat not found`

**原因：**
- 机器人未被添加到群组/频道
- Chat ID 不正确
- 群组是隐私的且机器人没有权限

**解决：**
1. 确保机器人已添加到群组/频道
2. 验证 Chat ID 是否正确
3. 授予机器人发送消息权限

### 错误 2: `Forbidden: bot is not a member of the group chat`

**原因：**
- 机器人被移除了群组
- 群组被删除或解散

**解决：**
1. 重新添加机器人到群组
2. 或切换到新的群组/频道

### 错误 3: `Forbidden: bot was blocked by the user`

**原因：**
- 机器人被用户屏蔽（仅适用于私聊）

**解决：**
- 此错误通常不会出现在群组/频道中

## 最佳实践

1. **使用频道而不是群组** - 频道专为机器人推送设计
2. **使用公开频道** - 如果可能，使用 `@channel_name` 格式的 Chat ID
3. **定期验证访问** - 定期检查机器人是否仍在群组/频道中
4. **监控错误日志** - 及时处理发送失败的消息

## 获取 Chat ID 的方法

### 方法 1：使用 @userinfobot

1. 在 Telegram 中搜索 `@userinfobot`
2. 将机器人添加到你的群组/频道
3. 在群组/频道中发送任意消息
4. `@userinfobot` 会回复 Chat ID

### 方法 2：使用 API

```javascript
// 获取机器人的更新
const updates = await bot.getUpdates();
// 查找群组消息
const chatId = updates.find(u => u.message?.chat?.id)?.message?.chat?.id;
```

### 方法 3：临时代码

在群组中发送消息后，运行：

```javascript
bot.on('message', (msg) => {
  console.log('Chat ID:', msg.chat.id);
});
```

## 环境变量配置

```env
# Telegram Bot Token（从 @BotFather 获取）
TELEGRAM_TOKEN=your_bot_token

# Chat ID（群组/频道 ID）
# 可以是数字 ID（如：-1001234567890）
# 或频道用户名（如：@your_channel_name）
TELEGRAM_CHAT_ID=your_chat_id
```

## 测试配置

运行测试脚本验证配置：

```bash
node -e "
const { verifyChatAccess } = require('./utils/telegram');
verifyChatAccess(process.env.TELEGRAM_CHAT_ID)
  .then(result => {
    if (result.success) {
      console.log('✅ 配置正确！机器人可以访问群组/频道');
      console.log('Chat 信息:', result.chat);
    } else {
      console.error('❌ 配置错误:', result.error);
    }
  });
"
```


