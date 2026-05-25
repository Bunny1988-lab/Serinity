import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { JournalCreator } from '@/components/journal-creator'
import { Lock, BookHeart, Flame } from 'lucide-react'

import { MoodInsight } from '@/components/mood-insight'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch valid journal entries
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .or(`burn_after.is.null,burn_after.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })

  // Calculate simple mood stats
  const moodCounts = entries?.reduce((acc: any, entry: any) => {
    if (entry.mood) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1
    }
    return acc
  }, {})

  return (
    <div className="pb-32 md:pb-0 min-h-screen bg-background/50">
      <header className="sticky top-0 z-10 bg-background/80 px-6 py-6 backdrop-blur-2xl border-b border-border/30">
        <h1 className="text-2xl font-light tracking-tight flex items-center gap-2 text-foreground">
          <BookHeart size={24} className="text-primary opacity-80" strokeWidth={1.5} />
          Private Journal
        </h1>
      </header>
      
      <div className="p-6 space-y-12 max-w-xl mx-auto">
        <div className="bg-primary/5 rounded-3xl p-8 text-center space-y-3 relative overflow-hidden transition-all hover:bg-primary/10">
          <Lock className="absolute -right-4 -bottom-4 opacity-5 text-primary" size={120} />
          <h2 className="text-lg font-medium text-foreground relative z-10 tracking-tight">Your Safe Space</h2>
          <p className="text-sm font-light text-muted-foreground relative z-10 max-w-sm mx-auto leading-relaxed">
            Everything written here is securely encrypted. This space is entirely yours.
          </p>
        </div>

        {/* Mood Analytics */}
        <MoodInsight moodData={moodCounts} />

        <JournalCreator />

        <div className="space-y-12 mt-12">
          {entries?.length === 0 ? (
            <div className="text-center text-muted-foreground py-20 space-y-4">
              <BookHeart size={32} className="mx-auto opacity-20" strokeWidth={1} />
              <p className="text-lg font-light italic">Your journal feels peaceful.</p>
              <p className="text-sm font-light opacity-70">Take a moment to write your first reflection.</p>
            </div>
          ) : (
            entries?.map((entry: any) => (
              <article key={entry.id} className="relative space-y-4 pl-4 border-l-2 border-border/30 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between pb-2">
                  <p className="text-sm font-medium text-muted-foreground tracking-wide">
                    {new Date(entry.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-2">
                    {entry.mood && (
                      <span className="text-xs font-medium uppercase tracking-widest text-primary/70">
                        {entry.mood}
                      </span>
                    )}
                    {entry.burn_after && (
                      <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider bg-destructive/5 text-destructive px-3 py-1 rounded-full" title={`Burns after ${new Date(entry.burn_after).toLocaleString()}`}>
                        <Flame size={12} strokeWidth={2} />
                        Auto-delete
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-foreground text-lg leading-relaxed font-light whitespace-pre-wrap">
                  {entry.content}
                </p>

                {entry.image_url && (
                  <div className="mt-6 rounded-3xl overflow-hidden bg-muted/20">
                    <img src={entry.image_url} alt="Journal attachment" className="w-full h-auto object-cover max-h-[600px]" />
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
