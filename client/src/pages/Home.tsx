import { CyberLayout } from "@/components/CyberLayout";
import { Terminal } from "@/components/Terminal";
import { StatusCard } from "@/components/StatusCard";
import { useBotStatus, useBotLogs, useBotAction } from "@/hooks/use-bot";
import { Power, RotateCcw, LogOut, Play, Smartphone, Shield, Trash2 } from "lucide-react";
import QRCode from "react-qr-code";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  const { data: status, isLoading: statusLoading } = useBotStatus();
  const { data: logs, isLoading: logsLoading } = useBotLogs();
  const { mutate: executeAction, isPending } = useBotAction();
  const [phone, setPhone] = useState("");

  // Defensive fallback
  const botStatus = status?.status || "offline";
  const isOnline = botStatus === "online";

  return (
    <CyberLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">System Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-white">
              BOSS COMMAND
            </h1>
            <p className="text-muted-foreground font-medium mt-2 max-w-lg">
              Next-generation WhatsApp automation interface. Monitor performance, manage links, and control bot operations from a single unified workspace.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => executeAction({ action: "start" })}
              disabled={isPending || botStatus === "online" || botStatus === "starting"}
              className="cyber-button flex items-center justify-center gap-2 group px-8"
            >
              <Play className="w-5 h-5 group-hover:fill-current" />
              Initialize
            </button>
            <button
              onClick={() => executeAction({ action: "logout" })}
              disabled={isPending || !isOnline}
              className="cyber-button border-red-500/50 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Terminate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <StatusCard 
              status={botStatus} 
              qr={status?.qr || null} 
              pairingCode={status?.pairingCode || null}
              uptime={status?.uptime || 0} 
            />
            
            {!isOnline && botStatus !== "starting" && (
              <div className="cyber-card p-6 border-primary/20 bg-primary/5">
                <h3 className="text-xl mb-6 text-primary flex items-center gap-2 font-display font-bold">
                  <Smartphone className="w-5 h-5" /> 
                  LINK YOUR DEVICE
                </h3>
                <Tabs defaultValue="qr" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/20 border border-white/5 p-1 rounded-xl">
                    <TabsTrigger value="qr" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">QR AUTH</TabsTrigger>
                    <TabsTrigger value="pairing" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">PAIRING CODE</TabsTrigger>
                  </TabsList>
                  <TabsContent value="qr" className="pt-8 text-center flex flex-col items-center justify-center">
                    {botStatus === "starting" && !status?.qr ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-primary text-sm font-bold uppercase tracking-widest animate-pulse">Connecting to WhatsApp...</p>
                        <p className="text-muted-foreground text-xs">This may take 10-15 seconds</p>
                      </div>
                    ) : status?.qr ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-2xl shadow-primary/20">
                          <QRCode value={status.qr} size={192} level="L" />
                        </div>
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">Scan with WhatsApp</p>
                        <p className="text-[10px] text-muted-foreground">Open WhatsApp → Linked Devices → Link a Device → Scan this QR</p>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                          <Smartphone className="w-10 h-10 text-primary/50" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-sm">Click below to generate a QR code for linking</p>
                        </div>
                        <button
                          onClick={() => executeAction({ action: "start" })}
                          disabled={isPending}
                          className="cyber-button px-10 py-3 text-lg font-bold"
                        >
                          {isPending ? (
                            <span className="flex items-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Connecting...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Play className="w-5 h-5" />
                              Generate QR Code
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="pairing" className="pt-8 space-y-4">
                    {(botStatus === "starting" || botStatus === "offline") && !status?.pairingCode ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-primary text-sm font-bold uppercase tracking-widest animate-pulse">Generating Pairing Code...</p>
                        <p className="text-muted-foreground text-xs">Connecting to WhatsApp servers...</p>
                        {botStatus === "offline" && (
                          <div className="mt-4 w-full max-w-xs space-y-4">
                            <Input 
                              placeholder="234..." 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="cyber-input"
                            />
                            <button
                              onClick={() => {
                                 executeAction({ action: "start", phoneNumber: phone, userId: status?.currentUserId || undefined });
                              }}
                              disabled={isPending || !phone}
                              className="cyber-button w-full"
                            >
                              Connect with Phone
                            </button>
                          </div>
                        )}
                      </div>
                    ) : status?.pairingCode ? (
                      <div className="space-y-6">
                        <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 text-center">
                          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2 font-bold">Your Pairing Code</p>
                          <p className="text-4xl font-display font-bold text-primary tracking-[0.3em]">{status.pairingCode}</p>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">How to Link:</p>
                          <ol className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Open WhatsApp on your phone</li>
                            <li className="flex gap-2"><span className="text-primary font-bold">2.</span> Go to Settings → Linked Devices</li>
                            <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Tap "Link a Device"</li>
                            <li className="flex gap-2"><span className="text-primary font-bold">4.</span> Tap "Link with phone number instead"</li>
                            <li className="flex gap-2"><span className="text-primary font-bold">5.</span> Enter the code shown above</li>
                          </ol>
                          <p className="text-[10px] text-yellow-500 mt-4 font-medium">Code expires in ~60 seconds. Generate a new one if it fails.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-3">
                          <Input 
                            placeholder="234..." 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="cyber-input flex-1"
                          />
                          <button
                            onClick={() => {
                               executeAction({ action: "start", phoneNumber: phone, userId: status?.currentUserId || undefined });
                            }}
                            disabled={isPending || !phone}
                            className="cyber-button whitespace-nowrap px-8"
                          >
                            {isPending ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Connecting...
                              </span>
                            ) : (
                              "Generate Code"
                            )}
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic font-medium uppercase tracking-wider">Format: country code + number (e.g. 2349015613510)</p>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="cyber-card p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-white/5">
                <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
                  <Shield className="w-5 h-5 text-primary" /> 
                  Bot Security
                </h3>
                <div className="space-y-4">
                  {[
                    { label: "Anti-Ban Matrix", value: "Active", color: "text-green-500" },
                    { label: "Identity Masking", value: "Encrypted", color: "text-green-500" },
                    { label: "Delay Throttle", value: "Randomized", color: "text-primary" }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      <span className={`text-[10px] font-black ${item.color} uppercase`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="cyber-card p-6 border-white/5 flex flex-col justify-center gap-4">
                <button
                  onClick={() => executeAction({ action: "restart" })}
                  disabled={isPending || botStatus === "offline"}
                  className="cyber-button flex items-center justify-center gap-3 w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
                >
                  <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                  System Reboot
                </button>
                <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-[0.2em]">
                  Emergency Override Controls
                </p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Live Command Stream
                </h3>
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/bot/logs", { method: "DELETE" });
                      window.location.reload();
                    } catch (e) {
                      console.error("Failed to clear logs", e);
                    }
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Logs
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/5">
                <Terminal logs={logs} isLoading={logsLoading} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CyberLayout>
  );
}
