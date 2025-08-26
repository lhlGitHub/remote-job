module.exports = {
  apps: [
    {
      name: "remote-job", // 进程名字
      script: "./index.js", // 要运行的脚本
      interpreter: "/usr/bin/node", // Node 路径，用 which node 确认
      autorestart: false, // 执行完就退出，不自动重启
      watch: false, // 不需要热重载
      cron_restart: "0 */4 * * *", // 每 4 小时执行一次
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
