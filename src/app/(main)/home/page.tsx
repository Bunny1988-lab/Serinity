import { createClient } from '@/lib/supabase/server'
import { Calendar, Moon, Plus, Target, Heart, Award, Sparkles } from 'lucide-react'
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

  const mockConnections = [
    { id: '1', display_name: 'Elena', avatar_url: null, status: 'Active' },
    { id: '2', display_name: 'Julian', avatar_url: null, status: 'Recent' },
    { id: '3', display_name: 'Sophia', avatar_url: null, status: 'Recent' },
    { id: '4', display_name: 'Inner Circle', avatar_url: null, status: 'Group' },
  ]

  const firstName = profile?.display_name?.split(' ')[0] || 'There'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-transparent pb-32 md:pb-0 relative text-foreground">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-10 bg-background/60 backdrop-blur-xl border-b border-border/40">
        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex items-center justify-center shrink-0 shadow-sm border border-border/50">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-medium text-primary">{profile?.display_name?.[0]}</span>
          )}
        </div>
        
        <h1 className="text-xl font-light tracking-widest uppercase opacity-80">Serenity</h1>
        
        <NotificationBell />
      </header>

      <div className="px-6 py-8 space-y-8 max-w-2xl mx-auto">
        {/* Welcome Card */}
        <div className="bg-card/40 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-border/50 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{today}</p>
              <h2 className="text-2xl font-light mt-1">Welcome back, <span className="font-medium">{firstName}</span></h2>
              <p className="text-sm text-muted-foreground mt-1">Your calm space awaits 🌙</p>
            </div>
            <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full border border-border/40">
              <span className="text-lg">🌿</span>
              <span className="text-sm font-medium">Calm</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/40">
            <div className="flex flex-col items-center p-3 bg-background/50 rounded-2xl border border-border/30">
              <span className="text-xl mb-1">✍️</span>
              <span className="text-sm font-semibold">12</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Journal</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-background/50 rounded-2xl border border-border/30">
              <span className="text-xl mb-1">🧘‍♀️</span>
              <span className="text-sm font-semibold">5</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Reflection</span>
            </div>
            <div className="flex flex-col items-center p-3 bg-background/50 rounded-2xl border border-border/30">
              <span className="text-xl mb-1">✨</span>
              <span className="text-sm font-semibold">21</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Check-in</span>
            </div>
          </div>
        </div>

        {/* Quick Connect */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <h3 className="font-medium flex items-center gap-2"><Heart size={18} className="text-primary" /> Trusted Circle</h3>
            <Link href="/discover" className="text-xs text-muted-foreground hover:text-foreground">Discover</Link>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {mockConnections.map(conn => (
              <Link href={`/messages`} key={conn.id} className="flex flex-col items-center gap-2 shrink-0 group">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-secondary/80 border border-border flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                    {conn.avatar_url ? (
                      <img src={conn.avatar_url} alt={conn.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-light">{conn.display_name[0]}</span>
                    )}
                  </div>
                  {conn.status === 'Active' && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{conn.display_name}</p>
                  <p className="text-[10px] text-muted-foreground">{conn.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Wellness Journey & Events */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Wellness Journey */}
          <div className="bg-card/40 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-border/50 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
              <Target size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium">Gratitude Challenge</p>
              <p className="text-xs text-muted-foreground mt-1">Day 3 of 7 completed</p>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-primary h-full w-[42%] rounded-full"></div>
            </div>
          </div>
          
          {/* Upcoming Event */}
          <div className="bg-card/40 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-border/50 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
              <Calendar size={20} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium">Mindfulness Session</p>
              <p className="text-xs text-muted-foreground mt-1">Today at 8:00 PM</p>
            </div>
            <button className="text-xs font-medium text-primary mt-auto text-left hover:underline">Join Circle</button>
          </div>
        </div>

      </div>

    </div>
  )
}
