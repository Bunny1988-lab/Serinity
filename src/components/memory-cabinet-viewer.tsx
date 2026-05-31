'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createMemoryCabinet } from '@/app/(main)/actions-zen'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Folder, Eye, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Cabinet {
  id: string
  title: string
  cover_image_url: string | null
  created_at: string
}

export function MemoryCabinetViewer({ 
  profileUserId, 
  isOwnProfile 
}: { 
  profileUserId: string
  isOwnProfile: boolean
}) {
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [activeCabinet, setActiveCabinet] = useState<Cabinet | null>(null)
  const [cabinetItems, setCabinetItems] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedItems, setSelectedItems] = useState<{ post_id?: string; vignette_id?: string }[]>([])
  
  // Available items to select from (posts & vignettes)
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadCabinets()
  }, [profileUserId])

  async function loadCabinets() {
    const { data } = await supabase
      .from('memory_cabinets')
      .select('*')
      .eq('user_id', profileUserId)
      .order('created_at', { ascending: false })

    if (data) setCabinets(data)
  }

  async function loadCabinetDetails(cabinetId: string) {
    const { data } = await supabase
      .from('cabinet_items')
      .select(`
        created_at,
        posts (id, content, image_url, mood),
        vignettes (id, image_url, caption)
      `)
      .eq('cabinet_id', cabinetId)

    if (data) setCabinetItems(data)
  }

  const handleOpenCabinet = (cab: Cabinet) => {
    setActiveCabinet(cab)
    loadCabinetDetails(cab.id)
  }

  const handleLoadAvailable = async () => {
    setLoadingItems(true)
    setIsAdding(true)

    // Load user posts
    const { data: posts } = await supabase
      .from('posts')
      .select('id, content, image_url, created_at')
      .eq('author_id', profileUserId)
      .is('audio_is_whisper', false) // don't highlight dissolved whispers
      
    // Load user vignettes
    const { data: vignettes } = await supabase
      .from('vignettes')
      .select('id, caption, image_url, created_at')
      .eq('user_id', profileUserId)

    const combined = [
      ...(posts || []).map(p => ({ ...p, type: 'post', label: p.content || 'Photo Post' })),
      ...(vignettes || []).map(v => ({ ...v, type: 'vignette', label: v.caption || 'Daily Vignette' }))
    ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setAvailableItems(combined)
    setLoadingItems(false)
  }

  const handleToggleSelect = (item: any) => {
    const isSelected = selectedItems.some(i => 
      item.type === 'post' ? i.post_id === item.id : i.vignette_id === item.id
    )

    if (isSelected) {
      setSelectedItems(prev => prev.filter(i => 
        item.type === 'post' ? i.post_id !== item.id : i.vignette_id !== item.id
      ))
    } else {
      setSelectedItems(prev => [
        ...prev, 
        item.type === 'post' ? { post_id: item.id } : { vignette_id: item.id }
      ])
    }
  }

  const handleCreateCabinet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    // Pick first selected image as cover, or null
    let coverUrl: string | null = null
    if (selectedItems.length > 0) {
      const firstId = selectedItems[0]
      const matching = availableItems.find(i => 
        firstId.post_id ? i.id === firstId.post_id : i.id === firstId.vignette_id
      )
      if (matching) coverUrl = matching.image_url
    }

    const res = await createMemoryCabinet(title, coverUrl, selectedItems)
    if (res.success) {
      toast.success('Memory Cabinet filed in profile scrapbook drawers.', { icon: '📦' })
      setTitle('')
      setSelectedItems([])
      setIsAdding(false)
      loadCabinets()
    } else {
      toast.error(res.error || 'Failed to create memory cabinet')
    }
  }

  return (
    <div className="w-full select-none animate-fade-in relative z-20">
      
      {/* Drawer Section Header */}
      <div className="flex justify-between items-center mb-8 border-b-[0.5px] border-outline-variant/30 pb-4">
        <h3 className="font-label-caps text-xs font-bold text-primary uppercase tracking-[0.25em] flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary">book</span>
          Memory Scrapbooks
        </h3>
        {isOwnProfile && (
          <button
            onClick={handleLoadAvailable}
            className="flex items-center gap-1.5 font-label-caps text-[9px] font-bold text-amber-600 hover:text-amber-500 tracking-wider uppercase transition-colors"
          >
            <Plus size={12} />
            Add Cabinet Box
          </button>
        )}
      </div>

      {/* Grid of Scrapbook drawers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {cabinets.map((cab) => (
          <div
            key={cab.id}
            onClick={() => handleOpenCabinet(cab)}
            className="aspect-square rounded-3xl border border-outline-variant/30 bg-surface-container-low/40 p-4 flex flex-col justify-between cursor-pointer group hover:scale-[1.03] hover:bg-surface-container transition-all select-none shadow-xs"
          >
            {/* Box visual mockup */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface border border-outline-variant/20 relative shadow-inner">
              {cab.cover_image_url ? (
                <img 
                  src={cab.cover_image_url} 
                  alt="" 
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-105 transition-all duration-700" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-amber-500/5 text-amber-600">
                  <Folder size={24} strokeWidth={1.5} />
                </div>
              )}
            </div>

            <div className="mt-2 text-left">
              <h4 className="font-display text-sm text-primary font-medium tracking-wide truncate">{cab.title}</h4>
              <p className="font-sans text-[8px] uppercase tracking-wider text-outline font-bold mt-0.5 leading-none">
                SCRAPBOOK BOX
              </p>
            </div>
          </div>
        ))}

        {cabinets.length === 0 && (
          <p className="text-xs text-outline font-medium tracking-wide italic leading-normal col-span-full">
            No memories are archived in private highlights boxes yet.
          </p>
        )}
      </div>

      {/* --- BOX VIEWER MODAL CONTAINER --- */}
      <AnimatePresence>
        {activeCabinet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-background/96 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none overflow-y-auto"
          >
            <div className="w-full max-w-4xl flex flex-col gap-6 relative my-auto">
              {/* Header */}
              <div className="flex justify-between items-center border-b-[0.5px] border-outline-variant/30 pb-4">
                <div className="text-left">
                  <span className="font-label-caps text-[9px] font-bold text-on-surface-variant tracking-[0.25em] uppercase">Memory highlight drawer</span>
                  <h3 className="font-display text-2xl text-primary font-medium italic mt-1">{activeCabinet.title}</h3>
                </div>
                <button 
                  onClick={() => { setActiveCabinet(null); setCabinetItems([]); }}
                  className="w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-primary"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Bento Content box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-1">
                {cabinetItems.map((item, idx) => {
                  const content = item.posts || item.vignettes
                  if (!content) return null

                  const isPost = !!item.posts
                  const text = isPost ? content.content : content.caption

                  return (
                    <div
                      key={idx}
                      className="rounded-[28px] border border-outline-variant/30 bg-surface-container-low p-5 flex flex-col gap-3 relative group overflow-hidden shadow-xs"
                    >
                      {content.image_url && (
                        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-background border border-outline-variant/20 relative shadow-sm">
                          <img src={content.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      {text && (
                        <p className={`font-display text-sm leading-relaxed text-primary italic ${content.mood ? 'bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent' : ''}`}>
                          "{text}"
                        </p>
                      )}

                      <span className="font-sans text-[8px] uppercase tracking-widest text-outline font-bold">
                        {isPost ? 'POST SIGNAL' : 'DAILY VIGNETTE'}
                      </span>
                    </div>
                  )
                })}

                {cabinetItems.length === 0 && (
                  <p className="text-xs text-outline font-medium tracking-wide italic py-10 col-span-full">
                    No linked signals inside this drawer box.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADD DRAWER POPUP --- */}
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
              onSubmit={handleCreateCabinet}
              className="w-full max-w-md bg-surface-container-low border-[0.5px] border-outline-variant p-6 rounded-[32px] shadow-2xl relative flex flex-col gap-6"
            >
              <div className="flex justify-between items-center border-b-[0.5px] border-outline-variant/30 pb-4">
                <h3 className="font-display text-lg text-primary font-medium flex items-center gap-2">
                  <Folder size={16} className="text-amber-500" />
                  Create Memory Scrapbook
                </h3>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Cabinet drawer title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Kyoto Memories, Silent Mornings"
                  className="w-full h-12 px-5 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] text-xs font-medium text-foreground rounded-2xl outline-none transition-all"
                  required
                />
              </div>

              {/* Selection list */}
              <div className="space-y-2 flex-grow flex flex-col min-h-0">
                <label className="text-[9px] uppercase tracking-widest font-bold text-outline">Select curations to file (First image is cover)</label>
                {loadingItems ? (
                  <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin" /></div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {availableItems.map((item) => {
                      const isSelected = selectedItems.some(i => 
                        item.type === 'post' ? i.post_id === item.id : i.vignette_id === item.id
                      )

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleSelect(item)}
                          className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-colors ${
                            isSelected 
                              ? 'border-amber-500/50 bg-amber-500/5 text-amber-700' 
                              : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface'
                          }`}
                        >
                          <span className="truncate max-w-[200px]">{item.label}</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-outline px-2 py-0.5 bg-surface-container rounded">
                            {item.type}
                          </span>
                        </button>
                      )
                    })}

                    {availableItems.length === 0 && (
                      <p className="text-xs text-outline italic py-4">No curations available to archive.</p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!title.trim() || selectedItems.length === 0}
                className="w-full h-12 rounded-full font-label-caps text-xs font-bold bg-primary text-on-primary hover:bg-primary/95 transition-all tracking-[0.2em] uppercase disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                Assemble Cabinet Drawer
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
