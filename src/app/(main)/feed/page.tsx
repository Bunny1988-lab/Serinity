import { createClient } from '@/lib/supabase/server'
import { PostCreator } from '@/components/post-creator'
import { Heart, MessageCircle } from 'lucide-react'

import { PostInteractions } from '@/components/post-interactions'
import { PostMenu } from '@/components/post-menu'
import { Lock, BookHeart } from 'lucide-react'
import Link from 'next/link'

export default async function FeedPage() {
  const supabase = await createClient()
  
  // Fetch user's circles for the post creator
  const { data: { user } } = await supabase.auth.getUser()
  const { data: circles } = await supabase.from('circles').select('id, name').eq('owner_id', user?.id)
  
  // Fetch chronologically ordered posts from last 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      image_url,
      mood,
      created_at,
      author_id,
      allow_comments,
      unlock_date,
      author:users(username, display_name, avatar_url),
      reactions ( user_id, type ),
      comments ( id, content, created_at, author:users(display_name) )
    `)
    .gte('created_at', twoDaysAgo)
    .order('created_at', { ascending: false })

  const REFLECTION_PROMPTS = [
    "What made you smile today?",
    "Want to reflect for a moment?",
    "What's on your mind today?",
    "One thing you're grateful for?",
    "How are you really feeling right now?"
  ]
  const randomPrompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]

  return (
    <div className="pb-32 md:pb-0 min-h-screen bg-background/50">
      <header className="sticky top-0 z-10 bg-background/80 px-6 py-6 backdrop-blur-2xl border-b border-border/30">
        <h1 className="text-2xl font-light tracking-tight text-foreground">Home</h1>
      </header>
      
      <div className="p-6 space-y-12 max-w-xl mx-auto">
        
        {/* Daily Reflection Prompt */}
        <div className="bg-primary/5 rounded-3xl p-6 flex items-center justify-between transition-transform hover:scale-[1.01]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <BookHeart size={24} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-medium text-sm">Reflection</p>
              <p className="text-sm text-muted-foreground font-light">{randomPrompt}</p>
            </div>
          </div>
          <Link href="/journal">
            <button className="px-5 py-2.5 bg-background shadow-sm rounded-full text-xs font-medium hover:bg-muted transition-colors">
              Write
            </button>
          </Link>
        </div>

        <PostCreator circles={circles || []} />
        
        <div className="space-y-16 mt-8">
          {posts?.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <p className="text-lg font-light">Quiet here today 🌿</p>
            </div>
          ) : (
            <>
              {posts?.map((post: any) => {
                const isLocked = post.unlock_date && new Date(post.unlock_date) > new Date();

                return (
                  <article key={post.id} className="relative space-y-4">
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium overflow-hidden">
                          {post.author.avatar_url ? (
                            <img src={post.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            post.author.display_name?.[0]
                          )}
                        </div>
                        <div>
                          <p className="text-base font-medium text-foreground">{post.author.display_name}</p>
                          <p className="text-xs text-muted-foreground font-light">
                            {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {post.circle?.name && ` • ${post.circle.name}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.mood && (
                          <span className="text-xs font-medium uppercase tracking-widest text-primary/70">
                            {post.mood}
                          </span>
                        )}
                        {post.author.id === user.id && <PostMenu postId={post.id} allowComments={post.allow_comments} />}
                      </div>
                    </div>
                    
                    {isLocked ? (
                      <div className="bg-primary/5 rounded-3xl p-8 text-center space-y-3 relative overflow-hidden backdrop-blur-md">
                        <Lock className="mx-auto text-primary/40" size={32} strokeWidth={1} />
                        <p className="font-medium text-foreground">Time Capsule</p>
                        <p className="text-sm text-muted-foreground font-light">Unlocks on {new Date(post.unlock_date).toLocaleDateString()}</p>
                      </div>
                    ) : (
                      <>
                        {post.content && (
                          <p className="text-foreground text-lg leading-relaxed font-light whitespace-pre-wrap pl-1">
                            {post.content}
                          </p>
                        )}

                        {post.image_url && (
                          <div className="mt-6 rounded-3xl overflow-hidden bg-muted/20">
                            <img src={post.image_url} alt="Post attachment" className="w-full h-auto object-cover max-h-[600px]" />
                          </div>
                        )}

                        <div className="pt-4">
                          <PostInteractions 
                            postId={post.id} 
                            reactions={post.reactions} 
                            comments={post.comments} 
                            allowComments={post.allow_comments}
                            currentUserId={user.id}
                          />
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
              
              <div className="py-20 text-center space-y-4">
                <p className="text-xl font-light text-foreground/60 italic">That's all for now 🌿</p>
                <p className="text-sm text-muted-foreground font-light max-w-xs mx-auto">
                  You're all caught up. Why not take a moment to reflect in your journal?
                </p>
                <Link href="/journal" className="inline-block mt-4">
                  <button className="px-6 py-2 rounded-full border border-border/50 text-sm font-medium hover:bg-muted/50 transition-colors">
                    Go to Journal
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
