const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "../data/jobs.json");

// 读取 JSON 数据
function loadJobs() {
  try {
    if (!fs.existsSync(dataFile)) return [];
    const content = fs.readFileSync(dataFile, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error("读取 jobs.json 错误", e);
    return [];
  }
}

// 写入 JSON 数据
function saveJobs(jobs) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(jobs, null, 2));
  } catch (e) {
    console.error("写入 jobs.json 错误", e);
  }
}

// 去重：只保留新的岗位
function filterNewJobs(currentJobs, oldJobs) {
  const oldIds = new Set(oldJobs.map((job) => job.id));
  return currentJobs.filter((job) => !oldIds.has(job.id));
}

module.exports = {
  loadJobs,
  saveJobs,
  filterNewJobs,
};
