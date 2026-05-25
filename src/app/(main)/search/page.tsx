'use client'

import { useState, useEffect } from 'react'
import { searchUsers } from '@/app/(main)/actions'
import { Search as SearchIcon, UserCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true)
        const users = await searchUsers(query)
        setResults(users)
        setIsSearching(false)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="pb-20 md:pb-0 min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 px-4 py-4 backdrop-blur-xl border-b border-border/50">
        <h1 className="text-xl font-light tracking-tight">Search</h1>
      </header>
      
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input 
            type="text" 
            placeholder="Search for friends by name or username..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-background border border-border/50 rounded-2xl pl-10 pr-4 py-3 outline-none focus:border-primary/50 transition-colors shadow-sm"
          />
        </div>

        <div className="space-y-2">
          {isSearching && <p className="text-center text-sm text-muted-foreground pt-10">Searching...</p>}
          
          {!isSearching && query.length >= 2 && results.length === 0 && (
             <p className="text-center text-sm text-muted-foreground pt-10">No users found.</p>
          )}

          {!isSearching && results.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={28} strokeWidth={1} />
                  )}
                </div>
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <Link 
                href={`/messages?u=${user.id}`}
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                title="Message"
              >
                <MessageSquare size={20} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
