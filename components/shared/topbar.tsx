'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Menu, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopbarProps {
  onMenuClick: () => void
  onSearchClick?: () => void
  userEmail?: string
  userAvatar?: string
  userName?: string
}

export function Topbar({ onMenuClick, onSearchClick, userEmail, userAvatar, userName }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : userEmail?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between px-6 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm sticky top-0 z-30 shrink-0">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <button
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-xl px-3.5 py-2 w-64 text-slate-400 dark:text-slate-500 text-sm cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600/60 transition-colors select-none"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span>Search trips, places…</span>
          <kbd className="ml-auto text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded-md font-mono leading-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-indigo-500 rounded-full" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="ml-1 flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Avatar className="h-7 w-7 ring-2 ring-indigo-100 dark:ring-indigo-900/60">
                <AvatarImage src={userAvatar} alt={userName ?? userEmail} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                {userName?.split(' ')[0] ?? 'Account'}
              </span>
            </button>
          } />
          <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-xl shadow-slate-200/60 dark:shadow-black/40 border-slate-100 dark:border-slate-800">
            <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{userName ?? 'Traveler'}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{userEmail}</p>
            </div>
            <DropdownMenuItem>
              <a href="/settings" className="w-full">Account Settings</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
