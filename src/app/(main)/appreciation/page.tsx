import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Heart, Sparkles, Sun } from 'lucide-react'

export default async function AppreciationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user's posts
  const { data: myPosts } = await supabase
    .from('posts')
    .select('id')
    .eq('author_id', user.id)

  const postIds = myPosts?.map((p: any) => p.id) || []

  // Fetch reactions on those posts (excluding own reactions)
  let appreciations: any[] = []
  if (postIds.length > 0) {
    const { data } = await supabase
      .from('reactions')
      .select('type, created_at, user:users(display_name)')
      .in('post_id', postIds)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    appreciations = data || []
  }

  // Fetch positive comments (just showing all comments on their posts for now)
  let comments: any[] = []
  if (postIds.length > 0) {
    const { data } = await supabase
      .from('comments')
      .select('content, created_at, author:users(display_name)')
      .in('post_id', postIds)
      .neq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    comments = data || []
  }

  // Combine and sort
  const allPositivity = [
    ...appreciations.map(a => ({ ...a, kind: 'reaction' })),
    ...comments.map(c => ({ ...c, kind: 'comment' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const REACTION_ICONS: Record<string, any> = {
    'hear_you': <Heart className="text-[#3b82f6]" fill="currentColor" size={24} />,
    'appreciate': <Sparkles className="text-[#10b981]" size={24} />,
    'smile': <Sun className="text-[#f59e0b]" size={24} />
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent relative z-20">
        <h1 className="text-[17px] font-bold text-foreground flex items-center gap-2">
          <Sparkles size={20} className="text-[#D4AF37]" />
          Appreciation Wall
        </h1>
      </header>
      
      <main className="px-6 space-y-6 max-w-[800px] mx-auto w-full">
        <div className="bg-[#FFFCF5] border border-[#D4AF37]/40 rounded-[24px] p-6 text-center space-y-2 relative overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <Heart className="absolute -bottom-4 -left-4 opacity-10 text-[#D4AF37]" size={100} />
          <h2 className="text-[16px] font-bold text-foreground relative z-10">Private Positivity Archive</h2>
          <p className="text-[13px] font-medium text-foreground/70 relative z-10">
            A quiet space to see the kindness you've received. No public counts, no comparison. Just good energy.
          </p>
        </div>

        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {allPositivity.length === 0 ? (
            <div className="text-center py-10 col-span-full">
              <p className="text-[14px] text-foreground/60 font-medium">Share your thoughts to receive kindness from your circles.</p>
            </div>
          ) : (
            allPositivity.map((item, i) => (
              <div key={i} className="bg-card border border-border-mint rounded-[24px] p-5 break-inside-avoid shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-shadow">
                {item.kind === 'reaction' ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    {REACTION_ICONS[item.type] || <Heart className="text-rose-500" fill="currentColor" size={32} />}
                    <p className="text-[13px] text-center">
                      <span className="font-bold text-foreground">{item.user?.display_name}</span>
                      <span className="text-foreground/70 font-medium"> reacted to your post</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-background border border-border-mint flex items-center justify-center text-foreground text-[13px] font-bold">
                        {item.author?.display_name?.[0]}
                      </div>
                      <p className="text-[14px] font-bold text-foreground">{item.author?.display_name}</p>
                    </div>
                    <p className="text-[14px] text-foreground font-medium leading-relaxed bg-background/30 p-4 rounded-[16px]">
                      "{item.content}"
                    </p>
                  </div>
                )}
                <p className="text-[11px] font-bold text-foreground/40 mt-4 text-right uppercase tracking-widest">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
