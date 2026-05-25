'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function InviteButton() {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const shareData = {
      title: 'Join me on Serenity',
      text: 'Hey! I am using Serenity, a calm, privacy-focused social network. Come join my private circle!',
      url: window.location.origin, // This shares the home/login page
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback: Copy to clipboard if Web Share API is not supported (e.g. some desktop browsers)
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
    <Button 
      onClick={handleShare}
      className="w-full flex items-center justify-center gap-2 rounded-xl py-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
    >
      {copied ? <Check size={20} /> : <Share2 size={20} />}
      <span className="font-medium text-lg">{copied ? 'Link Copied!' : 'Invite Friends'}</span>
    </Button>
  )
}
