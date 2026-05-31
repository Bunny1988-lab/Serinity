import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PresenceRoom } from '@/components/presence-room'

export default async function SilentPresencePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="w-full min-h-screen bg-background">
      <PresenceRoom 
        currentUser={{
          id: user.id,
          display_name: profile?.display_name || 'Anonymous',
          avatar_url: profile?.avatar_url
        }} 
      />
    </div>
  )
}
