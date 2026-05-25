import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingClient } from './onboarding-client'
import { WallpaperProvider } from '@/components/wallpaper-provider'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('wallpaper_theme, display_name')
    .eq('id', user.id)
    .single()

  return (
    <WallpaperProvider theme={profile?.wallpaper_theme || 'system'}>
      <OnboardingClient displayName={profile?.display_name || 'there'} />
    </WallpaperProvider>
  )
}
