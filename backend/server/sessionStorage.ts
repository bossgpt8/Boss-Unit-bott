import { createClient } from "@supabase/supabase-js";
import fs from "fs-extra";
import path from "path";
import crypto from "crypto";

const supabaseUrl = process.env.SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key";
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || "your-default-32-char-key-here-12"; // Must be 32 chars
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = "whatsapp-sessions";

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text: string) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift()!, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function uploadSession(userId: string, authDir: string) {
  if (!supabaseUrl || !supabaseKey) return;
  
  const files = ["creds.json"];
  for (const file of files) {
    const filePath = path.join(authDir, userId, file);
    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath, "utf8");
      const encryptedContent = encrypt(content);
      await supabase.storage.from(BUCKET_NAME).upload(`${userId}/${file}`, Buffer.from(encryptedContent), {
        upsert: true
      });
    }
  }
}

export async function downloadSession(userId: string, authDir: string): Promise<boolean> {
  if (!supabaseUrl || !supabaseKey) return false;

  const userDir = path.join(authDir, userId);
  await fs.ensureDir(userDir);

  const { data: files } = await supabase.storage.from(BUCKET_NAME).list(userId);
  if (files && files.length > 0) {
    for (const file of files) {
      const { data } = await supabase.storage.from(BUCKET_NAME).download(`${userId}/${file.name}`);
      if (data) {
        const encryptedText = await data.text();
        const decryptedContent = decrypt(encryptedText);
        await fs.writeFile(path.join(userDir, file.name), decryptedContent);
      }
    }
    return true;
  }
  return false;
}
