// src/pairingClient.ts
import { WebSocket } from "ws";
import { botManager } from "./botManager";
import fs from "fs";
import path from "path";

const BOT_ID = process.env.BOT_ID;
const PAIRING_SERVER_URL = process.env.PAIRING_SERVER_URL || "http://localhost:5000";

if (BOT_ID) {
  const WS_URL = PAIRING_SERVER_URL.replace(/^http(s?):\/\//, "ws$1://") + `/ws?botId=${BOT_ID}`;

  console.log(`🔌 Connecting to pairing server at ${WS_URL}`);
  const ws = new WebSocket(WS_URL);

  ws.on("open", () => {
    console.log("✅ Connected to pairing server");
  });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "request_pairing_code") {
        const { phoneNumber } = msg.payload;
        console.log(`🔔 Received pairing request for ${phoneNumber} (botId: ${BOT_ID})`);

        await botManager.start(phoneNumber, true, BOT_ID);

        setTimeout(() => {
          const status = botManager.getStatus(BOT_ID);
          if (status.pairingCode) {
            fetch(`${PAIRING_SERVER_URL}/api/pair/relay`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                botId: BOT_ID,
                pairingCode: status.pairingCode,
                expiresIn: 300,
              }),
            })
              .then((res) => {
                if (res.ok) {
                  console.log("✅ Pairing code sent to pairing server");
                } else {
                  console.error("❌ Failed to relay pairing code");
                }
              })
              .catch((err) => {
                console.error("📡 Relay error:", err);
              });
          }
        }, 6000);
      }

      if (msg.type === "session_deleted") {
        botManager.logout();
      }
    } catch (e) {
      console.error("WebSocket message error:", e);
    }
  });

  ws.on("error", (err) => {
    console.error("WebSocket connection error:", err);
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket disconnected");
  });

  // === Auto-upload session after WhatsApp connects ===
  const originalStart = botManager.start;
  botManager.start = async (...args) => {
    await originalStart.apply(botManager, args);

    // Poll until status is 'online', then upload
    const uploadInterval = setInterval(() => {
      const status = botManager.getStatus(BOT_ID);
      if (status.status === "online") {
        clearInterval(uploadInterval);
        uploadSessionToPairingServer();
      }
    }, 2000);
  };

  async function uploadSessionToPairingServer() {
    const userAuthDir = path.join(process.cwd(), "session", BOT_ID);
    try {
      if (!fs.existsSync(userAuthDir)) {
        console.warn("📁 Session directory not found — skipping upload");
        return;
      }

      const credsPath = path.join(userAuthDir, "creds.json");
      if (!fs.existsSync(credsPath)) {
        console.warn("🔑 creds.json not found — skipping upload");
        return;
      }

      const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

      const keys: Record<string, any> = {};
      const keyFiles = fs.readdirSync(userAuthDir).filter((f) => f.endsWith(".key"));
      for (const file of keyFiles) {
        const keyName = path.basename(file, ".key");
        try {
          keys[keyName] = JSON.parse(
            fs.readFileSync(path.join(userAuthDir, file), "utf-8")
          );
        } catch (e) {
          console.warn(`⚠️ Failed to read key file: ${file}`);
        }
      }

      const res = await fetch(`${PAIRING_SERVER_URL}/api/session/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: BOT_ID,
          auth: { creds, keys },
        }),
      });

      if (res.ok) {
        console.log("✅ Session uploaded to pairing server");
      } else {
        console.error("❌ Session upload failed:", await res.text());
      }
    } catch (e) {
      console.error("💥 Session upload error:", e);
    }
  }
} else {
  console.warn("⚠️ BOT_ID not set — skipping pairing server integration");
}