// Travel guide server launcher
// - Cleans port 3000 leftovers (avoids EADDRINUSE)
// - Opens browser invisibly (no flashing cmd window)
// - Starts the actual server in this same process so all logs appear in ONE window
// - Designed to be launched by start.bat (keeps cmd window open via pause)

const { exec } = require('child_process');

function runHidden(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { windowsHide: true }, () => resolve());
  });
}

function killPort3000() {
  return new Promise((resolve) => {
    exec('netstat -ano', { windowsHide: true }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      const pids = [...new Set(
        stdout.split(/\r?\n/)
          .filter((line) => line.includes(':3000') && line.includes('LISTENING'))
          .map((line) => line.trim().split(/\s+/).pop())
          .filter((p) => p && /^\d+$/.test(p))
      )];
      if (pids.length === 0) return resolve([]);
      console.log('[cleanup] killing old process on port 3000: pid=' + pids.join(','));
      exec(
        `taskkill /F ${pids.map((p) => '/PID ' + p).join(' ')}`,
        { windowsHide: true },
        () => resolve(pids)
      );
    });
  });
}

(async () => {
  console.log('============================================================');
  console.log('  Travel guide server');
  console.log('  Dir: ' + __dirname);
  console.log('  Keep this window OPEN. Close it to stop the server.');
  console.log('============================================================');
  console.log('');

  await killPort3000();

  // Open browser after server has a moment to listen (no visible cmd window)
  setTimeout(() => {
    console.log('[browser] opening http://localhost:3000');
    runHidden('start "" "http://localhost:3000"');
  }, 2500);

  console.log('[server] starting...');
  console.log('');
  try {
    // Start the actual server in this same process so all logs appear here
    require('./index.js');
  } catch (e) {
    console.error('[FATAL] failed to start server:', e && (e.stack || e.message));
    process.exit(1);
  }
})();
