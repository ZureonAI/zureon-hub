import { AskAI } from './AskAI'

export function generateStaticParams() {
  return ['stonfi', 'dedust', 'evaa', 'tonstakers', 'getgems', 'tonkeeper', 'tondns', 'fragment'].map(id => ({ id }))
}

export default async function AskAIPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AskAI id={id} />
}
