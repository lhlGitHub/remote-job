-- 创建jobs表
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  salary TEXT,
  tech TEXT[],
  url TEXT,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);

-- 启用行级安全策略（RLS）
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 1. 查看当前RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'jobs';

-- 2. 删除可能有问题的策略
DROP POLICY IF EXISTS "Allow public read access" ON jobs;
DROP POLICY IF EXISTS "Allow authenticated insert" ON jobs;
DROP POLICY IF EXISTS "Allow authenticated update" ON jobs;
DROP POLICY IF EXISTS "Allow authenticated delete" ON jobs;
DROP POLICY IF EXISTS "Allow all operations for service role" ON jobs;

-- 3. 创建新的策略：允许service_role key进行所有操作
CREATE POLICY "Allow all operations for service role" ON jobs
  FOR ALL USING (true) WITH CHECK (true);

-- 4. 验证策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'jobs';

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 