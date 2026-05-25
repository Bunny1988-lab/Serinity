import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { action, text } = await req.json()

    let prompt = ''
    
    if (action === 'safe-share') {
      prompt = `Analyze the following text to see if it contains highly vulnerable, personal, or emotionally raw content that might be better kept private in a journal rather than shared publicly. 
      Respond ONLY with 'SAFE' or 'VULNERABLE'. No other text.
      Text: "${text}"`
    } else if (action === 'mood-insight') {
      prompt = `You are a quiet, calming AI companion. Review the user's past 7 days of moods: "${text}". 
      Write ONE brief, gentle sentence summarizing the trend (e.g., 'You've felt calmer this week.'). 
      Do not offer advice.`
    } else if (action === 'soften-tone') {
      prompt = `Rewrite this text to have a softer, gentler, and calmer tone. Keep it concise.
      Text: "${text}"`
    } else if (action === 'clarify') {
      prompt = `Rewrite this text to be clearer and more concise, while maintaining its emotional intent.
      Text: "${text}"`
    } else {
      return new NextResponse('Invalid action', { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2
      }
    })

    return NextResponse.json({ result: response.text?.trim() })

  } catch (error) {
    console.error('Tools Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
