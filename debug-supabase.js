require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const config = require("./config");

async function debugSupabase() {
  try {
    console.log("🔍 Supabase 连接诊断开始...\n");

    // 检查配置
    console.log("📋 配置检查:");
    console.log("SUPABASE_URL:", config.supabase.url || "❌ 未设置");
    console.log(
      "SUPABASE_ROLE_KEY:",
      config.supabase.roleKey ? "✅ 已设置" : "❌ 未设置"
    );

    if (!config.supabase.url || !config.supabase.roleKey) {
      console.log("\n❌ 配置不完整，请检查 .env 文件");
      return;
    }

    // 创建客户端
    console.log("\n🔌 创建Supabase客户端...");
    const supabase = createClient(config.supabase.url, config.supabase.roleKey);

    // 检查所有表
    console.log("\n📊 检查所有表...");
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name, table_schema")
      .eq("table_schema", "public");

    if (tablesError) {
      console.log("❌ 查询表列表失败:", tablesError.message);
    } else {
      console.log("✅ 找到以下表:");
      tables.forEach((table) => {
        console.log(`   - ${table.table_schema}.${table.table_name}`);
      });
    }

    // 尝试不同的表名
    const possibleTableNames = [
      "jobs",
      "job",
      "remote_jobs",
      "remote_job",
      "positions",
      "position",
    ];

    for (const tableName of possibleTableNames) {
      console.log(`\n🔍 尝试查询表: ${tableName}`);

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName} 表查询失败:`, error.message);
        } else {
          console.log(
            `✅ ${tableName} 表查询成功，数据量: ${data ? data.length : 0}`
          );
          if (data && data.length > 0) {
            console.log(`📋 数据示例:`, data[0]);
          }
        }
      } catch (e) {
        console.log(`❌ ${tableName} 表访问异常:`, e.message);
      }
    }

    // 检查RLS策略
    console.log("\n🔐 检查RLS策略...");
    try {
      const { data: policies, error: policiesError } = await supabase
        .from("pg_policies")
        .select("*")
        .eq("tablename", "jobs");

      if (policiesError) {
        console.log("❌ 查询RLS策略失败:", policiesError.message);
      } else {
        console.log(`✅ 找到 ${policies.length} 条RLS策略:`);
        policies.forEach((policy) => {
          console.log(`   - ${policy.policyname}: ${policy.cmd}`);
        });
      }
    } catch (e) {
      console.log("❌ RLS策略检查异常:", e.message);
    }

    // 尝试原始SQL查询
    console.log("\n🔧 尝试原始SQL查询...");
    try {
      const { data: rawData, error: rawError } = await supabase.rpc(
        "exec_sql",
        { sql: "SELECT COUNT(*) as count FROM jobs" }
      );

      if (rawError) {
        console.log("❌ 原始SQL查询失败:", rawError.message);
      } else {
        console.log("✅ 原始SQL查询成功:", rawData);
      }
    } catch (e) {
      console.log("❌ 原始SQL查询异常:", e.message);
    }

    console.log("\n🎉 诊断完成！");
  } catch (error) {
    console.error("\n❌ 诊断过程中发生错误:", error);
    console.error("错误堆栈:", error.stack);
  }
}

debugSupabase();
