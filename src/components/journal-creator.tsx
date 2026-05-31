'use client'

import { useState, useRef } from 'react'
import { createJournalEntry } from '@/app/(main)/actions'
import { Button } from '@/components/ui/button'
import { ImagePlus, Smile, Send, X, Loader2, Flame, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const MOODS = ['Happy', 'Reflective', 'Calm', 'Anxious', 'Excited', 'Tired', 'Grateful', 'Overwhelmed', 'Low']

export function JournalCreator() {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [showMoods, setShowMoods] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [burnAfter, setBurnAfter] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !file) return

    setIsUploading(true)
    let imageUrl = ''

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `journal_${Math.random()}.${fileExt}`
      const filePath = `journal-images/${fileName}`

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
    if (mood) formData.append('mood', mood)
    if (imageUrl) formData.append('image_url', imageUrl)
    if (burnAfter) formData.append('burn_after_hours', burnAfter)
    
    await createJournalEntry(formData)
    toast.success('Journal securely saved', {
      description: 'Your thoughts are safely encrypted in your vault.',
      icon: '🌿'
    })
    setContent('')
    setMood('')
    setFile(null)
    setBurnAfter('')
    setIsUploading(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div className="bg-card/30 backdrop-blur-md border border-border/50 rounded-[2rem] p-5 shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full bg-transparent resize-none outline-none text-foreground placeholder:text-muted-foreground min-h-[100px] text-lg font-light"
          placeholder="What's on your mind? (Private)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isUploading}
        />

        {file && (
          <div className="relative inline-block mt-2 mb-4">
            <img src={URL.createObjectURL(file)} alt="Upload preview" className="h-32 rounded-lg object-cover border border-border/50" />
            <button 
              type="button" 
              onClick={() => setFile(null)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {mood && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-2">
              Feeling {mood}
              <button type="button" onClick={() => setMood('')}><X size={12}/></button>
            </span>
          </div>
        )}

        {showMoods && (
          <div className="flex flex-wrap gap-2 mb-4 p-4 bg-secondary/50 rounded-2xl border border-border/40">
            {MOODS.map(m => (
              <button 
                key={m} 
                type="button"
                onClick={() => { setMood(m); setShowMoods(false) }}
                className="text-sm px-3 py-1 rounded-full border border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
              >
                {m}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-border/30 gap-y-2">
          <div className="flex items-center gap-1 sm:gap-2">
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
              className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/10"
              title="Add Private Image"
            >
              <ImagePlus size={20} />
            </button>
            <button 
              type="button" 
              onClick={() => setShowMoods(!showMoods)}
              className={`p-2 transition-colors rounded-full hover:bg-primary/10 ${showMoods ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary'}`}
              title="Tag Mood"
            >
              <Smile size={20} />
            </button>
            
            <div className="relative flex items-center">
              <Flame size={16} className={`absolute left-2 ${burnAfter ? 'text-destructive' : 'text-muted-foreground'}`} />
              <select 
                value={burnAfter}
                onChange={(e) => setBurnAfter(e.target.value)}
                className={`pl-8 pr-2 py-1 bg-transparent text-sm outline-none cursor-pointer rounded-lg hover:bg-muted/50 transition-colors ${burnAfter ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                title="Burn After Reflection"
              >
                <option value="">Keep forever</option>
                <option value="1">Burn in 1 hr</option>
                <option value="24">Burn in 24 hrs</option>
                <option value="168">Burn in 7 days</option>
              </select>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={(!content.trim() && !file) || isUploading}
            className="rounded-full px-5 h-10 transition-all shadow-sm shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isUploading
              ? <Loader2 size={15} className="animate-spin" />
              : <><span className="text-sm">Reflect</span><Lock size={14} /></>}
          </Button>
        </div>
      </form>
    </div>
  )
}
