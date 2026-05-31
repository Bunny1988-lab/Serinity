import { ChevronLeft, HelpCircle, MessageCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SupportPage() {
  return (
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent">
        <Link href="/profile" className="flex items-center justify-center w-10 h-10 -ml-2 hover:opacity-70 transition-opacity">
          <ChevronLeft className="text-foreground" size={28} strokeWidth={2} />
        </Link>
        <h1 className="text-[18px] font-bold text-foreground flex-1 text-center -ml-8">Support</h1>
      </header>

      <main className="w-full max-w-[800px] px-6 mx-auto mt-4 space-y-4">
        <section className="bg-card border border-border-mint rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] flex flex-col items-center text-center py-8">
          <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4">
            <HelpCircle size={32} className="text-foreground" />
          </div>
          <h2 className="text-[20px] font-bold text-foreground">How can we help?</h2>
          <p className="text-[14px] text-foreground/70 mt-2 max-w-[250px]">
            We're here to support your journey. Get in touch with our team or browse our FAQs.
          </p>
        </section>

        <section className="bg-card border border-border-mint rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-4">
           <Link href="#" className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center group-hover:bg-[#BCE3D8] transition-colors">
                 <MessageCircle size={20} className="text-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-foreground">Chat with us</h3>
                <p className="text-[12px] text-foreground/60">Typically replies in a few hours</p>
              </div>
           </Link>
           <div className="w-full h-[1px] bg-[#BCE3D8]/50"></div>
           <Link href="mailto:support@serenity.app" className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center group-hover:bg-[#BCE3D8] transition-colors">
                 <Mail size={20} className="text-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-[14px] text-foreground">Email support</h3>
                <p className="text-[12px] text-foreground/60">support@serenity.app</p>
              </div>
           </Link>
        </section>
        
        <section className="bg-card border border-border-mint rounded-[24px] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <h2 className="font-bold text-[15px] text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
             <div>
                <h3 className="font-medium text-[14px] text-foreground">How do I delete my journal entries?</h3>
                <p className="text-[12px] text-foreground/70 mt-1">You can delete an entry by tapping the three dots menu on any journal entry and selecting "Delete".</p>
             </div>
             <div>
                <h3 className="font-medium text-[14px] text-foreground">Who can see my profile?</h3>
                <p className="text-[12px] text-foreground/70 mt-1">Check your Privacy Settings to control who can view your profile and journal entries.</p>
             </div>
          </div>
        </section>
      </main>
    </div>
  )
}
