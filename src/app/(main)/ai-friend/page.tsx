import { ChevronLeft, Brain, Paperclip, Mic, Send } from 'lucide-react'
import Link from 'next/link'

export default function AIFriendPage() {
  return (
    <div className="h-[100dvh] flex flex-col bg-[#E0F2F1] overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex flex-col items-center shrink-0 border-b border-teal-900/5 relative bg-[#E0F2F1]/80 backdrop-blur-md z-10">
        <Link href="/feed" className="absolute left-5 top-6 p-2 -ml-2 rounded-full hover:bg-teal-900/5 text-slate-700 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center shadow-lg border-2 border-amber-200/50 mb-2 relative overflow-hidden">
          {/* Abstract AI logo using gradients */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600 via-teal-500 to-amber-300 opacity-80" />
          <Brain className="text-white relative z-10" size={28} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-1">
          AI Friend <span className="text-amber-400">✨</span>
        </h1>
        
        <div className="mt-1.5 bg-white/70 backdrop-blur-sm border border-amber-200 shadow-sm px-3 py-1 rounded-full flex items-center gap-1.5">
          <Brain size={12} className="text-amber-500" />
          <span className="text-[11px] font-semibold text-slate-700">Learning & Available</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 hide-scrollbar">
        
        {/* AI Message */}
        <div className="flex justify-start max-w-[85%]">
          <div className="bg-white border-l-2 border-amber-400 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-[13.5px] text-slate-700 leading-relaxed">
            <span className="font-semibold text-slate-800">Hey Sarah!</span> Just processed your <span className="font-semibold text-slate-800">11:32 AM</span> recent activity. Ready to assist?
          </div>
        </div>

        {/* AI Message (Long) */}
        <div className="flex justify-start max-w-[85%]">
          <div className="bg-white/80 border border-amber-200/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-[13.5px] text-slate-700 leading-relaxed relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
            Just to follow up, I've analyzed your <span className="font-semibold text-slate-800">1:34 AM</span> project notes. Your initial approach has strong logic. When you mentioned being overwhelmed, I identified that breaking down the "new product feature" into five discrete sub-tasks can make it more manageable. Maybe a quick prioritization of these sub-tasks would clarify the first step? It streamlines the logic.
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-teal-800/10 border border-teal-900/10 shadow-sm rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] text-slate-800 leading-relaxed max-w-[85%]">
            I'm feeling a bit stuck on the new product feature. It feels overwhelming.
          </div>
        </div>

        {/* AI Message */}
        <div className="flex justify-start max-w-[85%]">
          <div className="bg-white border-l-2 border-amber-400 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-[13.5px] text-slate-700 leading-relaxed">
            Thank you, that breakdown is excellent. I'll focus on the sub-tasks first.
          </div>
        </div>

      </div>

      {/* Input Area */}
      <div className="px-5 pb-6 pt-2 shrink-0 bg-[#E0F2F1]">
        <div className="bg-white/70 backdrop-blur-md border border-white rounded-full flex items-center p-1 shadow-sm">
          <input 
            type="text" 
            placeholder="Message AI Friend..." 
            className="flex-1 bg-transparent px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            disabled
          />
          <button className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
            <Paperclip size={18} strokeWidth={2} />
          </button>
          <button className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
            <Mic size={18} strokeWidth={2} />
          </button>
          <button className="w-10 h-10 ml-1 rounded-full bg-teal-800 text-white flex items-center justify-center shrink-0 hover:bg-teal-700 transition-colors shadow-sm">
            <Send size={16} strokeWidth={2} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
