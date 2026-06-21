'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
}

export function SettingsMobileHeader({ title }: Props) {
  return (
    <div className="md:hidden sticky top-0 z-20 flex items-center bg-background/95 backdrop-blur-sm border-b border-border/60 px-1 h-12">
      <Link
        href="/settings"
        className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 pl-2 pr-4 h-full"
      >
        <ChevronLeft className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">Settings</span>
      </Link>
      <h1 className="flex-1 text-center text-sm font-semibold text-foreground translate-x-[-60px]">
        {title}
      </h1>
    </div>
  )
}
