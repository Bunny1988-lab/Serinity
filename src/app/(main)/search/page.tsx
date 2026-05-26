'use client'

import { useState, useEffect } from 'react'
import { searchUsers, getCirclesWithOwner, addMemberToCircleGlobal, getMembershipsForUser } from '@/app/(main)/actions'
import { Search as SearchIcon, UserCircle, MessageSquare, ShieldCheck, UserPlus, X, Check, Loader2, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import { ContactImporter } from '@/components/contact-importer'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isImporterOpen, setIsImporterOpen] = useState(false)
  
  // User authentication
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  // Circle modal state
  const [circles, setCircles] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false)
  const [userMemberships, setUserMemberships] = useState<string[]>([]) // List of circle_ids
  const [loadingCircleId, setLoadingCircleId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setCurrentUserId(data.user.id)
      }
    })
  }, [])

  // Debounced search query
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

  // Open circle allocation modal
  const handleOpenCircleModal = async (user: any) => {
    setSelectedUser(user)
    setIsCircleModalOpen(true)
    
    // Load circles & user memberships
    const userCircles = await getCirclesWithOwner()
    const memberships = await getMembershipsForUser(user.id)
    
    setCircles(userCircles)
    setUserMemberships(memberships)
  }

  // Add user to a circle
  const handleAddToCircle = async (circleId: string) => {
    if (!selectedUser) return
    setLoadingCircleId(circleId)
    
    const res = await addMemberToCircleGlobal(circleId, selectedUser.id)
    if (res.success) {
      setUserMemberships(prev => [...prev, circleId])
    }
    
    setLoadingCircleId(null)
  }

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

        {/* Contact Sync Entry Card */}
        <div className="p-5 bg-background/40 backdrop-blur-sm border border-border/50 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex gap-3">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={20} className="stroke-[1.75]" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-snug">Privacy-First Friend Sync</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                Have friends on Serenity? Securely scan your contacts using browser-based hashing to find them instantly.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsImporterOpen(true)}
            className="w-full md:w-auto px-5 py-2.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground hover:bg-primary/95 transition-all text-center select-none shadow-sm shrink-0"
          >
            Find Friends
          </button>
        </div>

        <div className="space-y-2">
          {isSearching && <p className="text-center text-sm text-muted-foreground pt-10">Searching...</p>}
          
          {!isSearching && query.length >= 2 && results.length === 0 && (
             <p className="text-center text-sm text-muted-foreground pt-10">No users found.</p>
          )}

          {!isSearching && results.map((user) => {
            // Don't show myself in search results for circle adding
            if (user.id === currentUserId) return null

            return (
              <div key={user.id} className="flex items-center justify-between p-4 bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={28} strokeWidth={1} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm leading-snug">{user.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Add to Circle Button */}
                  <button 
                    onClick={() => handleOpenCircleModal(user)}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Add to Circle"
                  >
                    <UserPlus size={20} strokeWidth={1.5} />
                  </button>

                  {/* Message Button */}
                  <Link 
                    href={`/messages?u=${user.id}`}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Message"
                  >
                    <MessageSquare size={20} strokeWidth={1.5} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ContactImporter 
        isOpen={isImporterOpen} 
        onClose={() => setIsImporterOpen(false)} 
      />

      {/* Circle Allocation Modal */}
      <AnimatePresence>
        {isCircleModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCircleModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
            />
            {/* Dialog Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-background/95 border border-border/50 rounded-3xl p-6 shadow-2xl w-full max-w-sm relative z-10 flex flex-col gap-4 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  <span className="font-light tracking-wide text-sm">Add to Circles</span>
                </div>
                <button 
                  onClick={() => setIsCircleModalOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Bio Summary */}
              <div className="flex items-center gap-3 p-3 bg-muted/20 border border-border/30 rounded-2xl">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle size={24} strokeWidth={1} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{selectedUser.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Circles List */}
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-none pr-1">
                {circles.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground font-light mb-3">You haven't created any Circles yet.</p>
                    <Link href="/circles" onClick={() => setIsCircleModalOpen(false)}>
                      <button className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-full transition-all">
                        Create a Circle
                      </button>
                    </Link>
                  </div>
                ) : (
                  circles.map((circle) => {
                    const isInCircle = userMemberships.includes(circle.id)
                    const isLoading = loadingCircleId === circle.id

                    return (
                      <div 
                        key={circle.id} 
                        className="flex items-center justify-between p-3.5 bg-background border border-border/40 rounded-2xl hover:border-primary/20 transition-all group"
                      >
                        <span className="font-light text-sm text-foreground">{circle.name}</span>
                        
                        {isInCircle ? (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <Check size={10} strokeWidth={2} />
                            In Circle
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToCircle(circle.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all disabled:opacity-50 select-none cursor-pointer"
                          >
                            {isLoading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>
                                <Plus size={12} />
                                Add
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
