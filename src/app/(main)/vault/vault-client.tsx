'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVault } from '@/components/vault-context'
import { generateSalt, deriveKey, encryptText, decryptText, generateMasterKey, wrapMasterKey, unwrapMasterKey } from '@/lib/crypto'
import { setupVault, getVaultItems, addVaultItem, resetVaultPin, deleteVaultItem } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LockKeyhole, Unlock, Plus, FileText, Lock, X, Trash2 } from 'lucide-react'
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
        className="w-full max-w-sm mx-auto mt-24 space-y-8 bg-background/50 p-8 rounded-3xl border border-border/50 shadow-2xl backdrop-blur-md text-center relative overflow-hidden"
      >
        {isRecoveryMode && (
          <button onClick={() => setIsRecoveryMode(false)} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        )}
        
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {isRecoveryMode || isResettingPin ? <Unlock size={28} /> : <LockKeyhole size={28} />}
        </div>
        
        {isSetupRequired ? (
          <>
            <div>
              <h2 className="text-2xl font-light">Secure Your Vault</h2>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">
                Create a PIN and a Security Question. Your data will be encrypted end-to-end.
              </p>
            </div>
            <form onSubmit={handleSetup} className="space-y-6 text-left">
              <div className="space-y-2">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Create a PIN"
                  className="h-12 text-center text-xl tracking-[0.5em] bg-background border-border/50 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2 pt-2 border-t border-border/50">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Security Question</label>
                <Input
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  placeholder="e.g. What is your mother's maiden name?"
                  className="h-12 bg-background border-border/50 rounded-xl font-light"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground pl-1">Answer</label>
                <Input
                  type="password"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your Answer"
                  className="h-12 bg-background border-border/50 rounded-xl font-light"
                  required
                />
              </div>
              {error && <p className="text-xs text-destructive text-center">{error}</p>}
              <Button type="submit" disabled={isProcessing} className="w-full h-12 rounded-full font-medium">
                {isProcessing ? 'Encrypting...' : 'Initialize Vault'}
              </Button>
            </form>
          </>
        ) : isRecoveryMode ? (
          <>
            <div>
              <h2 className="text-2xl font-light">Recover Vault</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {vaultSecurityQuestion}
              </p>
            </div>
            <form onSubmit={handleRecovery} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="password"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your Answer"
                  className="h-12 text-center bg-background border-border/50 rounded-xl font-light"
                  required
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full h-12 rounded-full font-medium">
                {isProcessing ? 'Decrypting...' : 'Recover'}
              </Button>
            </form>
          </>
        ) : isResettingPin ? (
          <>
            <div>
              <h2 className="text-2xl font-light">Set New PIN</h2>
              <p className="text-xs text-muted-foreground mt-2 px-4 leading-relaxed">
                Vault recovered successfully! Set a new PIN to re-secure it.
              </p>
            </div>
            <form onSubmit={handleResetPin} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="New PIN"
                  className="h-12 text-center text-xl tracking-[0.5em] bg-background border-border/50 rounded-xl"
                  required
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <Button type="submit" disabled={isProcessing} className="w-full h-12 rounded-full font-medium">
                {isProcessing ? 'Saving...' : 'Set New PIN'}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-light">Unlock Vault</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Enter your PIN to decrypt your private space.
              </p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="h-12 text-center text-xl tracking-[0.5em] bg-background border-border/50 rounded-xl"
                  required
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              
              <Button type="submit" disabled={isProcessing} className="w-full h-12 rounded-full font-medium mb-4">
                {isProcessing ? 'Decrypting...' : 'Unlock'}
              </Button>

              <button 
                type="button"
                onClick={() => setIsRecoveryMode(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex justify-end mb-4">
        <Button variant="ghost" onClick={lockVault} className="text-muted-foreground hover:text-foreground">
          <Lock size={16} className="mr-2" />
          Lock Vault
        </Button>
      </div>

      {!isAddingMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div 
            onClick={() => setIsAddingMode(true)}
            className="aspect-video rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/20 hover:text-foreground hover:border-primary/50 transition-all cursor-pointer"
          >
            <Plus size={32} className="mb-2" />
            <span className="text-sm font-medium">Add Secret Note</span>
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
              <div key={item.id} className="aspect-video rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col gap-2 relative group overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <FileText size={16} />
                    <span className="text-xs font-medium uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => confirmDeleteNote(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="font-medium text-foreground">{title || 'Untitled'}</h3>
                
                {/* Blur filter to protect against shoulder surfing, reveals on hover */}
                <div className="mt-2 text-sm text-muted-foreground font-light line-clamp-3 filter blur-sm group-hover:blur-none transition-all duration-300">
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
            className="max-w-2xl mx-auto bg-background/80 backdrop-blur-2xl p-6 md:p-8 rounded-3xl border border-border/50 shadow-2xl relative"
          >
            <button 
              type="button" 
              onClick={() => setIsAddingMode(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-light mb-6">New Secret Note</h2>
            
            <div className="space-y-4">
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Title (optional)"
                className="h-12 bg-transparent border-border/50 text-lg rounded-xl"
              />
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Write something completely private..."
                className="w-full h-48 bg-transparent border border-border/50 rounded-xl p-4 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground font-light"
                required
              />
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button disabled={isProcessing} type="submit" className="rounded-full px-8 h-12 shadow-md">
                {isProcessing ? 'Encrypting...' : 'Encrypt & Save'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Custom Confirm Dialog */}
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

      {/* Toast notification */}
      <Toast
        isOpen={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast(t => ({ ...t, open: false }))}
      />
    </motion.div>
  )
}
