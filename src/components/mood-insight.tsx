'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export function MoodInsight({ moodData }: { moodData: Record<string, number> }) {
  const [insight, setInsight] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function fetchInsight() {
    setIsLoading(true)
    try {
      const moodsStr = Object.entries(moodData).map(([m, c]) => `${c}x ${m}`).join(', ')
      const res = await fetch('/api/seren/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mood-insight', text: moodsStr })
      })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setInsight(data.result)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  if (!moodData || Object.keys(moodData).length === 0) return null

  return (
    <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm relative overflow-hidden group">
      <h3 className="text-sm font-medium tracking-wide text-foreground/80 mb-4 uppercase text-center flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-primary" />
        Emotional Landscape
      </h3>
      
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {Object.entries(moodData).map(([mood, count]) => (
          <div key={mood} className="px-4 py-2 bg-muted/30 rounded-full border border-border/40 text-sm flex items-center gap-2 transition-transform hover:scale-105">
            <span className="font-light text-foreground">{mood}</span>
            <span className="text-muted-foreground/60 text-xs font-medium">{count as number}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        {!insight && !isLoading && (
          <button 
            onClick={fetchInsight}
            className="text-xs text-primary/80 hover:text-primary transition-colors border border-primary/20 rounded-full px-4 py-2 bg-primary/5 hover:bg-primary/10"
          >
            Ask Seren for an insight
          </button>
        )}
        {isLoading && <p className="text-sm font-light text-muted-foreground animate-pulse">Seren is reflecting...</p>}
        {insight && (
          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <p className="text-sm font-light text-foreground italic">"{insight}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
