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
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative group flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
          <input 
            type="text" 
            placeholder="Search registered users to add..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 bg-background border border-border-mint/50 rounded-full pl-11 pr-5 text-[14px] font-medium text-foreground outline-none focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] transition-all placeholder:text-foreground/40"
          />
        </div>
        
        <button
          type="button"
          onClick={() => setImporterOpen(true)}
          className="h-12 px-6 rounded-full border border-border-mint bg-card text-[14px] font-bold text-foreground hover:bg-background transition-all flex items-center justify-center gap-2 shrink-0 select-none shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer"
        >
          <ShieldCheck size={18} strokeWidth={2.5} className="text-foreground" />
          Sync Contacts
        </button>
      </div>

      {isSearching && (
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 size={16} className="animate-spin text-foreground/60" />
          <p className="text-[13px] text-foreground/60 font-bold uppercase tracking-wide animate-pulse">Searching...</p>
        </div>
      )}

      {!isSearching && query.length >= 2 && results.length === 0 && (
        <div className="text-center py-8 border border-dashed border-border-mint rounded-[20px] bg-background/30">
          <p className="text-[14px] text-foreground/60 font-medium">No registered users match your search.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-card border border-border-mint rounded-[20px] divide-y divide-[#BCE3D8]/30 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          {results.map((u: any) => {
            const isLoading = loadingUserId === u.id
            return (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-background/50 transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-background border border-border-mint flex items-center justify-center shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[15px] font-bold text-foreground">{u.display_name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">{u.display_name}</p>
                  <p className="text-[12px] text-foreground/60 truncate font-medium">@{u.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(u.id)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-[13px] font-bold bg-foreground text-white hover:opacity-90 transition-all disabled:opacity-50 select-none shadow-sm cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={14} strokeWidth={2.5} />
                      Add
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
