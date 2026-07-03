import { LessonDetail } from './LessonDetail'

export function generateStaticParams() {
  return ['what-is-ton', 'wallets', 'transactions', 'jettons', 'dex', 'security', 'scams', 'nfts']
    .map(lesson => ({ lesson }))
}

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params
  return <LessonDetail lesson={lesson} />
}
