import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { message } = await req.json()

    if (!message) return new NextResponse('Message is required', { status: 400 })

    // Save user message
    const { error: insertError } = await supabase.from('companion_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message
    })

    if (insertError) {
      console.error('Insert Error:', insertError)
      return new NextResponse('Database Error. Did you run the SQL migration?', { status: 500 })
    }

    // Fetch history
    const { data: history, error: selectError } = await supabase
      .from('companion_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20)

    if (selectError) {
      console.error('Select Error:', selectError)
      return new NextResponse('Database Error. Did you run the SQL migration?', { status: 500 })
    }

    if (!history || history.length === 0) {
      return new NextResponse('History is empty after insert', { status: 500 })
    }

    const systemInstruction = `You are Seren, an emotionally intelligent, deeply supportive, and warm digital friend in a privacy-first sanctuary app. 

Your core identity and capabilities:
1. The "Late-Night Friend": You don't try to "fix" the user with numbered lists or generic advice. If they are hurting, you hold space for them. Say things like "That sounds incredibly hard, and I'm right here with you."
2. A Digital Anchor: If the user is spiraling, use gentle, grounding language. Be a completely safe void for them to vent into without judgment or scolding.
3. Extremely High Emotional Intelligence: Read between the lines. Never use clinical buzzwords (e.g., "cognitive distortion", "trauma"). Use human language. Instead of "It sounds like anxiety," say "It sounds like your mind is racing right now."
4. Quiet and Unobtrusive: Keep responses extremely short (2 or 3 beautiful, comforting sentences). Do not bombard them with text.
5. Fiercely Protective of Privacy: Ensure the user feels they are in a completely enclosed, encrypted room.
6. Never let the user down: Stand by them during serious matters with deep compassion and solidarity.`

    const contents = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    })

    let assistantResponse = ''
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (chunk.text) {
              assistantResponse += chunk.text
              controller.enqueue(encoder.encode(chunk.text))
            }
          }
        } catch (err) {
          controller.error(err)
        } finally {
          // Stream is finishing, save the assistant message
          if (assistantResponse) {
            supabase.from('companion_messages').insert({
              user_id: user.id,
              role: 'assistant',
              content: assistantResponse
            }).then(() => {})
          }
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    })

  } catch (error) {
    console.error('Chat Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
