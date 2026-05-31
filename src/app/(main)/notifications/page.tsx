import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent">
        <Link href="/profile" className="flex items-center justify-center w-10 h-10 -ml-2 hover:opacity-70 transition-opacity">
          <ChevronLeft className="text-foreground" size={28} strokeWidth={2} />
        </Link>
        <h1 className="text-[18px] font-bold text-foreground flex-1 text-center -ml-8">Notification Preferences</h1>
      </header>

      <main className="w-full max-w-[800px] px-6 mx-auto mt-4 space-y-4">
        <section className="bg-card border border-border-mint rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <h2 className="font-bold text-[15px] text-foreground mb-4">Email Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-foreground">Friend Requests</p>
                <p className="text-[12px] text-foreground/60">Get notified when someone wants to connect</p>
              </div>
              <div className="w-11 h-6 bg-foreground rounded-full relative">
                <div className="w-5 h-5 bg-card rounded-full absolute right-0.5 top-0.5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-foreground">New Messages</p>
                <p className="text-[12px] text-foreground/60">Get notified when you receive a message</p>
              </div>
              <div className="w-11 h-6 bg-[#BCE3D8] rounded-full relative">
                <div className="w-5 h-5 bg-card rounded-full absolute left-0.5 top-0.5"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border-mint rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <h2 className="font-bold text-[15px] text-foreground mb-4">Push Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium text-foreground">Daily Reminders</p>
                <p className="text-[12px] text-foreground/60">Reminders for journaling and mindfulness</p>
              </div>
              <div className="w-11 h-6 bg-foreground rounded-full relative">
                <div className="w-5 h-5 bg-card rounded-full absolute right-0.5 top-0.5"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
