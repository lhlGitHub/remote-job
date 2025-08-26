const { createClient } = require("@supabase/supabase-js");
const config = require("../config");

// 创建Supabase客户端
const supabase = createClient(config.supabase.url, config.supabase.roleKey);

// 从Supabase数据库读取岗位数据
async function loadJobs() {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200); // 增加限制，确保能获取足够的数据

    if (error) {
      console.error("从Supabase读取数据错误:", error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error("读取Supabase数据异常:", e);
    return [];
  }
}

// 保存岗位数据到Supabase数据库
async function saveJobs(jobs) {
  try {
    if (!jobs || jobs.length === 0) {
      console.log("没有新岗位数据需要保存");
      return;
    }

    console.log(`准备保存 ${jobs.length} 条岗位数据...`);

    // 使用upsert策略，避免重复键错误
    const { data, error } = await supabase
      .from("jobs")
      .upsert(jobs, {
        onConflict: "id",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error("保存到Supabase错误:", error);
      return;
    }

    console.log(`✅ 成功保存 ${data.length} 条岗位数据到Supabase`);
  } catch (e) {
    console.error("保存到Supabase异常:", e);
  }
}

// 去重：只保留新的岗位
async function filterNewJobs(currentJobs) {
  try {
    if (!currentJobs || currentJobs.length === 0) {
      console.log("没有岗位数据需要过滤");
      return [];
    }

    // 获取数据库中所有记录的ID（不限制100条，确保完整去重）
    const { data: allExistingJobs, error } = await supabase
      .from("jobs")
      .select("id")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取现有岗位失败:", error);
      return currentJobs;
    }

    const existingIds = new Set(allExistingJobs.map((job) => job.id));
    const newJobs = currentJobs.filter((job) => !existingIds.has(job.id));

    console.log(
      `过滤结果: ${currentJobs.length} -> ${newJobs.length} 条新岗位`
    );
    console.log(`数据库中现有记录数: ${existingIds.size}`);

    return newJobs;
  } catch (e) {
    console.error("过滤新岗位异常:", e);
    return currentJobs;
  }
}

// 清理旧数据：只保留最近30天的数据
async function cleanupOldJobs() {
  try {
    // 计算30天前的时间
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTime = thirtyDaysAgo.toISOString();

    console.log(`开始清理30天前的旧数据...`);
    console.log(`清理时间点: ${cutoffTime}`);

    // 获取总数据量
    const { count: totalCount, error: countError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("获取数据总数失败:", countError);
      return;
    }

    console.log(`当前数据库记录数: ${totalCount}`);

    // 统计30天前的记录数量
    const { count: oldCount, error: oldCountError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .lt("created_at", cutoffTime);

    if (oldCountError) {
      console.error("统计旧记录数量失败:", oldCountError);
      return;
    }

    if (oldCount === 0) {
      console.log("没有30天前的旧数据需要清理");
      return;
    }

    console.log(`发现 ${oldCount} 条30天前的旧数据，开始清理...`);

    // 删除30天前的旧数据
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .lt("created_at", cutoffTime);

    if (deleteError) {
      console.error("清理旧数据失败:", deleteError);
      return;
    }

    // 验证清理结果
    const { count: newCount, error: verifyError } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    if (verifyError) {
      console.error("验证清理结果失败:", verifyError);
      return;
    }

    console.log(
      `🧹 清理完成！从 ${totalCount} 条清理到 ${newCount} 条，删除了 ${oldCount} 条旧数据`
    );

    // 显示剩余数据的时间范围
    if (newCount > 0) {
      const { data: timeRangeData } = await supabase
        .from("jobs")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1);

      if (timeRangeData && timeRangeData.length > 0) {
        const newestTime = new Date(timeRangeData[0].created_at);
        const oldestTime = new Date(cutoffTime);
        console.log(
          `📅 剩余数据时间范围: ${oldestTime.toLocaleDateString()} 至 ${newestTime.toLocaleDateString()}`
        );
      }
    }
  } catch (e) {
    console.error("清理旧数据异常:", e);
  }
}

module.exports = {
  loadJobs,
  saveJobs,
  filterNewJobs,
  cleanupOldJobs,
};
