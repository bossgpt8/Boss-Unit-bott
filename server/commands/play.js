// play.ts (updated for youtube-dl-exec)
import ytdl from 'youtube-dl-exec';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';

export default async function playCommand(sock, chatId, senderId, mentionedJids, message, args) {
  try {
    const searchQuery = args?.join(' ')?.trim();
    if (!searchQuery) {
      return await sock.sendMessage(chatId, {
        text: "🎵 What song do you want to download?\n\nUsage: .play <song name>"
      }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
      text: "🎧 Processing your request..."
    }, { quoted: message });

    // Search and get metadata
    const result = await ytdl(`ytsearch1:${searchQuery}`, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
    });

    if (!result || !result.url) {
      return await sock.sendMessage(chatId, { text: "❌ No video found." }, { quoted: message });
    }

    const { title, duration_string: duration, view_count: views, uploader: author, thumbnail } = result;

    const metadataMsg = `🎧 *AUDIO DOWNLOADER* 🎶

• *Title   : ${title}*
• *Duration: ${duration}*
• *Views   : ${views}*
• *Author   : ${author}*
• *Status   : Downloading...*

🔥 [Click here for thumbnail](${thumbnail})

> *© Powered by Boss Bot*`;

    await sock.sendMessage(chatId, {
      text: metadataMsg,
      linkPreview: true
    }, { quoted: message });

    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-');
    const filePath = join(tmpdir(), `${safeTitle}.mp3`);

    // Download audio
    await ytdl(result.url, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: filePath,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
    });

    const stats = await import('fs').then(fs => fs.promises.stat(filePath));
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 100) {
      await sock.sendMessage(chatId, {
        document: { url: filePath },
        mimetype: "audio/mpeg",
        fileName: `${safeTitle}.mp3`,
        caption: `*${title}*\n\n> View updates here: 120363426051727952@newsletter`
      }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
        caption: "> View updates here: 120363426051727952@newsletter"
      }, { quoted: message });
    }

    // Cleanup
    await unlink(filePath).catch(() => {});

  } catch (error) {
    console.error('YT-DLP Error:', error);
    await sock.sendMessage(chatId, { text: "❌ Download failed." }, { quoted: message });
  }
}