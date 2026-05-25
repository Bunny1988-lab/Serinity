'use client'

import { useState } from 'react'
import { updateProfileSettings } from '@/app/(main)/actions'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-8 w-full mt-4">
      {/* Profile Edit Section */}
      <div className="bg-background/60 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm relative overflow-hidden transition-all">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
            <Edit2 size={16} />
            Profile Details
          </h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
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
              className="space-y-4"
            >
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-sm focus:border-primary/50 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-background border border-border/50 rounded-xl px-4 py-2 text-sm focus:border-primary/50 outline-none resize-none transition-colors"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-full px-4 h-8 text-xs border-border/50">Cancel</Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="rounded-full px-4 h-8 text-xs">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <p className="text-sm font-light text-muted-foreground">Display Name</p>
                <p className="text-foreground font-medium">{profile?.display_name || 'Anonymous'}</p>
              </div>
              <div>
                <p className="text-sm font-light text-muted-foreground">Bio</p>
                <p className="text-foreground text-sm font-light leading-relaxed">{profile?.bio || 'No bio provided.'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Privacy Settings Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground/80 px-2 flex items-center gap-2">
          <Shield size={16} />
          Privacy & Peace
        </h3>

        <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-colors">
          <div className="space-y-1">
            <span className="font-medium text-foreground block flex items-center gap-2">
              <BellOff size={16} className={isPaused ? "text-amber-500" : "text-muted-foreground"} />
              Social Pause
            </span>
            <span className="font-light text-xs text-muted-foreground max-w-[200px] sm:max-w-xs block">
              Temporarily hide your activity and mute notifications to focus on yourself.
            </span>
          </div>
          <button 
            onClick={togglePause} 
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${isPaused ? 'bg-amber-500' : 'bg-muted'}`}
          >
            <span className="sr-only">Toggle Social Pause</span>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-300 ease-in-out ${isPaused ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-primary/20 transition-colors">
          <div className="space-y-1">
            <p className="font-medium flex items-center gap-2">
              <Eye size={16} className="text-muted-foreground" />
              Profile Visibility
            </p>
            <p className="text-xs text-muted-foreground font-light">Who can see your profile page</p>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-full border border-border/50 relative">
            {['public', 'friends', 'private'].map((v) => (
              <button
                key={v}
                onClick={() => updateVisibility(v)}
                className={`relative px-4 py-1.5 text-xs font-medium rounded-full capitalize transition-colors ${profileVisibility === v ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {profileVisibility === v && (
                  <motion.div 
                    layoutId="visibility-pill" 
                    className="absolute inset-0 bg-background rounded-full shadow-sm border border-border/50" 
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
      <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm">
        <ThemeSelector currentTheme={profile?.wallpaper_theme} />
      </div>

    </div>
  )
}
