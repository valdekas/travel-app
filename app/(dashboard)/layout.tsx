import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/shared/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <DashboardShell
      userEmail={user.email}
      userAvatar={user.user_metadata?.avatar_url}
      userName={user.user_metadata?.full_name}
    >
      {children}
    </DashboardShell>
  )
}
