import Image from 'next/image'
import Link from 'next/link'
import type { NftItem } from '@/types/nft'

interface Props {
  nft: NftItem
}

export function NftCard({ nft }: Props) {
  return (
    <Link
      href={`/nft?address=${encodeURIComponent(nft.address)}`}
      className="glass-card rounded-[16px] overflow-hidden flex flex-col active:scale-[0.97] transition-transform"
    >
      <div className="aspect-square bg-white/[0.04] relative flex items-center justify-center">
        {nft.image ? (
          <Image
            src={nft.image}
            alt={nft.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-outline text-[28px]">image</span>
        )}
      </div>
      <div className="p-[12px] flex flex-col gap-[2px]">
        <div className="text-label-sm text-white truncate">{nft.name}</div>
        {nft.collectionName && (
          <div className="text-[10px] text-on-surface-variant truncate">{nft.collectionName}</div>
        )}
      </div>
    </Link>
  )
}
