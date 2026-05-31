'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVault } from '@/components/vault-context'
import { generateSalt, deriveKey, encryptText, decryptText, generateMasterKey, wrapMasterKey, unwrapMasterKey } from '@/lib/crypto'
import { setupVault, getVaultItems, addVaultItem, resetVaultPin, deleteVaultItem } from './actions'
import { LockKeyhole, Unlock, Plus, FileText, Lock, X, Trash2, Loader2 } from 'lucide-react'
import { ConfirmDialog, Toast } from '@/components/ui/dialog'

const CANARY_MESSAGE = "SERENITY_VAULT_CANARY_OK"

interface VaultItem {
  id: string
  type: 'text' | 'image'
  title_ciphertext: string | null
  content_ciphertext: string
  iv: string
  created_at: string
}

interface DecryptedItem extends VaultItem {
  decryptedContent: string
  decryptedTitle: string | null
}

export function VaultClient({ 
  vaultSalt, 
  vaultMkPin, 
  vaultMkRecovery, 
  vaultSecurityQuestion 
}: { 
  vaultSalt: string | null, 
  vaultMkPin: string | null,
  vaultMkRecovery: string | null,
  vaultSecurityQuestion: string | null
}) {
  const { vaultKey, isLocked, unlockVault, lockVault } = useVault()
  const isSetupRequired = !vaultSalt || !vaultMkPin

  const [pin, setPin] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState('')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [items, setItems] = useState<DecryptedItem[]>([])
  
  // State for Add Note
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')

  // State for Recovery
  const [isRecoveryMode, setIsRecoveryMode] = useState(false)
  const [isResettingPin, setIsResettingPin] = useState(false)
  const [recoveredMasterKey, setRecoveredMasterKey] = useState<CryptoKey | null>(null)

  // Dialog / Toast state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ open: boolean; message: string; variant: 'error' | 'success' | 'info' }>({ open: false, message: '', variant: 'error' })
  const showToast = (message: string, variant: 'error' | 'success' | 'info' = 'error') => setToast({ open: true, message, variant })

  useEffect(() => {
    if (!isLocked && vaultKey) {
      loadItems(vaultKey)
    }
  }, [isLocked, vaultKey])

  async function loadItems(key: CryptoKey) {
    try {
      const rawItems = await getVaultItems() as VaultItem[]
      const decrypted = await Promise.all(rawItems.map(async (item) => {
        const dContent = await decryptText(item.content_ciphertext, item.iv, key)
        const dTitle = item.title_ciphertext 
          ? await decryptText(item.title_ciphertext, item.iv, key)
          : null
        return { ...item, decryptedContent: dContent, decryptedTitle: dTitle }
      }))
      setItems(decrypted)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) {
      setError("PIN must be at least 4 characters")
      return
    }
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      setError("Please provide a security question and answer")
      return
    }
    setIsProcessing(true)
    setError('')
    try {
      // 1. Generate new Master Key
      const mk = await generateMasterKey()

      // 2. Generate Salt
      const salt = generateSalt()

      // 3. Derive PIN KEK & wrap MK
      const pinKek = await deriveKey(pin, salt)
      const { wrappedKey: mkPinWrapped, iv: mkPinIv } = await wrapMasterKey(mk, pinKek)

      // 4. Derive Recovery KEK & wrap MK
      const recoveryKek = await deriveKey(securityAnswer.toLowerCase().trim(), salt)
      const { wrappedKey: mkRecoveryWrapped, iv: mkRecoveryIv } = await wrapMasterKey(mk, recoveryKek)
      
      // 5. Save to Server
      await setupVault(salt, mkPinWrapped, mkPinIv, mkRecoveryWrapped, mkRecoveryIv, securityQuestion)
      
      unlockVault(mk)
    } catch (e) {
      console.error(e)
      const msg = (e as Error).message
      setError("Failed to setup vault: " + msg)
      showToast("Error initializing vault: " + msg, 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setIsProcessing(true)
    setError('')
    try {
      if (!vaultSalt || !vaultMkPin) throw new Error("Missing vault data")
      
      const pinKek = await deriveKey(pin, vaultSalt)
      const mkPinData = JSON.parse(vaultMkPin)
      
      const masterKey = await unwrapMasterKey(mkPinData.ciphertext, mkPinData.iv, pinKek)
      
      unlockVault(masterKey)
      setPin('') 
    } catch (e) {
      setError("Incorrect PIN. Please try again.")
      setPin('')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleRecovery(e: React.FormEvent) {
    e.preventDefault()
    setIsProcessing(true)
    setError('')
    try {
      if (!vaultSalt || !vaultMkRecovery) throw new Error("Missing recovery data")
      
      const recoveryKek = await deriveKey(securityAnswer.toLowerCase().trim(), vaultSalt)
      const mkRecoveryData = JSON.parse(vaultMkRecovery)
      
      const masterKey = await unwrapMasterKey(mkRecoveryData.ciphertext, mkRecoveryData.iv, recoveryKek)
      
      // Success! Move to PIN Reset step
      setRecoveredMasterKey(masterKey)
      setIsResettingPin(true)
      setIsRecoveryMode(false)
    } catch (e) {
      setError("Incorrect answer. Please try again.")
      setSecurityAnswer('')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) {
      setError("PIN must be at least 4 characters")
      return
    }
    setIsProcessing(true)
    setError('')
    try {
      if (!vaultSalt || !recoveredMasterKey) throw new Error("Missing data")
      
      const pinKek = await deriveKey(pin, vaultSalt)
      const { wrappedKey: mkPinWrapped, iv: mkPinIv } = await wrapMasterKey(recoveredMasterKey, pinKek)
      
      await resetVaultPin(mkPinWrapped, mkPinIv)
      
      // Unlock with the recovered key
      unlockVault(recoveredMasterKey)
      setPin('')
      setIsResettingPin(false)
      setRecoveredMasterKey(null)
    } catch (e) {
      setError("Failed to reset PIN.")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || !vaultKey) return
    setIsProcessing(true)

    try {
      const payload = JSON.stringify({ title: newTitle, content: newContent })
      const { ciphertext, iv: newIv } = await encryptText(payload, vaultKey)

      await addVaultItem('text', '', ciphertext, newIv) 
      
      setNewTitle('')
      setNewContent('')
      setIsAddingMode(false)
      loadItems(vaultKey)
    } catch(e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  async function confirmDeleteNote(id: string) {
    setDeleteTargetId(id)
  }

  async function executeDeleteNote() {
    if (!deleteTargetId) return
    setDeleteTargetId(null)
    setIsProcessing(true)
    try {
      await deleteVaultItem(deleteTargetId)
      if (vaultKey) loadItems(vaultKey)
    } catch (e) {
      console.error(e)
      showToast("Failed to delete note.", 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  // --- RENDERS ---

  if (isLocked) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto mt-16 space-y-8 bg-card p-8 rounded-[32px] border border-border-mint shadow-[0_8px_32px_rgba(0,0,0,0.04)] text-center relative overflow-hidden"
      >
        {isRecoveryMode && (
          <button onClick={() => setIsRecoveryMode(false)} className="absolute top-6 left-6 text-foreground/50 hover:text-foreground transition-colors rounded-full hover:bg-background p-2">
            <X size={20} strokeWidth={2.5} />
          </button>
        )}
        
        <div className="w-16 h-16 mx-auto rounded-full bg-background border border-border-mint flex items-center justify-center text-foreground">
          {isRecoveryMode || isResettingPin ? <Unlock size={24} strokeWidth={2.5} /> : <LockKeyhole size={24} strokeWidth={2.5} />}
        </div>
        
        {isSetupRequired ? (
          <>
            <div>
              <h2 className="text-[20px] font-bold text-foreground">Secure Your Vault</h2>
              <p className="text-[13px] font-medium text-foreground/60 mt-2 px-2 leading-relaxed">
                Create a PIN and a Security Question. Your data will be encrypted end-to-end.
              </p>
            </div>
            <form onSubmit={handleSetup} className="space-y-5 text-left">
              <div className="space-y-1.5">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Create a PIN"
                  className="w-full h-12 text-center text-xl tracking-[0.5em] bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-full transition-all text-foreground font-bold outline-none placeholder:text-foreground/30 placeholder:tracking-normal placeholder:text-[14px]"
                  required
                />
              </div>
              <div className="space-y-1.5 pt-2 border-t border-border-mint/50">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 pl-2">Security Question</label>
                <input
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  placeholder="e.g. What is your mother's maiden name?"
                  className="w-full h-12 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-full transition-all text-[14px] font-medium text-foreground px-5 outline-none placeholder:text-foreground/40"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-foreground/60 pl-2">Answer</label>
                <input
                  type="password"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your Answer"
                  className="w-full h-12 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-full transition-all text-[14px] font-medium text-foreground px-5 outline-none placeholder:text-foreground/40"
                  required
                />
              </div>
              {error && <p className="text-[13px] font-bold text-red-600 text-center">{error}</p>}
              <button disabled={isProcessing} type="submit" className="w-full h-12 flex items-center justify-center gap-2 font-bold text-[14px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] bg-foreground hover:bg-foreground/90 transition-all text-white disabled:opacity-50 select-none cursor-pointer mt-2">
                {isProcessing ? (
                  <><Loader2 size={16} className="animate-spin" /> Encrypting...</>
                ) : 'Initialize Vault'}
              </button>
            </form>
          </>
        ) : isRecoveryMode ? (
          <>
            <div>
              <h2 className="text-[20px] font-bold text-foreground">Recover Vault</h2>
              <p className="text-[14px] font-bold text-foreground/80 mt-2 px-2">
                {vaultSecurityQuestion}
              </p>
            </div>
            <form onSubmit={handleRecovery} className="space-y-5">
              <div className="space-y-2">
                <input
                  type="password"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your Answer"
                  className="w-full h-12 text-center bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-full transition-all text-[14px] font-bold text-foreground outline-none placeholder:text-foreground/40"
                  required
                />
                {error && <p className="text-[13px] font-bold text-red-600">{error}</p>}
              </div>
              <button disabled={isProcessing} type="submit" className="w-full h-12 flex items-center justify-center gap-2 font-bold text-[14px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] bg-foreground hover:bg-foreground/90 transition-all text-white disabled:opacity-50 select-none cursor-pointer">
                {isProcessing ? (
                  <><Loader2 size={16} className="animate-spin" /> Decrypting...</>
                ) : 'Recover'}
              </button>
            </form>
          </>
        ) : isResettingPin ? (
          <>
            <div>
              <h2 className="text-[20px] font-bold text-foreground">Set New PIN</h2>
              <p className="text-[13px] font-medium text-foreground/60 mt-2 px-4 leading-relaxed">
                Vault recovered successfully! Set a new PIN to re-secure it.
              </p>
            </div>
            <form onSubmit={handleResetPin} className="space-y-5">
              <div className="space-y-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="New PIN"
                  className="w-full h-12 text-center text-xl tracking-[0.5em] bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-full transition-all text-foreground font-bold outline-none placeholder:text-foreground/30 placeholder:tracking-normal placeholder:text-[14px]"
                  required
                />
                {error && <p className="text-[13px] font-bold text-red-600">{error}</p>}
              </div>
              <button disabled={isProcessing} type="submit" className="w-full h-12 flex items-center justify-center gap-2 font-bold text-[14px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] bg-foreground hover:bg-foreground/90 transition-all text-white disabled:opacity-50 select-none cursor-pointer">
                {isProcessing ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : 'Set New PIN'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-[20px] font-bold text-foreground">Unlock Vault</h2>
              <p className="text-[13px] font-medium text-foreground/60 mt-2">
                Enter your PIN to decrypt your private space.
              </p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-5">
              <div className="space-y-2">
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full h-12 text-center text-xl tracking-[0.5em] bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-full transition-all text-foreground font-bold outline-none placeholder:text-foreground/30 placeholder:tracking-normal placeholder:text-[14px]"
                  required
                />
                {error && <p className="text-[13px] font-bold text-red-600">{error}</p>}
              </div>
              
              <button disabled={isProcessing} type="submit" className="w-full h-12 flex items-center justify-center gap-2 font-bold text-[14px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] bg-foreground hover:bg-foreground/90 transition-all text-white disabled:opacity-50 select-none cursor-pointer">
                {isProcessing ? (
                  <><Loader2 size={16} className="animate-spin" /> Decrypting...</>
                ) : 'Unlock'}
              </button>

              <button 
                type="button"
                onClick={() => setIsRecoveryMode(true)}
                className="text-[12px] font-bold text-foreground/50 hover:text-foreground transition-colors mt-2"
              >
                Forgot PIN?
              </button>
            </form>
          </>
        )}
      </motion.div>
    )
  }

  // UNLOCKED STATE (Gallery & Note Adding)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={lockVault} 
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold text-foreground/60 hover:text-foreground hover:bg-card rounded-full transition-all border border-transparent hover:border-border-mint"
        >
          <Lock size={16} strokeWidth={2.5} />
          Lock Vault
        </button>
      </div>

      {!isAddingMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            onClick={() => setIsAddingMode(true)}
            className="aspect-video rounded-[24px] border-2 border-dashed border-border-mint flex flex-col items-center justify-center text-foreground/50 hover:bg-card hover:text-foreground transition-all cursor-pointer group shadow-sm hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
          >
            <div className="w-12 h-12 rounded-full bg-background border border-border-mint flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <span className="text-[14px] font-bold">Add Secret Note</span>
          </div>

          {items.map(item => {
            // Parse JSON since we stored it that way
            let title = ''
            let content = item.decryptedContent
            try {
              const parsed = JSON.parse(item.decryptedContent)
              title = parsed.title
              content = parsed.content
            } catch(e) {}

            return (
              <div key={item.id} className="aspect-video rounded-[24px] border border-border-mint bg-card p-6 flex flex-col gap-3 relative group overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <FileText size={16} strokeWidth={2.5} />
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/60">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => confirmDeleteNote(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-foreground/30 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Note"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <h3 className="font-bold text-[15px] text-foreground">{title || 'Untitled'}</h3>
                
                {/* Blur filter to protect against shoulder surfing, reveals on hover */}
                <div className="mt-2 text-[14px] text-foreground/80 font-medium line-clamp-3 filter blur-sm group-hover:blur-none transition-all duration-300">
                  {content}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {isAddingMode && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleAddNote}
            className="w-full bg-card p-6 md:p-8 rounded-[32px] border border-border-mint shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold text-foreground">New Secret Note</h2>
              <button 
                type="button" 
                onClick={() => setIsAddingMode(false)}
                className="p-2 text-foreground/50 hover:text-foreground hover:bg-background rounded-full transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Title (optional)"
                className="w-full h-14 px-6 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] text-[16px] font-bold text-foreground rounded-[20px] outline-none placeholder:text-foreground/40 transition-all"
              />
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Write something completely private..."
                className="w-full h-48 bg-background border border-border-mint/50 focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] rounded-[20px] p-6 resize-none outline-none text-[15px] text-foreground font-medium placeholder:text-foreground/40 transition-all"
                required
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                disabled={isProcessing} 
                type="submit" 
                className="h-12 px-8 flex items-center justify-center gap-2 font-bold text-[14px] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] bg-foreground hover:bg-foreground/90 transition-all text-white disabled:opacity-50 select-none cursor-pointer"
              >
                {isProcessing ? (
                  <><Loader2 size={16} className="animate-spin" /> Encrypting...</>
                ) : 'Encrypt & Save'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Delete secure note?"
        message="This note will be permanently erased from your vault. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={executeDeleteNote}
        onCancel={() => setDeleteTargetId(null)}
      />

      <Toast
        isOpen={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast(t => ({ ...t, open: false }))}
      />
    </motion.div>
  )
}
