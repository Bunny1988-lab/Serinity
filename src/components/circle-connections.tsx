'use client'

import { useState } from 'react'
import { Share2, ShieldCheck } from 'lucide-react'
import { ContactImporter } from '@/components/contact-importer'

export function CircleConnections({ userId }: { userId: string }) {
  const [importerOpen, setImporterOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const shareData = {
      title: 'Join me on Serenity',
      text: 'Hey! I am using Serenity, a calm, privacy-focused social network. Come join my private circle!',
      url: window.location.origin,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy', err)
      }
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-6 relative z-10 w-full">
      {/* Invite Friends Button (Cross platform share) */}
      <button 
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 rounded-full h-12 bg-foreground text-white hover:opacity-90 transition-opacity active:scale-[0.98] select-none cursor-pointer"
      >
        <Share2 size={16} strokeWidth={2.5} />
        <span className="font-bold text-[14px]">{copied ? 'Link Copied!' : 'Invite Friends'}</span>
      </button>

      {/* Sync Contacts Button (Local SHA-256 sync matcher) */}
      <button 
        onClick={() => setImporterOpen(true)}
        className="flex-1 flex items-center justify-center gap-2 rounded-full h-12 border border-border-mint bg-card text-foreground hover:bg-background transition-all active:scale-[0.98] select-none cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
      >
        <ShieldCheck size={18} strokeWidth={2.5} className="text-foreground" />
        <span className="font-bold text-[14px]">Sync Contacts</span>
      </button>

      <ContactImporter isOpen={importerOpen} onClose={() => setImporterOpen(false)} />
    </div>
  )
}
