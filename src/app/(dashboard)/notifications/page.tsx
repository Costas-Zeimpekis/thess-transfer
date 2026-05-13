"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { FaSlidersH, FaTimes } from "react-icons/fa";
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [level, setLevel] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [applied, setApplied] = useState({ level: "all", from: "", to: "" });

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
    setApplied({ level, from, to });
    void fetchLogs(level, from, to);
  }

  function resetFilters() {
    setLevel("all");
    setFrom("");
    setTo("");
    setApplied({ level: "all", from: "", to: "" });
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

  const activeFilterCount = [
    applied.level !== "all",
    applied.from !== "",
    applied.to !== "",
  ].filter(Boolean).length;

  return (
    <div className="flex gap-2 items-stretch flex-1 min-h-0">
      {/* Main content */}
      <div className="flex-1 min-w-0 bg-white p-4 flex flex-col min-h-0 gap-4 overflow-auto">
        <div className="flex items-center gap-3">
          <Navigation />
          <div className="flex-1" />
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
                      <p className="text-sm font-medium text-[#333333] wrap-break-word">{log.message}</p>
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

      {/* Collapsible filter sidebar */}
      <div className="flex items-stretch shrink-0">
        {/* Toggle tab */}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex flex-col items-center justify-center gap-1 w-8 bg-[#333333] text-[#f9cf44] rounded-l-md hover:bg-[#3d3d3d] transition-colors cursor-pointer"
        >
          {filtersOpen ? <FaTimes size={13} /> : <FaSlidersH size={13} />}
          {!filtersOpen && activeFilterCount > 0 && (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#f9cf44] text-[#333333] text-[9px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="w-72 flex flex-col p-4 space-y-4 bg-[#333333] text-[#f9cf44] rounded-r-md overflow-y-auto">
            <div className="space-y-1">
              <Label className="text-xs">Επίπεδο</Label>
              <div className="flex flex-col rounded-md overflow-hidden border border-[#f9cf44]">
                {(["all", "info", "success", "warn", "error"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-1 px-3 text-xs font-medium text-left transition-colors ${level === lvl
                      ? "bg-[#f9cf44] text-[#333333]"
                      : "text-[#f9cf44] hover:bg-[#f9cf44]/20"
                    }`}
                  >
                    {LEVEL_LABELS[lvl]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">
                Από
              </Label>
              <Input
                id="from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 w-full bg-white text-[#333333]"
                max={to || undefined}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">
                Έως
              </Label>
              <Input
                id="to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 w-full bg-white text-[#333333]"
                min={from || undefined}
              />
            </div>

            <Button
              size="sm"
              onClick={applyFilters}
              className="h-8 w-full bg-[#f9cf44] text-[#333333] hover:bg-[#f9cf44]/90 font-semibold"
            >
              Εφαρμογή
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetFilters}
              className="h-8 w-full border-[#f9cf44] text-[#f9cf44] hover:bg-[#f9cf44]/20 hover:text-[#f9cf44]"
            >
              Επαναφορά
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
