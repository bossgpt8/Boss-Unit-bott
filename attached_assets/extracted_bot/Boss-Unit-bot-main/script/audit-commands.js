#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const commandsDir = path.join(__dirname, '..', 'server', 'commands');
const outPath = path.join(__dirname, '..', 'data', 'command-audit.json');

const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));
const results = [];

for (const f of files) {
  const full = path.join(commandsDir, f);
  const entry = { file: f, syntax: 'OK', require: 'OK', exportType: 'unknown', error: null };
  try {
    execSync(`node -c "${full.replace(/"/g, '\\"')}"`, { stdio: 'ignore' });
  } catch (e) {
    entry.syntax = 'SYNTAX_ERROR';
    entry.error = e.message.split('\n')[0];
    results.push(entry);
    continue;
  }

  try {
    // Clear cache & require
    delete require.cache[require.resolve(full)];
    const mod = require(full);
    if (typeof mod === 'function') entry.exportType = 'function';
    else if (mod && typeof mod === 'object') {
      entry.exportType = Object.keys(mod).length ? 'object' : 'empty_object';
      if (typeof mod.execute === 'function') entry.exportType = 'execute_method';
    } else entry.exportType = typeof mod;
  } catch (e) {
    entry.require = 'REQUIRE_ERROR';
    entry.error = e.message.split('\n')[0];
  }
  results.push(entry);
}

const summary = {
  checked: results.length,
  syntaxErrors: results.filter(r => r.syntax !== 'OK').length,
  requireErrors: results.filter(r => r.require !== 'OK').length,
  suspiciousExports: results.filter(r => r.exportType === 'empty_object' || r.exportType === 'unknown').map(r => r.file),
  details: results,
  timestamp: new Date().toISOString(),
};

try {
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log('Audit complete. Report written to', outPath);
  console.log(`Checked: ${summary.checked}, Syntax errors: ${summary.syntaxErrors}, Require errors: ${summary.requireErrors}`);
  process.exit(0);
} catch (e) {
  console.error('Failed to write report:', e.message);
  process.exit(2);
}
