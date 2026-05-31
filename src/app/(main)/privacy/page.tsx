import { createClient } from '@/lib/supabase/server'
import { ChevronLeft, Lock, Shield } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('privacy_profile_visibility')
    .eq('id', user.id)
    .single()

  return (
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent">
        <Link href="/profile" className="flex items-center justify-center w-10 h-10 -ml-2 hover:opacity-70 transition-opacity">
          <ChevronLeft className="text-foreground" size={28} strokeWidth={2} />
        </Link>
        <h1 className="text-[18px] font-bold text-foreground flex-1 text-center -ml-8">Privacy Settings</h1>
      </header>

      <main className="w-full max-w-[800px] px-6 mx-auto mt-4 space-y-4">
        <section className="bg-card border border-border-mint rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-foreground" size={20} />
            <h2 className="font-bold text-[15px] text-foreground">Profile Visibility</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="visibility" className="w-4 h-4 text-foreground focus:ring-[#1D3B35]" defaultChecked={profile?.privacy_profile_visibility === 'public'} />
              <div>
                <p className="text-[14px] font-medium text-foreground">Public</p>
                <p className="text-[12px] text-foreground/60">Anyone can find and view your profile</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="visibility" className="w-4 h-4 text-foreground focus:ring-[#1D3B35]" defaultChecked={profile?.privacy_profile_visibility === 'friends'} />
              <div>
                <p className="text-[14px] font-medium text-foreground">Friends Only</p>
                <p className="text-[12px] text-foreground/60">Only your connections can see your profile</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="visibility" className="w-4 h-4 text-foreground focus:ring-[#1D3B35]" defaultChecked={profile?.privacy_profile_visibility === 'private'} />
              <div>
                <p className="text-[14px] font-medium text-foreground">Private</p>
                <p className="text-[12px] text-foreground/60">Hidden from search and discoverability</p>
              </div>
            </label>
          </div>
        </section>

        <section className="bg-card border border-border-mint rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="text-foreground" size={20} />
            <h2 className="font-bold text-[15px] text-foreground">Data & Security</h2>
          </div>
          <div className="space-y-4">
             <button className="w-full text-left">
                <p className="text-[14px] font-medium text-foreground">Download my data</p>
                <p className="text-[12px] text-foreground/60">Request a copy of your personal data</p>
             </button>
             <div className="w-full h-[1px] bg-[#BCE3D8]/50"></div>
             <button className="w-full text-left">
                <p className="text-[14px] font-medium text-red-500">Delete Account</p>
                <p className="text-[12px] text-red-500/60">Permanently remove your account and data</p>
             </button>
          </div>
        </section>
      </main>
    </div>
  )
}
