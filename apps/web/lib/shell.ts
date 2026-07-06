import { cache } from 'react'
import { prisma, DEMO } from '@ss/db'
import { openRecommendations } from '@ss/jobs'
import { llmConfig } from '@ss/config'
import { getSession } from './auth'
import { resolveActiveStore } from './store-resolve'

export type ShellSyncStatus = 'DEMO' | 'PENDING' | 'SYNCING' | 'READY' | 'ERROR'

export interface ShellContext {
  storeName: string
  isDemo: boolean
  syncStatus: ShellSyncStatus
  openMoves: number
  model: string
}

/**
 * The chrome data every app screen's AppShell needs — resolved ONCE per request (React cache),
 * so the topbar store name, the sync pill, and the nav badge are consistent and correct on
 * every page instead of each page passing its own (often wrong: hardcoded demo name, openMoves=0).
 */
export const getShellContext = cache(async (): Promise<ShellContext> => {
  const { orgId } = await getSession()
  const { store, isDemo } = await resolveActiveStore(orgId)
  const open = await openRecommendations(prisma, store.id)
  const cfg = llmConfig()
  return {
    storeName: isDemo ? DEMO.storeName : store.shopDomain,
    isDemo,
    syncStatus: isDemo ? 'DEMO' : store.syncStatus,
    openMoves: open.length,
    model: cfg.hasApiKey ? cfg.model : 'mock',
  }
})
