import DriverForm from '@/components/drivers/driver-form'

type Props = { params: Promise<{ id: string }> }

export default async function EditDriverPage({ params }: Props) {
  const { id } = await params
  return <DriverForm id={id} />
}
