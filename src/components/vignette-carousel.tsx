'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createVignette } from '@/app/(main)/actions-zen'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Vignette {
  id: string
  image_url: string
  caption: string | null
  created_at: string
  users: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
}

export function VignetteCarousel({ 
  currentUser 
}: { 
  currentUser: { id: string; display_name: string; avatar_url?: string | null } 
}) {
  const [vignettes, setVignettes] = useState<Vignette[]>([])
  const [activeVignette, setActiveVignette] = useState<Vignette | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadVignettes()
  }, [])

  async function loadVignettes() {
    // Fetch active vignettes from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('vignettes')
      .select(`
        id, image_url, caption, created_at,
        users:user_id (id, display_name, avatar_url)
      `)
      .gt('created_at', oneDayAgo)
      .order('created_at', { ascending: false })

    if (data) setVignettes(data as any[])
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    setIsUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `vignette-${Math.random()}.${fileExt}`
      const filePath = `vignette-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) throw new Error(uploadError.message)

      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
      const imageUrl = data.publicUrl

      const caption = prompt('Add a slow reflection caption (optional):') || ''

      const res = await createVignette(new FormData()) // Trigger action via server
      // We pass the parameters cleanly:
      const fd = new FormData()
      fd.append('image_url', imageUrl)
      fd.append('caption', caption)
      
      const serverRes = await createVignette(fd)
      if (serverRes.success) {
        toast.success('Your daily Vignette has been cast into the sunset.', { icon: '🌅' })
        loadVignettes()
        router.refresh()
      } else {
        toast.error(serverRes.error || 'Failed to upload vignette')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload vignette')
    } finally {
      setIsUploading(false)
    }
  }

  // Touch focus director
  const startFocus = () => setIsFocused(true)
  const stopFocus = () => setIsFocused(false)

  return (
    <div className="w-full py-6 select-none animate-fade-in relative z-20">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-none pb-2 px-2 flex-nowrap">
        {/* Creator bubble */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full border-[0.5px] border-dashed border-outline-variant hover:border-primary/50 bg-surface-container-low flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative"
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin text-primary" />
            ) : (
              <Plus size={20} strokeWidth={1.5} className="text-on-surface-variant group-hover:text-primary transition-colors" />
            )}
          </button>
          <span className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant">Your Day</span>
        </div>

        {/* Connections' vignettes */}
        {vignettes.map((v) => {
          const authName = v.users?.display_name || 'Anonymous'
          return (
            <div 
              key={v.id}
              onClick={() => setActiveVignette(v)}
              className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500/30 via-rose-500/20 to-indigo-950/20 group-hover:scale-105 transition-all">
                <div className="w-full h-full rounded-full border border-white/40 overflow-hidden bg-surface flex items-center justify-center">
                  {v.users?.avatar_url ? (
                    <img 
                      src={v.users.avatar_url} 
                      alt="" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
                    />
                  ) : (
                    <span className="text-[14px] font-bold text-primary">{authName[0]?.toUpperCase()}</span>
                  )}
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-widest font-bold text-primary truncate w-14 text-center">
                {authName.split(' ')[0]}
              </span>
            </div>
          )
        })}

        {vignettes.length === 0 && !isUploading && (
          <p className="text-[10px] text-outline font-medium tracking-wide italic pl-2 leading-none uppercase">
            No active vignettes. Be the first to share a quiet moment.
          </p>
        )}
      </div>

      {/* --- WATERCOLOR BLUR STORY VIEW MODAL --- */}
      <AnimatePresence>
        {activeVignette && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-background/96 flex flex-col items-center justify-center p-6 select-none"
          >
            {/* Header controls */}
            <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                  {activeVignette.users?.avatar_url ? (
                    <img src={activeVignette.users.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xs">{activeVignette.users?.display_name?.[0]}</span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-primary">{activeVignette.users?.display_name || 'Anonymous'}</p>
                  <p className="text-[8px] text-outline uppercase tracking-wider font-bold">
                    {new Date(activeVignette.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setActiveVignette(null); setIsFocused(false); }}
                className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-primary"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Hold container instructions */}
            <div className="text-center mb-8 relative z-20">
              <p className="font-label-caps text-[9px] font-bold text-on-surface-variant mb-2 uppercase tracking-[0.25em]">
                Intentional Focus
              </p>
              <p className="text-xs text-on-surface-variant/80 italic font-medium max-w-xs">
                Press and hold anywhere on the circle to defocus the watercolor blur...
              </p>
            </div>

            {/* The hold-to-focus visual circle */}
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center z-20">
              <motion.div
                animate={{ 
                  boxShadow: isFocused 
                    ? '0 0 50px 10px rgba(0,0,0,0.03)' 
                    : '0 0 30px 4px rgba(245,158,11,0.08)'
                }}
                transition={{ duration: 0.6 }}
                // Desktop hold triggers
                onMouseDown={startFocus}
                onMouseUp={stopFocus}
                onMouseLeave={stopFocus}
                // Mobile hold triggers (multi-device compatible!)
                onTouchStart={startFocus}
                onTouchEnd={stopFocus}
                className="w-full h-full rounded-full overflow-hidden border border-outline-variant/30 relative cursor-pointer"
              >
                {/* Real High-Res image */}
                <motion.img
                  animate={{ 
                    filter: isFocused ? 'blur(0px)' : 'blur(45px)',
                    scale: isFocused ? 1.0 : 1.05
                  }}
                  transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  src={activeVignette.image_url}
                  alt="Vignette"
                  className="w-full h-full object-cover pointer-events-none"
                />

                {/* Twilight circular glow backdrop inside */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-rose-500/3 to-indigo-950/10 pointer-events-none" />
              </motion.div>
            </div>

            {/* Custom reflection text floating below */}
            {activeVignette.caption && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: isFocused ? 0.95 : 0.4 }}
                className="mt-10 font-display text-base text-primary italic max-w-sm text-center px-4 leading-relaxed transition-opacity duration-500 relative z-20"
              >
                "{activeVignette.caption}"
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
