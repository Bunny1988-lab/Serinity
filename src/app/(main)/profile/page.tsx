import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Settings, Book, Clock, Users } from 'lucide-react'
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
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-foreground pb-24 md:pb-0">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between shrink-0 bg-transparent">
        <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
          <ChevronLeft size={24} strokeWidth={2} className="text-foreground" />
        </Link>
        <h1 className="text-[17px] font-medium text-foreground tracking-tight">
          My Profile
        </h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors">
          <Settings size={22} strokeWidth={2} className="text-foreground" />
        </button>
      </header>

      <div className="flex-1 px-6 space-y-6 max-w-2xl mx-auto w-full">
        
        {/* User Avatar & Info */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-[100px] h-[100px] rounded-full bg-secondary border-[3px] border-card shadow-sm overflow-hidden flex items-center justify-center relative mb-4">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-medium text-primary">{profile?.display_name?.substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
            {profile?.display_name || 'Sarah M.'} <span className="text-xl">✨</span>
          </h2>
          <p className="text-[13px] text-foreground/80 font-medium mt-1">
            {profile?.bio || 'Nurturing growth, one step at a time.'}
          </p>
        </div>

        {/* Stats Row */}
        <div className="bg-card shadow-sm rounded-3xl p-4 flex justify-between items-center text-center mx-1">
          <div className="flex-1 flex flex-col items-center gap-1">
            <Book size={20} className="text-[#c1684c]" strokeWidth={2} />
            <p className="text-[11px] font-bold text-foreground mt-1">Journal Entries:</p>
            <p className="text-lg font-bold text-foreground">{journalCount || 47}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <Clock size={20} className="text-[#659e72]" strokeWidth={2} />
            <p className="text-[11px] font-bold text-foreground mt-1">Mindfulness Minutes:</p>
            <p className="text-lg font-bold text-foreground">320</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <Users size={20} className="text-[#598c9c]" strokeWidth={2} />
            <p className="text-[11px] font-bold text-foreground mt-1">Connections:</p>
            <p className="text-lg font-bold text-foreground">{friendsCount || 12}</p>
          </div>
        </div>

        {/* 2-Column Sections */}
        <div className="grid grid-cols-2 gap-3 mx-1">
          <div className="bg-card shadow-sm rounded-3xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-foreground">Personal Reflections</h3>
            <p className="text-[13px] text-foreground/80 font-medium leading-snug">A Blank Slate For My Thoughts</p>
            <p className="text-[13px] text-foreground/80 font-medium leading-snug">Finding Calm In Clarity Onwards!</p>
          </div>
          <div className="bg-card shadow-sm rounded-3xl p-5 flex flex-col gap-2">
            <h3 className="text-[13px] font-bold text-foreground">Shared Journals</h3>
            <p className="text-[13px] text-foreground/80 font-medium leading-snug">Collaborative Growth Circle</p>
            <p className="text-[13px] text-foreground/80 font-medium leading-snug">Team Perspective</p>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-card shadow-sm rounded-3xl p-5 mx-1 flex flex-col gap-2">
          <h3 className="text-[13px] font-bold text-foreground mb-1">Account</h3>
          <p className="text-[13px] text-foreground/80 font-medium">Notification Preferences</p>
          <p className="text-[13px] text-foreground/80 font-medium">Privacy Settings</p>
          <p className="text-[13px] text-foreground/80 font-medium">Support</p>
        </div>

        {/* Your Journey Summary */}
        <div className="bg-card shadow-sm rounded-3xl p-5 mx-1 mb-8">
          <h3 className="text-[13px] font-bold text-foreground mb-4">Your Journey Summary</h3>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">🌳</span>
              <p className="text-[13px] font-medium text-foreground leading-snug pt-1">
                <span className="font-bold">This week:</span> Break-through with task-breaking method!
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-2xl shrink-0">⚖️</span>
              <p className="text-[13px] font-medium text-foreground leading-snug pt-1">
                <span className="font-bold">This week:</span> Balance accommodating love yourself!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
