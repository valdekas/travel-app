'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Camera, Loader2 } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Props {
  user: SupabaseUser
}

export function AccountSettings({ user }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const meta = user.user_metadata ?? {}
  const [fullName, setFullName] = useState<string>(meta.full_name ?? '')
  const [username, setUsername] = useState<string>(meta.username ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string>(meta.avatar_url ?? '')
  const [saving, setSaving] = useState(false)

  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (user.email?.[0] ?? 'U').toUpperCase()

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2 MB'); return }
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Upload failed: ' + uploadError.message); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(data.publicUrl + `?t=${Date.now()}`)
    toast.success('Avatar updated')
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, username, avatar_url: avatarUrl },
      })
      if (error) throw error
      toast.success('Profile saved')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setChangingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success('Password updated')
      setNewPw(''); setConfirmPw('')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to update password')
    } finally {
      setChangingPw(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5 pb-24 md:pb-0">

      {/* Avatar */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60 md:border-0 md:rounded-none md:p-0 md:bg-transparent">
        <div className="relative">
          <Avatar className="h-16 w-16 md:h-20 md:w-20 ring-2 ring-border">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-lg font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 shadow-md transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{fullName || 'Your Name'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <button onClick={() => fileRef.current?.click()} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5">
            Change photo
          </button>
        </div>
      </div>

      {/* Profile fields */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profile</p>
        </div>
        <div className="divide-y divide-border/40">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="fullName" className="w-24 text-sm flex-shrink-0 text-muted-foreground">Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-sm bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="username" className="w-24 text-sm flex-shrink-0 text-muted-foreground">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="@username"
              className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-sm bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="email" className="w-24 text-sm flex-shrink-0 text-muted-foreground">Email</Label>
            <Input
              id="email"
              value={user.email ?? ''}
              disabled
              className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-sm bg-transparent opacity-50 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Change Password</p>
        </div>
        <div className="divide-y divide-border/40">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="newPw" className="w-24 text-sm flex-shrink-0 text-muted-foreground">New</Label>
            <Input
              id="newPw"
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-sm bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Label htmlFor="confirmPw" className="w-24 text-sm flex-shrink-0 text-muted-foreground">Confirm</Label>
            <Input
              id="confirmPw"
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat password"
              className="border-0 shadow-none p-0 h-auto focus-visible:ring-0 text-sm bg-transparent"
            />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangePassword}
            disabled={changingPw || !newPw || !confirmPw}
            className="gap-2 w-full md:w-auto"
          >
            {changingPw && <Loader2 className="h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </div>
      </div>

      {/* Sticky save — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 z-10">
        <Button onClick={handleSaveProfile} disabled={saving} className="w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </div>

      {/* Desktop save */}
      <div className="hidden md:block pt-2">
        <Separator className="mb-4" />
        <div className="flex justify-end">
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </div>
    </div>
  )
}
