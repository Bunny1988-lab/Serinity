import { EyeOff, UserX, Shield, Lock } from 'lucide-react'
import Link from 'next/link'

export default function PrivacySettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-6 h-full overflow-y-auto hide-scrollbar">
      <div className="mb-8">
        <Link href="/settings" className="text-sm font-medium text-outline hover:text-primary transition-colors flex items-center gap-2 mb-4 w-fit">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Settings
        </Link>
        <h1 className="font-display text-4xl font-medium text-primary tracking-tight">Privacy</h1>
        <p className="text-on-surface-variant font-body-md mt-2 max-w-xl">
          Your space, your rules. Manage who can see your activity and interact with you.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-container-lowest rounded-3xl border-[0.5px] border-outline-variant overflow-hidden">
          <div className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Private Account</h3>
              <p className="text-sm text-on-surface-variant mt-1">When your account is private, only people you approve can see your posts.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <EyeOff size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Activity Status</h3>
              <p className="text-sm text-on-surface-variant mt-1">Allow accounts you follow to see when you're online.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="p-5 flex items-start gap-4 border-b-[0.5px] border-outline-variant/50 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-on-surface">Hidden Words</h3>
              <p className="text-sm text-on-surface-variant mt-1">Automatically hide comments containing certain words.</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </div>

          <div className="p-5 flex items-start gap-4 hover:bg-surface-container-low transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-error/10 flex items-center justify-center shrink-0">
              <UserX size={18} className="text-error" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-error">Blocked Accounts</h3>
              <p className="text-sm text-on-surface-variant mt-1">Manage users you've blocked from viewing your profile.</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </div>
        </div>
      </div>
    </div>
  )
}
