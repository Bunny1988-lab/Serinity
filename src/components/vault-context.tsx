'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface VaultContextType {
  vaultKey: CryptoKey | null
  isLocked: boolean
  unlockVault: (key: CryptoKey) => void
  lockVault: () => void
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export function useVault() {
  const context = useContext(VaultContext)
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null)

  const isLocked = vaultKey === null

  const unlockVault = (key: CryptoKey) => {
    setVaultKey(key)
  }

  const lockVault = () => {
    setVaultKey(null)
  }

  return (
    <VaultContext.Provider value={{ vaultKey, isLocked, unlockVault, lockVault }}>
      {children}
    </VaultContext.Provider>
  )
}
