import { GridSkeleton, LoadingAnnounce, PageHeaderSkeleton } from '@/components/skeletons'

export default function Loading() {
  return (
    <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
      <LoadingAnnounce label="Loading" />
      <PageHeaderSkeleton />
      <GridSkeleton />
    </main>
  )
}
