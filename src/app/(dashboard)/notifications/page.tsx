"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCheck, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  success: "bg-green-100 text-green-700 border-green-300",
};

const LEVEL_LABELS: Record<string, string> = {
  all: "Όλα",
  info: "Info",
  warn: "Warning",
  error: "Error",
  success: "Success",
};

const LEVEL_TAB_STYLES: Record<string, string> = {
  all: "border-gray-300 text-gray-700 hover:bg-gray-50 data-[active=true]:bg-gray-100 data-[active=true]:border-gray-500",
  info: "border-blue-300 text-blue-700 hover:bg-blue-50 data-[active=true]:bg-blue-100 data-[active=true]:border-blue-500",
  warn: "border-amber-300 text-amber-700 hover:bg-amber-50 data-[active=true]:bg-amber-100 data-[active=true]:border-amber-500",
  error: "border-red-300 text-red-700 hover:bg-red-50 data-[active=true]:bg-red-100 data-[active=true]:border-red-500",
  success: "border-green-300 text-green-700 hover:bg-green-50 data-[active=true]:bg-green-100 data-[active=true]:border-green-500",
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

  const [level, setLevel] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchLogs = useCallback(async (lvl: string, f: string, t: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (lvl !== "all") params.set("level", lvl);
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    const res = await fetch(`/api/notifications?${params.toString()}`);
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLogs("all", "", "");
  }, [fetchLogs]);

  function applyFilters() {
    void fetchLogs(level, from, to);
  }

  function resetFilters() {
    setLevel("all");
    setFrom("");
    setTo("");
    void fetchLogs("all", "", "");
  }

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

      {/* Filters */}
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
        {/* Level tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "info", "success", "warn", "error"] as const).map((lvl) => (
            <button
              key={lvl}
              data-active={level === lvl}
              onClick={() => setLevel(lvl)}
              className={cn(
                "px-3 py-1 rounded border text-xs font-semibold transition-colors",
                LEVEL_TAB_STYLES[lvl],
              )}
            >
              {LEVEL_LABELS[lvl]}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div className="flex gap-4 items-end flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Από</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 text-sm w-40"
              max={to || undefined}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Έως</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 text-sm w-40"
              min={from || undefined}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={applyFilters} className="h-8">
              Εφαρμογή
            </Button>
            <Button size="sm" variant="outline" onClick={resetFilters} className="h-8 gap-1.5">
              <RotateCcw className="h-3 w-3" />
              Επαναφορά
            </Button>
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Φόρτωση...</p>}

      {!loading && logs.length === 0 && (
        <p className="text-sm text-muted-foreground">Δεν βρέθηκαν ειδοποιήσεις.</p>
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
