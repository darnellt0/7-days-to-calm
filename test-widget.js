#!/usr/bin/env node
// Runtime verification replaces the old source-string assertions.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const frontend = path.join(__dirname, 'em-frontend');
if (!fs.existsSync(path.join(frontend, '.next', 'BUILD_ID'))) {
  console.error('Run npm run build from em-frontend before browser verification.');
  process.exit(1);
}
const result = spawnSync(process.execPath, [path.join(frontend, 'node_modules', '@playwright', 'test', 'cli.js'), 'test'], {
  cwd: frontend, stdio: 'inherit',
});
process.exit(result.status ?? 1);
