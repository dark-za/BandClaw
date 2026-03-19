// ═══════════════════════════════════════════════════════════════
//  🐺 BandClaw — PM2 Ecosystem Configuration
//  Manages the bot 24/7 with automatic restart and log rotation
// ═══════════════════════════════════════════════════════════════

const path = require('path');

module.exports = {
  apps: [
    {
      // ─── Process Identity ───────────────────────────────────
      name: 'bandclaw',
      script: 'dist/index.js',
      cwd: __dirname,

      // ─── Execution ──────────────────────────────────────────
      interpreter: 'node',
      node_args: '--enable-source-maps',
      instances: 1,
      exec_mode: 'fork',

      // ─── Environment ───────────────────────────────────────
      env: {
        NODE_ENV: 'production',
      },

      // ─── Restart Policy ─────────────────────────────────────
      autorestart: true,
      watch: false,
      max_restarts: 15,
      min_uptime: '10s',
      restart_delay: 5000,
      max_memory_restart: '500M',
      kill_timeout: 8000,
      wait_ready: false,

      // ─── Logs ───────────────────────────────────────────────
      error_file: path.join(__dirname, 'logs', 'error.log'),
      out_file: path.join(__dirname, 'logs', 'out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      // ─── Crash Recovery ─────────────────────────────────────
      exp_backoff_restart_delay: 1000,

      // ─── Source Map Support ─────────────────────────────────
      source_map_support: true,
    },

    // ─── Alternative: Development via tsx (uncomment to use) ─
    // {
    //   name: 'bandclaw-dev',
    //   script: 'node_modules/.bin/tsx',
    //   args: 'src/index.ts',
    //   cwd: __dirname,
    //   interpreter: 'none',
    //   instances: 1,
    //   autorestart: true,
    //   watch: ['src'],
    //   watch_delay: 1000,
    //   ignore_watch: ['node_modules', 'dist', 'logs', '*.db'],
    //   env: {
    //     NODE_ENV: 'development',
    //   },
    //   error_file: path.join(__dirname, 'logs', 'dev-error.log'),
    //   out_file: path.join(__dirname, 'logs', 'dev-out.log'),
    //   log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    //   merge_logs: true,
    // },
  ],
};
