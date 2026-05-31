'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Volume2, VolumeX, Sparkles, Smile } from 'lucide-react'

interface PresentUser {
  id: string
  display_name: string
  avatar_url?: string | null
  action?: string
  glow_level?: number
  updated_at?: string
}

export function PresenceRoom({ currentUser }: { currentUser: { id: string; display_name: string; avatar_url?: string | null } }) {
  const [usersInRoom, setUsersInRoom] = useState<PresentUser[]>([])
  const [userAction, setUserAction] = useState<string>('Reflecting')
  const [glowLevel, setGlowLevel] = useState<number>(1)
  const [activeSound, setActiveSound] = useState<'none' | 'rain' | 'tide'>('none')
  const [bellToggled, setBellToggled] = useState(false)

  const supabase = createClient()
  const channelRef = useRef<any>(null)

  // Web Audio Synthesizer Refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rainNodeRef = useRef<AudioNode | null>(null)
  const tideNodeRef = useRef<AudioNode | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    // Set up Supabase Presence Channel
    const channel = supabase.channel('presence_room', {
      config: { presence: { key: currentUser.id } }
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const parsedUsers: PresentUser[] = []
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any
          if (presences && presences[0]) {
            parsedUsers.push({
              id: key,
              display_name: presences[0].display_name || 'Anonymous',
              avatar_url: presences[0].avatar_url,
              action: presences[0].action || 'Reflecting',
              glow_level: presences[0].glow_level || 1,
              updated_at: presences[0].updated_at
            })
          }
        })
        setUsersInRoom(parsedUsers)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handled via sync usually, but safe to keep track
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handled via sync
      })
      .on('broadcast', { event: 'flicker' }, ({ payload }) => {
        // Animate user's candle/cup glow temporarily when someone clicks it!
        setUsersInRoom(prev => prev.map(u => {
          if (u.id === payload.userId) {
            return { ...u, glow_level: (u.glow_level || 1) + 1.5 }
          }
          return u
        }))
        // Slowly decay the glow back to baseline
        setTimeout(() => {
          setUsersInRoom(prev => prev.map(u => {
            if (u.id === payload.userId) {
              return { ...u, glow_level: Math.max(1, (u.glow_level || 1) - 1.5) }
            }
            return u
          }))
        }, 1200)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            display_name: currentUser.display_name,
            avatar_url: currentUser.avatar_url,
            action: userAction,
            glow_level: glowLevel,
            updated_at: new Date().toISOString()
          })
        }
      })

    return () => {
      channel.unsubscribe()
      // Clean up sound synthesizers
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [])

  // Update track state when action or glow changes
  const updatePresenceState = async (newAction: string, newGlow: number) => {
    if (channelRef.current) {
      await channelRef.current.track({
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
        action: newAction,
        glow_level: newGlow,
        updated_at: new Date().toISOString()
      })
    }
  }

  const handleActionChange = (action: string) => {
    setUserAction(action)
    updatePresenceState(action, glowLevel)
  }

  const handleSelfGlowIncrement = () => {
    const nextGlow = Math.min(5, glowLevel + 0.5)
    setGlowLevel(nextGlow)
    updatePresenceState(userAction, nextGlow)
  }

  const handleGlowReset = () => {
    setGlowLevel(1)
    updatePresenceState(userAction, 1)
  }

  // Click on a user's presence card to trigger a flicker broadcast event
  const triggerFlicker = (userId: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'flicker',
        payload: { userId }
      })
    }
  }

  // --- WEB AUDIO SYNTHESIZERS ---
  const initAudio = () => {
    if (audioCtxRef.current) return
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioContextClass()
    audioCtxRef.current = ctx

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.5, ctx.currentTime)
    masterGain.connect(ctx.destination)
    masterGainRef.current = masterGain
  }

  // Rain sound generator using white noise and low-pass filter
  const startRain = () => {
    initAudio()
    const ctx = audioCtxRef.current!
    
    // Create random buffer
    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }

    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, ctx.currentTime) // Muffled rain tone

    const rainGain = ctx.createGain()
    rainGain.gain.setValueAtTime(0.25, ctx.currentTime)

    whiteNoise.connect(filter)
    filter.connect(rainGain)
    rainGain.connect(masterGainRef.current!)

    whiteNoise.start()
    rainNodeRef.current = whiteNoise
  }

  const stopRain = () => {
    if (rainNodeRef.current) {
      try {
        (rainNodeRef.current as AudioBufferSourceNode).stop()
      } catch (e) {}
      rainNodeRef.current = null
    }
  }

  // Tide sound generator using sine wave modulated by low frequency oscillator (LFO)
  const startTide = () => {
    initAudio()
    const ctx = audioCtxRef.current!

    // Main deep carrier wave
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(75, ctx.currentTime) // Deep ocean low frequency

    // Filter to make it sound soft/muddy
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(120, ctx.currentTime)

    // Gain node that modulates volume
    const gainNode = ctx.createGain()
    gainNode.gain.setValueAtTime(0.02, ctx.currentTime)

    // LFO that oscillates slowly (breathing rate: 0.1Hz, 10 seconds per wave cycle)
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime)

    const lfoGain = ctx.createGain()
    lfoGain.gain.setValueAtTime(0.12, ctx.currentTime) // wave amplitude

    lfo.connect(lfoGain)
    lfoGain.connect(gainNode.gain) // Modulates master tide volume

    osc.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(masterGainRef.current!)

    osc.start()
    lfo.start()

    tideNodeRef.current = osc
  }

  const stopTide = () => {
    if (tideNodeRef.current) {
      try {
        (tideNodeRef.current as any).stop()
      } catch (e) {}
      tideNodeRef.current = null
    }
  }

  // Synthesize Tatami Zen Bell
  const playBellChime = () => {
    initAudio()
    const ctx = audioCtxRef.current!
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime

    // Synthesize partial frequencies for a metallic bowl sound
    const partials = [220, 442, 663, 885, 1100]
    const gains = [0.4, 0.25, 0.15, 0.1, 0.05]

    partials.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(gains[idx] * 0.4, now)
      // Exponential decay of the chimes
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 4.5)

      osc.connect(gainNode)
      gainNode.connect(masterGainRef.current!)

      osc.start(now)
      osc.stop(now + 5)
    })

    setBellToggled(true)
    setTimeout(() => setBellToggled(false), 2000)
  }

  const handleSoundscapeToggle = (sound: 'rain' | 'tide') => {
    if (activeSound === sound) {
      if (sound === 'rain') stopRain()
      if (sound === 'tide') stopTide()
      setActiveSound('none')
    } else {
      // Stop anything else first
      stopRain()
      stopTide()
      
      if (sound === 'rain') startRain()
      if (sound === 'tide') startTide()
      setActiveSound(sound)
    }
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col items-center pt-32 pb-24 px-5">
      <div className="w-full max-w-[900px] flex flex-col items-center">
        {/* Title / Intro */}
        <div className="text-center mb-16 max-w-lg">
          <p className="font-label-caps text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-[0.25em]">
            The Silent Lounge
          </p>
          <h3 className="font-display text-4xl text-primary font-semibold tracking-wide italic">
            Zen Presence Room
          </h3>
          <p className="font-sans text-xs text-on-surface-variant/80 mt-3 leading-relaxed">
            A real-time quiet tea room. No messages, no distractions. Sit together with friends in absolute silent focus or deep relaxation.
          </p>
        </div>

        {/* --- MAIN ZEN BOARD --- */}
        <div className="w-full bg-gradient-to-b from-surface-container-low/40 to-surface-container-low/90 border-[0.5px] border-outline-variant/30 rounded-3xl p-10 md:p-14 relative overflow-hidden shadow-xs min-h-[500px] flex flex-col justify-between">
          <div className="absolute inset-0 bg-radial from-amber-500/3 via-transparent to-transparent blur-3xl pointer-events-none" />

          {/* Connected Friends Grid as Floating Candles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 justify-items-center items-center py-6">
            <AnimatePresence>
              {usersInRoom.map((user) => {
                const isSelf = user.id === currentUser.id
                const candleScale = Math.min(1.8, 1 + ((user.glow_level || 1) - 1) * 0.2)
                const isUserOnline = true // Presence list represents online users

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    whileHover={{ y: -4 }}
                    onClick={() => triggerFlicker(user.id)}
                    className="flex flex-col items-center cursor-pointer relative group"
                  >
                    {/* Glowing Candle / Cup Element */}
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      
                      {/* Floating hot steam micro-animation for tea cups, or candle flame flicker */}
                      {user.action === 'Brewing Tea' || user.action === 'Resting' ? (
                        <div className="absolute top-1 flex flex-col gap-1 select-none pointer-events-none">
                          <motion.div 
                            animate={{ y: [-2, -12], x: [0, 4, -4, 0], opacity: [0, 0.7, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="w-1 h-3 rounded-full bg-amber-500/30 blur-xs"
                          />
                          <motion.div 
                            animate={{ y: [-2, -15], x: [0, -4, 4, 0], opacity: [0, 0.5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
                            className="w-1.5 h-4 bg-amber-500/20 rounded-full blur-xs"
                          />
                        </div>
                      ) : (
                        // Standard candle flame flicker
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 0.95, 1.05, 1],
                            opacity: [0.8, 0.95, 0.7, 0.85, 0.8]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute top-4 w-2 h-4 rounded-full bg-gradient-to-t from-amber-500 to-yellow-400 blur-[2px]"
                          style={{ scale: candleScale }}
                        />
                      )}

                      {/* Glowing aura around candle/cup */}
                      <motion.div
                        animate={{ 
                          boxShadow: [
                            `0 0 20px 4px rgba(245,158,11,${0.15 * (user.glow_level || 1)})`,
                            `0 0 35px 8px rgba(245,158,11,${0.25 * (user.glow_level || 1)})`,
                            `0 0 20px 4px rgba(245,158,11,${0.15 * (user.glow_level || 1)})`
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center backdrop-blur-xs select-none"
                      >
                        <span className="material-symbols-outlined text-[24px] text-amber-500/90">
                          {user.action === 'Brewing Tea' ? 'local_cafe' :
                           user.action === 'Reading' ? 'menu_book' :
                           user.action === 'Writing' ? 'edit_note' :
                           user.action === 'Resting' ? 'spa' : 'self_improvement'}
                        </span>
                      </motion.div>
                    </div>

                    {/* Metadata Card */}
                    <div className="text-center mt-2 w-28">
                      <p className="font-ui-element text-xs font-bold text-primary truncate leading-tight flex items-center justify-center gap-1">
                        {user.display_name}
                        {isSelf && <span className="text-[9px] px-1 bg-primary/5 text-primary rounded border-[0.5px] border-outline-variant font-medium">You</span>}
                      </p>
                      <p className="font-sans text-[8px] uppercase tracking-wider text-on-surface-variant/80 mt-1 font-bold">
                        {user.action || 'Reflecting'}
                      </p>
                    </div>

                    {/* Glow indicators showing how many chimes/clicks they received */}
                    {user.glow_level && user.glow_level > 1 && (
                      <span className="absolute -top-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-0.5 shadow-xs leading-none">
                        <Sparkles size={8} />
                        {(user.glow_level - 1) * 2}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Soundscapes Soundboard & Self State Broadcaster Panel */}
          <div className="border-t-[0.5px] border-outline-variant/30 pt-10 mt-12 flex flex-col md:flex-row md:items-center justify-between gap-8 z-20 relative">
            
            {/* Broadcaster Controller */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-bold text-outline">Your active state</span>
              <div className="flex flex-wrap gap-2">
                {['Reflecting', 'Reading', 'Writing', 'Brewing Tea', 'Resting'].map((act) => (
                  <button
                    key={act}
                    onClick={() => handleActionChange(act)}
                    className={`font-label-caps text-[9px] font-bold uppercase tracking-widest border-[0.5px] px-3.5 py-2 transition-all rounded-full hover:scale-102 active:scale-98 ${
                      userAction === act
                        ? 'bg-primary text-on-primary border-primary'
                        : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>

              {/* Increase self glow */}
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  onClick={handleSelfGlowIncrement}
                  className="font-sans text-[9px] uppercase tracking-widest font-bold text-amber-600 hover:text-amber-500 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                  Increase soft glow
                </button>
                {glowLevel > 1 && (
                  <button
                    onClick={handleGlowReset}
                    className="font-sans text-[8px] uppercase tracking-widest font-semibold text-outline hover:text-primary transition-colors leading-none"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Programmatic Soundboard Controls */}
            <div className="flex flex-col gap-3">
              <span className="text-[9px] uppercase tracking-widest font-bold text-outline md:text-right">Room soundscapes</span>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {/* Programmable rain sound */}
                <button
                  onClick={() => handleSoundscapeToggle('rain')}
                  className={`font-label-caps text-[9px] font-bold uppercase tracking-widest border-[0.5px] px-4 py-2.5 transition-all rounded-xl flex items-center gap-1.5 ${
                    activeSound === 'rain'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">rainy</span>
                  Rain noise
                </button>

                {/* Programmable ocean waves */}
                <button
                  onClick={() => handleSoundscapeToggle('tide')}
                  className={`font-label-caps text-[9px] font-bold uppercase tracking-widest border-[0.5px] px-4 py-2.5 transition-all rounded-xl flex items-center gap-1.5 ${
                    activeSound === 'tide'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">waves</span>
                  Ocean tide
                </button>

                {/* Programmable zen chime bell */}
                <button
                  onClick={playBellChime}
                  className={`font-label-caps text-[9px] font-bold uppercase tracking-widest border-[0.5px] px-4 py-2.5 transition-all rounded-xl flex items-center gap-1.5 border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary cursor-pointer ${
                    bellToggled ? 'scale-105 bg-amber-500/5 text-amber-600 border-amber-500/35' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">notifications</span>
                  Tatami Chime
                </button>
              </div>
              <p className="text-[8px] text-outline text-right italic font-medium leading-none">
                *Programmed dynamically in Web Audio API. Zero asset downloads.
              </p>
            </div>
            
          </div>
        </div>

        {/* Footer Ambient Reflection */}
        <p className="font-sans text-[11px] text-on-surface-variant/50 italic mt-8 leading-none">
          Click on a connection's icon to chime them and gently flicker their light.
        </p>
      </div>
    </div>
  )
}
