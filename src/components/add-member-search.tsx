'use client'

import { useState, useEffect } from 'react'
import { searchUsers, addMemberToCircleGlobal } from '@/app/(main)/actions'
import { Search, Loader2, Plus, UserCircle, ShieldCheck } from 'lucide-react'
import { ContactImporter } from '@/components/contact-importer'

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
  const [importerOpen, setImporterOpen] = useState(false)

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary" size={15} />
          <input 
            type="text" 
            placeholder="Search registered users to add..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-11 bg-background/40 backdrop-blur-xs border border-border/40 rounded-full pl-11 pr-5 text-xs font-light outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 focus:bg-background/80 transition-all placeholder:text-muted-foreground/40 shadow-2xs"
          />
        </div>
        
        {/* Sync Contacts Button inside adding circles panel */}
        <button
          type="button"
          onClick={() => setImporterOpen(true)}
          className="h-11 px-5 rounded-full border border-border/10 bg-background/30 backdrop-blur-sm text-xs font-medium text-foreground hover:bg-muted/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer"
        >
          <ShieldCheck size={14} className="text-primary" />
          Sync Contacts
        </button>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 size={14} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground/75 font-light tracking-wide uppercase animate-pulse">Searching the platform...</p>
        </div>
      )}

      {!isSearching && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-6 border border-dashed border-border/30 rounded-2xl">
          <p className="text-xs text-muted-foreground/60 font-light">No registered users match your search.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-background/40 backdrop-blur-md border border-border/30 rounded-2xl divide-y divide-border/20 overflow-hidden shadow-2xs animate-in fade-in duration-300">
          {results.map((u: any) => {
            const isLoading = loadingUserId === u.id
            return (
              <div key={u.id} className="flex items-center gap-3.5 p-3.5 hover:bg-muted/15 transition-colors">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/0 border border-border/30 flex items-center justify-center shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-primary/60">{u.display_name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{u.display_name}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate font-light">@{u.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(u.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 select-none cursor-pointer shadow-2xs"
                >
                  {isLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={11} strokeWidth={2.5} />
                      Add to Circle
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
      <ContactImporter isOpen={importerOpen} onClose={() => setImporterOpen(false)} />
    </div>
  )
}
