import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Log } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ensure this client-side firebase export exists

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
    refetchInterval: 5000, 
  });
}

// ============================================
// ACTION HOOKS
// ============================================

export function useBotAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ action, phoneNumber, userId }: { action: "start" | "stop" | "restart" | "logout", phoneNumber?: string, userId?: string }) => {
      const res = await fetch(api.bot.action.path, {
        method: api.bot.action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, phoneNumber, userId }),
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
// LOGS HOOKS (Real-time Firestore Listener)
// ============================================

export function useBotLogs(userId?: string) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const colName = userId ? `user_logs_${userId}` : "logs";
    const q = query(
      collection(db, colName),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id as any, // Cast to avoid type mismatch with number id
          level: data.level || "info",
          message: data.message || "",
          timestamp: data.timestamp ? new Date(data.timestamp) : null
        };
      }) as Log[];
      setLogs(newLogs);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore real-time listener failed:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { data: logs, isLoading };
}
