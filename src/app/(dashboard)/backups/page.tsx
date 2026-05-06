"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Backup = {
  id: number;
  calendarId: string;
  eventsCount: number;
  createdAt: string;
};

function fmt(val: string) {
  return new Date(val).toLocaleString("el-GR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [calendarId, setCalendarId] = useState("bkkostas@gmail.com");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function fetchBackups() {
    const res = await fetch("/api/calendar-backups");
    setBackups(await res.json());
  }

  useEffect(() => {
    fetchBackups().finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!calendarId.trim()) return;
    setCreating(true);
    await fetch("/api/calendar-backups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId: calendarId.trim() }),
    });
    await fetchBackups();
    setCreating(false);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    await fetch(`/api/calendar-backups/${id}`, { method: "DELETE" });
    setBackups((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
  }

  function handleDownload(id: number) {
    window.open(`/api/calendar-backups/${id}`, "_blank");
  }

  return (
    <div className="bg-white p-6 flex flex-col gap-6 flex-1 min-h-0 overflow-auto">
      <Navigation />

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="calendarId">Calendar ID</Label>
          <Input
            id="calendarId"
            value={calendarId}
            onChange={(e) => setCalendarId(e.target.value)}
            placeholder="example@gmail.com"
            className="w-72"
          />
        </div>
        <Button onClick={handleCreate} disabled={creating || !calendarId.trim()}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {creating ? "Δημιουργία..." : "Δημιουργία Αντιγράφου"}
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Φόρτωση...</p>}

      {!loading && backups.length === 0 && (
        <p className="text-sm text-muted-foreground">Δεν υπάρχουν αντίγραφα ακόμα.</p>
      )}

      {backups.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Ημερομηνία</th>
                <th className="px-4 py-3 text-left">Calendar ID</th>
                <th className="px-4 py-3 text-center">Γεγονότα</th>
                <th className="px-4 py-3 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-[#333333]">{fmt(b.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{b.calendarId}</td>
                  <td className="px-4 py-3 text-center font-medium">{b.eventsCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(b.id)}
                        className="gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        .ics
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(b.id)}
                        disabled={deletingId === b.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        {deletingId === b.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
