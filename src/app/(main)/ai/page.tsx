import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AIFriendChat } from '@/components/ai-friend-chat'

export default async function AIFriendPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: history } = await supabase
    .from('companion_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return <AIFriendChat initialMessages={history || []} />
}
