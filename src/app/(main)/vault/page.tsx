import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VaultClient } from './vault-client'
import { LockKeyhole } from 'lucide-react'

export default async function VaultPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('vault_salt, vault_mk_pin, vault_mk_recovery, vault_security_question')
    .eq('id', user.id)
    .single()

  return (
    <div className="pb-32 md:pb-0 min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 px-8 py-6 backdrop-blur-2xl border-b border-border/30 flex justify-between items-center">
        <h1 className="text-xl font-light tracking-tight text-foreground flex items-center gap-2">
          <LockKeyhole size={18} />
          Safe Vault
        </h1>
      </header>
      
      <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
        <VaultClient 
          vaultSalt={profile?.vault_salt || null} 
          vaultMkPin={profile?.vault_mk_pin || null} 
          vaultMkRecovery={profile?.vault_mk_recovery || null} 
          vaultSecurityQuestion={profile?.vault_security_question || null} 
        />
      </div>
    </div>
  )
}
