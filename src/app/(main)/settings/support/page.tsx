import { HelpCircle, MessageCircleWarning, FileText } from 'lucide-react'
import Link from 'next/link'

export default function SupportSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-6 h-full overflow-y-auto hide-scrollbar">
      <div className="mb-8">
        <Link href="/settings" className="text-sm font-medium text-outline hover:text-primary transition-colors flex items-center gap-2 mb-4 w-fit">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Settings
        </Link>
        <h1 className="font-display text-4xl font-medium text-primary tracking-tight">Support</h1>
        <p className="text-on-surface-variant font-body-md mt-2 max-w-xl">
          Need help? We're here for you.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-container-lowest rounded-3xl border-[0.5px] border-outline-variant overflow-hidden">
          <a href="#" className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50 hover:bg-surface-container-low transition-colors group">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <HelpCircle size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Help Center</h3>
              <p className="text-sm text-on-surface-variant mt-1">Browse articles and guides about using the app.</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </a>

          <a href="#" className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50 hover:bg-surface-container-low transition-colors group">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MessageCircleWarning size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Report a Problem</h3>
              <p className="text-sm text-on-surface-variant mt-1">Let us know if something isn't working correctly.</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </a>

          <a href="/privacy" className="p-5 flex items-start gap-4 hover:bg-surface-container-low transition-colors group">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Terms & Privacy Policy</h3>
              <p className="text-sm text-on-surface-variant mt-1">Read our commitments to your privacy.</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </a>
        </div>
      </div>
    </div>
  )
}
