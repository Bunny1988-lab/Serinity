import { createClient } from '@/lib/supabase/server'
import { Search, Settings, ChevronLeft, Sprout, PenTool, TrendingUp, BookOpen, Handshake } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ConnectButton } from '@/components/connect-button'

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { q } = await searchParams
  
  // Fetch suggested users (excluding current user)
  let query = supabase.from('users').select('*').neq('id', user.id).limit(10)
  if (q) {
    query = query.ilike('display_name', `%${q}%`)
  }
  
  const { data: suggestedUsers } = await query

  return (
    <div className="h-[100dvh] flex flex-col bg-[#E0F2F1] overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0">
        <Link href="/feed" className="p-2 -ml-2 rounded-full hover:bg-teal-900/5 text-slate-700 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-medium text-slate-800">Discover Friends</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-teal-900/5 text-slate-700 transition-colors">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </header>

      {/* Search Bar */}
      <div className="px-5 mb-6 shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-11 pr-4 py-3 bg-white/70 border border-white/50 backdrop-blur-md rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-white shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 scrollbar-none px-5 space-y-8">
        
        {/* Suggested Matches */}
        <section>
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-slate-800 tracking-tight">Suggested Matches</h2>
            <p className="text-xs text-slate-600 mt-0.5">Connections for shared growth</p>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-5 px-5">
            {suggestedUsers && suggestedUsers.length > 0 ? (
              suggestedUsers.map((u: any) => (
                <div key={u.id} className="w-28 shrink-0 bg-white/60 border border-teal-100/50 backdrop-blur-sm rounded-[24px] p-3 flex flex-col items-center text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-teal-50 border-4 border-[#E0F2F1] shadow-sm mb-2 overflow-hidden flex items-center justify-center">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-medium text-teal-800">{u.display_name?.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <p className="text-[13px] font-bold text-slate-800 mb-0.5 truncate w-full">{u.display_name}</p>
                  <p className="text-[10px] text-teal-700 font-medium bg-teal-100/50 px-2 py-0.5 rounded-full mb-3 truncate w-full">Mindful</p>
                  <ConnectButton targetUserId={u.id} />
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 italic py-4">No users found to suggest.</div>
            )}
          </div>
        </section>

        {/* Growth Interests */}
        <section>
          <div className="mb-4">
            <h2 className="text-[17px] font-semibold text-slate-800 tracking-tight">Growth Interests</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1 */}
            <div className="bg-white/60 border border-teal-100/50 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <Sprout size={16} className="text-green-600" />
                <p className="text-xs font-bold text-slate-800">Mindful Living 🌿</p>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug">Popular interest groups, Mindful Living</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/60 border border-teal-100/50 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <PenTool size={16} className="text-amber-600" />
                <p className="text-xs font-bold text-slate-800">Collaborative Journaling ✍️</p>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug">Popular interest groups</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/60 border border-teal-100/50 backdrop-blur-sm rounded-2xl p-3.5 shadow-sm col-span-2">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={16} className="text-blue-600" />
                <p className="text-xs font-bold text-slate-800">Growth Strategy 📈</p>
              </div>
              <p className="text-[10px] text-slate-600 leading-snug">Popular interest groups, Growth, Strategy, Collaborative...</p>
            </div>
          </div>
        </section>

        {/* Shared Reflections */}
        <section>
          <div className="flex flex-col gap-3">
            <div className="bg-white/60 border border-teal-100/50 backdrop-blur-sm rounded-[20px] p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-50 border border-white shrink-0">
                  <img src="https://i.pravatar.cc/150?u=1" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">Shared Reflections <BookOpen size={12} className="text-slate-500" /></p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-5 h-3.5 bg-slate-200/60 rounded flex items-center justify-center">
                      <span className="text-[8px]">💬</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-600">Say Hi</p>
                  </div>
                </div>
              </div>
              <button className="px-4 py-1.5 bg-[#E0F2F1] text-teal-900 text-[11px] font-semibold rounded-full hover:bg-teal-100 transition-colors">
                Connect
              </button>
            </div>

            <div className="bg-white/60 border border-teal-100/50 backdrop-blur-sm rounded-[20px] p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-teal-50 border border-white shrink-0">
                  <img src="https://i.pravatar.cc/150?u=2" alt="User" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 flex items-center gap-1">Team Perspective <Handshake size={12} className="text-amber-500" /></p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-5 h-3.5 bg-slate-200/60 rounded flex items-center justify-center">
                      <span className="text-[8px]">💬</span>
                    </div>
                    <p className="text-[10px] font-medium text-slate-600">Say Hi</p>
                  </div>
                </div>
              </div>
              <button className="px-4 py-1.5 bg-[#E0F2F1] text-teal-900 text-[11px] font-semibold rounded-full hover:bg-teal-100 transition-colors">
                Connect
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
