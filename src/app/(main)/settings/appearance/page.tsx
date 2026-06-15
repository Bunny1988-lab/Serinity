import { Palette, Moon, Sun, Monitor } from 'lucide-react'
import Link from 'next/link'

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-6 h-full overflow-y-auto hide-scrollbar">
      <div className="mb-8">
        <Link href="/settings" className="text-sm font-medium text-outline hover:text-primary transition-colors flex items-center gap-2 mb-4 w-fit">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Settings
        </Link>
        <h1 className="font-display text-4xl font-medium text-primary tracking-tight">Appearance</h1>
        <p className="text-on-surface-variant font-body-md mt-2 max-w-xl">
          Customize how the app looks and feels to suit your preference.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-bold text-outline tracking-wider uppercase mb-4 px-2">Theme</h2>
          <div className="grid grid-cols-3 gap-4">
            <button className="flex flex-col items-center gap-3 p-4 rounded-3xl border-2 border-primary bg-surface-container-lowest transition-all">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sun size={24} className="text-primary" />
              </div>
              <span className="font-medium text-primary">Light</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 rounded-3xl border border-outline-variant hover:border-primary/50 bg-surface-container-lowest transition-all">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                <Moon size={24} className="text-outline" />
              </div>
              <span className="font-medium text-on-surface-variant">Dark</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 rounded-3xl border border-outline-variant hover:border-primary/50 bg-surface-container-lowest transition-all">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                <Monitor size={24} className="text-outline" />
              </div>
              <span className="font-medium text-on-surface-variant">System</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-outline tracking-wider uppercase mb-4 px-2">Accent Color</h2>
          <div className="flex gap-4 p-6 bg-surface-container-lowest rounded-3xl border-[0.5px] border-outline-variant">
            <button className="w-10 h-10 rounded-full bg-[#1c1917] ring-2 ring-offset-2 ring-offset-surface ring-[#1c1917]" title="Quiet Ink"></button>
            <button className="w-10 h-10 rounded-full bg-rose-800 hover:scale-110 transition-transform" title="Rose"></button>
            <button className="w-10 h-10 rounded-full bg-emerald-800 hover:scale-110 transition-transform" title="Forest"></button>
            <button className="w-10 h-10 rounded-full bg-blue-800 hover:scale-110 transition-transform" title="Ocean"></button>
          </div>
        </div>
      </div>
    </div>
  )
}
