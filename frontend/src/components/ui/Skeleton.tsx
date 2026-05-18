import { cn } from '@/lib/util'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-white/5', className)}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl p-6 space-y-3" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}
