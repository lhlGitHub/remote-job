-- 迁移脚本：更新行级安全策略
-- 在Supabase SQL Editor中执行此脚本

-- 删除旧的策略
DROP POLICY IF EXISTS "Allow public read access" ON jobs;
DROP POLICY IF EXISTS "Allow authenticated insert" ON jobs;
DROP POLICY IF EXISTS "Allow authenticated update" ON jobs;
DROP POLICY IF EXISTS "Allow authenticated delete" ON jobs;

-- 创建新的策略：允许所有操作（因为使用service_role key）
CREATE POLICY "Allow all operations for service role" ON jobs
  FOR ALL USING (true) WITH CHECK (true);

-- 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'jobs'; 