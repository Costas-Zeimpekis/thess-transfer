'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import ProviderSheet, { type Provider } from './provider-sheet'

type ProvidersClientProps = {
  providers: Provider[]
}

export default function ProvidersClient({ providers: initialProviders }: ProvidersClientProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  function handleCreate() {
    setEditingProvider(null)
    setSheetOpen(true)
  }

  function handleEdit(provider: Provider) {
    setEditingProvider(provider)
    setSheetOpen(true)
  }

  function handleDeletePrompt(provider: Provider) {
    setDeleteTarget(provider)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await fetch(`/api/providers/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      router.refresh()
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Πάροχοι</h1>
        <Button onClick={handleCreate}>Νέος Πάροχος</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Όνομα</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Emails</TableHead>
              <TableHead className="text-right">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialProviders.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Δεν βρέθηκαν πάροχοι
                </TableCell>
              </TableRow>
            )}
            {initialProviders.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">{provider.slug}</code>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {provider.emails.length > 0
                    ? provider.emails.map((e) => e.email).join(', ')
                    : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(provider)}
                      title="Επεξεργασία"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePrompt(provider)}
                      title="Διαγραφή"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProviderSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        provider={editingProvider}
        onSuccess={handleSuccess}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Διαγραφή Παρόχου</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Είστε σίγουροι ότι θέλετε να διαγράψετε τον πάροχο{' '}
            <strong>{deleteTarget?.name}</strong>; Η ενέργεια δεν μπορεί να αναιρεθεί.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Ακύρωση
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Διαγραφή...' : 'Διαγραφή'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
