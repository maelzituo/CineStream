import React from 'react';

export function SkeletonShelf({ title, layout = 'poster' }: { title: string; layout?: 'poster' | 'landscape' }) {
  return (
    <section className="relative space-y-3 select-none mb-12">
      {/* Shelf Header Skeleton */}
      <div className="flex justify-between items-center px-6 md:px-16">
        <div className="h-6 w-48 bg-white/10 rounded-md animate-pulse"></div>
      </div>

      {/* Carousel Wrapper */}
      <div className="flex gap-4 overflow-hidden px-6 md:px-16 py-3 opacity-60">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`flex-none ${layout === 'poster' ? 'w-36 sm:w-44 md:w-52' : 'w-64 sm:w-72 md:w-88'}`}
          >
            {/* Image Skeleton */}
            <div
              className={`rounded-xl bg-white/5 animate-pulse ${
                layout === 'poster' ? 'aspect-[2/3]' : 'aspect-video'
              }`}
            ></div>
            
            {/* Title & Year Skeleton (only for poster) */}
            {layout === 'poster' && (
              <div className="mt-3 px-1 space-y-2">
                <div className="h-3 w-3/4 bg-white/10 rounded animate-pulse"></div>
                <div className="h-2 w-1/2 bg-white/5 rounded animate-pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
