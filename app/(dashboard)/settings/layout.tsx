import { SettingsNav } from '@/components/settings/settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full">
      <SettingsNav />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
