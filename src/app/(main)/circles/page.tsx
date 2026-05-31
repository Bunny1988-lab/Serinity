import { createClient } from '@/lib/supabase/server'
import { createCircle } from '@/app/(main)/actions'
import { Users, ChevronLeft, Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { CircleConnections } from '@/components/circle-connections'

export default async function CirclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: circles } = await supabase
    .from('circles')
    .select('id, name, created_at')
    .eq('owner_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="w-full flex justify-between items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent relative z-20">
        <Link href="/home" className="active:scale-95 transition-transform duration-200 text-foreground">
          <ChevronLeft size={28} strokeWidth={2} />
        </Link>
        <h1 className="text-[17px] font-bold text-foreground">Your Circles</h1>
        <button className="active:scale-95 transition-transform duration-200 text-foreground">
          <Search size={24} strokeWidth={2} />
        </button>
      </header>
      
      <main className="px-6 space-y-6 max-w-[800px] mx-auto w-full">
        {/* Card 1: Expand Your Space */}
        <div className="bg-card border border-border-mint rounded-[24px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="space-y-1">
            <h2 className="text-[16px] font-bold text-foreground">Expand Your Space</h2>
            <p className="text-[13px] font-medium text-foreground/70 leading-relaxed">
              Invite trusted friends to Serenity to secure your communication and build custom, isolated circles.
            </p>
          </div>
          {user && <CircleConnections userId={user.id} />}
        </div>

        {/* Card 2: Create a New Circle */}
        <div className="bg-card border border-border-mint rounded-[24px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col gap-4">
          <div className="space-y-1">
            <h2 className="text-[16px] font-bold text-foreground">Create a new Circle</h2>
            <p className="text-[13px] font-medium text-foreground/70 leading-relaxed">
              Add an isolated group (e.g., Close Friends, Dev Team, Family) to selectively share journals or send group-targeted messages.
            </p>
          </div>
          
          <form action={createCircle} className="flex gap-2">
            <input 
              name="name" 
              placeholder="e.g. Close Friends" 
              className="flex-1 bg-background border border-border-mint/50 rounded-full px-5 py-3 text-[14px] font-medium text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-[#BCE3D8] transition-all"
              required 
            />
            <SubmitButton className="rounded-full w-12 h-12 flex items-center justify-center bg-foreground text-white hover:bg-foreground/90 transition-colors shrink-0">
              <Plus size={20} strokeWidth={2.5} />
            </SubmitButton>
          </form>
        </div>

        {/* Section: Circles Grid */}
        <div className="space-y-4">
          <h3 className="text-[14px] font-bold text-foreground/60 uppercase tracking-widest px-2">
            Your Intentional Spaces ({circles?.length || 0})
          </h3>

          {circles?.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border-mint border-dashed rounded-[24px] space-y-3">
              <Users size={32} strokeWidth={2} className="mx-auto text-foreground/30" />
              <p className="text-[15px] font-bold text-foreground/70">Your space feels peaceful.</p>
              <p className="text-[13px] text-foreground/50 font-medium px-8">Create your first circle above to start curating your network.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {circles?.map((circle: any) => (
                <Link 
                  href={`/circles/${circle.id}`} 
                  key={circle.id} 
                  className="bg-card border border-border-mint rounded-[20px] p-5 flex items-center gap-4 hover:border-foreground/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-background border border-border-mint flex items-center justify-center text-foreground shrink-0 group-hover:scale-105 transition-transform">
                    <Users size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground text-[15px] truncate">
                      {circle.name}
                    </h4>
                    <p className="text-[12px] font-medium text-foreground/60 mt-0.5">
                      Created {new Date(circle.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
