'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Square, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function AudioReflectionsPlayer({ 
  audioUrl, 
  isWhisper = false, 
  playCount = 0, 
  postId 
}: { 
  audioUrl: string; 
  isWhisper?: boolean; 
  playCount?: number; 
  postId?: string; 
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [localPlayCount, setLocalPlayCount] = useState(playCount)
  const [isDissolved, setIsDissolved] = useState(false)
  const router = useRouter()

  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)

  const setupWebAudio = () => {
    if (!audioRef.current || audioContextRef.current || !isWhisper) return
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const ctx = new AudioContextClass()
      audioContextRef.current = ctx

      const source = ctx.createMediaElementSource(audioRef.current)
      sourceRef.current = source

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      // Degrade frequency based on play count (10 listens limit)
      // Mapped linearly from 10000Hz (0 play count) down to 250Hz (9 play count)
      const freq = Math.max(250, 10000 - (localPlayCount || 0) * 1050)
      filter.frequency.setValueAtTime(freq, ctx.currentTime)
      filterRef.current = filter

      source.connect(filter)
      filter.connect(ctx.destination)
    } catch (e) {
      console.error('Failed to initialize Web Audio API filter:', e)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current || isDissolved) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (isWhisper && localPlayCount >= 9) {
      setIsDissolved(true)
      toast.info('The whisper has dissolved into pure silence.')
      router.refresh()
    }
  }

  const handlePlay = async () => {
    setIsPlaying(true)
    
    // Web Audio setup
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume()
    } else {
      setupWebAudio()
    }

    if (isWhisper && postId) {
      const { incrementWhisperPlayCount } = await import('@/app/(main)/actions')
      const res = await incrementWhisperPlayCount(postId)
      if (res?.success) {
        if (res.dissolved) {
          setIsDissolved(true)
          toast.info('The whisper has dissolved into pure silence.')
          router.refresh()
        } else if (res.count !== undefined) {
          setLocalPlayCount(res.count)
        }
      }
    }
  }

  const formatAudioTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (isDissolved) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl border-[0.5px] border-outline-variant/20 bg-surface-container-low max-w-sm mt-4 select-none italic text-outline text-xs w-64 text-left">
        <span className="material-symbols-outlined text-[15px] opacity-40">leak_remove</span>
        <span>Reflection dissolved into silence</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border-[0.5px] border-outline-variant/30 bg-surface-container-low max-w-sm mt-4 select-none animate-fade-in shadow-xs text-left w-64 sm:w-80">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        preload="metadata"
        crossOrigin="anonymous"
      />
      
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-on-primary hover:scale-105 active:scale-95 transition-all shadow-xs shrink-0"
      >
        {isPlaying ? (
          <Square size={13} fill="currentColor" className="text-current" />
        ) : (
          <Play size={15} fill="currentColor" className="ml-0.5 text-current" />
        )}
      </button>
      
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-primary">
          <span>{isWhisper ? 'Transient Whisper' : 'Audio Reflection'}</span>
          <span className="text-[9px] text-outline font-semibold">{formatAudioTime(currentTime)} / {formatAudioTime(duration || 0)}</span>
        </div>
        <div className="h-1 bg-outline-variant/30 rounded-full relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        {isWhisper && (
          <span className="text-[8px] text-purple-500 font-bold uppercase tracking-wider animate-pulse leading-none">
            {10 - localPlayCount} plays remaining before dissolution
          </span>
        )}
      </div>
    </div>
  )
}
