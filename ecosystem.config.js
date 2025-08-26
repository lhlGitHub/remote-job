module.exports = {
  apps: [
    {
      name: "remote-job",
      script: "./index.js",
      interpreter: "/usr/bin/node",
      autorestart: true, // ✅ 保持进程存活
      watch: false,
      cron_restart: "0 */4 * * *", // 每 4 小时重启一次
      env: {
        NODE_ENV: "production",
        LOCAL: "false",
      },
    },
  ],
};
