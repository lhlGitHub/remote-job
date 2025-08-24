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
      .limit(110);

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

    // 批量插入新岗位数据
    const { data, error } = await supabase.from("jobs").insert(jobs).select();

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
    // 检查输入是否为空
    if (!currentJobs || currentJobs.length === 0) {
      console.log("没有岗位数据需要过滤");
      return [];
    }

    // 获取数据库中前100条数据的ID
    const existingJobs = await loadJobs();

    const existingIds = new Set(existingJobs.map((job) => job.id));

    const newJobs = currentJobs.filter((job) => !existingIds.has(job.id));
    console.log("过滤前的岗位数量:", existingJobs.length);

    console.log("过滤后的新岗位:", newJobs);
    console.log(`🧹 过滤后新岗位数量: ${newJobs.length}/${currentJobs.length}`);
    return newJobs;
  } catch (e) {
    console.error("过滤新岗位异常:", e);
    return currentJobs; // 如果出错，返回所有岗位
  }
}

// 清理旧数据：只保留最新的100条
async function cleanupOldJobs() {
  try {
    // 先获取第100条记录的ID
    const { data: limitData, error: limitError } = await supabase
      .from("jobs")
      .select("id")
      .order("created_at", { ascending: false })
      .range(99, 99); // 使用range替代limit+offset

    if (limitError || !limitData || limitData.length === 0) {
      console.log("数据量不足100条，无需清理");
      return;
    }

    const limitId = limitData[0].id;

    // 先获取第100条记录的created_at时间
    const { data: timeData, error: timeError } = await supabase
      .from("jobs")
      .select("created_at")
      .eq("id", limitId)
      .single();

    if (timeError || !timeData) {
      console.error("获取时间数据失败:", timeError);
      return;
    }

    const limitTime = timeData.created_at;

    // 删除created_at早于第100条记录的所有数据
    const { error } = await supabase
      .from("jobs")
      .delete()
      .lt("created_at", limitTime);

    if (error) {
      console.error("清理旧数据错误:", error);
    } else {
      console.log("🧹 已清理旧数据，保留最新100条");
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
