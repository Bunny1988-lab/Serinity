import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Settings, Book, Clock, Users, Link as LinkIcon, Lock } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ProfileAvatar } from '@/components/profile-avatar'

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

  // Fetch recent journals for Personal Reflections
  const { data: recentJournals } = await supabase
    .from('journal_entries')
    .select('id, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Fetch circles for Shared Journals
  const { data: circles } = await supabase
    .from('circles')
    .select('id, name')
    .eq('owner_id', user.id)
    .limit(3)

  return (
    <div className="h-[100dvh] flex flex-col bg-[#E0F2F1] overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 border-b border-teal-900/5">
        <Link href="/feed" className="p-2 -ml-2 rounded-full hover:bg-teal-900/5 text-slate-700 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        <h1 className="text-lg font-bold text-slate-800">My Profile</h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-teal-900/5 text-slate-700 transition-colors">
          <Settings size={22} strokeWidth={1.5} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 px-5 pt-6 space-y-6 hide-scrollbar">
        
        {/* User Info */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-24 h-24 rounded-full bg-teal-50 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-medium text-teal-800">{profile?.display_name?.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="text-[19px] font-bold text-slate-800 flex items-center justify-center gap-1">
              {profile?.display_name} <span className="text-amber-400">✨</span>
            </h2>
            <p className="text-[13px] text-slate-600 font-medium mt-1">
              {profile?.bio || 'Nurturing growth, one step at a time.'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-3xl p-4 flex justify-between items-center text-center">
          <div className="flex-1">
            <Book size={18} className="text-amber-600 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Journal Entries:</p>
            <p className="text-[15px] font-bold text-slate-800">{journalCount || 0}</p>
          </div>
          <div className="w-px h-10 bg-teal-900/10" />
          <div className="flex-1">
            <Clock size={18} className="text-teal-600 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Mindfulness Minutes:</p>
            <p className="text-[15px] font-bold text-slate-800">320</p>
          </div>
          <div className="w-px h-10 bg-teal-900/10" />
          <div className="flex-1">
            <Users size={18} className="text-blue-500 mx-auto mb-1" />
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Connections:</p>
            <p className="text-[15px] font-bold text-slate-800">{friendsCount || 0}</p>
          </div>
        </div>

        {/* Cards Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Personal Reflections */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-[24px] p-4">
            <h3 className="text-[13px] font-bold text-slate-800 mb-2">Personal Reflections</h3>
            <div className="space-y-1.5">
              {recentJournals && recentJournals.length > 0 ? (
                recentJournals.map(j => (
                  <p key={j.id} className="text-[11px] font-medium text-slate-600 leading-snug truncate">
                    {j.content.substring(0, 30)}...
                  </p>
                ))
              ) : (
                <>
                  <p className="text-[11px] font-medium text-slate-600 leading-snug">A Blank Slate For My Thoughts</p>
                  <p className="text-[11px] font-medium text-slate-600 leading-snug">Finding Calm In Clarity Onwards!</p>
                </>
              )}
            </div>
          </div>

          {/* Shared Journals */}
          <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-[24px] p-4">
            <h3 className="text-[13px] font-bold text-slate-800 mb-2">Shared Journals</h3>
            <div className="space-y-1.5">
              {circles && circles.length > 0 ? (
                circles.map(c => (
                  <p key={c.id} className="text-[11px] font-medium text-slate-600 leading-snug truncate">
                    {c.name}
                  </p>
                ))
              ) : (
                <>
                  <p className="text-[11px] font-medium text-slate-600 leading-snug">Collaborative Growth Circle</p>
                  <p className="text-[11px] font-medium text-slate-600 leading-snug">Team Perspective</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-[24px] p-4">
          <h3 className="text-[13px] font-bold text-slate-800 mb-2">Account</h3>
          <div className="space-y-2">
            <p className="text-[12px] font-medium text-slate-700">Notification Preferences</p>
            <p className="text-[12px] font-medium text-slate-700">Privacy Settings</p>
            <p className="text-[12px] font-medium text-slate-700">Support</p>
          </div>
        </div>

        {/* Your Journey Summary */}
        <div className="bg-white/80 backdrop-blur-sm border border-white/60 shadow-sm rounded-[24px] p-4">
          <h3 className="text-[13px] font-bold text-slate-800 mb-3">Your Journey Summary</h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="text-xl shrink-0">🌳</span>
              <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                This week: Break-through with task-breaking method!
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-xl shrink-0">⚖️</span>
              <p className="text-[11px] font-semibold text-slate-700 leading-snug">
                This week: Balance accomodating less stressful moments.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
