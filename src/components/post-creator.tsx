'use client'

import { useState, useRef } from 'react'
import { createPost } from '@/app/(main)/actions'
import { ImagePlus, Smile, Send, X, Loader2, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

const MOODS = ['Happy', 'Reflective', 'Calm', 'Anxious', 'Excited', 'Tired']

export function PostCreator({ circles = [] }: { circles?: { id: string, name: string }[] }) {
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('all_friends')
  const [mood, setMood] = useState('')
  const [showMoods, setShowMoods] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [unlockDate, setUnlockDate] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)
  const [showSafeguard, setShowSafeguard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const [isValidating, setIsValidating] = useState(false)

  async function handleInitialSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !file) return

    // If it's going to all friends, validate using Seren AI
    if (visibility === 'all_friends') {
      setIsValidating(true)
      try {
        const res = await fetch('/api/seren/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'safe-share', text: content })
        })
        if (res.ok) {
          const data = await res.json()
          if (data.result === 'VULNERABLE') {
            setShowSafeguard(true)
            setIsValidating(false)
            return
          }
        }
      } catch (err) {
        console.error('Safeguard check failed', err)
      }
      setIsValidating(false)
    }

    await executePost()
  }

  async function executePost() {
    setIsUploading(true)
    setShowSafeguard(false)
    let imageUrl = ''

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `post-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (!uploadError) {
        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
        imageUrl = data.publicUrl
      }
    }

    const formData = new FormData()
    formData.append('content', content)
    formData.append('visibility', visibility)
    if (mood) formData.append('mood', mood)
    if (imageUrl) formData.append('image_url', imageUrl)
    if (unlockDate) formData.append('unlock_date', unlockDate)
    
    await createPost(formData)
    setContent('')
    setMood('')
    setFile(null)
    setUnlockDate('')
    setShowCalendar(false)
    setIsUploading(false)
    setIsExpanded(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div 
      layout
      className={`bg-card border border-border-mint rounded-[32px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] relative transition-colors`}
    >
      {showSafeguard && (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center p-8 text-center border border-border-mint">
          <p className="font-bold text-[18px] text-foreground mb-2">Reflect before sharing?</p>
          <p className="text-[14px] font-medium text-foreground/70 mb-8 max-w-sm leading-relaxed">
            This seems emotional. Would you rather save it privately to your journal first, or are you sure you want to share it?
          </p>
          <div className="flex gap-3">
            <button className="px-6 py-2.5 rounded-full border border-border-mint text-[13px] font-bold text-foreground bg-card hover:bg-background transition-all shadow-sm" onClick={() => setShowSafeguard(false)}>Cancel</button>
            <button className="px-6 py-2.5 rounded-full text-[13px] font-bold text-white bg-foreground hover:bg-foreground/90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)]" onClick={executePost}>Share Anyway</button>
          </div>
        </div>
      )}

      <form onSubmit={handleInitialSubmit}>
        <textarea
          className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-foreground/40 text-[16px] font-medium transition-all"
          placeholder="What's on your mind?"
          value={content}
          rows={isExpanded || content ? 3 : 1}
          onFocus={() => setIsExpanded(true)}
          onChange={(e) => setContent(e.target.value)}
          disabled={isUploading}
        />

        <AnimatePresence>
          {(isExpanded || content || file) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {file && (
                <div className="relative inline-block mt-4 mb-4">
                  <img src={URL.createObjectURL(file)} alt="Upload preview" className="max-h-48 rounded-[20px] object-cover border border-border-mint" />
                  <button 
                    type="button" 
                    onClick={() => setFile(null)}
                    className="absolute -top-3 -right-3 bg-card border border-border-mint text-foreground rounded-full p-1.5 shadow-sm hover:bg-background transition-colors"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {mood && (
                <div className="flex items-center gap-2 mt-2 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-widest bg-background text-foreground px-4 py-1.5 rounded-full flex items-center gap-2 border border-border-mint">
                    Feeling {mood}
                    <button type="button" onClick={() => setMood('')} className="hover:text-red-500 transition-colors"><X size={14} strokeWidth={2.5} /></button>
                  </span>
                </div>
              )}

              {showMoods && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 mt-2 mb-4 p-4 bg-background/50 rounded-[24px] border border-border-mint"
                >
                  {MOODS.map(m => (
                    <button 
                      key={m} 
                      type="button"
                      onClick={() => { setMood(m); setShowMoods(false) }}
                      className="text-[13px] font-bold px-4 py-2 rounded-full border border-border-mint bg-card text-foreground hover:bg-foreground hover:text-white hover:border-foreground transition-all shadow-sm"
                    >
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}

              {unlockDate && (
                 <div className="flex items-center gap-2 mt-2 mb-4">
                  <span className="text-[11px] font-bold bg-[#FFF9E6] border border-[#FFE082] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 uppercase tracking-widest">
                    <Calendar size={14} strokeWidth={2.5} />
                    Unlocks {new Date(unlockDate).toLocaleDateString()}
                    <button type="button" onClick={() => setUnlockDate('')} className="hover:text-red-500 transition-colors"><X size={14} strokeWidth={2.5} /></button>
                  </span>
                </div>
              )}

              {showCalendar && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 mb-4 flex items-center gap-2"
                >
                  <input 
                    type="date" 
                    value={unlockDate}
                    onChange={(e) => { setUnlockDate(e.target.value); setShowCalendar(false) }}
                    className="bg-card border border-border-mint shadow-sm rounded-full px-5 py-2.5 text-[14px] font-bold text-foreground outline-none"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </motion.div>
              )}
              
              <div className="flex flex-wrap gap-4 items-center justify-between pt-6 mt-2 border-t border-border-mint/50">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-foreground/50 hover:text-foreground hover:bg-background transition-colors rounded-full"
                    title="Add Image"
                  >
                    <ImagePlus size={20} strokeWidth={2} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowMoods(!showMoods)}
                    className={`p-2.5 transition-colors rounded-full ${showMoods ? 'text-foreground bg-background' : 'text-foreground/50 hover:text-foreground hover:bg-background'}`}
                    title="Set Mood"
                  >
                    <Smile size={20} strokeWidth={2} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`p-2.5 transition-colors rounded-full ${showCalendar || unlockDate ? 'text-[#D4AF37] bg-[#FFF9E6]' : 'text-foreground/50 hover:text-[#D4AF37] hover:bg-[#FFF9E6]'}`}
                    title="Time Capsule"
                  >
                    <Calendar size={20} strokeWidth={2} />
                  </button>
                  
                  <div className="relative flex items-center ml-2 border-l border-border-mint pl-4">
                    <select 
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="appearance-none bg-transparent text-[13px] font-bold text-foreground/60 outline-none cursor-pointer hover:text-foreground transition-colors pr-2"
                    >
                      <option value="all_friends">All Friends</option>
                      <option value="only_me">Only Me</option>
                      {circles.map(c => (
                        <option key={c.id} value={`circle_${c.id}`}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isExpanded && !content && !file && (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        setShowMoods(false);
                        setShowCalendar(false);
                      }}
                      className="text-[13px] font-bold text-foreground/60 hover:text-foreground px-4 py-2 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={(!content.trim() && !file) || isUploading || isValidating}
                    className="h-10 px-6 flex items-center gap-2 rounded-full font-bold text-[13px] shadow-sm bg-foreground hover:bg-foreground/90 transition-all text-white disabled:opacity-50 select-none cursor-pointer"
                  >
                    {(isUploading || isValidating) ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} strokeWidth={2.5} />}
                    Share
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  )
}
