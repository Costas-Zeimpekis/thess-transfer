import PartnerForm from '@/components/partners/partner-form'

type Props = { params: Promise<{ id: string }> }

export default async function EditPartnerPage({ params }: Props) {
  const { id } = await params
  return <PartnerForm id={id} />
}
