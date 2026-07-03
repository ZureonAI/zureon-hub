import { ExploreDetail } from './ExploreDetail'

export function generateStaticParams() {
  return ['stonfi', 'dedust', 'evaa', 'tonstakers', 'getgems', 'tonkeeper', 'tondns', 'fragment'].map(id => ({ id }))
}

export default async function ExploreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ExploreDetail id={id} />
}
