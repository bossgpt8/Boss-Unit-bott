#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, '..', 'server', 'commands');
const helpPath = path.join(commandsDir, 'help.js');

function normalizeCmdToFile(cmd) {
  // Remove leading dot and whitespace
  let name = cmd.replace(/^\./, '').trim();
  // Unicode normalize then strip diacritics
  name = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  // Keep only ascii letters, numbers, underscore, dash
  name = name.replace(/[^A-Za-z0-9_-]+/g, '');
  name = name.toLowerCase();
  if (!name) name = 'cmd_' + Math.random().toString(36).slice(2, 8);
  return name + '.js';
}

function createStub(fileName, originalCmd) {
  const base = path.basename(fileName, '.js');
  const funcName = base.replace(/[^A-Za-z0-9]/g, '') + 'Command';
  const content = `// Auto-generated stub for ${originalCmd}
// TODO: Implement command behavior

async function ${funcName}(sock, chatId, senderId, mentionedJids, message, args) {
  try {
    await sock.sendMessage(chatId, { text: 'Command ${originalCmd} is not implemented yet.' }, { quoted: message });
  } catch (err) {
    console.error('${base} command error:', err);
  }
}

module.exports = ${funcName};
`;
  fs.writeFileSync(path.join(commandsDir, fileName), content, { flag: 'wx' });
}

try {
  const helpContent = fs.readFileSync(helpPath, 'utf8');
  const listed = (helpContent.match(/\.[^\s\*\n\<\(\),]+/g) || []).map(c => c.replace(/[.,()<>|]+$/g, '').trim());

  const created = [];
  const skipped = [];

  for (const cmd of listed) {
    const fileName = normalizeCmdToFile(cmd);
    const filePath = path.join(commandsDir, fileName);
    if (fs.existsSync(filePath)) {
      skipped.push({ cmd, file: fileName });
      continue;
    }
    try {
      createStub(fileName, cmd);
      created.push({ cmd, file: fileName });
    } catch (e) {
      // if file already exists (race), skip
      skipped.push({ cmd, file: fileName, error: e.message });
    }
  }

  console.log('Create missing commands complete.');
  console.log('Created:', created.length);
  created.slice(0, 200).forEach(c => console.log(`  - ${c.cmd} -> server/commands/${c.file}`));
  if (skipped.length) {
    console.log('Skipped (already exist or failed):', skipped.length);
    skipped.slice(0, 50).forEach(s => console.log(`  - ${s.cmd} -> ${s.file}${s.error ? ' (' + s.error + ')' : ''}`));
  }
} catch (e) {
  console.error('Error creating missing commands:', e.message);
  process.exit(2);
}
