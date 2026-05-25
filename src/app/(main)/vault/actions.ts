'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setupVault(
  salt: string, 
  mkPinWrapped: string, 
  mkPinIv: string, 
  mkRecoveryWrapped: string, 
  mkRecoveryIv: string, 
  securityQuestion: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const mkPinData = JSON.stringify({ ciphertext: mkPinWrapped, iv: mkPinIv })
  const mkRecoveryData = JSON.stringify({ ciphertext: mkRecoveryWrapped, iv: mkRecoveryIv })

  const { error } = await supabase
    .from('users')
    .update({ 
      vault_salt: salt,
      vault_mk_pin: mkPinData,
      vault_mk_recovery: mkRecoveryData,
      vault_security_question: securityQuestion
    })
    .eq('id', user.id)

  if (error) {
    throw new Error('Failed to setup vault: ' + error.message)
  }

  revalidatePath('/vault')
}

export async function resetVaultPin(mkPinWrapped: string, mkPinIv: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const mkPinData = JSON.stringify({ ciphertext: mkPinWrapped, iv: mkPinIv })

  const { error } = await supabase
    .from('users')
    .update({ vault_mk_pin: mkPinData })
    .eq('id', user.id)

  if (error) {
    throw new Error('Failed to reset vault pin: ' + error.message)
  }

  revalidatePath('/vault')
}

export async function addVaultItem(type: 'text' | 'image', titleCipher: string, contentCipher: string, iv: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('vault_items')
    .insert({
      user_id: user.id,
      type,
      title_ciphertext: titleCipher,
      content_ciphertext: contentCipher,
      iv: iv
    })

  if (error) {
    throw new Error('Failed to save to vault: ' + error.message)
  }

  revalidatePath('/vault')
}

export async function getVaultItems() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to load vault items: ' + error.message)
  }

  return data
}

export async function deleteVaultItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to delete item: ' + error.message)
  }

  revalidatePath('/vault')
}
