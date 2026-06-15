import { Skeleton } from '@/components/ui/skeleton'

export default function ChecklistLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      {Array.from({ length: 3 }).map((_, gi) => (
        <div key={gi} className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-2 w-full rounded-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}
