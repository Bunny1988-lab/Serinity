'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createVignette(formData: FormData) {
  const supabase = await createClient()
  const imageUrl = formData.get('image_url') as string
  const caption = formData.get('caption') as string
  
  if (!imageUrl) return { success: false, error: 'Image is required' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check 24-hour limit (polite limit of 1 vignette per day)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await supabase
    .from('vignettes')
    .select('id')
    .eq('user_id', user.id)
    .gt('created_at', oneDayAgo)
    .limit(1)

  if (existing && existing.length > 0) {
    return { 
      success: false, 
      error: 'You have already curated a vignette today. Practising slow sharing.' 
    }
  }

  const { error } = await supabase.from('vignettes').insert({
    user_id: user.id,
    image_url: imageUrl,
    caption: caption || null
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/home')
  return { success: true }
}

export async function createZenLoop(formData: FormData) {
  const supabase = await createClient()
  const videoUrl = formData.get('video_url') as string
  const poemLine = formData.get('poem_line') as string

  if (!videoUrl || !poemLine) return { success: false, error: 'Video and poem line are required' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check limit (polite limit of 5 loops per day to prevent addictive vertical infinite scrolling behavior)
  const startOfDay = new Date()
  startOfDay.setHours(0,0,0,0)
  
  const { data: existing } = await supabase
    .from('zen_loops')
    .select('id')
    .eq('user_id', user.id)
    .gt('created_at', startOfDay.toISOString())

  if (existing && existing.length >= 5) {
    return { success: false, error: 'Daily loop limit (5) reached to encourage offline reflection.' }
  }

  const { error } = await supabase.from('zen_loops').insert({
    user_id: user.id,
    video_url: videoUrl,
    poem_line: poemLine
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/loops')
  return { success: true }
}

export async function reactWithResonance(messageId: string, resonanceType: 'om' | 'love' | 'chime' | 'water') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('message_reactions')
      .update({
        emoji: '🔔', // Fallback standard emoji
        resonance_type: resonanceType
      })
      .eq('id', existing.id)

    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('message_reactions').insert({
      message_id: messageId,
      user_id: user.id,
      emoji: '🔔',
      resonance_type: resonanceType
    })

    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/messages')
  return { success: true }
}

export async function createMemoryCabinet(title: string, coverImageUrl: string | null, selectedItemIds: { post_id?: string; vignette_id?: string }[]) {
  const supabase = await createClient()
  if (!title) return { success: false, error: 'Cabinet title is required' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Create the Cabinet drawer
  const { data: cabinet, error: cabError } = await supabase
    .from('memory_cabinets')
    .insert({
      user_id: user.id,
      title,
      cover_image_url: coverImageUrl
    })
    .select()
    .single()

  if (cabError || !cabinet) return { success: false, error: cabError?.message || 'Failed to create cabinet' }

  // 2. Link items (Vignettes or Posts)
  if (selectedItemIds.length > 0) {
    const linkData = selectedItemIds.map(item => ({
      cabinet_id: cabinet.id,
      post_id: item.post_id || null,
      vignette_id: item.vignette_id || null
    }))

    const { error: itemError } = await supabase.from('cabinet_items').insert(linkData)
    if (itemError) return { success: false, error: itemError.message }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function createQuietGuide(title: string, description: string, soundscape: 'none' | 'rain' | 'wind' | 'chime', pages: { title?: string; content: string; image_url?: string }[]) {
  const supabase = await createClient()
  if (!title || pages.length === 0) return { success: false, error: 'Title and pages are required' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // 1. Create the Guide booklet
  const { data: guide, error: guideError } = await supabase
    .from('quiet_guides')
    .insert({
      user_id: user.id,
      title,
      description,
      soundscape
    })
    .select()
    .single()

  if (guideError || !guide) return { success: false, error: guideError?.message || 'Failed to create booklet' }

  // 2. Insert pages
  const pageData = pages.map((p, idx) => ({
    guide_id: guide.id,
    page_number: idx + 1,
    title: p.title || null,
    content: p.content,
    image_url: p.image_url || null
  }))

  const { error: pageError } = await supabase.from('guide_pages').insert(pageData)
  if (pageError) return { success: false, error: pageError.message }

  revalidatePath('/guides')
  return { success: true }
}
