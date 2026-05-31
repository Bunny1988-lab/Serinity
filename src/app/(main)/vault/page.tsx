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
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent relative z-20">
        <h1 className="text-[17px] font-bold text-foreground flex items-center gap-2">
          <LockKeyhole size={20} strokeWidth={2.5} />
          Safe Vault
        </h1>
      </header>
      
      <main className="px-6 space-y-6 max-w-[800px] mx-auto w-full">
        <VaultClient 
          vaultSalt={profile?.vault_salt || null} 
          vaultMkPin={profile?.vault_mk_pin || null} 
          vaultMkRecovery={profile?.vault_mk_recovery || null} 
          vaultSecurityQuestion={profile?.vault_security_question || null} 
        />
      </main>
    </div>
  )
}
