import Link from 'next/link'
import { Calendar, TrendingUp, Zap } from 'lucide-react'

interface RightSidebarProps {
  activeFriends?: { id: string; display_name: string; avatar_url: string | null }[]
}

export function DesktopRightSidebar({ activeFriends = [] }: RightSidebarProps) {
  const events = [
    { emoji: '🧘‍♀️', title: 'Mindfulness Session', time: 'Today, 8:00 PM' },
    { emoji: '✍️', title: 'Group Journaling', time: 'Tomorrow, 7:00 PM' },
    { emoji: '🌿', title: 'Gratitude Circle', time: 'Sun, 5:00 PM' },
  ]

  const trends = [
    { tag: '#MorningMindfulness', posts: '1.2k posts' },
    { tag: '#GratitudeChallenge', posts: '843 posts' },
    { tag: '#DigitalDetox', posts: '679 posts' },
    { tag: '#JournalEveryDay', posts: '512 posts' },
  ]

  return (
    <aside className="hidden xl:flex flex-col w-[300px] shrink-0 gap-4 py-8 pr-6 overflow-y-auto hide-scrollbar">
      
      {/* Active Friends */}
      {activeFriends.length > 0 && (
        <div className="bg-surface-container-low border-[0.5px] border-outline-variant rounded-lg p-6 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-6 border-b-[0.5px] border-outline-variant/50 pb-2">
            <h3 className="text-xs font-bold text-secondary tracking-[0.2em] uppercase">Active Now</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-auto"></div>
          </div>
          <div className="space-y-4">
            {activeFriends.slice(0, 5).map(friend => (
              <Link key={friend.id} href={`/messages?u=${friend.id}`} className="flex items-center gap-3 group">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-surface border border-outline-variant flex items-center justify-center overflow-hidden">
                    {friend.avatar_url
                      ? <img src={friend.avatar_url} alt={friend.display_name} className="w-full h-full object-cover" />
                      : <span className="text-[13px] font-bold text-primary">{friend.display_name[0]}</span>
                    }
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-[2px] border-surface rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary truncate group-hover:underline">{friend.display_name}</p>
                  <p className="text-xs text-on-surface-variant font-medium">Active now</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-surface-container-low border-[0.5px] border-outline-variant rounded-lg p-6 relative overflow-hidden group">
        <div className="flex items-center gap-2 mb-6 border-b-[0.5px] border-outline-variant/50 pb-2">
          <h3 className="text-xs font-bold text-secondary tracking-[0.2em] uppercase">Upcoming</h3>
        </div>
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.title} className="flex items-start gap-3 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-sm shrink-0">
                {event.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary leading-tight group-hover:underline">{event.title}</p>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-surface-container-low border-[0.5px] border-outline-variant rounded-lg p-6 relative overflow-hidden group">
        <div className="flex items-center gap-2 mb-6 border-b-[0.5px] border-outline-variant/50 pb-2">
          <h3 className="text-xs font-bold text-secondary tracking-[0.2em] uppercase">Trending</h3>
        </div>
        <div className="space-y-4">
          {trends.map(trend => (
            <div key={trend.tag} className="group cursor-pointer flex justify-between items-center">
              <p className="text-sm font-semibold text-primary group-hover:underline">{trend.tag}</p>
              <p className="text-xs text-on-surface-variant font-medium">{trend.posts}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Tip */}
      <div className="bg-surface-container-low border-[0.5px] border-outline-variant rounded-lg p-8 relative overflow-hidden text-center group">
        <span className="font-label-caps text-xs font-bold text-secondary mb-4 block uppercase tracking-widest">Reflection</span>
        <h2 className="font-display text-2xl text-primary italic mb-4 leading-tight">
          "Take 3 deep breaths before your next meeting."
        </h2>
        <div className="w-8 h-[0.5px] bg-outline mx-auto mb-4"></div>
        <p className="text-sm text-on-surface-variant italic opacity-80">
          Your nervous system will thank you.
        </p>
      </div>

    </aside>
  )
}
