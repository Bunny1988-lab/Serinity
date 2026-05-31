import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuietGuidesScroller } from '@/components/quiet-guides-scroller'

export default async function QuietGuidesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="w-full min-h-screen bg-background pb-32">
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent relative z-20">
        <h1 className="text-[17px] font-bold text-foreground flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">import_contacts</span>
          Quiet Guides
        </h1>
      </header>
      
      <main className="w-full">
        <QuietGuidesScroller currentUser={{ id: user.id }} />
      </main>
    </div>
  )
}
