import { Skeleton } from '@/components/ui/skeleton'

export default function ItineraryLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-10 rounded-xl" />
          <div className="ml-4 space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <Skeleton key={j} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
