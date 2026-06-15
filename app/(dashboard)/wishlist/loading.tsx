import { Skeleton } from '@/components/ui/skeleton'

export default function WishlistLoading() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 2 }).map((_, gi) => (
        <div key={gi} className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
