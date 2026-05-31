'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createZenLoop } from '@/app/(main)/actions-zen'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ZenLoop {
  id: string
  video_url: string
  poem_line: string
  created_at: string
  users: {
    display_name: string | null
    avatar_url: string | null
  }
}

// Preset peaceful visual loop loops for quick selection
const AMBIENT_PRESETS = [
  { name: '🍵 Kyoto Bamboo', url: 'https://assets.mixkit.co/videos/preview/mixkit-swaying-green-bamboo-leaves-40899-large.mp4' },
  { name: '🌊 Ocean Tides', url: 'https://assets.mixkit.co/videos/preview/mixkit-gentle-tides-lapping-on-the-shore-41584-large.mp4' },
  { name: '🌧️ Golden Rain', url: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-falling-on-water-surface-41588-large.mp4' },
  { name: '🌌 Lavender Dusk', url: 'https://assets.mixkit.co/videos/preview/mixkit-purple-aesthetic-misty-mountains-42289-large.mp4' }
]

export function ZenLoopsFeed({ currentUser }: { currentUser: { id: string } }) {
  const [loops, setLoops] = useState<ZenLoop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newPoem, setNewPoem] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(AMBIENT_PRESETS[0].url)
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [isCasting, setIsCasting] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadLoops()
  }, [])

  async function loadLoops() {
    setIsLoading(true)
    const { data } = await supabase
      .from('zen_loops')
      .select(`
        id, video_url, poem_line, created_at,
        users:user_id (display_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Fallback default loops if database is empty so there's never a blank placeholder experience
    const fallbackLoops: ZenLoop[] = AMBIENT_PRESETS.map((p, idx) => ({
      id: `preset-${idx}`,
      video_url: p.url,
      poem_line: idx === 0 ? 'silence is the temple of the dreaming soul' :
                 idx === 1 ? 'the tide returns, carrying what we let go' :
                 idx === 2 ? 'each drop of rain remembers the clouds it left' :
                             'dusk falls, wrapping the world in indigo rest',
      created_at: new Date().toISOString(),
      users: { display_name: 'Zen Master', avatar_url: null }
    }))

    if (data && data.length > 0) {
      setLoops([...data as any[], ...fallbackLoops])
    } else {
      setLoops(fallbackLoops)
    }
    setIsLoading(false)
  }

  const handleCastLoop = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPoem.trim()) return
    setIsCasting(true)

    try {
      let finalVideoUrl = selectedVideo

      if (customFile) {
        const fileExt = customFile.name.split('.').pop()
        const fileName = `zen-loop-${Math.random()}.${fileExt}`
        const filePath = `zen-loops/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, customFile)

        if (uploadError) throw new Error(uploadError.message)
        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
        finalVideoUrl = data.publicUrl
      }

      const fd = new FormData()
      fd.append('video_url', finalVideoUrl)
      fd.append('poem_line', newPoem)

      const serverRes = await createZenLoop(fd)
      if (serverRes.success) {
        toast.success('Your poetic micro-contemplation has been cast.', { icon: '✨' })
        setNewPoem('')
        setCustomFile(null)
        setIsAdding(false)
        loadLoops()
        router.refresh()
      } else {
        toast.error(serverRes.error || 'Failed to cast loop')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cast loop')
    } finally {
      setIsCasting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary/40" />
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center relative z-20">
      
      {/* Absolute top action button */}
      <div className="w-full max-w-[500px] px-5 flex justify-between items-center mb-8">
        <h4 className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.25em]">
          Contemplations
        </h4>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 font-label-caps text-[9px] font-bold text-amber-600 hover:text-amber-500 tracking-wider uppercase transition-colors"
        >
          <Plus size={12} />
          Cast Quiet Loop
        </button>
      </div>

      {/* Snap-y Vertical Mobile Viewport snaper */}
      <div className="w-full max-w-[500px] h-[650px] sm:h-[700px] overflow-y-scroll snap-y snap-mandatory scrollbar-none rounded-3xl border border-outline-variant/30 bg-black relative shadow-lg">
        {loops.map((loop) => (
          <div 
            key={loop.id} 
            className="w-full h-full snap-start snap-always relative flex flex-col items-center justify-center overflow-hidden shrink-0 bg-neutral-950"
          >
            {/* Ambient Background Loop */}
            <video
              src={loop.video_url}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
            />

            {/* Indigo/Orange Twilight Ambient Veil */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-indigo-950/20 to-black/80 pointer-events-none" />

            {/* Floating Poetic Line Overlay */}
            <div className="relative z-10 px-8 text-center max-w-sm">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="font-display text-2xl sm:text-3xl text-white italic tracking-wide leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
              >
                "{loop.poem_line}"
              </motion.p>
              
              <div className="w-6 h-[0.5px] bg-white/30 mx-auto my-6" />
              
              <span className="font-sans text-[8px] uppercase tracking-[0.25em] text-white/60 font-bold drop-shadow-sm">
                cast by {loop.users?.display_name || 'Anonymous'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* --- ADD CONTEMPLATION POPUP --- */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-background/96 backdrop-blur-sm flex items-center justify-center p-5"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onSubmit={handleCastLoop}
              className="w-full max-w-md bg-surface-container-low border-[0.5px] border-outline-variant p-6 rounded-[32px] shadow-2xl relative flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b-[0.5px] border-outline-variant/30 pb-4">
                <h3 className="font-display text-lg text-primary font-medium flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500 animate-pulse" />
                  Cast Zen Contemplation
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Video Backdrops selection */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase tracking-widest font-bold text-outline">Select peaceful loop backdrop</span>
                <div className="grid grid-cols-2 gap-2">
                  {AMBIENT_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => { setSelectedVideo(p.url); setCustomFile(null); }}
                      className={`p-3 rounded-2xl border text-left text-xs font-medium tracking-wide transition-all ${
                        selectedVideo === p.url && !customFile
                          ? 'border-amber-500/50 bg-amber-500/5 text-amber-700'
                          : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <input
                    type="file"
                    accept="video/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCustomFile(e.target.files[0])
                        setSelectedVideo('')
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full py-3 rounded-2xl border border-dashed text-xs font-semibold uppercase tracking-wider transition-colors ${
                      customFile 
                        ? 'border-amber-500 text-amber-600 bg-amber-50/50' 
                        : 'border-outline-variant/30 text-outline hover:text-primary'
                    }`}
                  >
                    {customFile ? `Selected: ${customFile.name.slice(0, 20)}...` : 'Or upload custom loop video'}
                  </button>
                </div>
              </div>

              {/* Poetic Line input */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Your poetic reflection line</label>
                <textarea
                  value={newPoem}
                  onChange={(e) => setNewPoem(e.target.value)}
                  placeholder="e.g. dawn rises, mirroring the silent heart..."
                  maxLength={120}
                  className="w-full h-24 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-2xl p-4 resize-none outline-none text-xs font-medium placeholder:text-outline"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCasting || !newPoem.trim()}
                className="w-full h-12 rounded-full font-label-caps text-xs font-bold bg-primary text-on-primary hover:bg-primary/95 transition-all tracking-[0.2em] uppercase disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isCasting ? <Loader2 size={16} className="animate-spin" /> : null}
                Cast Zen Loop
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
