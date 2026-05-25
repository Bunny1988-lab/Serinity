import { createClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile-avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { InviteButton } from '@/components/invite-button'
import { ProfileSettings } from '@/components/profile-settings'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div className="pb-20 md:pb-0 min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 px-4 py-4 backdrop-blur-xl border-b border-border/50 flex justify-between items-center">
        <h1 className="text-xl font-light tracking-tight">Profile</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
            <Settings size={20} />
          </button>
        </div>
      </header>
      
      <div className="p-4 space-y-8 max-w-xl mx-auto mt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <ProfileAvatar currentUrl={profile?.avatar_url} userId={user?.id || ''} />
          <div>
            <h2 className="text-2xl font-medium">{profile?.display_name || 'Anonymous'}</h2>
            <p className="text-muted-foreground">@{profile?.username || 'user'}</p>
          </div>
          <p className="text-sm max-w-md font-light leading-relaxed">
            {profile?.bio || 'No bio provided. This is your calm, private space.'}
          </p>
          <InviteButton />
        </div>

          <ProfileSettings profile={profile} />
      </div>
    </div>
  )
}
