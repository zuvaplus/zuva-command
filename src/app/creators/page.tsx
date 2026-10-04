import { Suspense } from 'react'
import CreatorsClient from '@/components/creators/CreatorsClient'
import { fetchAllCreators } from '@/lib/creatorData'
import { errorMessage } from '@/lib/creatorInput'
import type { CommandCreator } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function CreatorsPage() {
  let creators: CommandCreator[] = []
  let loadError: string | null = null
  try {
    creators = await fetchAllCreators()
  } catch (error) {
    // Shown on the page (e.g. the migration hasn't been run yet) instead of
    // an empty list that looks like "no creators".
    loadError = `Could not load creators: ${errorMessage(error)}`
  }

  return (
    <Suspense fallback={<div className="h-screen" style={{ backgroundColor: '#0A0A0A' }} />}>
      <CreatorsClient initialCreators={creators} loadError={loadError} />
    </Suspense>
  )
}
