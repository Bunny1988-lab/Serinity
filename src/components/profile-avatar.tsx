'use client'

import { useState, useRef } from 'react'
import { UserCircle, Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProfileAvatar } from '@/app/(main)/actions'

export function ProfileAvatar({ currentUrl, userId }: { currentUrl?: string, userId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file)

    if (!uploadError) {
      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath)
      
      const formData = new FormData()
      formData.append('avatar_url', data.publicUrl)
      await updateProfileAvatar(formData)
    }

    setIsUploading(false)
  }

  return (
    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary/60 overflow-hidden relative">
        {isUploading ? (
          <Loader2 size={32} className="animate-spin text-primary" />
        ) : currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <UserCircle size={64} strokeWidth={1} />
        )}
        
        {/* Hover overlay */}
        {!isUploading && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white" size={24} />
          </div>
        )}
      </div>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
    </div>
  )
}
