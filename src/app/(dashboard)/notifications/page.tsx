"use client";

import { useEffect, useState } from "react";
import { CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Log = {
  id: number;
  level: string;
  source: string;
  message: string;
  payload: unknown;
  read: boolean;
  createdAt: string;
};

const LEVEL_STYLES: Record<string, string> = {
  error: "bg-red-100 text-red-700 border-red-300",
  warn: "bg-amber-100 text-amber-700 border-amber-300",
  info: "bg-blue-100 text-blue-700 border-blue-300",
};

function fmt(val: string) {
  return new Date(val).toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function NotificationsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setLogs(data))
      .finally(() => setLoading(false));
  }, []);

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function markAllRead() {
    const unread = logs.filter((l) => !l.read).map((l) => l.id);
    if (unread.length === 0) return;
    setMarking(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unread }),
    });
    setLogs((prev) => prev.map((l) => ({ ...l, read: true })));
    setMarking(false);
  }

  const unreadCount = logs.filter((l) => !l.read).length;

  return (
    <div className="bg-white p-6 flex flex-col gap-6 flex-1 min-h-0 overflow-auto">
      <Navigation />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#333333]">Ειδοποιήσεις</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-red-600 text-white text-xs font-bold px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={marking}
            className="gap-1.5"
          >
            <CheckCheck className="h-4 w-4" />
            Σήμανση όλων ως αναγνωσμένα
          </Button>
        )}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Φόρτωση...</p>
      )}

      {!loading && logs.length === 0 && (
        <p className="text-sm text-muted-foreground">Δεν υπάρχουν ειδοποιήσεις.</p>
      )}

      <div className="flex flex-col gap-2">
        {logs.map((log) => {
          const isExpanded = expanded.has(log.id);
          const levelStyle = LEVEL_STYLES[log.level] ?? "bg-gray-100 text-gray-700 border-gray-300";

          return (
            <div
              key={log.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                log.read ? "bg-white border-border" : "bg-red-50 border-red-200",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className={cn("mt-0.5 shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", levelStyle)}>
                    {log.level}
                  </span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-medium text-[#333333] break-words">{log.message}</p>
                    <p className="text-xs text-muted-foreground font-mono">{log.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">{fmt(log.createdAt)}</span>
                  {log.payload != null && (
                    <button
                      onClick={() => toggleExpand(log.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && log.payload != null && (
                <pre className="mt-3 rounded bg-muted p-3 text-xs overflow-auto max-h-60 text-[#333333]">
                  {JSON.stringify(log.payload, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
