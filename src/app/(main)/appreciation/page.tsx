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
    'hear_you': <Heart className="text-blue-500" fill="currentColor" size={24} />,
    'appreciate': <Sparkles className="text-emerald-500" size={24} />,
    'smile': <Sun className="text-amber-500" size={24} />
  }

  return (
    <div className="pb-20 md:pb-0 min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 px-4 py-4 backdrop-blur-xl border-b border-border/50">
        <h1 className="text-xl font-light tracking-tight flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" />
          Appreciation Wall
        </h1>
      </header>
      
      <div className="p-4 space-y-8 max-w-xl mx-auto">
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 text-center space-y-2 relative overflow-hidden">
          <Heart className="absolute -bottom-4 -left-4 opacity-5 text-amber-500" size={100} />
          <h2 className="text-lg font-medium text-foreground relative z-10">Private Positivity Archive</h2>
          <p className="text-sm font-light text-muted-foreground relative z-10">
            A quiet space to see the kindness you've received. No public counts, no comparison. Just good energy.
          </p>
        </div>

        <div className="columns-1 sm:columns-2 gap-4 space-y-4">
          {allPositivity.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 col-span-full">
              <p className="text-sm font-light">Share your thoughts to receive kindness from your circles.</p>
            </div>
          ) : (
            allPositivity.map((item, i) => (
              <div key={i} className="bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl p-5 break-inside-avoid shadow-sm hover:shadow-md transition-shadow">
                {item.kind === 'reaction' ? (
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    {REACTION_ICONS[item.type] || <Heart className="text-rose-500" fill="currentColor" size={32} />}
                    <p className="text-sm text-center">
                      <span className="font-medium text-foreground">{item.user?.display_name}</span>
                      <span className="text-muted-foreground"> reacted to your post</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                        {item.author?.display_name?.[0]}
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.author?.display_name}</p>
                    </div>
                    <p className="text-sm text-foreground/80 font-light leading-relaxed">
                      "{item.content}"
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground/50 mt-4 text-right">
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
