"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";

type Backup = {
  id: number;
  calendarId: string;
  eventsCount: number;
  createdAt: string;
};

type CalendarSource = {
  label: string;
  calendarId: string;
};

function fmt(val: string) {
  return new Date(val).toLocaleString("el-GR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function CalendarSection({
  source,
  backups,
  onBackupCreated,
}: {
  source: CalendarSource;
  backups: Backup[];
  onBackupCreated: () => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleCreate() {
    setCreating(true);
    await fetch("/api/calendar-backups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId: source.calendarId }),
    });
    await onBackupCreated();
    setCreating(false);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    await fetch(`/api/calendar-backups/${id}`, { method: "DELETE" });
    await onBackupCreated();
    setDeletingId(null);
  }

  function handleDownload(id: number) {
    window.open(`/api/calendar-backups/${id}`, "_blank");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{source.label}</h2>
          <p className="text-xs text-muted-foreground font-mono">{source.calendarId}</p>
        </div>
        <Button onClick={handleCreate} disabled={creating} size="sm">
          {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
          {creating ? "Δημιουργία..." : "Δημιουργία Αντιγράφου"}
        </Button>
      </div>

      {backups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Δεν υπάρχουν αντίγραφα ακόμα.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Ημερομηνία</th>
                <th className="px-4 py-3 text-center">Γεγονότα</th>
                <th className="px-4 py-3 text-right">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {backups.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-[#333333]">{fmt(b.createdAt)}</td>
                  <td className="px-4 py-3 text-center font-medium">{b.eventsCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDownload(b.id)} className="gap-1.5">
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
                          : <Trash2 className="h-3.5 w-3.5" />}
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

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [sources, setSources] = useState<CalendarSource[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchBackups() {
    const res = await fetch("/api/calendar-backups");
    setBackups(await res.json());
  }

  useEffect(() => {
    async function init() {
      const [backupsRes, driversRes] = await Promise.all([
        fetch("/api/calendar-backups"),
        fetch("/api/drivers"),
      ]);

      const backupsData: Backup[] = await backupsRes.json();
      const driversData: { fullName: string; googleCalendarId: string | null }[] = await driversRes.json();

      setBackups(backupsData);

      const driverSources: CalendarSource[] = driversData
        .filter((d) => d.googleCalendarId)
        .map((d) => ({ label: d.fullName, calendarId: d.googleCalendarId! }));

      setSources([
        { label: "bkkostas@gmail.com", calendarId: "bkkostas@gmail.com" },
        ...driverSources,
      ]);

      setLoading(false);
    }

    init();
  }, []);

  return (
    <div className="bg-white p-6 flex flex-col gap-8 flex-1 min-h-0 overflow-auto">
      <Navigation />

      {loading && <p className="text-sm text-muted-foreground">Φόρτωση...</p>}

      {!loading && sources.map((source) => (
        <CalendarSection
          key={source.calendarId}
          source={source}
          backups={backups.filter((b) => b.calendarId === source.calendarId)}
          onBackupCreated={fetchBackups}
        />
      ))}
    </div>
  );
}
