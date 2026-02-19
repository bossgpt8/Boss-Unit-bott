import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import settings from '../settings.js';
import isOwnerOrSudo from '../lib/isOwner.js';

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function hasGitRepo() {
    const gitDir = path.join(process.cwd(), '.git');
    if (!fs.existsSync(gitDir)) return false;
    try {
        await run('git --version');
        return true;
    } catch {
        return false;
    }
}

async function updateViaGit() {
    const oldRev = (await run('git rev-parse HEAD').catch(() => 'unknown')).trim();
    await run('git fetch --all --prune');
    const newRev = (await run('git rev-parse origin/main')).trim();
    const alreadyUpToDate = oldRev === newRev;
    await run(`git reset --hard ${newRev}`);
    await run('git clean -fd');
    return { oldRev, newRev, alreadyUpToDate };
}

async function restartProcess(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '✅ Update complete! Restarting…' }, { quoted: message });
    } catch {}
    setTimeout(() => {
        process.exit(0);
    }, 500);
}

async function updateCommand(sock, chatId, senderId, mentionedJids, message, args) {
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
    const isFromMe = message.key?.fromMe || false;
    
    if (!isFromMe && !isOwner) {
        await sock.sendMessage(chatId, { text: '❌ Only bot owner can use .update' }, { quoted: message });
        return;
    }
    
    try {
        await sock.sendMessage(chatId, { text: '🔄 Updating the bot, please wait…' }, { quoted: message });
        
        if (await hasGitRepo()) {
            const { newRev, alreadyUpToDate } = await updateViaGit();
            const summary = alreadyUpToDate ? `✅ Already up to date: ${newRev}` : `✅ Updated to ${newRev}`;
            await run('npm install --no-audit --no-fund');
            await sock.sendMessage(chatId, { text: summary }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: '❌ No git repository found. Cannot update.' }, { quoted: message });
            return;
        }
        
        await restartProcess(sock, chatId, message);
    } catch (err) {
        console.error('Update failed:', err);
        await sock.sendMessage(chatId, { text: `❌ Update failed:\n${String(err.message || err)}` }, { quoted: message });
    }
}

export default updateCommand;
