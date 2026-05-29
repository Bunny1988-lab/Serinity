import { createClient } from '@/lib/supabase/server'
import { Search, Settings, ChevronLeft, Sprout, PenTool, TrendingUp, BookOpen, Users, Compass } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ConnectButton } from '@/components/connect-button'

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { q } = await searchParams
  
  let query = supabase.from('users').select('*').neq('id', user.id).limit(10)
  if (q) {
    query = query.ilike('display_name', `%${q}%`)
  }
  
  const { data: suggestedUsers } = await query

  return (
    <div className="h-[100dvh] flex flex-col bg-transparent overflow-hidden text-foreground pb-32 md:pb-0">
      {/* Header */}
      <header className="px-6 pt-8 pb-6 flex items-center justify-between shrink-0 bg-background/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Link>
          <h1 className="text-2xl font-light tracking-wide text-foreground">
            Discover
          </h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 mt-6 mb-6 shrink-0 max-w-2xl mx-auto w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-muted-foreground" strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search interests, people, or circles..."
            className="w-full pl-11 pr-4 py-3 bg-card/50 border border-border/50 backdrop-blur-md rounded-[2rem] text-[15px] font-light text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 scrollbar-none px-6 space-y-10 max-w-2xl mx-auto w-full">
        
        {/* Suggested Matches */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <Compass size={20} className="text-primary" />
              Suggested Matches
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Based on your shared growth goals</p>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 -mx-6 px-6">
            {suggestedUsers && suggestedUsers.length > 0 ? (
              suggestedUsers.map((u: any) => (
                <div key={u.id} className="w-32 shrink-0 bg-card/40 border border-border/50 backdrop-blur-md rounded-3xl p-4 flex flex-col items-center text-center shadow-sm hover:bg-card/60 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-secondary border border-border/50 shadow-sm mb-3 overflow-hidden flex items-center justify-center">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-light text-primary">{u.display_name?.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1 truncate w-full">{u.display_name}</p>
                  <p className="text-[11px] text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full mb-4 truncate max-w-full">Mindful Living</p>
                  <ConnectButton targetUserId={u.id} />
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground italic py-4">No users found to suggest.</div>
            )}
          </div>
        </section>

        {/* Growth Interests */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-medium tracking-tight">Growth Interests</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="bg-card/40 border border-border/50 backdrop-blur-md rounded-3xl p-5 shadow-sm hover:bg-card/60 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Sprout size={20} strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-medium group-hover:text-primary transition-colors">Mindful Living</p>
              </div>
              <p className="text-sm text-muted-foreground font-light mt-2 leading-relaxed">Connect with others focusing on daily mindfulness.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-card/40 border border-border/50 backdrop-blur-md rounded-3xl p-5 shadow-sm hover:bg-card/60 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <PenTool size={20} strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-medium group-hover:text-primary transition-colors">Journaling</p>
              </div>
              <p className="text-sm text-muted-foreground font-light mt-2 leading-relaxed">Share prompts and reflection techniques.</p>
            </div>
            
            {/* Card 3 */}
            <div className="bg-card/40 border border-border/50 backdrop-blur-md rounded-3xl p-5 shadow-sm hover:bg-card/60 transition-colors cursor-pointer group sm:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <TrendingUp size={20} strokeWidth={1.5} />
                </div>
                <p className="text-[15px] font-medium group-hover:text-primary transition-colors">Self Improvement</p>
              </div>
              <p className="text-sm text-muted-foreground font-light mt-2 leading-relaxed">A space for sharing goals and building consistent habits together.</p>
            </div>
          </div>
        </section>

        {/* Shared Reflection Communities */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Shared Reflection Communities
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Join circles for collective growth</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-card/40 border border-border/50 backdrop-blur-md rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border/50 shrink-0 flex items-center justify-center text-xl">
                  🌅
                </div>
                <div>
                  <p className="text-[15px] font-medium flex items-center gap-2">Morning Gratitude</p>
                  <p className="text-xs font-light text-muted-foreground mt-1">124 members • Daily reflections</p>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-primary/10 text-primary text-sm font-medium rounded-full hover:bg-primary hover:text-primary-foreground transition-all sm:w-auto w-full">
                Join Circle
              </button>
            </div>

            <div className="bg-card/40 border border-border/50 backdrop-blur-md rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border/50 shrink-0 flex items-center justify-center text-xl">
                  📖
                </div>
                <div>
                  <p className="text-[15px] font-medium flex items-center gap-2">Weekly Review Group</p>
                  <p className="text-xs font-light text-muted-foreground mt-1">86 members • Goal breakdowns</p>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-primary/10 text-primary text-sm font-medium rounded-full hover:bg-primary hover:text-primary-foreground transition-all sm:w-auto w-full">
                Join Circle
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
