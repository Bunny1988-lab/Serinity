import { createClient } from '@/lib/supabase/server'
import { Calendar, Heart, Sparkles, Target } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NotificationBell } from '@/components/notification-bell'
import { CreatePostModal } from '@/components/create-post-modal'
import { PostInteractions } from '@/components/post-interactions'
import { AudioReflectionsPlayer } from '@/components/audio-reflections-player'
import { SunsetLockCover } from '@/components/sunset-lock-cover'
import { getMoodInkwellStyle } from '@/lib/utils'
import { VignetteCarousel } from '@/components/vignette-carousel'
import { ExpandableImage } from '@/components/expandable-image'


export default async function HomeDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  // Real circles for the create post dropdown
  const { data: circles } = await supabase
    .from('circles')
    .select('id, name')
    .eq('owner_id', user.id)

  // Fetch actual posts with sunset lock and audio whisper fields (Global Feed)
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, content, image_url, audio_url, mood, created_at, allow_comments,
      audio_play_count, audio_is_whisper, is_sunset_locked,
      users:author_id (id, display_name, avatar_url),
      reactions (id, user_id),
      comments (id, content, created_at, users:author_id(display_name))
    `)
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <div className="flex w-full min-h-screen bg-background">
      {/* ── MAIN SCROLL AREA ── */}
      <div className="flex-1 min-w-0 flex flex-col items-center pt-32 pb-24">
        <div className="w-full max-w-[800px] px-5">
          {/* Feed Intro / Atmosphere */}
          <div className="mb-16 text-center">
            <p className="font-label-caps text-xs font-bold text-on-surface-variant mb-4 uppercase tracking-[0.2em]">
              The Curator's Journal
            </p>
            <h3 className="font-headline-md text-3xl font-medium text-primary italic">
              Deep focus is the currency of the modern age.
            </h3>
          </div>

          {/* Daily Vignettes */}
          <div className="mb-16">
            <VignetteCarousel currentUser={{ id: user.id, display_name: profile?.display_name || 'You', avatar_url: profile?.avatar_url }} />
          </div>
          
          {/* Single Column Feed */}
          <div className="space-y-24">
            {posts?.map((post: any) => {
              const authorInfo = post.users || { id: '', display_name: 'Anonymous', avatar_url: null }
              const isOwnPost = authorInfo.id === user.id

              return (
                <article key={post.id} className="group">
                  <SunsetLockCover isLocked={post.is_sunset_locked}>
                    {post.image_url && (
                      <div className="relative mb-8 rounded-2xl">
                        <ExpandableImage
                          layoutId={`post-${post.id}`}
                          src={post.image_url}
                          alt="Post visual"
                          className="w-full h-[500px] rounded-2xl overflow-hidden border-[0.5px] border-outline-variant bg-surface-container-low shadow-sm"
                        />
                        <div className="absolute top-6 left-6 z-20">
                          <Link 
                            href={isOwnPost ? '/profile' : `/discover?u=${authorInfo.id}`}
                            className="flex items-center space-x-3 hover:opacity-85 transition-all"
                          >
                            <div className="w-10 h-10 rounded-full border border-white/20 bg-white/10 backdrop-blur-md overflow-hidden flex items-center justify-center">
                              {authorInfo.avatar_url ? (
                                <img
                                  alt="Author"
                                  className="w-full h-full object-cover"
                                  src={authorInfo.avatar_url}
                                />
                              ) : (
                                <span className="text-white font-bold text-sm">{(authorInfo.display_name || 'A')[0]}</span>
                              )}
                            </div>
                            <span className="font-ui-element text-sm font-medium tracking-wide text-white drop-shadow-md">
                              {authorInfo.display_name || 'Anonymous'}
                            </span>
                          </Link>
                        </div>
                      </div>
                    )}
                    
                    <div className={post.image_url ? 'px-2' : 'bg-surface-container-low border-[0.5px] border-outline-variant p-12 relative overflow-hidden group rounded-2xl'}>
                      {!post.image_url && (
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors duration-700"></div>
                      )}
                      
                      <div className={!post.image_url ? 'relative z-10 flex flex-col items-center text-center' : ''}>
                        {post.mood && (
                          <span className={`font-label-caps text-xs font-bold text-secondary mb-4 uppercase tracking-widest block ${!post.image_url ? 'mb-8' : ''}`}>
                            Feeling {post.mood}
                          </span>
                        )}
                        
                        <div className={`flex justify-between items-start mb-4 ${!post.image_url ? 'w-full flex-col items-center gap-4' : ''}`}>
                          <h2 className={`${getMoodInkwellStyle(post.mood) || (!post.image_url ? 'font-display-lg text-5xl italic text-primary' : 'font-headline-md text-3xl font-medium text-primary')} ${!post.image_url ? 'max-w-lg leading-[1.2] mb-8 text-center' : 'max-w-2xl leading-tight'}`}>
                            {post.content}
                          </h2>
                          {post.image_url && (
                            <span className="font-label-caps text-xs font-bold text-on-surface-variant pt-2 uppercase tracking-widest whitespace-nowrap">
                              {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {post.audio_url && (
                          <div className={`mb-6 flex ${!post.image_url ? 'justify-center w-full' : ''}`}>
                            <AudioReflectionsPlayer 
                              audioUrl={post.audio_url} 
                              isWhisper={post.audio_is_whisper}
                              playCount={post.audio_play_count}
                              postId={post.id}
                            />
                          </div>
                        )}

                        {!post.image_url && (
                          <>
                            <div className="w-12 h-[0.5px] bg-outline mb-8"></div>
                            <div className="flex items-center space-x-4">
                              <Link
                                href={isOwnPost ? '/profile' : `/discover?u=${authorInfo.id}`}
                                className="flex items-center space-x-4 hover:opacity-85 transition-all"
                              >
                                <div className="w-12 h-12 rounded-full border border-outline-variant overflow-hidden flex items-center justify-center bg-surface">
                                  {authorInfo.avatar_url ? (
                                    <img src={authorInfo.avatar_url} alt="Author" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="font-bold text-primary">{(authorInfo.display_name || 'A')[0]}</span>
                                  )}
                                </div>
                                <div className="text-left">
                                  <p className="font-ui-element text-sm font-medium tracking-wide text-primary">
                                    {authorInfo.display_name || 'Anonymous'}
                                  </p>
                                  <p className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </p>
                                </div>
                              </Link>
                            </div>
                          </>
                        )}

                        <div className={!post.image_url ? 'w-full mt-12' : ''}>
                          <PostInteractions 
                            postId={post.id} 
                            initialReactions={post.reactions} 
                            initialComments={post.comments} 
                            allowComments={post.allow_comments} 
                            mood={post.mood}
                          />
                        </div>
                      </div>
                    </div>
                  </SunsetLockCover>
                </article>
              )
            })}

            {(!posts || posts.length === 0) && (
              <div className="text-center py-24">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">history_edu</span>
                <p className="font-headline-md text-xl text-primary italic">The page is blank.</p>
                <p className="font-body-md text-on-surface-variant mt-2">Write the first entry in your journal.</p>
              </div>
            )}
          </div>

          {posts && posts.length > 0 && (
            <div className="mt-32 flex flex-col items-center">
              <div className="w-1 h-12 bg-outline-variant mb-8"></div>
              <button className="font-label-caps text-xs font-bold text-on-surface-variant hover:text-primary transition-colors tracking-[0.3em] uppercase active-underline relative py-2">
                Scroll to reveal more
              </button>
            </div>
          )}
        </div>
      </div>
      
      <CreatePostModal circles={circles || []} />
    </div>
  )
}
