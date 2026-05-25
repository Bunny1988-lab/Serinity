'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Search, MessageSquare, AlertCircle, Sparkles, UserCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
              className="pointer-events-auto w-full max-w-lg bg-background/95 backdrop-blur-2xl border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[75vh]"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck size={20} className="stroke-[1.75]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground leading-snug">Privacy-First Friend Sync</h2>
                    <p className="text-xs text-muted-foreground">Match contacts securely using SHA-256</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
                {/* Privacy Guarantee Panel */}
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                  <div className="shrink-0 text-primary mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div className="text-xs font-light leading-relaxed text-muted-foreground">
                    <strong className="font-medium text-foreground block mb-0.5">Zero-Knowledge Sync Guarantee</strong>
                    Your plain-text contacts **never** touch our servers. emails are trimmed, lowercased, and converted into secure, irreversible cryptographic hashes directly in your browser. Our server only checks if any of these anonymous hashes match registered accounts.
                  </div>
                </div>

                {!hasScanned ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Enter Email Addresses
                      </label>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="example1@email.com, example2@email.com&#10;paste or type your friends' emails..."
                        className="w-full h-32 bg-background border border-border/60 rounded-2xl p-4 outline-none focus:border-primary/50 transition-colors shadow-inner text-sm placeholder:text-muted-foreground resize-none"
                      />
                      <p className="text-[11px] text-muted-foreground font-light">
                        Supports comma, semicolon, space, or newline separators.
                      </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-full px-5 py-5 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleScan}
                        disabled={isScanning || !inputText.trim()}
                        className="rounded-full px-6 py-5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md font-medium"
                      >
                        {isScanning ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            Hashing & Syncing...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Search size={16} />
                            Securely Sync Contacts
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground">Matched Users</h3>
                      <button
                        onClick={handleReset}
                        className="text-xs text-primary hover:underline font-light"
                      >
                        Scan New List
                      </button>
                    </div>

                    {results.length === 0 ? (
                      <div className="text-center py-8 px-4 border border-dashed border-border/60 rounded-2xl bg-muted/5 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                          <AlertCircle size={22} className="stroke-[1.5]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">No matches found</p>
                          <p className="text-xs font-light text-muted-foreground max-w-xs mt-1">
                            None of the scanned email hashes are associated with active Serenity accounts. Use the **Invite Friends** option to invite them!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                        {results.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3.5 bg-background/50 border border-border/40 rounded-2xl hover:border-primary/20 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden border border-border/50 shadow-inner">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <UserCircle2 size={24} strokeWidth={1.25} />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm leading-tight">{user.display_name}</p>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                              </div>
                            </div>

                            <Link
                              href={`/messages?u=${user.id}`}
                              onClick={onClose}
                              className="p-2.5 text-primary hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center border border-transparent hover:border-primary/15"
                              title={`Message ${user.display_name}`}
                            >
                              <MessageSquare size={18} />
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={onClose}
                        className="rounded-full px-6 py-5 bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-md font-medium"
                      >
                        Done
                      </Button>
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
