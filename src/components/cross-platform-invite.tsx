'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Share2, Mail, MessageCircle, Link2 } from 'lucide-react'
import { toast } from 'sonner'

interface CrossPlatformInviteProps {
  isOpen: boolean
  onClose: () => void
  /** The user's display name to personalise the invite message */
  displayName?: string
}

const APP_URL = 'https://social-app-psi-dun.vercel.app'
const APP_NAME = 'Quiet'

function buildMessage(displayName?: string) {
  const name = displayName || 'Someone'
  return `${name} invited you to join ${APP_NAME} — a calm, private, slow-social network built for meaningful connections. No algorithms, no ads, no noise.\n\nJoin here 👉 ${APP_URL}`
}

const platforms = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    getUrl: (msg: string) => `https://wa.me/?text=${encodeURIComponent(msg)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: '#229ED9',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    getUrl: (msg: string) => `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(msg)}`,
  },
  {
    id: 'twitter',
    label: 'X / Twitter',
    color: '#000000',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.622 5.905-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: (msg: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`,
  },
  {
    id: 'email',
    label: 'Email',
    color: '#6366F1',
    icon: <Mail className="w-5 h-5" />,
    getUrl: (msg: string) =>
      `mailto:?subject=${encodeURIComponent(`Join me on ${APP_NAME}`)}&body=${encodeURIComponent(msg)}`,
  },
  {
    id: 'sms',
    label: 'SMS',
    color: '#10B981',
    icon: <MessageCircle className="w-5 h-5" />,
    getUrl: (msg: string) => `sms:?body=${encodeURIComponent(msg)}`,
  },
]

export function CrossPlatformInvite({ isOpen, onClose, displayName }: CrossPlatformInviteProps) {
  const [copied, setCopied] = useState(false)
  const [hasNativeShare, setHasNativeShare] = useState(false)
  const message = buildMessage(displayName)

  // Detect Web Share API availability after mount (client-only)
  useState(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setHasNativeShare(true)
    }
  })

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${APP_URL}`)
      setCopied(true)
      toast.success('Invite link copied to clipboard!', { icon: '🔗' })
      setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Could not copy to clipboard.')
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return
    try {
      await navigator.share({
        title: `Join me on ${APP_NAME}`,
        text: message,
        url: APP_URL,
      })
    } catch {
      // User dismissed — no-op
    }
  }

  function openPlatform(getUrl: (msg: string) => string) {
    window.open(getUrl(message), '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[201] flex items-end sm:items-center justify-center p-0 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="pointer-events-auto w-full sm:max-w-md bg-surface border-t sm:border border-outline-variant/40 sm:rounded-[32px] rounded-t-[32px] shadow-2xl overflow-hidden"
            >
              {/* Drag handle (mobile) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Share2 size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg text-primary font-semibold leading-tight">Invite to Quiet</h2>
                    <p className="text-[11px] text-on-surface-variant/70 font-medium tracking-wide">Share across any platform</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface-variant cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Invite message preview */}
                <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-2">Preview Message</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed font-medium whitespace-pre-line">{message}</p>
                </div>

                {/* Platform grid */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-outline mb-3">Share via</p>
                  <div className="grid grid-cols-3 gap-3">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        onClick={() => openPlatform(platform.getUrl)}
                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all cursor-pointer group"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110"
                          style={{ backgroundColor: platform.color }}
                        >
                          {platform.icon}
                        </div>
                        <span className="text-[11px] font-bold text-on-surface-variant tracking-wide">{platform.label}</span>
                      </button>
                    ))}

                    {/* Native Share (mobile only, shown when available) */}
                    {hasNativeShare && (
                      <button
                        onClick={handleNativeShare}
                        className="flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-outline-variant/25 bg-surface-container-low hover:bg-surface-container active:scale-95 transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm transition-transform group-hover:scale-110">
                          <Share2 size={18} />
                        </div>
                        <span className="text-[11px] font-bold text-on-surface-variant tracking-wide">More</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-outline-variant/20" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-outline">or copy link</span>
                  <div className="flex-1 h-px bg-outline-variant/20" />
                </div>

                {/* Copy link row */}
                <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/25 rounded-2xl px-4 py-3">
                  <Link2 size={14} className="text-outline shrink-0" />
                  <span className="flex-1 text-sm font-medium text-on-surface-variant truncate">{APP_URL}</span>
                  <button
                    onClick={handleCopyLink}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                      copied
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : 'bg-primary text-on-primary hover:bg-primary/90'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
