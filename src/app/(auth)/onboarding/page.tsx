'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ThemeSelector } from '@/components/theme-selector'

const INTERESTS = [
  "Mindful Living", "Creativity", "Self Improvement", "Reading", "Wellness", 
  "Journaling", "Productivity", "Meditation", "Gratitude"
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [focus, setFocus] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const router = useRouter()

  const handleNext = () => setStep(s => s + 1)
  const handleComplete = () => router.push('/')

  const toggleInterest = (i: string) => {
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8 min-h-[400px] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-[#2F3E36]">Welcome to Serenity 🌿</h1>
            <p className="text-[#4A5D53]">Your calm digital space for growth, reflection, and meaningful connection.</p>
            <Button onClick={handleNext} className="w-full h-12 rounded-full bg-[#2F3E36] hover:bg-[#1A2922] text-white">Get Started</Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2F3E36]">Choose your focus</h2>
            <div className="space-y-3">
              {['Personal Growth', 'Journaling', 'Mindfulness', 'Meaningful Connections', 'Productivity'].map(f => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${focus === f ? 'border-[#2F3E36] bg-[#E8EFE9] text-[#2F3E36]' : 'border-border/50 hover:border-[#2F3E36]/50 text-[#4A5D53]'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button onClick={handleNext} disabled={!focus} className="w-full h-12 rounded-full bg-[#2F3E36] hover:bg-[#1A2922] text-white">Continue</Button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2F3E36]">Choose Interests</h2>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(i => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${interests.includes(i) ? 'border-[#2F3E36] bg-[#2F3E36] text-white' : 'border-border/50 hover:border-[#2F3E36]/50 text-[#4A5D53]'}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <Button onClick={handleNext} disabled={interests.length === 0} className="w-full h-12 rounded-full bg-[#2F3E36] hover:bg-[#1A2922] text-white">Continue</Button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#E8EFE9] to-[#CDE0D4] flex items-center justify-center shadow-inner text-4xl">
              ✨
            </div>
            <h2 className="text-2xl font-semibold text-[#2F3E36]">Meet Seren</h2>
            <p className="text-[#4A5D53]">Your AI companion for reflection, journaling guidance, and emotional support.</p>
            <Button onClick={handleNext} className="w-full h-12 rounded-full bg-[#2F3E36] hover:bg-[#1A2922] text-white">Say Hello</Button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <h2 className="text-2xl font-semibold text-[#2F3E36]">Choose Theme</h2>
            <ThemeSelector />
            <Button onClick={handleComplete} className="w-full h-12 rounded-full bg-[#2F3E36] hover:bg-[#1A2922] text-white mt-8">Complete Setup</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
