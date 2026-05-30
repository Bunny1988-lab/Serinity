import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Check, Pen } from 'lucide-react'

export default async function JournalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-foreground pb-20 md:pb-0">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between shrink-0 bg-transparent z-10">
        <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
          <ChevronLeft size={24} strokeWidth={2} className="text-foreground" />
        </Link>
        <h1 className="text-[17px] font-bold text-foreground tracking-tight">
          My Daily Journal ✍️
        </h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors">
          <Check size={24} strokeWidth={2} className="text-[#659e72]" />
        </button>
      </header>
      
      {/* Journal Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-6 relative">
        <div className="bg-card shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[32px] p-6 min-h-[60vh] relative border border-border/50">
          <div className="text-[15px] font-medium text-foreground leading-relaxed whitespace-pre-wrap">
            <p className="font-bold mb-1">[Today's Date: Oct 28, 2023]</p>
            <p className="font-bold mb-4">Title: Reflecting on Project Progress and Clarity</p>
            <p>
              A blank slate for my thoughts today. After the conversation with Sarah and the AI, I feel much more grounded. The overwhelm is lifting. I've broken down the project into five key sub-tasks as suggested, and now I can actually see the path forward. Focusing on the sub-tasks first is such a smart approach. I'll make time each morning to prioritize them. It's amazing how a different perspective can make all the difference. I'm feeling a sense of accomplishment just for having a plan. Onwards!
            </p>
          </div>
          
          {/* Floating book icon */}
          <div className="absolute -bottom-4 -left-3 text-4xl transform -rotate-12 drop-shadow-md">
            📖
          </div>
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="px-4 pb-6 pt-2 shrink-0 bg-transparent relative z-20">
        <div className="bg-card border border-border/50 rounded-full flex items-center pr-1.5 pl-4 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] h-[52px]">
          <input 
            type="text"
            placeholder="Keep writing your thoughts..." 
            className="flex-1 bg-transparent px-2 text-[15px] font-medium placeholder:text-foreground/50 focus:outline-none"
          />
          <button className="w-[38px] h-[38px] rounded-full bg-[#f4e8cc] text-[#c1684c] flex items-center justify-center shrink-0 shadow-sm border border-[#e8d5a7]">
            <Pen size={18} strokeWidth={2.5} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
