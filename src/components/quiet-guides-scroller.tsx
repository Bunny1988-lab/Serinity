'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createQuietGuide } from '@/app/(main)/actions-zen'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, BookOpen, Volume2, VolumeX, Sparkles, Loader2, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface QuietGuide {
  id: string
  title: string
  description: string | null
  soundscape: 'none' | 'rain' | 'wind' | 'chime'
  created_at: string
  users: {
    display_name: string | null
  }
}

interface GuidePage {
  page_number: number
  title: string | null
  content: string
  image_url: string | null
}

export function QuietGuidesScroller({ currentUser }: { currentUser: { id: string } }) {
  const [guides, setGuides] = useState<QuietGuide[]>([])
  const [activeGuide, setActiveGuide] = useState<QuietGuide | null>(null)
  const [pages, setPages] = useState<GuidePage[]>([])
  const [activePageIdx, setActivePageIdx] = useState(0)

  // Creation State
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [soundscape, setSoundscape] = useState<'none' | 'rain' | 'wind' | 'chime'>('none')
  const [pageInputs, setPageInputs] = useState<{ title: string; content: string }[]>([{ title: '', content: '' }])
  const [isCasting, setIsCasting] = useState(false)

  // Audio Ambient soundtrack states
  const [playingSound, setPlayingSound] = useState<'none' | 'rain' | 'wind' | 'chime'>('none')
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadGuides()
    return () => {
      stopSoundscape()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAdding) {
          setIsAdding(false)
        } else if (activeGuide) {
          handleCloseBooklet()
        }
      }
    }

    if (activeGuide || isAdding) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeGuide, isAdding])

  async function loadGuides() {
    const { data } = await supabase
      .from('quiet_guides')
      .select(`
        id, title, description, soundscape, created_at,
        users:user_id (display_name)
      `)
      .order('created_at', { ascending: false })

    // Provide default booklets if database is empty so it looks instantly rich
    const fallbacks: QuietGuide[] = [
      {
        id: 'preset-1',
        title: 'Morning Silence Rituals',
        description: 'Cultivating focus through offline early hour curation.',
        soundscape: 'rain',
        created_at: new Date().toISOString(),
        users: { display_name: 'Zen Companion' }
      },
      {
        id: 'preset-2',
        title: 'Tactile Reading Habits',
        description: 'Translating digital feeds back to wooden desks.',
        soundscape: 'chime',
        created_at: new Date().toISOString(),
        users: { display_name: 'Scribe Studio' }
      }
    ]

    if (data && data.length > 0) {
      setGuides([...data as any[], ...fallbacks])
    } else {
      setGuides(fallbacks)
    }
  }

  async function loadGuidePages(guideId: string) {
    const { data } = await supabase
      .from('guide_pages')
      .select('page_number, title, content, image_url')
      .eq('guide_id', guideId)
      .order('page_number', { ascending: true })

    const fallbacks: GuidePage[] = [
      { page_number: 1, title: 'I. The First Breath', content: 'Begin your day by leaving your digital devices locked away. Allow your mind to gather its thoughts naturally under daylight.', image_url: null },
      { page_number: 2, title: 'II. Curating Tea', content: 'Brew a single warm cup of herbal tea. Observe the steam rise. This is the pace of intentional focus.', image_url: null },
      { page_number: 3, title: 'III. Focused Intention', content: 'Write down a single, actionable thought. Carry this intention with you, casting aside the clutter of the global timeline.', image_url: null }
    ]

    if (data && data.length > 0) {
      setPages(data as GuidePage[])
    } else {
      setPages(fallbacks)
    }
    setActivePageIdx(0)
  }

  const handleOpenBooklet = (guide: QuietGuide) => {
    setActiveGuide(guide)
    loadGuidePages(guide.id)
    // Default to 'chime' soundscape so beautiful chimes start playing automatically when reading booklets
    const selectedSoundscape = (guide.soundscape && guide.soundscape !== 'none') ? guide.soundscape : 'chime'
    toggleSoundscape(selectedSoundscape)
  }

  const handleCloseBooklet = () => {
    setActiveGuide(null)
    setPages([])
    stopSoundscape()
  }

  // --- PROGRAMMATIC WEB AUDIO SOUNDSCAPES ---
  const initAudio = () => {
    if (audioCtxRef.current) return
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioCtx()
    audioCtxRef.current = ctx

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.2, ctx.currentTime) // peaceful background level
    masterGain.connect(ctx.destination)
    masterGainRef.current = masterGain
  }

  const stopSoundscape = () => {
    if (sourceNodeRef.current) {
      try {
        (sourceNodeRef.current as any).stop()
      } catch (e) {}
      sourceNodeRef.current = null
    }
    setPlayingSound('none')
  }

  const toggleSoundscape = (sound: 'rain' | 'wind' | 'chime') => {
    if (playingSound === sound) {
      stopSoundscape()
      return
    }

    stopSoundscape()
    initAudio()
    const ctx = audioCtxRef.current!
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime

    if (sound === 'rain') {
      // White noise lowpassed rain
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1

      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(450, now)

      src.connect(filter)
      filter.connect(masterGainRef.current!)
      src.start(now)
      sourceNodeRef.current = src
    } else if (sound === 'wind') {
      // Modulated pink noise wave swell
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(80, now)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(100, now)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.05, now)

      const lfo = ctx.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(0.08, now) // slow wave sweep

      const lfoGain = ctx.createGain()
      lfoGain.gain.setValueAtTime(0.1, now)

      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(masterGainRef.current!)

      osc.start(now)
      lfo.start(now)
      sourceNodeRef.current = osc
    } else if (sound === 'chime') {
      const now = ctx.currentTime

      // 1. Create Grounding Ambient Drone (Om frequency 136.1Hz & warm fifth 203.2Hz)
      const droneOsc1 = ctx.createOscillator()
      const droneOsc2 = ctx.createOscillator()
      const droneFilter = ctx.createBiquadFilter()
      const droneGain = ctx.createGain()

      droneOsc1.type = 'sine'
      droneOsc1.frequency.setValueAtTime(136.1, now)
      droneOsc2.type = 'triangle'
      droneOsc2.frequency.setValueAtTime(203.2, now) // warm fifth drone support

      droneFilter.type = 'lowpass'
      droneFilter.frequency.setValueAtTime(180, now)

      droneGain.gain.setValueAtTime(0.015, now) // whisper quiet base support

      // LFO to let the drone breathe
      const droneLFO = ctx.createOscillator()
      const droneLFOGain = ctx.createGain()
      droneLFO.type = 'sine'
      droneLFO.frequency.setValueAtTime(0.05, now) // extremely slow 20s cycle
      droneLFOGain.gain.setValueAtTime(0.005, now)

      droneLFO.connect(droneLFOGain)
      droneLFOGain.connect(droneGain.gain)

      droneOsc1.connect(droneFilter)
      droneOsc2.connect(droneFilter)
      droneFilter.connect(droneGain)
      droneGain.connect(masterGainRef.current!)

      droneOsc1.start(now)
      droneOsc2.start(now)
      droneLFO.start(now)

      // 2. Pentatonic Chime Strike Engine
      let isChiming = true
      let activeOscillators: { stop: () => void }[] = []

      const playChimeStrike = () => {
        if (!audioCtxRef.current || !isChiming) return
        const cCtx = audioCtxRef.current
        const cNow = cCtx.currentTime

        // Pentatonic frequencies: E4, G4, A4, C5, D5, E5, G5, A5
        const scale = [329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]
        const freq = scale[Math.floor(Math.random() * scale.length)]

        // Rod resonance simulation
        const oscRod = cCtx.createOscillator()
        oscRod.type = 'sine'
        oscRod.frequency.setValueAtTime(freq, cNow)

        // Shimmer harmonic tone (high pitch peak)
        const oscShimmer = cCtx.createOscillator()
        oscShimmer.type = 'sine'
        oscShimmer.frequency.setValueAtTime(freq * 3.01, cNow) // slightly detuned 3rd harmonic for realism

        const strikeGain = cCtx.createGain()
        strikeGain.gain.setValueAtTime(0.0, cNow)
        strikeGain.gain.linearRampToValueAtTime(0.06, cNow + 0.02) // instant strike attack
        strikeGain.gain.exponentialRampToValueAtTime(0.0001, cNow + 5.0) // long peaceful ring-out

        const shimmerGain = cCtx.createGain()
        shimmerGain.gain.setValueAtTime(0.0, cNow)
        shimmerGain.gain.linearRampToValueAtTime(0.02, cNow + 0.01)
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, cNow + 1.2) // shimmer dies down quickly

        // Spatial panning (pan left or right randomly for beautiful acoustic width)
        const panner = cCtx.createStereoPanner ? cCtx.createStereoPanner() : null
        if (panner) {
          panner.pan.setValueAtTime(Math.random() * 1.6 - 0.8, cNow)
        }

        oscRod.connect(strikeGain)
        oscShimmer.connect(shimmerGain)

        if (panner) {
          strikeGain.connect(panner)
          shimmerGain.connect(panner)
          panner.connect(masterGainRef.current!)
        } else {
          strikeGain.connect(masterGainRef.current!)
          shimmerGain.connect(shimmerGain)
          strikeGain.connect(masterGainRef.current!)
          // Fallback if no panner
        }

        oscRod.start(cNow)
        oscShimmer.start(cNow)

        oscRod.stop(cNow + 6)
        oscShimmer.stop(cNow + 2)

        const cleanObj = {
          stop: () => {
            try {
              oscRod.stop()
              oscShimmer.stop()
            } catch(e){}
          }
        }
        activeOscillators.push(cleanObj)
        setTimeout(() => {
          activeOscillators = activeOscillators.filter(o => o !== cleanObj)
        }, 6000)

        // Schedule next wind strike organically (2.5s to 5.5s delay)
        const nextDelay = 2500 + Math.random() * 3000
        setTimeout(playChimeStrike, nextDelay)
      }

      playChimeStrike()

      sourceNodeRef.current = {
        stop: () => {
          isChiming = false
          try {
            droneOsc1.stop()
            droneOsc2.stop()
            droneLFO.stop()
          } catch(e){}
          activeOscillators.forEach(o => o.stop())
        }
      } as any
    }

    setPlayingSound(sound)
  }

  // Creator helpers
  const handleAddPageInput = () => {
    setPageInputs(prev => [...prev, { title: '', content: '' }])
  }

  const handlePageInputChange = (idx: number, field: 'title' | 'content', val: string) => {
    setPageInputs(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p))
  }

  const handleCastGuide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || pageInputs.some(p => !p.content.trim())) return
    setIsCasting(true)

    const res = await createQuietGuide(title, description, soundscape, pageInputs)
    if (res.success) {
      toast.success('Your Quiet Booklet Guide has been bound.', { icon: '📘' })
      setTitle('')
      setDescription('')
      setSoundscape('none')
      setPageInputs([{ title: '', content: '' }])
      setIsAdding(false)
      loadGuides()
      router.refresh()
    } else {
      toast.error(res.error || 'Failed to bind guide')
    }
    setIsCasting(false)
  }

  return (
    <div className="w-full select-none animate-fade-in relative z-20 px-5 max-w-[800px] mx-auto">
      
      {/* Booklet Header */}
      <div className="flex justify-between items-center mb-10 border-b-[0.5px] border-outline-variant/30 pb-4">
        <span className="font-label-caps text-[10px] font-bold text-outline tracking-[0.25em] uppercase">
          Intentional Guides
        </span>
        {currentUser && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 font-label-caps text-[9px] font-bold text-amber-600 hover:text-amber-500 tracking-wider uppercase transition-colors"
          >
            <Plus size={12} />
            Bind Guide Booklet
          </button>
        )}
      </div>

      {/* Booklet Scrapbook Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {guides.map((guide) => (
          <div
            key={guide.id}
            onClick={() => handleOpenBooklet(guide)}
            className="rounded-[32px] border border-outline-variant/30 bg-surface-container-low/40 p-8 flex flex-col justify-between cursor-pointer group hover:scale-[1.02] hover:bg-surface-container transition-all min-h-[220px]"
          >
            <div className="space-y-3">
              <span className="material-symbols-outlined text-[36px] text-amber-600/70 select-none">
                menu_book
              </span>
              <h3 className="font-display text-xl text-primary font-medium tracking-wide leading-snug">{guide.title}</h3>
              {guide.description && (
                <p className="font-sans text-xs leading-relaxed text-on-surface-variant/80 italic">
                  "{guide.description}"
                </p>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t border-outline-variant/20">
              <span className="font-sans text-[8px] uppercase tracking-widest text-outline font-bold">
                by {guide.users?.display_name || 'Anonymous'}
              </span>
              <span className="font-sans text-[9px] uppercase tracking-widest text-amber-600 font-bold flex items-center gap-1">
                Open Booklet
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* --- HORIZONTAL BOOKLET SNAPPING VIEW MODAL --- */}
      <AnimatePresence>
        {activeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-background/97 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
          >
            {/* Soft background sound indicators floating top right */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseBooklet}
                  className="w-9 h-9 mr-1 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-primary shadow-sm"
                  title="Back to booklets"
                >
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <span className="material-symbols-outlined text-amber-600 text-[18px]">import_contacts</span>
                <span className="font-display text-sm text-primary font-medium">{activeGuide.title}</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Programmable Soundscape toggles within booklet */}
                <div className="flex items-center gap-2">
                  {[
                    { key: 'rain', label: '🌧️', name: 'Rain' },
                    { key: 'wind', label: '🌊', name: 'Tide' },
                    { key: 'chime', label: '🔔', name: 'Chime' }
                  ].map(s => (
                    <button
                      key={s.key}
                      onClick={() => toggleSoundscape(s.key as any)}
                      className={`w-7 h-7 rounded-full border text-xs flex items-center justify-center transition-all ${
                        playingSound === s.key 
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700 animate-pulse' 
                          : 'border-outline-variant/30 text-outline hover:text-primary'
                      }`}
                      title={`${s.name} Soundscape`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleCloseBooklet}
                  className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-primary"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* booklet frame with snap horizontal scrolling */}
            <div className="w-full max-w-2xl flex flex-col items-center gap-10 mt-16">
              
              {/* snap-x Horizontal Scroller */}
              <div 
                className="w-full h-80 sm:h-96 flex overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-[40px] border border-outline-variant/30 bg-surface-container-low relative shadow-xl"
                onScroll={(e) => {
                  const el = e.currentTarget
                  const pageIdx = Math.round(el.scrollLeft / el.clientWidth)
                  setActivePageIdx(pageIdx)
                }}
              >
                {pages.map((p, idx) => (
                  <div 
                    key={idx} 
                    className="w-full h-full snap-start snap-always flex flex-col items-center justify-center text-center p-8 sm:p-14 shrink-0 overflow-y-auto"
                  >
                    <div className="space-y-6 max-w-md">
                      {p.title && (
                        <h4 className="font-display text-lg text-amber-700/80 italic font-medium tracking-wide">
                          {p.title}
                        </h4>
                      )}
                      
                      <p className="font-serif text-base sm:text-lg leading-relaxed text-primary">
                        "{p.content}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Booklet pagination indicator dots */}
              <div className="flex items-center gap-3">
                {pages.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activePageIdx === idx 
                        ? 'w-6 bg-primary' 
                        : 'w-1.5 bg-outline-variant/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- BIND GUIDE BOOKLET POPUP --- */}
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
              onSubmit={handleCastGuide}
              className="w-full max-w-lg bg-surface-container-low border-[0.5px] border-outline-variant p-6 rounded-[32px] shadow-2xl relative flex flex-col gap-5 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center border-b-[0.5px] border-outline-variant/30 pb-4 shrink-0">
                <h3 className="font-display text-lg text-primary font-medium flex items-center gap-2">
                  <BookOpen size={16} className="text-amber-500" />
                  Bind Mindful Guide
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                  title="Close (Esc)"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Title & soundscape */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Guide title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Daily Digital Sabbath"
                    className="w-full h-11 px-4 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] text-xs font-medium text-foreground rounded-2xl outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Default soundscape</label>
                  <select
                    value={soundscape}
                    onChange={e => setSoundscape(e.target.value as any)}
                    className="w-full h-11 px-4 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] text-xs font-medium text-foreground rounded-2xl outline-none"
                  >
                    <option value="none">None</option>
                    <option value="rain">🌧️ Muffled Rain</option>
                    <option value="wind">🌊 Slow Tides</option>
                    <option value="chime">🔔 Zen Chimes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Description/Introduction</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Curating offline rest windows..."
                  className="w-full h-11 px-4 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] text-xs font-medium text-foreground rounded-2xl outline-none"
                />
              </div>

              {/* Dynamic Pages inputs */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div className="flex justify-between items-center border-b-[0.5px] border-outline-variant/20 pb-2">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-outline">Booklet pages</span>
                  <button
                    type="button"
                    onClick={handleAddPageInput}
                    className="text-[9px] uppercase tracking-widest font-bold text-amber-600 hover:text-amber-500 flex items-center gap-1.5"
                  >
                    <Plus size={10} /> Add Page
                  </button>
                </div>

                <div className="space-y-4">
                  {pageInputs.map((page, idx) => (
                    <div key={idx} className="p-4 border border-outline-variant/30 rounded-2xl bg-surface-container-lowest/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-amber-700/80 italic">Page {idx + 1}</span>
                        {pageInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPageInputs(prev => prev.filter((_, i) => i !== idx))}
                            className="text-[8px] uppercase font-bold text-outline hover:text-error leading-none"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={page.title}
                        onChange={e => handlePageInputChange(idx, 'title', e.target.value)}
                        placeholder="Page Header (optional, e.g. I. Meditation)"
                        className="w-full h-10 px-4 bg-background border border-border-mint/50 focus:border-border-mint rounded-xl text-xs font-medium"
                      />
                      <textarea
                        value={page.content}
                        onChange={e => handlePageInputChange(idx, 'content', e.target.value)}
                        placeholder="Write booklet page content reflections..."
                        required
                        className="w-full h-20 bg-background border border-border-mint/50 focus:border-border-mint rounded-xl p-4 resize-none outline-none text-xs font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isCasting || !title.trim()}
                className="w-full h-12 rounded-full font-label-caps text-xs font-bold bg-primary text-on-primary hover:bg-primary/95 transition-all tracking-[0.2em] uppercase disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
              >
                {isCasting ? <Loader2 size={16} className="animate-spin" /> : null}
                Bind & Publish Booklet
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
