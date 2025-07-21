module.exports = {
  apps: [
    {
      name: 'olx-monitor',
      script: 'olx-scraper-intelligent.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      cron_restart: '0 2 * * *', // Restart every day at 2 AM
      max_restarts: 10,
      min_uptime: '60s'
    }
  ]
};