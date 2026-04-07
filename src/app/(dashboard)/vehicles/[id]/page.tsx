import VehicleForm from '@/components/vehicles/vehicle-form'

type Props = { params: Promise<{ id: string }> }

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params
  return <VehicleForm id={id} />
}
