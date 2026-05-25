import { getNotifications, markNotificationsRead } from '@/app/(main)/actions'
import { Bell, Heart, MessageCircle, UserCircle } from 'lucide-react'

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  
  // Mark as read in the background
  if (notifications.some((n: any) => !n.read)) {
    markNotificationsRead()
  }

  return (
    <div className="pb-32 md:pb-0 min-h-screen bg-background/50">
      <header className="sticky top-0 z-10 bg-background/80 px-6 py-6 backdrop-blur-2xl border-b border-border/30">
        <h1 className="text-2xl font-light tracking-tight text-foreground">Notifications</h1>
      </header>
      
      <div className="p-6 max-w-xl mx-auto space-y-4 mt-4">
        {notifications.length === 0 ? (
          <div className="text-center text-muted-foreground py-24 space-y-4">
            <Bell className="mx-auto opacity-10" size={40} strokeWidth={1} />
            <p className="text-lg font-light italic">Quiet today 🌿</p>
            <p className="text-sm font-light opacity-70">You're all caught up with your network.</p>
          </div>
        ) : (
          notifications.map((notification: any) => (
            <div 
              key={notification.id} 
              className={`flex items-start gap-4 p-5 rounded-3xl transition-all ${notification.read ? 'bg-background/80 border border-border/30 hover:border-border/60 hover:shadow-sm' : 'bg-primary/5 border border-primary/20 shadow-sm'}`}
            >
              <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary overflow-hidden shrink-0 shadow-sm border border-border/50">
                {notification.source_user.avatar_url ? (
                  <img src={notification.source_user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={28} strokeWidth={1} />
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <p className="text-sm">
                  <span className="font-medium text-foreground">{notification.source_user.display_name}</span>
                  {' '}
                  <span className="text-muted-foreground font-light">
                    {notification.type === 'reaction' ? 'reacted to your reflection' : 'shared a thought on your post'}
                  </span>
                </p>
                
                {notification.post?.content && (
                  <p className="text-sm font-light text-muted-foreground/80 border-l-2 border-border/50 pl-3 mt-3 italic line-clamp-2">
                    "{notification.post.content}"
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground/40 pt-2 font-medium uppercase tracking-wider">
                  {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="shrink-0 mt-1">
                {notification.type === 'reaction' ? (
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Heart size={14} strokeWidth={2} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <MessageCircle size={14} strokeWidth={2} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
