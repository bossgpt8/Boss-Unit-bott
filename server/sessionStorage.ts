import { createClient } from "@supabase/supabase-js";
import fs from "fs-extra";
import path from "path";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = "whatsapp-sessions";

export async function uploadSession(userId: string, authDir: string) {
  if (!supabaseUrl || !supabaseKey) return;
  
  const files = ["creds.json"]; // Basic multi-file auth might have more, but creds is core
  for (const file of files) {
    const filePath = path.join(authDir, userId, file);
    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath);
      await supabase.storage.from(BUCKET_NAME).upload(`${userId}/${file}`, content, {
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
        const buffer = Buffer.from(await data.arrayBuffer());
        await fs.writeFile(path.join(userDir, file.name), buffer);
      }
    }
    return true;
  }
  return false;
}
