import { createClient } from '@/lib/supabase/server'
import { Calendar, Moon, Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NotificationBell } from '@/components/notification-bell'

export default async function HomeDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  // For the Quick Connect, let's just get some friends or recent users
  // Mocking this query for now since we're building UI
  const mockFriends = [
    { id: '1', display_name: 'Alex', avatar_url: null, status: 'Active' },
    { id: '2', display_name: 'Maya', avatar_url: null, status: 'Status' },
    { id: '3', display_name: 'David', avatar_url: null, status: 'Status' },
    { id: '4', display_name: 'Chloe', avatar_url: null, status: 'Unnoticed' },
  ]

  const firstName = profile?.display_name?.split(' ')[0] || 'There'

  return (
    <div className="min-h-screen bg-[#E0F2F1] pb-32 md:pb-0 relative">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-[#E0F2F1]/80 backdrop-blur-md">
        <div className="w-10 h-10 rounded-full bg-white/50 border border-white/60 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-teal-800">{profile?.display_name?.[0]}</span>
          )}
        </div>
        
        <h1 className="text-xl font-medium tracking-wide text-slate-800">Serenity</h1>
        
        <NotificationBell />
      </header>

      <div className="px-5 space-y-6 max-w-xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-[#CFE8E7] rounded-3xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/30">
          <h2 className="text-xl font-semibold text-slate-800">Welcome Back, {firstName}!</h2>
          <p className="text-slate-600 font-light mt-1">Your Calm Space awaits. 🌙</p>
        </div>

        {/* Streak Card */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] p-5 shadow-sm border border-white/80 flex items-center gap-4 relative overflow-hidden">
          <div className="w-24 h-24 shrink-0 flex items-center justify-center translate-y-2">
            <img src="/dog_mascot.png" alt="Mascot" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 space-y-3 z-10">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-1.5">
                Login Streak: 21 Days! <span className="text-lg">🔥</span>
              </h3>
            </div>
            
            {/* Streak dots */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {[...Array(11)].map((_, i) => (
                <div key={i} className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${i < 7 ? 'bg-amber-400 text-white shadow-sm' : 'bg-slate-200/50 text-slate-400'}`}>
                  {i < 7 ? '✓' : ''}
                </div>
              ))}
            </div>

            <button className="bg-white/80 hover:bg-white text-teal-700 text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all border border-white">
              Login Rewards
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white/70 hover:bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/60 flex flex-col gap-2 transition-all text-left">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-1">
              <Calendar size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Upcoming Event</p>
              <p className="text-xs text-slate-500">11h - 3 pm</p>
            </div>
          </button>
          
          <button className="bg-white/70 hover:bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/60 flex flex-col gap-2 transition-all text-left">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 mb-1">
              <Moon size={16} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Meditation</p>
              <p className="text-xs text-slate-500">Sessions</p>
            </div>
          </button>
        </div>

        {/* Quick Connect */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Quick Connect</h3>
              <p className="text-xs text-slate-500">Active friends in status.</p>
            </div>
            <Link href="/people" className="text-xs font-medium text-teal-700 hover:underline">See All</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {mockFriends.map(friend => (
              <Link href={`/messages`} key={friend.id} className="flex flex-col items-center gap-1.5 shrink-0">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-white/60 border border-white/80 flex items-center justify-center shadow-sm overflow-hidden">
                    {friend.avatar_url ? (
                      <img src={friend.avatar_url} alt={friend.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-600 font-medium">{friend.display_name[0]}</span>
                    )}
                  </div>
                  {friend.status === 'Active' && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#E0F2F1] rounded-full"></span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-800">{friend.display_name}</p>
                  <p className="text-[10px] text-slate-500">{friend.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Wellness Journey */}
        <div className="space-y-3 relative pb-10">
          <h3 className="font-semibold text-slate-800">Your Wellness Journey</h3>
          
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/80 flex items-center gap-4 relative">
            {/* Chart Graphic mock */}
            <div className="w-16 h-12 flex items-end justify-between gap-0.5 opacity-60">
              {[4, 6, 3, 7, 5, 8, 4, 9].map((h, i) => (
                <div key={i} className="w-1.5 bg-teal-500 rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
              ))}
            </div>
            
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Today's Focus:</p>
                <p className="text-sm font-semibold text-slate-800">Gratitude Journal</p>
              </div>
              <Link href="/journal">
                <button className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium px-4 py-2 rounded-full shadow-sm transition-colors w-max">
                  Start Session
                </button>
              </Link>
            </div>
          </div>

          {/* Floating Action Button (+). Overlaps bottom right */}
          <button className="absolute -bottom-2 right-4 w-14 h-14 bg-[#2C6E6E] hover:bg-[#235858] text-white rounded-[1.25rem] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer z-10">
            <Plus size={24} strokeWidth={2} />
          </button>
        </div>

      </div>

      {/* AI Friend FAB */}
      <div className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-20">
        <Link href="/ai-friend" className="w-14 h-14 bg-amber-400 hover:bg-amber-300 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 border border-amber-300">
          <span className="text-2xl">✨</span>
        </Link>
      </div>
    </div>
  )
}
