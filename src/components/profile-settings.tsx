'use client'

import { useState } from 'react'
import { updateProfileSettings } from '@/app/(main)/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Check, X, Shield, Eye, BellOff } from 'lucide-react'
import { ThemeSelector } from '@/components/theme-selector'

export function ProfileSettings({ profile }: { profile: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  
  const [isPaused, setIsPaused] = useState(profile?.is_paused || false)
  const [profileVisibility, setProfileVisibility] = useState(profile?.privacy_profile_visibility || 'public')
  
  const [isSaving, setIsSaving] = useState(false)

  async function handleSaveProfile() {
    setIsSaving(true)
    const formData = new FormData()
    formData.append('display_name', name)
    formData.append('bio', bio)
    await updateProfileSettings(formData)
    setIsEditing(false)
    setIsSaving(false)
  }

  async function togglePause() {
    const newValue = !isPaused
    setIsPaused(newValue)
    const formData = new FormData()
    formData.append('is_paused', newValue.toString())
    await updateProfileSettings(formData)
  }

  async function updateVisibility(v: string) {
    setProfileVisibility(v)
    const formData = new FormData()
    formData.append('privacy_profile_visibility', v)
    await updateProfileSettings(formData)
  }

  return (
    <div className="space-y-6 w-full mt-4">
      {/* Profile Edit Section */}
      <div className="bg-card border border-border-mint rounded-[32px] p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] relative overflow-hidden transition-all">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground/60 flex items-center gap-2">
            <Edit2 size={16} strokeWidth={2.5} />
            Profile Details
          </h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-[13px] font-bold text-foreground bg-background px-4 py-1.5 rounded-full border border-border-mint hover:bg-foreground hover:text-white transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div 
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block pl-2">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 bg-card border border-border-mint rounded-full px-5 text-[15px] font-bold text-foreground focus:ring-1 focus:ring-[#BCE3D8] outline-none transition-colors shadow-sm"
                />
              </div>
              <div>
                <label className="text-[12px] font-bold uppercase tracking-wider text-foreground/60 mb-2 block pl-2">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-card border border-border-mint rounded-[24px] px-5 py-4 text-[15px] font-medium text-foreground focus:ring-1 focus:ring-[#BCE3D8] outline-none resize-none transition-colors shadow-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsEditing(false)} className="rounded-full px-6 h-10 text-[13px] font-bold border border-border-mint text-foreground hover:bg-background transition-colors shadow-sm">Cancel</button>
                <button onClick={handleSaveProfile} disabled={isSaving} className="rounded-full px-6 h-10 text-[13px] font-bold bg-foreground text-white hover:bg-foreground/90 transition-colors shadow-sm disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-foreground/60 mb-1">Display Name</p>
                <p className="text-foreground font-bold text-[18px]">{profile?.display_name || 'Anonymous'}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-foreground/60 mb-1">Bio</p>
                <p className="text-foreground text-[15px] font-medium leading-relaxed max-w-xl">{profile?.bio || 'No bio provided.'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy Settings Section */}
      <div className="space-y-4">
        <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground/60 px-2 flex items-center gap-2">
          <Shield size={16} strokeWidth={2.5} />
          Privacy & Peace
        </h3>

        <div className="bg-card border border-border-mint rounded-[24px] p-6 shadow-sm flex items-center justify-between group hover:border-foreground/20 transition-colors">
          <div className="space-y-2">
            <span className="font-bold text-[16px] text-foreground flex items-center gap-2">
              <BellOff size={18} strokeWidth={2.5} className={isPaused ? "text-amber-500" : "text-foreground/40"} />
              Social Pause
            </span>
            <span className="font-medium text-[13px] text-foreground/60 max-w-[200px] sm:max-w-xs block leading-relaxed">
              Temporarily hide your activity and mute notifications to focus on yourself.
            </span>
          </div>
          <button 
            onClick={togglePause} 
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none border ${isPaused ? 'bg-amber-500 border-amber-600' : 'bg-background border-border-mint'}`}
          >
            <span className="sr-only">Toggle Social Pause</span>
            <span className={`inline-block h-6 w-6 transform rounded-full bg-card shadow-sm transition duration-300 ease-in-out ${isPaused ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="bg-card border border-border-mint rounded-[24px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 group hover:border-foreground/20 transition-colors">
          <div className="space-y-2">
            <p className="font-bold text-[16px] text-foreground flex items-center gap-2">
              <Eye size={18} strokeWidth={2.5} className="text-foreground/40" />
              Profile Visibility
            </p>
            <p className="text-[13px] text-foreground/60 font-medium leading-relaxed">Who can see your profile page</p>
          </div>
          <div className="flex bg-background p-1.5 rounded-full border border-border-mint relative">
            {['public', 'friends', 'private'].map((v) => (
              <button
                key={v}
                onClick={() => updateVisibility(v)}
                className={`relative px-5 py-2 text-[13px] font-bold rounded-full capitalize transition-colors ${profileVisibility === v ? 'text-foreground' : 'text-foreground/50 hover:text-foreground'}`}
              >
                {profileVisibility === v && (
                  <motion.div 
                    layoutId="visibility-pill" 
                    className="absolute inset-0 bg-card rounded-full shadow-sm border border-border-mint" 
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{v}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Settings Section */}
      <div className="bg-card border border-border-mint rounded-[32px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <ThemeSelector currentTheme={profile?.wallpaper_theme} />
      </div>

    </div>
  )
}
