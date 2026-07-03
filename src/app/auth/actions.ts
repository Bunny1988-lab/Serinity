'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // If email is not confirmed, redirect to signup-success page to resend verification
    if (
      error.message === 'Email not confirmed' ||
      (error.status === 400 && error.message.toLowerCase().includes('confirm'))
    ) {
      redirect('/signup-success?email=' + encodeURIComponent(data.email) + '&reason=unconfirmed')
    }
    // Show a friendly message for invalid credentials
    if (error.status === 400 || error.message.toLowerCase().includes('invalid')) {
      redirect('/login?error=' + encodeURIComponent('Incorrect email or password. Please try again.'))
    }
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  // ── Safety net: ensure public.users row exists ──────────────────────────────
  // The DB trigger `handle_new_user` can silently fail if username metadata was
  // missing at signup, leaving no row in public.users. This upsert guarantees
  // the row always exists so all downstream fetches work correctly.
  if (authData?.user) {
    const userId = authData.user.id
    const meta = authData.user.user_metadata || {}
    const fallbackUsername = meta.username || data.email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase()

    await supabase.from('users').upsert(
      {
        id: userId,
        username: fallbackUsername,
        display_name: meta.display_name || meta.full_name || fallbackUsername,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
  }

  revalidatePath('/', 'layout')
  redirect('/home')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    username: formData.get('username') as string,
    display_name: formData.get('display_name') as string,
  }

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_SITE_URL 
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : 'http://localhost:3000/auth/callback',
      data: {
        username: data.username,
        display_name: data.display_name,
      },
    },
  })

  if (error) {
    redirect('/signup?error=' + encodeURIComponent(error.message))
  }

  // If email confirmation is enabled, session will be null on signup.
  if (signUpData && !signUpData.session) {
    redirect('/signup-success?email=' + encodeURIComponent(data.email))
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding') // Direct new users to theme selection
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resendVerification(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function requestPasswordReset(email: string, origin: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}
