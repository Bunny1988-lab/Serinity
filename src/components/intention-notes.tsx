'use client'

import { useState, useRef } from 'react'
import { Plus, X, Sparkles, Loader2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { updateDailyIntention, updateProfileAvatar, updateProfileSettings, createPost } from '@/app/(main)/actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UserNote {
  id: string
  display_name: string | null
  avatar_url: string | null
  intention_text: string | null
  intention_expires_at: string | null
}

interface Props {
  currentUserId: string
  currentUserProfile: {
    display_name: string | null
    avatar_url: string | null
    intention_text: string | null
    intention_expires_at: string | null
  }
  connections: UserNote[]
}

export function IntentionNotes({ currentUserId, currentUserProfile, connections }: Props) {
  const profile = currentUserProfile || {
    display_name: 'You',
    avatar_url: null,
    intention_text: null,
    intention_expires_at: null
  }

  const router = useRouter()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [viewingNote, setViewingNote] = useState<UserNote | null>(null)
  const [inputText, setInputText] = useState(profile.intention_text || '')
  const [loading, setLoading] = useState(false)
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null)

  // Profile Edit Local States
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Filter notes that have not expired
  const getActiveNote = (note: { intention_text: string | null; intention_expires_at: string | null }) => {
    if (!note || !note.intention_text || !note.intention_expires_at) return null
    const expires = new Date(note.intention_expires_at).getTime()
    if (expires < Date.now()) return null
    return note.intention_text
  }

  const myActiveNote = getActiveNote(profile)

  const activeConnections = connections
    .map((c) => ({ ...c, active_text: getActiveNote(c) }))
    .filter((c) => c.active_text)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${currentUserId}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const supabase = createClient()
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file)

    if (!uploadError) {
      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)
      
      const formData = new FormData()
      formData.append('avatar_url', data.publicUrl)
      await updateProfileAvatar(formData)
      toast.success('Profile picture updated.', { icon: '📷' })
      router.refresh()
    } else {
      toast.error('Failed to upload picture.')
    }
    setUploadingAvatar(false)
  }

  async function handleSave() {
    setLoading(true)
    
    // Save daily intention
    const res = await updateDailyIntention(inputText.trim() || null)
    
    // Save display name if modified
    if (displayName.trim() && displayName.trim() !== (profile.display_name || '').trim()) {
      const formData = new FormData()
      formData.append('display_name', displayName.trim())
      await updateProfileSettings(formData)
    }

    if (res.success) {
      toast.success('Intention and profile details updated.', { icon: '✨' })
      setIsEditOpen(false)
      router.refresh()
    } else {
      toast.error('Failed to update details.')
    }
    setLoading(false)
  }

  async function handleShareAsPost() {
    if (!inputText.trim()) return
    setLoading(true)
    
    const formData = new FormData()
    formData.append('content', `My Focus Intention for today: "${inputText.trim()}" ✨`)
    formData.append('visibility', 'all_friends')
    formData.append('mood', 'Reflective')
    
    try {
      await createPost(formData)
      toast.success('Your thought has been shared to the feed!', { icon: '🌱' })
      setIsEditOpen(false)
      router.refresh()
    } catch (e) {
      toast.error('Failed to share to feed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full shrink-0 border-b-[0.5px] border-outline-variant/30 pb-2 mb-2">
      <div className="flex gap-6 overflow-x-auto py-4 px-6 hide-scrollbar">
        
        {/* Current User Note Bubble */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 relative cursor-pointer" onClick={() => setIsEditOpen(true)}>
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border-[0.5px] border-outline-variant shadow-xs">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-primary">{displayName?.[0]?.toUpperCase() || 'Y'}</span>
            )}
            <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Plus size={16} className="text-white" />
            </div>
          </div>
          
          {myActiveNote ? (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface border-[0.5px] border-outline-variant/60 rounded-full px-2.5 py-0.5 max-w-[80px] shadow-xs text-center">
              <p className="text-[10px] text-primary truncate leading-tight font-medium select-none">{myActiveNote}</p>
            </div>
          ) : (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface-container-low border-[0.5px] border-outline-variant/30 rounded-full p-1.5 shadow-xs">
              <Plus size={8} className="text-outline" />
            </div>
          )}
          
          <span className="text-[10px] text-outline uppercase tracking-wider font-semibold mt-1 truncate max-w-[65px]">
            {displayName.split(' ')[0] || 'You'}
          </span>
        </div>

        {/* Connections Notes list */}
        {activeConnections.map((c) => (
          <div 
            key={c.id} 
            className="flex flex-col items-center gap-1.5 shrink-0 relative cursor-pointer group"
            onClick={() => setViewingNote(c as any)}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border-[0.5px] border-outline-variant shadow-xs group-hover:scale-102 transition-transform duration-300">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt="" className="w-full h-full object-cover grayscale opacity-90" />
              ) : (
                <span className="font-bold text-primary">{c.display_name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface border-[0.5px] border-outline-variant/60 rounded-full px-2.5 py-0.5 max-w-[80px] shadow-xs text-center">
              <p className="text-[10px] text-primary truncate leading-tight font-medium select-none">{c.active_text}</p>
            </div>
            
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mt-1 truncate max-w-[65px]">
              {c.display_name?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* ── EDIT INTENTION / PROFILE MODAL ─────────────────────────── */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface border-[0.5px] border-outline-variant w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsEditOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors animate-fade-in"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-2 mb-6 text-secondary">
                <Sparkles size={16} />
                <span className="font-label-caps text-xs font-bold uppercase tracking-wider">Set Daily Intention</span>
              </div>
              
              {/* Profile details editing (name & avatar) */}
              <div className="flex flex-col items-center gap-4 mb-6">
                {/* Mini Avatar Uploader */}
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()} title="Change Profile Picture">
                  <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center overflow-hidden border-[0.5px] border-outline-variant shadow-sm relative">
                    {uploadingAvatar ? (
                      <Loader2 size={20} className="animate-spin text-primary" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">{displayName?.[0]?.toUpperCase() || 'Y'}</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-white text-[18px]">photo_camera</span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={avatarInputRef} 
                    onChange={handleAvatarChange} 
                  />
                </div>

                {/* Display Name Input */}
                <div className="w-full">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-outline mb-1.5 block pl-1">Your Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    className="w-full h-10 bg-surface-container border-none focus:ring-0 rounded-xl px-4 text-xs font-semibold text-primary placeholder:text-outline/40 shadow-xs"
                  />
                </div>
              </div>

              <h3 className="font-headline-sm text-[20px] text-primary mb-1 italic">What is your state of focus?</h3>
              <p className="text-on-surface-variant text-[11px] font-medium mb-4">Your status note expires automatically after 24 hours.</p>

              <div className="relative mb-6">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, 60))}
                  placeholder="In deep reflection... (max 60 chars)"
                  className="w-full bg-surface-container border-none focus:ring-0 rounded-2xl p-4 pr-12 text-sm text-primary placeholder:text-outline/50 font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-outline">
                  {inputText.length}/60
                </span>
              </div>

              <div className="flex gap-3 justify-between items-center mt-2 border-t border-outline-variant/20 pt-4 shrink-0">
                <div>
                  {profile.intention_text && (
                    <button
                      type="button"
                      disabled={loading || uploadingAvatar}
                      onClick={async () => {
                        setLoading(true)
                        await updateDailyIntention(null)
                        setInputText('')
                        toast.success('Your intention note has been cleared.')
                        setIsEditOpen(false)
                        setLoading(false)
                        router.refresh()
                      }}
                      className="py-2.5 px-3 bg-transparent text-error hover:bg-error/5 text-[10px] font-label-caps uppercase tracking-wider font-bold rounded-lg cursor-pointer animate-fade-in"
                    >
                      Clear Note
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {inputText.trim() && (
                    <button
                      type="button"
                      disabled={loading || uploadingAvatar}
                      onClick={handleShareAsPost}
                      className="py-2.5 px-3.5 rounded-xl border border-amber-600/30 hover:bg-amber-500/5 text-amber-700 text-[10px] font-label-caps uppercase tracking-wider font-bold flex items-center gap-1.5 cursor-pointer animate-fade-in transition-all active:scale-95"
                      title="Share this thought as a feed post"
                    >
                      <Sparkles size={11} className="text-amber-600" />
                      Share to Feed
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={loading || uploadingAvatar}
                    onClick={handleSave}
                    className="py-2.5 px-5 bg-primary text-on-primary hover:opacity-90 text-[10px] font-label-caps uppercase tracking-wider font-bold transition-all active:scale-98 rounded-xl cursor-pointer"
                  >
                    Save Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW NOTE MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {viewingNote && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setViewingNote(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface border-[0.5px] border-outline-variant w-full max-w-sm rounded-3xl p-6 shadow-2xl relative text-center flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewingNote(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
              >
                <X size={14} />
              </button>

              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container border-[0.5px] border-outline-variant flex items-center justify-center mb-4">
                {viewingNote.avatar_url ? (
                  <img src={viewingNote.avatar_url} alt="" className="w-full h-full object-cover grayscale opacity-90" />
                ) : (
                  <span className="text-xl font-bold text-primary">{viewingNote.display_name?.[0]?.toUpperCase()}</span>
                )}
              </div>

              <h4 className="font-headline-sm text-lg text-primary mb-6 italic">{viewingNote.display_name}</h4>

              <div className="bg-surface-container-low border-[0.5px] border-outline-variant/60 rounded-2xl p-5 mb-6 max-w-xs relative w-full">
                <p className="font-ui-element text-sm font-semibold text-primary leading-relaxed">
                  "{viewingNote.intention_text}"
                </p>
              </div>

              <div className="flex gap-3 justify-center mb-6 w-full max-w-xs shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    if (!viewingNote.intention_text) return
                    await navigator.clipboard.writeText(viewingNote.intention_text)
                    setCopiedNoteId(viewingNote.id)
                    toast.success('Copied thought to clipboard.', { icon: '📋' })
                    setTimeout(() => setCopiedNoteId(null), 2000)
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-[10px] font-label-caps uppercase tracking-wider font-bold text-on-surface-variant flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  {copiedNoteId === viewingNote.id ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      Copy
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewingNote(null)
                    router.push(`/messages?u=${viewingNote.id}`)
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-on-primary hover:opacity-90 text-[10px] font-label-caps uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[14px] text-white">chat</span>
                  Reply DM
                </button>
              </div>

              <span className="text-[9px] text-outline font-bold uppercase tracking-wider">Active for 24 hours</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
