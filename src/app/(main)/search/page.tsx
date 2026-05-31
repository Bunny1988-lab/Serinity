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
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent relative z-20">
        <h1 className="text-[17px] font-bold text-foreground flex items-center gap-2">
          <SearchIcon size={20} strokeWidth={2.5} />
          Search
        </h1>
      </header>
      
      <main className="px-6 space-y-6 max-w-[800px] mx-auto w-full">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
          <input 
            type="text" 
            placeholder="Search for friends by name or username..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 bg-card border border-border-mint rounded-full pl-11 pr-5 text-[14px] font-medium text-foreground outline-none focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] transition-all placeholder:text-foreground/40 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
          />
        </div>

        {/* Contact Sync Entry Card */}
        <div className="p-6 bg-card border border-border-mint rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <div className="flex gap-4">
            <div className="w-12 h-12 shrink-0 rounded-full bg-background flex items-center justify-center text-foreground border border-border-mint">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-[15px] text-foreground leading-snug">Privacy-First Friend Sync</p>
              <p className="text-[13px] font-medium text-foreground/60 mt-0.5 max-w-sm leading-relaxed">
                Have friends on Serenity? Securely scan your contacts using browser-based hashing to find them instantly.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsImporterOpen(true)}
            className="w-full md:w-auto h-12 px-6 rounded-full font-bold text-[14px] bg-foreground text-white hover:bg-foreground/90 transition-all text-center select-none shadow-sm shrink-0 active:scale-95"
          >
            Find Friends
          </button>
        </div>

        <div className="space-y-3">
          {isSearching && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 size={16} className="animate-spin text-foreground/60" />
              <p className="text-[13px] text-foreground/60 font-bold uppercase tracking-wide animate-pulse">Searching...</p>
            </div>
          )}
          
          {!isSearching && query.length >= 2 && results.length === 0 && (
             <div className="text-center py-12 bg-card border border-border-mint border-dashed rounded-[24px]">
               <p className="text-[14px] text-foreground/60 font-medium">No users found.</p>
             </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="bg-card border border-border-mint rounded-[24px] divide-y divide-[#BCE3D8]/30 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              {results.map((user) => {
                // Don't show myself in search results for circle adding
                if (user.id === currentUserId) return null

                return (
                  <div key={user.id} className="flex items-center justify-between p-5 hover:bg-background/30 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-background border border-border-mint flex items-center justify-center text-foreground overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[16px] font-bold text-foreground">{user.display_name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-[15px] leading-snug">{user.display_name}</p>
                        <p className="text-[13px] font-medium text-foreground/60">@{user.username}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenCircleModal(user)}
                        className="w-10 h-10 flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-background rounded-full transition-all"
                        title="Add to Circle"
                      >
                        <UserPlus size={20} strokeWidth={2} />
                      </button>

                      <Link 
                        href={`/messages?u=${user.id}`}
                        className="w-10 h-10 flex items-center justify-center text-foreground bg-background border border-border-mint hover:bg-foreground hover:text-white rounded-full transition-all shadow-sm"
                        title="Message"
                      >
                        <MessageSquare size={18} strokeWidth={2.5} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

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
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            />
            {/* Dialog Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border-mint rounded-[32px] p-6 shadow-2xl w-full max-w-sm relative z-10 flex flex-col gap-5 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={20} strokeWidth={2.5} className="text-foreground" />
                  <span className="font-bold text-[16px] text-foreground">Add to Circles</span>
                </div>
                <button 
                  onClick={() => setIsCircleModalOpen(false)}
                  className="p-2 text-foreground/50 hover:text-foreground transition-colors rounded-full hover:bg-background"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* User Bio Summary */}
              <div className="flex items-center gap-3 p-4 bg-background border border-border-mint rounded-[20px]">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-card border border-border-mint flex items-center justify-center text-foreground shrink-0">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[15px] font-bold">{selectedUser.display_name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground text-[14px] truncate">{selectedUser.display_name}</p>
                  <p className="text-[12px] font-medium text-foreground/60 truncate">@{selectedUser.username}</p>
                </div>
              </div>

              {/* Circles List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {circles.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-foreground/60 font-medium mb-3">You haven't created any Circles yet.</p>
                    <Link href="/circles" onClick={() => setIsCircleModalOpen(false)}>
                      <button className="px-5 py-2.5 bg-foreground text-white hover:bg-foreground/90 text-[13px] font-bold rounded-full transition-all">
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
                        className="flex items-center justify-between p-4 bg-card border border-border-mint rounded-[20px] hover:border-foreground/30 transition-all group shadow-sm"
                      >
                        <span className="font-bold text-[14px] text-foreground">{circle.name}</span>
                        
                        {isInCircle ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full">
                            <Check size={12} strokeWidth={2.5} />
                            In Circle
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToCircle(circle.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold bg-background hover:bg-foreground text-foreground hover:text-white transition-all disabled:opacity-50 select-none cursor-pointer border border-border-mint hover:border-foreground"
                          >
                            {isLoading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <>
                                <Plus size={12} strokeWidth={2.5} />
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
