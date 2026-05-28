import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Check, BookOpen } from 'lucide-react'
import { JournalInput } from '@/components/journal-input'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const { data: existing } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="h-[100dvh] flex flex-col bg-[#E0F2F1] overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 border-b border-teal-900/5 bg-[#E0F2F1]/80 backdrop-blur-md z-10">
        <Link href="/feed" className="p-2 -ml-2 rounded-full hover:bg-teal-900/5 text-slate-700 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          My Daily Journal <span className="text-xl">✍️</span>
        </h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-teal-900/5 text-teal-700 transition-colors">
          <Check size={22} strokeWidth={2} />
        </button>
      </header>
      
      {/* Document Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 hide-scrollbar relative">
        <div className="max-w-xl mx-auto w-full relative">
          
          {/* Document Card */}
          <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-sm rounded-[32px] p-6 pb-8 relative z-10 min-h-[300px]">
            <div className="mb-4">
              <p className="text-[14px] font-bold text-slate-800">[Today's Date: {todayStr}]</p>
              <p className="text-[14px] font-bold text-slate-800">Title: Daily Reflection</p>
            </div>
            
            <div className="text-[14px] text-slate-800 leading-relaxed font-medium space-y-4 whitespace-pre-wrap">
              {existing?.content || (
                <span className="text-slate-400 italic">No entries yet today. Start writing...</span>
              )}
            </div>
          </div>

          {/* Decorative Book */}
          <div className="absolute -left-3 bottom-4 text-4xl rotate-[-15deg] drop-shadow-sm z-20">
            📖
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="px-5 pb-6 pt-2 shrink-0 bg-[#E0F2F1]">
        <div className="max-w-xl mx-auto">
          <JournalInput />
        </div>
      </div>
    </div>
  )
}
