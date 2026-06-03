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

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // If email is not confirmed, redirect to signup-success page
    if (error.message === 'Email not confirmed' || (error.status === 400 && error.message.toLowerCase().includes('confirm'))) {
      redirect('/signup-success?email=' + encodeURIComponent(data.email))
    }
    redirect('/login?error=' + encodeURIComponent(error.message))
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
