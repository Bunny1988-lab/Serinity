'use client'

import { useState } from 'react'
import { Share2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <Button 
        onClick={handleShare}
        className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-6 bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
      >
        <Share2 size={16} />
        <span className="font-medium text-sm">{copied ? 'Link Copied!' : 'Invite Friends'}</span>
      </Button>

      {/* Sync Contacts Button (Local SHA-256 sync matcher) */}
      <Button 
        onClick={() => setImporterOpen(true)}
        variant="outline"
        className="flex-1 flex items-center justify-center gap-2 rounded-2xl py-6 border border-border/10 bg-background/30 backdrop-blur-sm text-foreground hover:bg-muted/40 transition-all hover:scale-[1.02] active:scale-[0.98] select-none cursor-pointer"
      >
        <ShieldCheck size={16} className="text-primary" />
        <span className="font-medium text-sm">Sync Contacts</span>
      </Button>

      <ContactImporter isOpen={importerOpen} onClose={() => setImporterOpen(false)} />
    </div>
  )
}
