'use client'

import { useState, useRef } from 'react'
import { createPost } from '@/app/(main)/actions'
import { Button } from '@/components/ui/button'
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
      className={`bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative transition-colors ${isExpanded ? 'bg-background' : ''}`}
    >
      {showSafeguard && (
        <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-xl rounded-3xl flex flex-col items-center justify-center p-8 text-center border border-primary/20">
          <p className="font-medium text-xl text-foreground mb-3 tracking-tight">Reflect before sharing?</p>
          <p className="text-base font-light text-muted-foreground mb-8 max-w-sm leading-relaxed">
            This seems emotional. Would you rather save it privately to your journal first, or are you sure you want to share it?
          </p>
          <div className="flex gap-4">
            <Button variant="outline" className="rounded-full px-6 border-border/50" onClick={() => setShowSafeguard(false)}>Cancel</Button>
            <Button className="rounded-full px-6" onClick={executePost}>Share Anyway</Button>
          </div>
        </div>
      )}

      <form onSubmit={handleInitialSubmit}>
        <textarea
          className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground/60 text-lg font-light transition-all"
          placeholder="What's on your mind?"
          value={content}
          rows={isExpanded || content ? 4 : 1}
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
                  <img src={URL.createObjectURL(file)} alt="Upload preview" className="max-h-48 rounded-2xl object-cover shadow-sm" />
                  <button 
                    type="button" 
                    onClick={() => setFile(null)}
                    className="absolute -top-3 -right-3 bg-background border border-border/50 text-foreground rounded-full p-1.5 shadow-sm hover:bg-muted transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {mood && (
                <div className="flex items-center gap-2 mt-2 mb-4">
                  <span className="text-xs font-medium uppercase tracking-widest bg-primary/5 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/10">
                    Feeling {mood}
                    <button type="button" onClick={() => setMood('')} className="hover:text-primary/50 transition-colors"><X size={14}/></button>
                  </span>
                </div>
              )}

              {showMoods && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 mt-2 mb-4 p-4 bg-muted/20 rounded-2xl border border-border/40"
                >
                  {MOODS.map(m => (
                    <button 
                      key={m} 
                      type="button"
                      onClick={() => { setMood(m); setShowMoods(false) }}
                      className="text-sm font-light px-4 py-1.5 rounded-full border border-border/50 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}

              {unlockDate && (
                 <div className="flex items-center gap-2 mt-2 mb-4">
                  <span className="text-xs font-medium bg-amber-500/5 border border-amber-500/20 text-amber-600 px-4 py-1.5 rounded-full flex items-center gap-2">
                    <Calendar size={14} />
                    Unlocks on {new Date(unlockDate).toLocaleDateString()}
                    <button type="button" onClick={() => setUnlockDate('')} className="hover:text-amber-600/50 transition-colors"><X size={14}/></button>
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
                    className="bg-background border border-border/50 shadow-sm rounded-xl px-4 py-2.5 text-sm outline-none text-muted-foreground"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </motion.div>
              )}
              
              <div className="flex items-center justify-between pt-6 mt-2 border-t border-border/30">
                <div className="flex items-center gap-1">
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
                    className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors rounded-full"
                    title="Add Image"
                  >
                    <ImagePlus size={20} strokeWidth={1.5} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowMoods(!showMoods)}
                    className={`p-2.5 transition-colors rounded-full ${showMoods ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}
                    title="Set Mood"
                  >
                    <Smile size={20} strokeWidth={1.5} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`p-2.5 transition-colors rounded-full ${showCalendar || unlockDate ? 'text-amber-500 bg-amber-500/5' : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-500/5'}`}
                    title="Time Capsule"
                  >
                    <Calendar size={20} strokeWidth={1.5} />
                  </button>
                  
                  <div className="relative flex items-center ml-2 border-l border-border/50 pl-4">
                    <select 
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="appearance-none bg-transparent text-sm font-medium text-muted-foreground outline-none cursor-pointer hover:text-foreground transition-colors pr-4"
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
                      className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <Button 
                      type="submit" 
                      disabled={(!content.trim() && !file) || isUploading || isValidating}
                      className="rounded-full px-6 gap-2"
                    >
                      {(isUploading || isValidating) ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  )
}
