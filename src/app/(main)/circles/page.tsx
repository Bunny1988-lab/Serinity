import { createClient } from '@/lib/supabase/server'
import { createCircle } from '@/app/(main)/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { SubmitButton } from '@/components/submit-button'
import { InviteButton } from '@/components/invite-button'

export default async function CirclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: circles } = await supabase
    .from('circles')
    .select('id, name, created_at')
    .eq('owner_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="pb-32 md:pb-0 min-h-screen bg-background/50">
      <header className="sticky top-0 z-10 bg-background/80 px-6 py-6 backdrop-blur-2xl border-b border-border/30">
        <h1 className="text-2xl font-light tracking-tight text-foreground">Circles</h1>
        <p className="text-sm font-light text-muted-foreground mt-1 tracking-wide">Manage your trusted spaces.</p>
      </header>
      
      <div className="p-6 space-y-12 max-w-xl mx-auto">
        <div className="bg-primary/5 rounded-3xl p-8 text-center space-y-4 relative overflow-hidden transition-all hover:bg-primary/10">
          <h2 className="text-lg font-medium text-foreground tracking-tight">Expand your space</h2>
          <p className="text-sm font-light text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Invite close friends to your network to start adding them to your inner circles.
          </p>
          <div className="pt-2">
            <InviteButton />
          </div>
        </div>

        <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-8 shadow-sm">
          <h2 className="text-lg font-medium mb-4 tracking-tight text-foreground">Create a new Circle</h2>
          <form action={createCircle} className="flex gap-3">
            <Input 
              name="name" 
              placeholder="e.g. Close Friends, Family" 
              className="flex-1 bg-background border-border/50 rounded-full px-6 shadow-sm focus-visible:ring-primary/20 text-sm font-light"
              required 
            />
            <SubmitButton className="rounded-full px-8 shadow-sm font-medium">Create</SubmitButton>
          </form>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-medium uppercase tracking-widest text-muted-foreground/80 px-2 text-center mb-6">Your Intentional Spaces</h3>
          {circles?.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 space-y-4">
              <Users size={32} className="mx-auto opacity-20" strokeWidth={1} />
              <p className="text-lg font-light italic">Your space feels peaceful.</p>
              <p className="text-sm font-light opacity-70">Create a circle to start curating your network.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {circles?.map((circle: any) => (
                <Link href={`/circles/${circle.id}`} key={circle.id} className="bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 flex flex-col justify-between h-36 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-primary/5 text-primary group-hover:scale-110 transition-transform">
                      <Users size={20} strokeWidth={1.5} />
                    </div>
                    <h4 className="font-medium text-foreground tracking-wide">{circle.name}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground font-light group-hover:text-primary transition-colors flex items-center gap-1">
                    Manage members <span className="opacity-0 group-hover:opacity-100 transition-opacity transition-transform translate-x-[-5px] group-hover:translate-x-0">→</span>
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
