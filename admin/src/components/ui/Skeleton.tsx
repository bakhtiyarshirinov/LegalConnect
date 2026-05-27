import React from 'react'

interface SkeletonProps {
  className?: string
  count?: number
}

const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-[#F5F5F5] rounded-xl ${className}`} />
)

export const Skeleton: React.FC<SkeletonProps> = ({ count = 1, className }) => {
  if (count > 1) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonBox key={i} className={className || 'h-40 w-full'} />
        ))}
      </div>
    )
  }
  return <SkeletonBox className={className || 'h-40 w-full'} />
}

export const LawyerCardSkeleton: React.FC = () => (
  <div className="bg-white border border-[#E8E8E8] rounded-2xl p-6 animate-pulse shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
    <div className="flex items-start justify-between mb-4">
      <div className="space-y-2">
        <div className="h-5 w-40 bg-[#F5F5F5] rounded-lg" />
        <div className="h-4 w-56 bg-[#F5F5F5] rounded-lg" />
      </div>
      <div className="h-6 w-28 bg-[#F5F5F5] rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-[#F5F5F5] rounded-xl" />
      ))}
    </div>
    <div className="flex gap-2 mb-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-6 w-20 bg-[#F5F5F5] rounded-full" />
      ))}
    </div>
    <div className="h-9 w-24 bg-[#F5F5F5] rounded-xl" />
  </div>
)
