'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import VehicleSheet, { type Vehicle } from './vehicle-sheet'

type VehiclesClientProps = {
  vehicles: Vehicle[]
}

const vehicleTypeLabels: Record<string, string> = {
  car: 'Επιβατικό',
  van: 'Βανάκι',
  bus: 'Λεωφορείο',
}

export default function VehiclesClient({ vehicles: initialVehicles }: VehiclesClientProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  function handleCreate() {
    setEditingVehicle(null)
    setSheetOpen(true)
  }

  function handleEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle)
    setSheetOpen(true)
  }

  async function handleDeactivate(vehicle: Vehicle) {
    if (!confirm(`Απενεργοποίηση οχήματος "${vehicle.name}";`)) return
    await fetch(`/api/vehicles/${vehicle.id}`, { method: 'DELETE' })
    router.refresh()
  }

  function handleSuccess() {
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Οχήματα</h1>
        <Button onClick={handleCreate}>Νέο Όχημα</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Όνομα</TableHead>
              <TableHead>Πινακίδα</TableHead>
              <TableHead>Τύπος</TableHead>
              <TableHead>Μάρκα</TableHead>
              <TableHead>Κατάσταση</TableHead>
              <TableHead className="text-right">Ενέργειες</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialVehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Δεν βρέθηκαν οχήματα
                </TableCell>
              </TableRow>
            )}
            {initialVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.name}</TableCell>
                <TableCell>{vehicle.plate}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {vehicleTypeLabels[vehicle.type] ?? vehicle.type}
                  </Badge>
                </TableCell>
                <TableCell>{vehicle.brand ?? '—'}</TableCell>
                <TableCell>
                  {vehicle.active ? (
                    <Badge variant="default">Ενεργό</Badge>
                  ) : (
                    <Badge variant="secondary">Ανενεργό</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(vehicle)}
                      title="Επεξεργασία"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {vehicle.active && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeactivate(vehicle)}
                        title="Απενεργοποίηση"
                      >
                        <PowerOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <VehicleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        vehicle={editingVehicle}
        onSuccess={handleSuccess}
      />
    </>
  )
}
