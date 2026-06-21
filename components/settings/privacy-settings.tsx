'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Download, Trash2, AlertTriangle } from 'lucide-react'
import type { UserSettings } from '@/lib/types'

interface Props {
  userId: string
  userEmail: string
  settings: Pick<UserSettings, 'private_account' | 'hide_profile'>
}

export function PrivacySettings({ userId, userEmail, settings }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [privateAccount, setPrivateAccount] = useState(settings.private_account)
  const [hideProfile, setHideProfile] = useState(settings.hide_profile)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, private_account: privateAccount, hide_profile: hideProfile }, { onConflict: 'user_id' })
      if (error) throw error
      toast.success('Privacy settings saved')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== userEmail) { toast.error('Email does not match'); return }
    setDeleting(true)
    try {
      await Promise.all([
        supabase.from('trips').delete().eq('user_id', userId),
        supabase.from('wishlist_items').delete().eq('user_id', userId),
        supabase.from('user_settings').delete().eq('user_id', userId),
      ])
      await supabase.auth.signOut()
      toast.success('Account data deleted. Contact support to remove the auth account.')
      router.push('/auth/login')
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to delete account')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-xl space-y-4 pb-24 md:pb-0">

      {/* Privacy toggles */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">Visibility</p>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Private Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Only you can see your trips and activity</p>
            </div>
            <Switch checked={privateAccount} onCheckedChange={v => setPrivateAccount(v)} />
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">Hide Profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">Don&apos;t appear in search results</p>
            </div>
            <Switch checked={hideProfile} onCheckedChange={v => setHideProfile(v)} />
          </div>
        </div>
      </div>

      {/* Data export */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-1.5">Your Data</p>
        <div className="rounded-2xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
          <button
            disabled
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left opacity-50 cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Export All Data</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </button>
          <button
            disabled
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left opacity-50 cursor-not-allowed"
          >
            <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Download Trips (PDF)</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-500 px-1 mb-1.5">Danger Zone</p>
        <div className="rounded-2xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 overflow-hidden">
          <button
            onClick={() => setDeleteOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-red-100/50 dark:active:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">Permanently remove account and data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden border-t border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3 z-10">
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Privacy Settings
        </Button>
      </div>

      {/* Desktop save */}
      <div className="hidden md:flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Privacy Settings
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3">
              <p className="text-sm font-semibold text-destructive">This will permanently delete all your data.</p>
              <p className="text-xs text-muted-foreground mt-1">Trips, itineraries, journals, budgets, and settings will all be removed.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deleteConfirm" className="text-sm">
                Type your email to confirm
              </Label>
              <p className="text-xs font-mono text-foreground bg-muted rounded px-2 py-1 select-all">{userEmail}</p>
              <Input
                id="deleteConfirm"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Enter your email"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setDeleteOpen(false); setDeleteConfirm('') }} className="flex-1" disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== userEmail}
                className="flex-1 gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete Forever
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
