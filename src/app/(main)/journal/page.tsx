import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, PenTool, BarChart3, Star, Zap, Smile, Book } from 'lucide-react'
import { JournalCreator } from '@/components/journal-creator'

const JOURNAL_TYPES = [
  { id: 'daily', name: 'Daily Reflection', icon: Book, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'gratitude', name: 'Gratitude Journal', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'growth', name: 'Growth Journal', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'mood', name: 'Mood Journal', icon: Smile, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'free', name: 'Free Writing', icon: PenTool, color: 'text-slate-500', bg: 'bg-slate-500/10' },
]

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-foreground relative pb-32 md:pb-0">
      {/* Header */}
      <header className="px-6 pt-8 pb-6 flex items-center justify-between shrink-0 bg-background/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Link>
          <h1 className="text-2xl font-light tracking-wide text-foreground">
            Journal
          </h1>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto px-6 py-8 hide-scrollbar">
        <div className="max-w-2xl mx-auto space-y-10">
          
          {/* Write New Entry */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">New Entry</h2>
            <JournalCreator />
          </section>

          {/* Journal Types */}
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Journal Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {JOURNAL_TYPES.map(type => (
                <button key={type.id} className="p-4 rounded-2xl bg-card/40 hover:bg-card/60 backdrop-blur-md border border-border/50 text-left transition-colors flex flex-col gap-3 group">
                  <div className={`w-10 h-10 rounded-full ${type.bg} flex items-center justify-center`}>
                    <type.icon size={20} className={type.color} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{type.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Journal Analytics */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <BarChart3 size={20} className="text-primary" />
                Your Insights
              </h2>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Private Only</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card/40 backdrop-blur-md rounded-3xl p-5 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Writing Frequency</p>
                <p className="text-3xl font-light">12 <span className="text-sm font-medium text-muted-foreground">days this month</span></p>
              </div>
              <div className="bg-card/40 backdrop-blur-md rounded-3xl p-5 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Top Mood</p>
                <p className="text-3xl font-light flex items-center gap-2">Calm <span className="text-xl">🌿</span></p>
              </div>
            </div>
          </section>

          {/* Recent Entries */}
          <section className="space-y-4 pb-8">
            <h2 className="text-lg font-medium text-foreground">Recent Reflections</h2>
            <div className="space-y-3">
              {recentEntries && recentEntries.length > 0 ? (
                recentEntries.map(entry => (
                  <div key={entry.id} className="bg-card/30 backdrop-blur-sm p-4 rounded-2xl border border-border/40">
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-light text-foreground line-clamp-3 leading-relaxed">
                      {entry.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">No entries yet. Start your journey today.</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
