import type { Finding } from '@ss/rulebooks'

export interface ReportMeta {
  module: string
  moduleVersion: string
  moduleTitle: string
  clientName: string
  /** ISO timestamp. */
  generatedAt: string
}

/** The shared report schema every audit module renders through (S4, plan §3). */
export interface Report {
  meta: ReportMeta
  findings: Finding[]
}
