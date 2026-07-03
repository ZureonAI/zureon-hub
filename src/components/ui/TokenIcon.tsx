'use client'
import { useState } from 'react'
import Image from 'next/image'

interface Props {
  src?: string
  symbol: string
  size?: number
}

export function TokenIcon({ src, symbol, size = 40 }: Props) {
  const [imgError, setImgError] = useState(false)

  if (src && !imgError) {
    return (
      <div
        className="rounded-full overflow-hidden flex-shrink-0 border border-white/10"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={symbol}
          width={size}
          height={size}
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    )
  }

  // Fallback: colored circle with symbol abbreviation
  const letter = symbol.slice(0, 2).toUpperCase()
  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center border border-primary-container/40 font-bold text-primary-container"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.35,
        background: 'radial-gradient(circle at 30% 30%, #00D4FF33, #00D4FF0a)',
      }}
    >
      {letter}
    </div>
  )
}
