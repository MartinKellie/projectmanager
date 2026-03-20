'use client'

import { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

const DEFAULT_ABACUS_URL = 'https://apps.abacus.ai/'
const abacusUrl = process.env.NEXT_PUBLIC_ABACUS_CHAT_URL?.trim() || DEFAULT_ABACUS_URL

export function AbacusMiniBrowser() {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="flex flex-col border-t border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
      >
        <span className="text-xs font-medium text-white/70">Abacus.AI</span>
        <div className="flex items-center gap-2">
          <a
            href={abacusUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
          >
            Open in new tab
            <ExternalLink size={12} />
          </a>
          {expanded ? (
            <ChevronDown size={14} className="text-white/50 flex-shrink-0" />
          ) : (
            <ChevronUp size={14} className="text-white/50 flex-shrink-0" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="h-[280px] w-full bg-black/20">
          <iframe
            title="Abacus.AI"
            src={abacusUrl}
            className="h-full w-full border-0"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}
    </div>
  )
}
