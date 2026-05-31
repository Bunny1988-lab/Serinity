import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Check } from 'lucide-react'
import { JournalEditor } from '@/components/journal-editor'
import { DailyJournalCard } from '@/components/daily-journal-card'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the most recent journal entry for display/editing
  const { data: latestEntry } = await supabase
    .from('journal_entries')
    .select('id, content, created_at, title')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })

  const displayContent = latestEntry?.content || ''
  const displayTitle = latestEntry?.title || `Reflecting on the day`

  return (
    <div className="flex flex-col h-full min-h-0 bg-background relative w-full overflow-hidden">
      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="w-full flex justify-between items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent relative z-20">
        <Link href="/home" className="active:scale-95 transition-transform duration-200 text-foreground p-2 -ml-2 rounded-full hover:bg-card border border-transparent hover:border-border-mint">
          <ChevronLeft size={28} strokeWidth={2} />
        </Link>
        <h1 className="text-[17px] font-bold text-foreground">My Daily Journal ✍️</h1>
        <button className="active:scale-95 transition-transform duration-200 text-foreground p-2 -mr-2 rounded-full hover:bg-card border border-transparent hover:border-border-mint">
          <Check size={24} strokeWidth={2.5} />
        </button>
      </header>
      
      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-6 pt-2 pb-48 space-y-4 scroll-smooth relative z-10 hide-scrollbar"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="max-w-[800px] mx-auto w-full h-full">
          <DailyJournalCard 
            initialContent={displayContent} 
            today={today} 
            title={displayTitle} 
          />
        </div>
      </div>

      {/* ── INPUT BAR ───────────────────────────────────── */}
      <JournalEditor userId={user.id} existingEntryId={latestEntry?.id} />
    </div>
  )
}
