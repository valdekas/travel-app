import { SettingsHub } from '@/components/settings/settings-hub'

export default function SettingsPage() {
  return (
    <>
      {/* Mobile: full category hub */}
      <div className="md:hidden">
        <div className="px-4 pt-5 pb-2">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
        <SettingsHub />
      </div>

      {/* Desktop: placeholder (users navigate via sidebar) */}
      <div className="hidden md:flex items-center justify-center h-64 text-muted-foreground text-sm">
        Select a category from the left
      </div>
    </>
  )
}
