import { createClient } from '@/lib/supabase/server'
import { createCircle } from '@/app/(main)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users } from 'lucide-react'
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
    <div className="pb-32 md:pb-8 min-h-screen bg-transparent relative overflow-hidden">
      {/* Decorative Top Ambient Light */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/3 blur-[150px] pointer-events-none" />

      <header className="sticky top-0 z-10 bg-background/30 px-8 py-6 backdrop-blur-2xl border-b border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground bg-clip-text">
            Circles
          </h1>
          <p className="text-xs font-light text-muted-foreground/80 mt-1 tracking-wide uppercase">
            Your intentional & curated inner spaces
          </p>
        </div>
      </header>
      
      <div className="p-6 md:p-8 space-y-10 max-w-4xl mx-auto">
        
        {/* Row 1: Expand your space & Create Circle (Frosted Widgets Side-by-Side on desktop) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Expand Your Space Card */}
          <div className="relative group overflow-hidden bg-gradient-to-br from-primary/[0.07] via-background/40 to-background/20 backdrop-blur-md border border-primary/10 rounded-[2rem] p-8 flex flex-col justify-between transition-all duration-500 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
            
            <div className="space-y-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-primary uppercase bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                Inner Connections
              </span>
              <h2 className="text-xl font-light text-foreground tracking-tight">Expand your space</h2>
              <p className="text-xs text-muted-foreground/80 font-light leading-relaxed max-w-sm">
                Invite trusted friends to Serenity to secure your communication and build custom, isolated circles.
              </p>
            </div>
            
            <div className="pt-6 relative z-10 w-full">
              {user && <CircleConnections userId={user.id} />}
            </div>
          </div>

          {/* Create Circle Card */}
          <div className="bg-background/30 backdrop-blur-md border border-border/30 rounded-[2rem] p-8 shadow-xs flex flex-col justify-between transition-all duration-500 hover:border-border/60">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase bg-muted/40 border border-border/40 px-3 py-1 rounded-full">
                Workspace
              </span>
              <h2 className="text-xl font-light tracking-tight text-foreground">Create a new Circle</h2>
              <p className="text-xs text-muted-foreground/80 font-light leading-relaxed">
                Add an isolated group (e.g., Close Friends, Dev Team, Family) to selectively share journals or send group-targeted messages.
              </p>
            </div>
            
            <form action={createCircle} className="flex gap-2.5 pt-6">
              <Input 
                name="name" 
                placeholder="e.g. Close Friends" 
                className="flex-1 bg-background/50 border-border/40 rounded-full px-5 py-5 text-xs font-light shadow-2xs focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all placeholder:text-muted-foreground/40"
                required 
              />
              <SubmitButton className="rounded-full px-6 text-xs font-medium shadow-xs hover:scale-105 active:scale-95 transition-all">Create</SubmitButton>
            </form>
          </div>
        </div>

        {/* Section 2: Circles Grid */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border/40 to-transparent" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-4">
              Your Intentional Spaces ({circles?.length || 0})
            </h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-border/40 to-transparent" />
          </div>

          {circles?.length === 0 ? (
            <div className="text-center py-20 bg-background/10 border border-dashed border-border/40 rounded-[2rem] space-y-4 backdrop-blur-xs">
              <Users size={40} className="mx-auto text-muted-foreground/30 stroke-[1.25]" />
              <p className="text-lg font-light text-muted-foreground/70 italic">Your space feels peaceful.</p>
              <p className="text-xs text-muted-foreground/40 font-light">Create your first circle above to start curating your network.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {circles?.map((circle: any) => (
                <Link 
                  href={`/circles/${circle.id}`} 
                  key={circle.id} 
                  className="group relative overflow-hidden bg-background/25 backdrop-blur-md border border-border/30 rounded-[2rem] p-6 flex flex-col justify-between h-40 hover:border-primary/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                >
                  <div className="absolute top-[-50%] right-[-50%] w-32 h-32 bg-primary/3 rounded-full blur-2xl group-hover:bg-primary/8 transition-colors duration-500" />
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/0 border border-primary/10 text-primary group-hover:scale-110 group-hover:shadow-[0_8px_30px_rgba(var(--primary),0.1)] transition-all duration-500 shrink-0">
                      <Users size={20} strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-foreground tracking-tight text-sm truncate group-hover:text-primary transition-colors duration-300">
                        {circle.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground/60 font-light mt-1">
                        Created {new Date(circle.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground/60 font-light mt-4 pt-3 border-t border-border/20 group-hover:text-primary transition-colors">
                    <span>Manage members</span>
                    <span className="transform translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-sm">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
