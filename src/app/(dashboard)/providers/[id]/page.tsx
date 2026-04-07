import ProviderForm from '@/components/providers/provider-form'

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProviderForm id={id} />
}
