'use client'

import { useState, useEffect } from 'react'
import { searchUsers, addMemberToCircleGlobal } from '@/app/(main)/actions'
import { Search, Loader2, Plus, UserCircle } from 'lucide-react'

interface Props {
  circleId: string
  excludeIds: string[]
}

export function AddMemberSearch({ circleId, excludeIds: initialExcludeIds }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [excludeIds, setExcludeIds] = useState<string[]>(initialExcludeIds)
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true)
        const users = await searchUsers(query)
        // Filter out users already in circle
        const filtered = users.filter((u: any) => !excludeIds.includes(u.id))
        setResults(filtered)
        setIsSearching(false)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, excludeIds])

  const handleAdd = async (userId: string) => {
    setLoadingUserId(userId)
    const res = await addMemberToCircleGlobal(circleId, userId)
    if (res.success) {
      setExcludeIds(prev => [...prev, userId])
      setResults(prev => prev.filter(u => u.id !== userId))
    }
    setLoadingUserId(null)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input 
          type="text" 
          placeholder="Search registered users to add..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full h-10 bg-background border border-border/50 rounded-full pl-9 pr-4 text-xs font-light outline-none focus:border-primary/50 transition-colors shadow-xs"
        />
      </div>

      {isSearching && <p className="text-center text-xs text-muted-foreground py-4 animate-pulse">Searching...</p>}

      {!isSearching && query.length >= 2 && results.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">No new users found.</p>
      )}

      {results.length > 0 && (
        <div className="bg-background/60 border border-border/40 rounded-2xl divide-y divide-border/30 overflow-hidden shadow-xs">
          {results.map((u: any) => {
            const isLoading = loadingUserId === u.id
            return (
              <div key={u.id} className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{u.display_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(u.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all disabled:opacity-50 select-none cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={10} />
                      Add
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
