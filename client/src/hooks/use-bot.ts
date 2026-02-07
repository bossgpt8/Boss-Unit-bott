import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Log } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// ============================================
// STATUS HOOKS
// ============================================

export function useBotStatus() {
  return useQuery({
    queryKey: [api.bot.status.path],
    queryFn: async () => {
      const res = await fetch(api.bot.status.path);
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      return api.bot.status.responses[200].parse(data);
    },
    refetchInterval: 2000, // Poll every 2 seconds
  });
}

// ============================================
// ACTION HOOKS
// ============================================

export function useBotAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ action, phoneNumber }: { action: "start" | "stop" | "restart" | "logout", phoneNumber?: string }) => {
      const res = await fetch(api.bot.action.path, {
        method: api.bot.action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phoneNumber }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Action failed");
      }
      return api.bot.action.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Command Executed",
        description: data.message,
        className: "bg-black border-primary text-primary font-mono",
      });
      queryClient.invalidateQueries({ queryKey: [api.bot.status.path] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ============================================
// LOGS HOOKS
// ============================================

export function useBotLogs() {
  return useQuery({
    queryKey: [api.bot.logs.path],
    queryFn: async () => {
      const res = await fetch(api.bot.logs.path);
      if (!res.ok) throw new Error("Failed to fetch logs");
      return api.bot.logs.responses[200].parse(await res.json());
    },
    refetchInterval: 2000,
  });
}
