'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  const rawVisibility = formData.get('visibility') as string
  const mood = formData.get('mood') as string
  const image_url = formData.get('image_url') as string
  const unlock_date = formData.get('unlock_date') as string
  
  if (!content && !image_url) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let visibility = 'all_friends'
  let circle_id = null

  if (rawVisibility === 'only_me') {
    visibility = 'only_me'
  } else if (rawVisibility.startsWith('circle_')) {
    visibility = 'circle'
    circle_id = rawVisibility.replace('circle_', '')
  }

  await supabase.from('posts').insert({
    author_id: user.id,
    content,
    visibility,
    circle_id,
    mood: mood || null,
    image_url: image_url || null,
    unlock_date: unlock_date ? new Date(unlock_date).toISOString() : null
  })

  revalidatePath('/feed')
}


export async function createCircle(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  
  if (!name) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('circles').insert({
    owner_id: user.id,
    name
  })

  revalidatePath('/circles')
}

export async function addReaction(formData: FormData) {
  const supabase = await createClient()
  const postId = formData.get('postId') as string
  const type = formData.get('type') as string
  
  if (!postId || !type) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('reactions').insert({
    post_id: postId,
    user_id: user.id,
    type
  }).select().single()
  // No revalidation needed if we rely on optimistic UI, but safe to do:
  revalidatePath('/feed')
}

export async function addComment(formData: FormData) {
  const supabase = await createClient()
  const postId = formData.get('postId') as string
  const content = formData.get('content') as string
  
  if (!postId || !content) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('comments').insert({
    post_id: postId,
    author_id: user.id,
    content
  })

  revalidatePath('/feed')
}

export async function updateProfileAvatar(formData: FormData) {
  const supabase = await createClient()
  const avatarUrl = formData.get('avatar_url') as string
  
  if (!avatarUrl) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', user.id)

  revalidatePath('/profile')
}

export async function deletePost(formData: FormData) {
  const supabase = await createClient()
  const postId = formData.get('postId') as string
  
  if (!postId) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // RLS ensures only the author can delete it
  await supabase.from('posts').delete().eq('id', postId).eq('author_id', user.id)

  revalidatePath('/feed')
}

export async function toggleComments(formData: FormData) {
  const supabase = await createClient()
  const postId = formData.get('postId') as string
  const allowComments = formData.get('allowComments') === 'true'
  
  if (!postId) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('posts').update({ allow_comments: allowComments }).eq('id', postId).eq('author_id', user.id)

  revalidatePath('/feed')
}

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return []
  
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20)

  return data || []
}

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      read,
      created_at,
      source_user:users!notifications_source_user_id_fkey(display_name, avatar_url),
      post:posts(content)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return data || []
}

export async function markNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  revalidatePath('/notifications')
}

export async function deleteMessage(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !messageId) return

  // Either sender or receiver can delete a whisper message
  await supabase.from('messages')
    .delete()
    .eq('id', messageId)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
}

export async function createJournalEntry(formData: FormData) {
  const supabase = await createClient()
  const content = formData.get('content') as string
  const mood = formData.get('mood') as string
  const image_url = formData.get('image_url') as string
  const burn_after_hours = formData.get('burn_after_hours') as string
  
  if (!content && !image_url) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  let burn_after = null
  if (burn_after_hours) {
    burn_after = new Date(Date.now() + parseInt(burn_after_hours) * 60 * 60 * 1000).toISOString()
  }

  await supabase.from('journal_entries').insert({
    user_id: user.id,
    content,
    mood: mood || null,
    image_url: image_url || null,
    burn_after
  })

  revalidatePath('/journal')
}

export async function appendDailyJournal(content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !content.trim()) return

  // Check if there's an entry for today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const { data: existing } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    // Append to existing
    await supabase.from('journal_entries').update({
      content: existing.content + '\n\n' + content
    }).eq('id', existing.id)
  } else {
    // Create new
    await supabase.from('journal_entries').insert({
      user_id: user.id,
      content,
    })
  }

  revalidatePath('/journal')
}

export async function updateProfileSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const updates: any = {}
  
  if (formData.has('display_name')) updates.display_name = formData.get('display_name')
  if (formData.has('bio')) updates.bio = formData.get('bio')
  if (formData.has('is_paused')) updates.is_paused = formData.get('is_paused') === 'true'
  if (formData.has('privacy_profile_visibility')) updates.privacy_profile_visibility = formData.get('privacy_profile_visibility')
  if (formData.has('wallpaper_theme')) updates.wallpaper_theme = formData.get('wallpaper_theme')

  if (Object.keys(updates).length > 0) {
    await supabase.from('users').update(updates).eq('id', user.id)
  }

  revalidatePath('/profile')
}

export async function markMessagesAsRead(senderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', senderId)
    .eq('receiver_id', user.id)
    .is('read_at', null)
}

export async function deleteChatWithUser(partnerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .delete()
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)

  revalidatePath('/messages')
}

export async function deleteMessageForEveryone(messageId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('messages')
    .delete()
    .eq('id', messageId)
    .eq('sender_id', user.id) // Only sender can delete
}

export async function matchContactHashes(hashes: string[]) {
  if (!hashes || hashes.length === 0) return []
  // Limit to 500 hashes per query to protect DB
  const cleanedHashes = hashes.slice(0, 500)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_privacy_lookups')
    .select(`
      user_id,
      users:users!inner (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .in('email_hash', cleanedHashes)

  if (error) {
    console.error('Error matching contact hashes:', error)
    return []
  }

  // Flatten and return the mapped user profiles
  interface LookupResponse {
    users: {
      id: string
      username: string
      display_name: string | null
      avatar_url: string | null
    }
  }
  return (data as unknown as LookupResponse[]).map((d) => d.users) || []
}

export async function getCirclesWithOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('circles')
    .select('id, name')
    .eq('owner_id', user.id)

  return data || []
}

export async function addMemberToCircleGlobal(circleId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check if circle is owned by the user
  const { data: circle } = await supabase
    .from('circles')
    .select('owner_id')
    .eq('id', circleId)
    .single()

  if (!circle || circle.owner_id !== user.id) {
    return { success: false, error: 'Unauthorized circle ownership' }
  }

  const { error } = await supabase
    .from('circle_members')
    .insert({ circle_id: circleId, user_id: userId })

  if (error) {
    if (error.code === '23505') {
      return { success: true, message: 'Already a member' }
    }
    return { success: false, error: error.message }
  }

  revalidatePath('/circles')
  revalidatePath(`/circles/${circleId}`)
  return { success: true }
}

export async function getMembershipsForUser(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', userId)

  return data?.map(d => d.circle_id) || []
}

// ─── FRIEND REQUESTS ──────────────────────────────────────────────────────────

export async function sendFriendRequest(receiverId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('friend_requests')
    .insert({ sender_id: user.id, receiver_id: receiverId })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Request already sent' }
    return { success: false, error: error.message }
  }

  revalidatePath('/people')
  return { success: true, requestId: data?.id }
}

export async function acceptFriendRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .eq('receiver_id', user.id)

  revalidatePath('/people')
  revalidatePath('/messages')
  return { success: true }
}

export async function declineFriendRequest(requestId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  await supabase
    .from('friend_requests')
    .update({ status: 'declined' })
    .eq('id', requestId)
    .eq('receiver_id', user.id)

  revalidatePath('/people')
  return { success: true }
}

export async function getAllFriendRequestsForUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('friend_requests')
    .select('id, sender_id, receiver_id, status')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

  return data || []
}
