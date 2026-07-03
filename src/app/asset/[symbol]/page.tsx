import { AssetDetail } from './AssetDetail'

// Pre-generate known asset pages for static export
export function generateStaticParams() {
  const common = ['TON', 'USDT', 'NOT', 'SCALE', 'DOGS', 'STON', 'BOLT', 'JETTON']
  return common.map(symbol => ({ symbol }))
}

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params
  return <AssetDetail symbol={symbol} />
}
