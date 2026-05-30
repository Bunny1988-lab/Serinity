import { createClient } from '@/lib/supabase/server'
import { Search, Settings, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-foreground pb-24 md:pb-0">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between shrink-0 bg-transparent z-10">
        <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
          <ChevronLeft size={24} strokeWidth={2} className="text-foreground" />
        </Link>
        <h1 className="text-[17px] font-bold text-foreground tracking-tight">
          Discover Friends
        </h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors">
          <Settings size={22} strokeWidth={2} className="text-foreground" />
        </button>
      </header>

      {/* Search Bar */}
      <div className="px-4 mt-2 mb-4 shrink-0 max-w-2xl mx-auto w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-foreground/50" strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-11 pr-4 py-2.5 bg-card border border-border/50 rounded-full text-[15px] font-medium text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* Suggested Matches */}
        <section>
          <div className="mb-3 px-1">
            <h2 className="text-[15px] font-bold text-foreground">Suggested Matches</h2>
            <p className="text-[13px] text-foreground/70 font-medium">Connections for shared growth</p>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            {/* Match 1 */}
            <div className="w-[100px] shrink-0 bg-card border border-border/50 rounded-3xl p-3 flex flex-col items-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-secondary border border-border/50 mb-2 overflow-hidden flex items-center justify-center">
                <span className="text-lg font-medium text-primary">SM</span>
              </div>
              <p className="text-[13px] font-bold mb-1 truncate w-full">Sarah M.</p>
              <p className="text-[10px] text-foreground/80 font-medium bg-foreground/5 px-2 py-0.5 rounded-full mb-2 truncate max-w-full border border-border/50">Mindful</p>
              <button className="text-[11px] font-bold text-[#1b3d30] w-full text-center hover:opacity-80 border-t border-border/50 pt-1.5 mt-auto">Connect</button>
            </div>
            {/* Match 2 */}
            <div className="w-[100px] shrink-0 bg-card border border-border/50 rounded-3xl p-3 flex flex-col items-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-secondary border border-border/50 mb-2 overflow-hidden flex items-center justify-center">
                <span className="text-lg font-medium text-primary">JB</span>
              </div>
              <p className="text-[13px] font-bold mb-1 truncate w-full">Jumy B.</p>
              <p className="text-[10px] text-foreground/80 font-medium bg-foreground/5 px-2 py-0.5 rounded-full mb-2 truncate max-w-full border border-border/50">Journaler</p>
              <button className="text-[11px] font-bold text-[#1b3d30] w-full text-center hover:opacity-80 border-t border-border/50 pt-1.5 mt-auto">Connect</button>
            </div>
            {/* Match 3 */}
            <div className="w-[100px] shrink-0 bg-card border border-border/50 rounded-3xl p-3 flex flex-col items-center text-center shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="w-12 h-12 rounded-full bg-secondary border border-border/50 mb-2 overflow-hidden flex items-center justify-center">
                <span className="text-lg font-medium text-primary">VR</span>
              </div>
              <p className="text-[13px] font-bold mb-1 truncate w-full">Vvitsa R.</p>
              <p className="text-[10px] text-foreground/80 font-medium bg-foreground/5 px-2 py-0.5 rounded-full mb-2 truncate max-w-full border border-border/50">Growth Circle</p>
              <button className="text-[11px] font-bold text-[#1b3d30] w-full text-center hover:opacity-80 border-t border-border/50 pt-1.5 mt-auto">Connect</button>
            </div>
          </div>
        </section>

        {/* Growth Interests */}
        <section>
          <div className="mb-3 px-1">
            <h2 className="text-[15px] font-bold text-foreground">Growth Interests</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mx-1">
            {/* Card 1 */}
            <div className="bg-card border border-border/50 rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg">🌳</span>
                <p className="text-[13px] font-bold leading-tight">Mindful Living</p>
              </div>
              <p className="text-[11px] text-foreground/70 font-medium leading-snug">Popular interest groups, Mindful Living</p>
            </div>

            {/* Card 2 */}
            <div className="bg-card border border-border/50 rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg">✍️</span>
                <p className="text-[13px] font-bold leading-tight">Collaborative Journaling</p>
              </div>
              <p className="text-[11px] text-foreground/70 font-medium leading-snug">Popular interest groups</p>
            </div>
            
            {/* Card 3 (full width) */}
            <div className="bg-card border border-border/50 rounded-[20px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] col-span-2">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg">📈</span>
                <p className="text-[13px] font-bold leading-tight">Growth Strategy</p>
              </div>
              <p className="text-[11px] text-foreground/70 font-medium leading-snug">Popular interest groups, Growth, Strategy, Collaborative...</p>
            </div>
          </div>
        </section>

        {/* Shared Reflection Communities */}
        <section className="mb-6">
          <div className="flex flex-col gap-3 mx-1">
            {/* Community 1 */}
            <div className="bg-card border border-border/50 rounded-[24px] p-4 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border/50">
                    <span className="w-full h-full flex items-center justify-center text-sm">👤</span>
                  </div>
                </div>
                <div>
                  <p className="text-[14px] font-bold flex items-center gap-1">Shared Reflections 📖</p>
                  <div className="mt-0.5 inline-block border border-border/50 rounded px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                    Say Hi
                  </div>
                </div>
              </div>
              <button className="px-3 py-1 bg-foreground/5 border border-border/50 text-[#1b3d30] text-[11px] font-bold rounded-full hover:bg-foreground/10 transition-all">
                Connect
              </button>
            </div>

            {/* Community 2 */}
            <div className="bg-card border border-border/50 rounded-[24px] p-4 flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary border border-border/50">
                    <span className="w-full h-full flex items-center justify-center text-sm">👤</span>
                  </div>
                </div>
                <div>
                  <p className="text-[14px] font-bold flex items-center gap-1">Team Perspective 🤝</p>
                  <div className="mt-0.5 inline-block border border-border/50 rounded px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                    Say Hi
                  </div>
                </div>
              </div>
              <button className="px-3 py-1 bg-foreground/5 border border-border/50 text-[#1b3d30] text-[11px] font-bold rounded-full hover:bg-foreground/10 transition-all">
                Connect
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
