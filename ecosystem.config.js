module.exports = {
  apps: [
    {
      name: "remote-job",
      script: "./index.js",
      interpreter: "/usr/bin/node",
      autorestart: false, // ✅ 执行完退出，不循环
      watch: false,
      cron_restart: "0 */4 * * *", // 每 4 小时执行一次
      env: {
        NODE_ENV: "production",
        LOCAL: "false",
      },
    },
  ],
};
