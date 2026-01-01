const { spawn } = require('child_process');
const path = require('path');

// Resolve module-alias path to ensure it works from any directory
const MODULE_ALIAS_PATH = require.resolve('module-alias/register');

function startProcess(name, command, args) {
    console.log(`🚀 Starting ${name}...`);
    const child = spawn(command, args, {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..') // Run from backend root
    });

    child.on('error', (err) => {
        console.error(`❌ Failed to start ${name}:`, err);
        process.exit(1);
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            console.error(`🛑 Process ${name} exited with code ${code}. Shutting down container to trigger restart.`);
            process.exit(code || 1);
        }
    });
}

// Start API Server
startProcess('API', 'node', ['-r', MODULE_ALIAS_PATH, 'src/server.js']);

// Start Background Worker
// Use 8GB heap for worker to handle large AI models/PDFs
startProcess('WORKER', 'node', ['-r', MODULE_ALIAS_PATH, '--max-old-space-size=8192', 'src/shared/messaging/workers/unified.worker.js']);
