import { Bell, Mail, Volume2, Moon } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-6 h-full overflow-y-auto hide-scrollbar">
      <div className="mb-8">
        <Link href="/settings" className="text-sm font-medium text-outline hover:text-primary transition-colors flex items-center gap-2 mb-4 w-fit">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Settings
        </Link>
        <h1 className="font-display text-4xl font-medium text-primary tracking-tight">Notifications</h1>
        <p className="text-on-surface-variant font-body-md mt-2 max-w-xl">
          Control how and when you want to be notified. We believe in mindful interruptions only.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-container-lowest rounded-3xl border-[0.5px] border-outline-variant overflow-hidden">
          <div className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <Bell size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Push Notifications</h3>
              <p className="text-sm text-on-surface-variant mt-1">Receive alerts on your device for messages and reactions.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Email Summaries</h3>
              <p className="text-sm text-on-surface-variant mt-1">Get a weekly digest of moments you missed.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <Volume2 size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">In-App Sounds</h3>
              <p className="text-sm text-on-surface-variant mt-1">Play soothing chimes for new messages.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <Moon size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Quiet Mode Schedule</h3>
              <p className="text-sm text-on-surface-variant mt-1">Automatically pause notifications from 10 PM to 7 AM.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
