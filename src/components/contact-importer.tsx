'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Search, MessageSquare, AlertCircle, Sparkles, UserCircle2, X } from 'lucide-react'
import { matchContactHashes } from '@/app/(main)/actions'
import Link from 'next/link'

interface ContactImporterProps {
  isOpen: boolean
  onClose: () => void
}

interface MatchedUser {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

export function ContactImporter({ isOpen, onClose }: ContactImporterProps) {
  const [inputText, setInputText] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [results, setResults] = useState<MatchedUser[]>([])
  const [hasScanned, setHasScanned] = useState(false)

  // Client-side SHA-256 hashing helper
  async function hashEmail(email: string): Promise<string> {
    const cleanEmail = email.trim().toLowerCase()
    const encoder = new TextEncoder()
    const data = encoder.encode(cleanEmail)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  async function handleScan() {
    if (!inputText.trim()) return

    setIsScanning(true)
    setHasScanned(false)

    try {
      // Split input by newlines, commas, semicolons, tabs, or spaces
      const rawEntries = inputText.split(/[,\n;|\t\s]+/)
      
      // Clean and validate emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const validEmails = rawEntries
        .map(e => e.trim().toLowerCase())
        .filter(e => emailRegex.test(e))

      if (validEmails.length === 0) {
        setResults([])
        setHasScanned(true)
        setIsScanning(false)
        return
      }

      // De-duplicate emails to avoid extra hashing
      const uniqueEmails = Array.from(new Set(validEmails))

      // Hash emails client-side (completely secure)
      const hashedEmails = await Promise.all(
        uniqueEmails.map(async (email) => await hashEmail(email))
      )

      // Query database hashes via Server Action
      const matchedUsers = await matchContactHashes(hashedEmails)
      setResults(matchedUsers)
      setHasScanned(true)
    } catch (error) {
      console.error('Contact scanning error:', error)
    } finally {
      setIsScanning(false)
    }
  }

  function handleReset() {
    setInputText('')
    setResults([])
    setHasScanned(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="pointer-events-auto w-full max-w-lg bg-card border border-border-mint rounded-[32px] shadow-[0_16px_48px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[85vh] md:max-h-[75vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border-mint/50 flex items-center justify-between bg-background">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[16px] bg-card border border-border-mint flex items-center justify-center text-foreground shadow-sm">
                    <ShieldCheck size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[16px] text-foreground leading-snug">Privacy-First Friend Sync</h2>
                    <p className="text-[12px] font-medium text-foreground/60">Match contacts securely using SHA-256</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/50 bg-card border border-border-mint shadow-sm hover:bg-background hover:text-foreground transition-colors outline-none"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 select-none bg-card">
                {/* Privacy Guarantee Panel */}
                <div className="p-5 rounded-[24px] bg-background border border-border-mint flex gap-4 shadow-sm">
                  <div className="shrink-0 text-foreground mt-0.5">
                    <Sparkles size={20} strokeWidth={2.5} />
                  </div>
                  <div className="text-[13px] font-medium leading-relaxed text-foreground/80">
                    <strong className="font-bold text-foreground block mb-1">Zero-Knowledge Sync Guarantee</strong>
                    Your plain-text contacts **never** touch our servers. emails are trimmed, lowercased, and converted into secure, irreversible cryptographic hashes directly in your browser. Our server only checks if any of these anonymous hashes match registered accounts.
                  </div>
                </div>

                {!hasScanned ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[14px] font-bold text-foreground">
                        Enter Email Addresses
                      </label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="example1@email.com, example2@email.com&#10;paste or type your friends' emails..."
                        className="w-full h-36 bg-card border border-border-mint rounded-[24px] p-5 outline-none focus:ring-1 focus:ring-[#BCE3D8] transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-[14px] font-medium text-foreground placeholder:text-foreground/30 placeholder:font-medium resize-none"
                      />
                      <p className="text-[12px] text-foreground/50 font-bold px-2">
                        Supports comma, semicolon, space, or newline separators.
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={onClose}
                        className="rounded-full px-6 h-12 bg-card border border-border-mint text-[14px] font-bold text-foreground hover:bg-background transition-all shadow-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleScan}
                        disabled={isScanning || !inputText.trim()}
                        className="rounded-full px-6 h-12 bg-foreground text-white hover:bg-foreground/90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] font-bold text-[14px] disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isScanning ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Hashing & Syncing...
                          </>
                        ) : (
                          <>
                            <Search size={18} strokeWidth={2.5} />
                            Securely Sync Contacts
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[16px] font-bold text-foreground">Matched Users</h3>
                      <button
                        onClick={handleReset}
                        className="text-[13px] text-foreground/60 hover:text-foreground font-bold bg-background px-4 py-1.5 rounded-full transition-colors border border-border-mint"
                      >
                        Scan New List
                      </button>
                    </div>

                    {results.length === 0 ? (
                      <div className="text-center py-10 px-6 border-2 border-dashed border-border-mint rounded-[24px] bg-background/50 flex flex-col items-center justify-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-card border border-border-mint flex items-center justify-center text-foreground shadow-sm">
                          <AlertCircle size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-[16px] font-bold text-foreground">No matches found</p>
                          <p className="text-[13px] font-medium text-foreground/60 max-w-xs mt-2 mx-auto leading-relaxed">
                            None of the scanned email hashes are associated with active Serenity accounts. Use the **Invite Friends** option to invite them!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border">
                        {results.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 bg-card border border-border-mint rounded-[24px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:border-foreground/20 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-background border border-border-mint flex items-center justify-center text-foreground overflow-hidden shadow-inner">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserCircle2 size={24} strokeWidth={2} />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-[15px] text-foreground leading-tight">{user.display_name}</p>
                                <p className="text-[13px] font-medium text-foreground/50">@{user.username}</p>
                              </div>
                            </div>

                            <Link
                              href={`/messages?u=${user.id}`}
                              onClick={onClose}
                              className="w-10 h-10 bg-background text-foreground rounded-full transition-colors flex items-center justify-center border border-border-mint hover:bg-foreground hover:text-white"
                              title={`Message ${user.display_name}`}
                            >
                              <MessageSquare size={18} strokeWidth={2.5} />
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={onClose}
                        className="rounded-full px-8 h-12 bg-foreground text-white hover:bg-foreground/90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.04)] font-bold text-[14px]"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
