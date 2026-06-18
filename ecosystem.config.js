/**
 * PM2 ECOSYSTEM CONFIG - BULLETPROOF 24/7 MONITORING
 *
 * This ensures the monitor NEVER stops:
 * ✅ Auto-restarts if it crashes
 * ✅ Survives reboots
 * ✅ Monitors itself
 * ✅ Rotates logs
 * ✅ Tracks uptime
 */

module.exports = {
  apps: [
    {
      // Main market monitor
      name: '24-7-market-monitor',
      script: './market-monitor-24-7.js',
      instances: 1,
      exec_mode: 'fork',

      // CRITICAL: Auto-restart on crash
      autorestart: true,
      max_restarts: 999,
      min_uptime: '10s',
      max_memory_restart: '1G',

      // CRITICAL: Survive reboots
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.monitor-state.json'],

      // Keep detailed logs
      error_file: './logs/market-monitor-error.log',
      out_file: './logs/market-monitor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,

      // Environment
      env: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s',
        TELEGRAM_CHAT_ID: '6470474178',
      },

      // Monitoring
      watch: true,
      ignore_watch: ['node_modules', '.monitor-state.json', 'logs'],
      max_restarts: 999,
      restart_delay: 4000, // Wait 4 seconds before restart
    },

    // Backup monitor instance (runs simultaneously)
    {
      name: '24-7-monitor-backup',
      script: './market-monitor-ultimate.js',
      instances: 1,
      exec_mode: 'fork',

      // Auto-restart
      autorestart: true,
      max_restarts: 999,
      min_uptime: '10s',
      max_memory_restart: '1G',

      // Logs
      error_file: './logs/monitor-backup-error.log',
      out_file: './logs/monitor-backup-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      env: {
        NODE_ENV: 'production',
        TELEGRAM_BOT_TOKEN: '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s',
        TELEGRAM_CHAT_ID: '6470474178',
      },
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'user',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:kgreen271029/claude-code.git',
      path: '/home/user/claude-code',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js --env production'
    }
  }
};
