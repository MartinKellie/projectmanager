'use client'

import { useState, useEffect, useMemo } from 'react'
import { Music } from 'lucide-react'

interface MusicCoverProps {
  picture?: Blob | null
  alt?: string
  className?: string
}

export function MusicCover({ picture, alt = 'Album', className = '' }: MusicCoverProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const url = useMemo(() => (picture ? URL.createObjectURL(picture) : null), [picture])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  if (!picture || error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-white/10 border border-white/10 ${className}`}
        aria-hidden
      >
        <Music size={32} className="text-white/40" />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob URL from in-memory tag art, not a static asset
    <img
      src={url ?? undefined}
      alt={alt}
      className={`rounded-lg object-cover border border-white/10 ${!loaded ? 'invisible' : ''} ${className}`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    />
  )
}
