'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPost } from '@/app/(main)/actions'
import { createClient } from '@/lib/supabase/client'
import { Loader2, X, ImagePlus, Smile } from 'lucide-react'

const MOODS = ['Reflective', 'Calm', 'Inspired', 'Melancholy', 'Grateful']

function AudioPlayerMini({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggle = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  return (
    <div className="flex items-center gap-3">
      <audio 
        ref={audioRef} 
        src={src} 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        onEnded={() => setIsPlaying(false)} 
      />
      <button 
        type="button" 
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-[16px] text-current" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>
      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Preview Reflection</span>
    </div>
  )
}

export function CreatePostModal({ circles = [] }: { circles?: { id: string, name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState('all_friends')
  const [mood, setMood] = useState('')
  const [showMoods, setShowMoods] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  
  // Custom Slow Social Suite States
  const [isSunsetLocked, setIsSunsetLocked] = useState(false)
  const [audioIsWhisper, setAudioIsWhisper] = useState(false)

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      setIsRecording(true)
      setRecordingTime(0)
      mediaRecorder.start(200)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Microphone access denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setAudioBlob(null)
      setAudioUrl(null)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !file && !audioBlob) return

    setIsUploading(true)
    let imageUrl = ''
    let uploadedAudioUrl = ''

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

    if (audioBlob) {
      const fileName = `post-audio-${Math.random()}.webm`
      const filePath = `post-audio/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, audioBlob)

      if (!uploadError) {
        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
        uploadedAudioUrl = data.publicUrl
      }
    }

    const formData = new FormData()
    formData.append('content', content)
    formData.append('visibility', visibility)
    if (mood) formData.append('mood', mood)
    if (imageUrl) formData.append('image_url', imageUrl)
    if (uploadedAudioUrl) formData.append('audio_url', uploadedAudioUrl)
    formData.append('is_sunset_locked', isSunsetLocked.toString())
    formData.append('audio_is_whisper', audioIsWhisper.toString())
    
    await createPost(formData)
    
    setContent('')
    setMood('')
    setFile(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setIsSunsetLocked(false)
    setAudioIsWhisper(false)
    setIsUploading(false)
    setIsOpen(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-12 w-16 h-16 bg-primary text-on-primary rounded-full shadow-[0_0_30px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group z-40"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
 
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && !isRecording && setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ type: "spring", duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-surface-container-low border-[0.5px] border-outline-variant shadow-[0_40px_80px_rgba(0,0,0,0.07)] relative flex flex-col max-h-[90vh]"
              >
                <div className="flex items-center justify-between p-6 border-b-[0.5px] border-outline-variant/50">
                  <h2 className="font-headline-md text-xl font-medium text-primary">New Reflection</h2>
                  <button 
                    onClick={() => !isUploading && !isRecording && setIsOpen(false)}
                    className="p-2 -mr-2 text-on-surface-variant hover:text-primary transition-colors"
                  >
                    <X size={20} strokeWidth={1.5} />
                  </button>
                </div>
 
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  <textarea
                    placeholder="What is on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isUploading || isRecording}
                    className="w-full min-h-[120px] bg-transparent text-body-lg text-primary placeholder:text-on-surface-variant/50 resize-none outline-none leading-relaxed"
                  />
 
                  {file && (
                    <div className="space-y-3 mt-4">
                      <div className="relative group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="Upload preview" 
                          className="w-full max-h-[300px] object-cover border-[0.5px] border-outline-variant"
                        />
                        <button 
                          type="button" 
                          onClick={() => { setFile(null); setIsSunsetLocked(false); }}
                          className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md text-white flex items-center justify-center rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} strokeWidth={2} />
                        </button>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none pl-1">
                        <input 
                          type="checkbox" 
                          checked={isSunsetLocked} 
                          onChange={(e) => setIsSunsetLocked(e.target.checked)}
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-transparent"
                        />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-amber-500 animate-pulse">wb_twilight</span> 
                          Sunset Lock (Unveils only during sunset hours)
                        </span>
                      </label>
                    </div>
                  )}

                  {isRecording && (
                    <div className="mt-4 p-4 border-[0.5px] border-outline-variant/30 rounded-2xl bg-error/5 flex items-center justify-between text-xs animate-pulse">
                      <div className="flex items-center gap-2.5 text-error font-bold uppercase tracking-wider">
                        <div className="w-2.5 h-2.5 bg-error rounded-full" />
                        <span>Recording Reflection ({Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={cancelRecording} className="text-on-surface-variant hover:text-error transition-colors uppercase font-bold tracking-widest text-[9px]">Cancel</button>
                        <button type="button" onClick={stopRecording} className="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                          <span className="material-symbols-outlined text-[16px] text-white">square</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {audioUrl && !isRecording && (
                    <div className="space-y-3 mt-4">
                      <div className="p-4 border-[0.5px] border-outline-variant/30 rounded-2xl bg-surface-container-low flex items-center justify-between">
                        <AudioPlayerMini src={audioUrl} />
                        <button 
                          type="button" 
                          onClick={() => { setAudioBlob(null); setAudioUrl(null); setAudioIsWhisper(false); }}
                          className="w-8 h-8 rounded-full bg-surface-container hover:bg-error/10 text-on-surface-variant hover:text-error flex items-center justify-center transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none pl-1">
                        <input 
                          type="checkbox" 
                          checked={audioIsWhisper} 
                          onChange={(e) => setAudioIsWhisper(e.target.checked)}
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 bg-transparent"
                        />
                        <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-purple-500 animate-pulse">leak_remove</span> 
                          Decaying Whisper (Fades & dissolves after 10 plays)
                        </span>
                      </label>
                    </div>
                  )}
 
                  {mood && (
                    <div className="mt-4 mb-2 flex items-center gap-2">
                      <span className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-widest flex items-center gap-2 border-[0.5px] border-outline-variant px-3 py-1.5 rounded-full">
                        Feeling {mood}
                        <button type="button" onClick={() => setMood('')} className="hover:text-primary transition-colors">
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </span>
                    </div>
                  )}
 
                  <AnimatePresence>
                    {showMoods && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2 mt-4 pb-2">
                          {MOODS.map(m => (
                            <button 
                              key={m}
                              type="button"
                              onClick={() => { setMood(m); setShowMoods(false) }}
                              className="font-label-caps text-[10px] font-bold text-on-surface-variant hover:text-primary hover:border-primary uppercase tracking-widest border-[0.5px] border-outline-variant px-4 py-2 rounded-full transition-colors"
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
 
                <div className="p-6 border-t-[0.5px] border-outline-variant/50 bg-surface-container-lowest/50 flex items-center justify-between">
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
                      disabled={isRecording || isUploading}
                      className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded-full disabled:opacity-30"
                      title="Add Image"
                    >
                      <ImagePlus size={20} strokeWidth={1.5} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowMoods(!showMoods)}
                      disabled={isRecording || isUploading}
                      className={`p-2.5 transition-colors rounded-full disabled:opacity-30 ${showMoods ? 'text-primary bg-surface-container-high' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'}`}
                      title="Set Mood"
                    >
                      <Smile size={20} strokeWidth={1.5} />
                    </button>
                    <button 
                      type="button" 
                      onClick={startRecording}
                      disabled={isRecording || isUploading}
                      className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors rounded-full disabled:opacity-30"
                      title="Record Audio Reflection"
                    >
                      <span className="material-symbols-outlined text-[20px]">mic</span>
                    </button>
                    
                    <div className="ml-2 pl-4 border-l-[0.5px] border-outline-variant">
                      <select 
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        disabled={isRecording || isUploading}
                        className="appearance-none bg-transparent font-label-caps text-[10px] font-bold text-on-surface-variant hover:text-primary uppercase tracking-widest outline-none cursor-pointer transition-colors disabled:opacity-30"
                      >
                        <option value="all_friends">All Friends</option>
                        <option value="only_me">Only Me</option>
                        {circles.map(c => (
                          <option key={c.id} value={`circle_${c.id}`}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handlePost}
                    disabled={(!content.trim() && !file && !audioBlob) || isUploading || isRecording}
                    className="h-10 px-6 font-label-caps text-xs font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors tracking-[0.2em] uppercase disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Share
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
