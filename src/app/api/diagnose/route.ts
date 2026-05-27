// Trigger Vercel Auto-Deploy
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const diagnostics: Record<string, any> = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT (starts with ' + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 15) + '...)' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT (starts with ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 15) + '...)' : 'MISSING',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'PRESENT (starts with ' + process.env.GEMINI_API_KEY.substring(0, 8) + '...)' : 'MISSING',
    },
    database: {
      connection: 'checking...',
      tables: {},
      error: null
    }
  }

  try {
    const supabase = await createClient()

    // Test a basic ping query
    const { data: pingData, error: pingError } = await supabase.from('users').select('count').limit(1)
    
    if (pingError) {
      diagnostics.database.connection = 'FAILED'
      diagnostics.database.error = pingError
    } else {
      diagnostics.database.connection = 'SUCCESSFUL'
      diagnostics.database.tables.users = 'OK'
    }

    // Check circles table
    const { error: circlesError } = await supabase.from('circles').select('id').limit(1)
    diagnostics.database.tables.circles = circlesError ? 'ERROR: ' + circlesError.message : 'OK'

    // Check posts table
    const { error: postsError } = await supabase.from('posts').select('id').limit(1)
    diagnostics.database.tables.posts = postsError ? 'ERROR: ' + postsError.message : 'OK'

    // Check if unlock_date column exists in posts
    const { error: unlockDateError } = await supabase.from('posts').select('unlock_date').limit(1)
    diagnostics.database.tables.posts_unlock_date = unlockDateError ? 'ERROR: ' + unlockDateError.message : 'OK'

    // Check notifications table
    const { error: notificationsError } = await supabase.from('notifications').select('id').limit(1)
    diagnostics.database.tables.notifications = notificationsError ? 'ERROR: ' + notificationsError.message : 'OK'

  } catch (err: any) {
    diagnostics.database.connection = 'CRASHED'
    diagnostics.database.error = err.message || err
  }

  return NextResponse.json(diagnostics)
}
