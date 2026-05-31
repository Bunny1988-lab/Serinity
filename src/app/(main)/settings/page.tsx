import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateProfileSettings } from '@/app/(main)/actions'
import { SubmitButton } from '@/components/submit-button'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="px-6 md:px-16 py-12 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row gap-16">
        
        {/* ── SIDEBAR TABS ───────────────────────────────────────── */}
        <aside className="w-full md:w-64 flex flex-col space-y-10 shrink-0">
          <div className="flex flex-col space-y-4">
            <button className="flex items-center gap-4 py-2 text-primary font-bold transition-all border-r-2 border-primary -mr-0 pr-4 text-left">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span> Account
            </button>
            <button className="flex items-center gap-4 py-2 text-on-surface-variant hover:text-primary transition-all text-left">
              <span className="material-symbols-outlined">notifications_active</span> Notifications
            </button>
            <button className="flex items-center gap-4 py-2 text-on-surface-variant hover:text-primary transition-all text-left">
              <span className="material-symbols-outlined">verified_user</span> Privacy
            </button>
            <button className="flex items-center gap-4 py-2 text-on-surface-variant hover:text-primary transition-all text-left">
              <span className="material-symbols-outlined">palette</span> Appearance
            </button>
            <button className="flex items-center gap-4 py-2 text-on-surface-variant hover:text-primary transition-all text-left">
              <span className="material-symbols-outlined">help_center</span> Support
            </button>
          </div>
          
          {/* Status Card */}
          <div className="bg-surface-container-low p-8 border-[0.5px] border-outline-variant">
            <p className="font-label-sm text-[10px] text-on-surface-variant mb-4 uppercase tracking-[0.2em]">Plan Status</p>
            <p className="font-headline-sm text-[24px] text-primary mb-1">Premium</p>
            <p className="font-body-md text-[12px] text-on-surface-variant italic">Renewal in 14 days</p>
            <button className="mt-8 w-full py-3 border-[0.5px] border-primary font-label-md hover:bg-primary hover:text-white transition-all duration-300 uppercase tracking-widest text-[11px]">Manage</button>
          </div>
        </aside>

        {/* ── SETTINGS CONTENT ───────────────────────────────────── */}
        <form action={updateProfileSettings} className="flex-grow space-y-20 min-w-0">
          
          {/* Account Section */}
          <div>
            <h2 className="font-headline-md text-3xl font-medium text-primary mb-12">Account Profile</h2>
            <div className="flex items-center gap-12 mb-12">
              <div className="relative group cursor-pointer shrink-0">
                <div className="w-32 h-32 overflow-hidden border-[0.5px] border-outline-variant grayscale group-hover:grayscale-0 transition-all duration-700 flex items-center justify-center bg-surface-container">
                  {profile?.avatar_url ? (
                    <img alt="Profile avatar" className="w-full h-full object-cover" src={profile.avatar_url} />
                  ) : (
                    <span className="text-4xl text-primary font-bold">{profile?.display_name?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white">photo_camera</span>
                </div>
              </div>
              <div className="flex-grow space-y-2 min-w-0">
                <label className="font-label-sm text-[10px] text-on-surface-variant block uppercase tracking-widest">Display Name</label>
                <input 
                  name="display_name"
                  className="w-full bg-transparent border-b border-outline-variant py-3 font-headline-sm text-2xl text-primary focus:border-primary transition-all placeholder:opacity-30 outline-none" 
                  type="text" 
                  defaultValue={profile?.display_name || ''} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <div className="space-y-2">
                <label className="font-label-sm text-[10px] text-on-surface-variant block uppercase tracking-widest">Bio</label>
                <textarea 
                  name="bio"
                  className="w-full bg-transparent border-b border-outline-variant py-3 font-body-lg text-primary focus:border-primary transition-all outline-none resize-none" 
                  defaultValue={profile?.bio || ''} 
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="font-label-sm text-[10px] text-on-surface-variant block uppercase tracking-widest">Handle</label>
                <div className="flex items-center border-b border-outline-variant focus-within:border-primary transition-all">
                  <span className="text-on-surface-variant font-body-lg pr-1 opacity-50">@</span>
                  <input 
                    name="username"
                    className="w-full bg-transparent py-3 font-body-lg text-primary outline-none" 
                    type="text" 
                    defaultValue={profile?.username || ''} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Separation Line */}
          <div className="h-[0.5px] bg-outline-variant/30"></div>

          {/* Signal Control */}
          <div>
            <h2 className="font-headline-md text-3xl font-medium text-primary mb-6">Signal Control</h2>
            <p className="text-on-surface-variant font-body-lg italic mb-10 max-w-xl">Configure how Quiet filters incoming information to protect your focus periods.</p>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-8 bg-surface-container-low/50 hover:bg-surface-container-low transition-all border-[0.5px] border-outline-variant/20">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-background border-[0.5px] border-outline-variant/30 shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant">timer</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-primary uppercase tracking-widest text-[13px]">Focused Batching</h4>
                    <p className="font-body-md text-[13px] text-on-surface-variant italic">Deliver notifications in 4 daily pulses</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input defaultChecked className="sr-only peer" type="checkbox" />
                  <div className="w-12 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary border border-outline-variant/20"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-8 bg-surface-container-low/50 hover:bg-surface-container-low transition-all border-[0.5px] border-outline-variant/20">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-background border-[0.5px] border-outline-variant/30 shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant">visibility_off</span>
                  </div>
                  <div>
                    <h4 className="font-label-md text-primary uppercase tracking-widest text-[13px]">Social Pause</h4>
                    <p className="font-body-md text-[13px] text-on-surface-variant italic">Temporarily hide your activity and mute notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input name="is_paused" value="true" defaultChecked={profile?.is_paused} className="sr-only peer" type="checkbox" />
                  <div className="w-12 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary border border-outline-variant/20"></div>
                </label>
              </div>

              <div className="flex flex-col gap-6 p-8 bg-surface-container-low/50 hover:bg-surface-container-low transition-all border-[0.5px] border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-background border-[0.5px] border-outline-variant/30 shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant">bedtime</span>
                    </div>
                    <div>
                      <h4 className="font-label-md text-primary uppercase tracking-widest text-[13px]">Digital Sabbath</h4>
                      <p className="font-body-md text-[13px] text-on-surface-variant italic">Mute presence and trigger auto-replies during quiet hours</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input name="quiet_mode_enabled" value="true" defaultChecked={profile?.quiet_mode_enabled} className="sr-only peer" type="checkbox" />
                    <div className="w-12 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary border border-outline-variant/20"></div>
                  </label>
                </div>
                
                {/* Quiet Hours details inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t-[0.5px] border-outline-variant/15">
                  <div className="space-y-2">
                    <label className="font-label-sm text-[9px] text-on-surface-variant block uppercase tracking-widest">Sabbath Starts</label>
                    <input 
                      name="quiet_mode_start" 
                      type="time" 
                      defaultValue={profile?.quiet_mode_start || '22:00'} 
                      className="w-full bg-transparent border-b border-outline-variant/60 py-2 font-body-md text-sm text-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-sm text-[9px] text-on-surface-variant block uppercase tracking-widest">Sabbath Ends</label>
                    <input 
                      name="quiet_mode_end" 
                      type="time" 
                      defaultValue={profile?.quiet_mode_end || '07:00'} 
                      className="w-full bg-transparent border-b border-outline-variant/60 py-2 font-body-md text-sm text-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-label-sm text-[9px] text-on-surface-variant block uppercase tracking-widest">Mindful Auto-Reply Message</label>
                    <input 
                      name="quiet_mode_auto_reply" 
                      type="text" 
                      defaultValue={profile?.quiet_mode_auto_reply || 'Practicing quiet focus. Messages will be read mindfully.'} 
                      className="w-full bg-transparent border-b border-outline-variant/60 py-2 font-body-md text-sm text-primary focus:border-primary outline-none"
                      placeholder="Your mindful quiet status..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Danger Zone */}
          <div className="pt-8 space-y-10">
            <h2 className="font-headline-md text-3xl font-medium text-primary mb-6">Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-[0.5px] border-outline-variant p-8 flex items-center justify-between hover:bg-surface-container-low transition-all cursor-pointer group">
                <div>
                  <h4 className="font-label-md text-primary uppercase tracking-widest text-[13px]">Two-Factor</h4>
                  <p className="font-body-md text-[12px] text-on-surface-variant italic">Protect with biometric auth</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>
              <div className="border-[0.5px] border-outline-variant p-8 flex items-center justify-between hover:bg-surface-container-low transition-all cursor-pointer group">
                <div>
                  <h4 className="font-label-md text-primary uppercase tracking-widest text-[13px]">Devices</h4>
                  <p className="font-body-md text-[12px] text-on-surface-variant italic">Manage 3 active sessions</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
              </div>
            </div>
            <div className="mt-16 border-t-[0.5px] border-outline-variant/30 pt-16">
              <button type="button" className="px-10 py-4 border-[0.5px] border-error text-error font-label-md uppercase tracking-widest text-[11px] hover:bg-error hover:text-white transition-all">Deactivate Account</button>
              <p className="mt-6 font-body-md text-[13px] text-on-surface-variant italic max-w-sm">This will temporarily hide your profile and signal history from the network.</p>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="flex flex-wrap items-center justify-end gap-6 pt-16 border-t-[0.5px] border-outline-variant/30 pb-24 md:pb-0">
            <button type="reset" className="px-12 py-4 bg-transparent border-[0.5px] border-primary text-primary font-label-md uppercase tracking-[0.2em] text-[11px] hover:bg-surface-container-low transition-all">Discard</button>
            <SubmitButton pendingText="Saving..." className="px-12 py-4 bg-primary text-white font-label-md uppercase tracking-[0.2em] text-[11px] hover:opacity-90 transition-all shadow-xl">
              Save Changes
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  )
}
