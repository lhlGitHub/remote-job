# Supabase 数据库设置指南

## 1. 创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录账户
3. 创建新项目
4. 等待项目初始化完成

## 2. 获取连接信息

1. 在项目仪表板中，进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL** (例如: `https://xxxxxxxxxxxxx.supabase.co`)
   - **service_role** key (用于服务端操作)

## 3. 配置环境变量

创建 `.env` 文件（如果不存在）：

```bash
# Supabase配置
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# 其他配置
LOCAL=false
```

## 4. 创建数据库表

1. 在 Supabase 仪表板中，进入 **SQL Editor**
2. 复制 `database/schema.sql` 文件中的内容
3. 执行 SQL 脚本创建表结构

## 5. 如果遇到 RLS 策略问题

如果遇到 "new row violates row-level security policy" 错误：

1. 在 **SQL Editor** 中执行 `database/migrate.sql` 脚本
2. 或者手动更新策略：

   ```sql
   -- 删除旧策略
   DROP POLICY IF EXISTS "Allow public read access" ON jobs;
   DROP POLICY IF EXISTS "Allow authenticated insert" ON jobs;
   DROP POLICY IF EXISTS "Allow authenticated update" ON jobs;
   DROP POLICY IF EXISTS "Allow authenticated delete" ON jobs;

   -- 创建新策略
   CREATE POLICY "Allow all operations for service role" ON jobs
     FOR ALL USING (true) WITH CHECK (true);
   ```

## 6. 故障排除：查询不到数据

### 6.1 运行诊断脚本

```bash
node debug-supabase.js
```

### 6.2 常见问题检查

#### 环境变量问题

- 确保 `.env` 文件在项目根目录
- 检查环境变量名称是否正确
- 重启终端/IDE 以加载新的环境变量

#### 数据库表问题

- 确认 `jobs` 表已创建
- 检查表名拼写是否正确
- 验证表结构是否完整

#### 权限问题

- 确认使用的是 `service_role` key 而不是 `anon` key
- 检查 RLS 策略是否正确设置
- 验证 API 密钥是否有效

#### 网络问题

- 检查网络连接
- 确认 Supabase 项目状态正常
- 验证项目 URL 是否正确

### 6.3 手动验证步骤

1. **检查表是否存在**:

   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_name = 'jobs'
   );
   ```

2. **检查表结构**:

   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'jobs';
   ```

3. **检查数据**:

   ```sql
   SELECT COUNT(*) FROM jobs;
   SELECT * FROM jobs LIMIT 5;
   ```

4. **检查 RLS 策略**:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'jobs';
   ```

## 7. 安装依赖

```bash
npm install @supabase/supabase-js
```

## 8. 验证连接

运行程序测试数据库连接是否正常。

## 注意事项

- 确保 `.env` 文件已添加到 `.gitignore` 中
- 不要将真实的 API 密钥提交到代码仓库
- 在生产环境中使用环境变量或密钥管理服务
- **service_role** key 具有完整权限，请妥善保管
- 如果使用 **anon** key，需要调整 RLS 策略
