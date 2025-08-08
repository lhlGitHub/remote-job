function extractSalarySentence(content) {
  // 匹配包含薪资信息的整句
  const salaryPattern =
    /(?:薪资|薪水|工资)[：:\s]*([^\n。；;]+?(?:\d{1,3}k\s*[–\-～—至到]\s*\d{1,3}k|\d{1,3}k)[^\n。；;]*)/i;

  const match = content.match(salaryPattern);
  if (match) {
    // 返回匹配到的整句，去掉前后的空白字符
    return match[1].trim();
  }

  return "";
}
function extractFieldsByRegex(content) {
  const techKeywords = [
    "JavaScript",
    "TypeScript",
    "Vue",
    "React",
    "Angular",
    "Node.js",
    "Python",
    "Java",
    "Go",
    "PHP",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "Kubernetes",
    "AWS",
    "Redis",
    "Linux",
    "Flutter",
    "iOS",
    "Android",
  ];

  // 技术提取：根据关键词判断（大小写不敏感）
  const tech = techKeywords.filter((kw) =>
    content.toLowerCase().includes(kw.toLowerCase())
  );

  // 薪资提取：匹配 15k-30k / 月 or 年薪 or 美元等
  const salaryMatch = extractSalarySentence(content);

  // 要求提取：找出“任职要求”、“岗位要求”、“你需要”、“我们希望你”这些引导词后面的内容
  const requirementMatch = content.match(
    /(任职要求|岗位要求|你需要|我们希望你)[\s\S]{0,500}/i
  );

  let requirements = [];
  if (requirementMatch) {
    const raw = requirementMatch[0];
    // 尝试按中英文的换行、数字或符号分条
    requirements = raw
      .split(/[\n•\-–·\d\.]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 5 && line.length < 200);
  }

  return {
    tech: tech.join(", "),
    salary: salaryMatch || "",
    requirements,
  };
}

module.exports = {
  extractFieldsByRegex,
};
