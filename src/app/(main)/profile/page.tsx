import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Settings, Book, Clock, Users, Sprout, Target } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch actual counts
  const { count: journalCount } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: friendsCount } = await supabase
    .from('friend_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

  return (
    <div className="h-[100dvh] flex flex-col bg-transparent overflow-hidden text-foreground pb-32 md:pb-0">
      {/* Header */}
      <header className="px-6 pt-8 pb-6 flex items-center justify-between shrink-0 bg-background/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft size={24} strokeWidth={1.5} />
          </Link>
          <h1 className="text-2xl font-light tracking-wide text-foreground">
            Profile
          </h1>
        </div>
        <button className="p-2 -mr-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-8 px-6 pt-8 space-y-8 hide-scrollbar max-w-2xl mx-auto w-full">
        
        {/* User Info */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-28 h-28 rounded-full bg-secondary border border-border/50 shadow-sm overflow-hidden flex items-center justify-center relative group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-light text-primary">{profile?.display_name?.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight text-foreground flex items-center justify-center gap-2">
              {profile?.display_name}
            </h2>
            <p className="text-sm text-muted-foreground font-light mt-1">
              {profile?.bio || 'Nurturing growth, one step at a time.'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-card/40 backdrop-blur-md border border-border/50 shadow-sm rounded-3xl p-5 flex justify-between items-center text-center">
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <Book size={20} className="text-amber-500 mb-1" strokeWidth={1.5} />
            <p className="text-2xl font-light text-foreground">{journalCount || 0}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Journals</p>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <Clock size={20} className="text-emerald-500 mb-1" strokeWidth={1.5} />
            <p className="text-2xl font-light text-foreground">320</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Minutes</p>
          </div>
          <div className="w-px h-12 bg-border/50" />
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <Users size={20} className="text-blue-500 mb-1" strokeWidth={1.5} />
            <p className="text-2xl font-light text-foreground">{friendsCount || 0}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Connections</p>
          </div>
        </div>

        {/* Growth Focus */}
        <div className="bg-card/40 backdrop-blur-md border border-border/50 shadow-sm rounded-3xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Target size={16} />
            Current Focus
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sprout size={24} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-medium">Mindful Communication</p>
              <div className="w-full bg-secondary h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-primary h-full w-[65%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Journey Summary */}
        <div className="bg-card/40 backdrop-blur-md border border-border/50 shadow-sm rounded-3xl p-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">Journey Highlights</h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <span className="text-2xl shrink-0 mt-0.5">🌳</span>
              <div>
                <p className="text-[15px] font-medium text-foreground">Consistency Milestone</p>
                <p className="text-[13px] text-muted-foreground font-light mt-1 leading-relaxed">
                  You've maintained your journaling habit for 7 consecutive days.
                </p>
              </div>
            </div>
            <div className="w-full h-px bg-border/40"></div>
            <div className="flex gap-4 items-start">
              <span className="text-2xl shrink-0 mt-0.5">⚖️</span>
              <div>
                <p className="text-[15px] font-medium text-foreground">Emotional Balance</p>
                <p className="text-[13px] text-muted-foreground font-light mt-1 leading-relaxed">
                  Your recent reflections show a trend towards calmer, more centered thoughts.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
