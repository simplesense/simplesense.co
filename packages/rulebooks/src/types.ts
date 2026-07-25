/**
 * Generic rulebook engine types (COMPOUND_ENGINEERING_PLAN.md §2.1). A rulebook is a
 * named, versioned set of rules; each rule is DATA (citation, remediation template,
 * `addedBecause`) plus a pure detection function. New detections are new rule files,
 * never edits buried in a report generator — the rulebook itself is the memory.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Citation {
  /** e.g. an internal benchmark/methodology name, or (legal-adjacent modules) a statute/guide reference. */
  label: string
  url?: string
}

export interface Evidence {
  /** Human-readable description of what was observed. */
  summary: string
  /** The raw computed value(s) this finding is grounded in — always traceable to input data.
   *  `undefined` is allowed because different branches of a rule's `detect` legitimately
   *  populate different metric keys (e.g. a "no gap" branch omits detail keys a "gap found"
   *  branch includes). */
  metrics: Record<string, number | string | boolean | null | undefined>
}

export interface DollarFrame {
  low: number
  high: number
  /** Plain-language basis for the range — never a number without a stated basis. */
  basis: string
}

/** What a rule's `detect` function returns for one snapshot. */
export interface DetectionResult {
  status: 'triggered' | 'insufficient'
  /** Required when status === 'triggered'. */
  evidence?: Evidence
  /** Required when status === 'insufficient' — why the rule couldn't run (grounding: never guess). */
  insufficientReason?: string
  /** Only present when the rule can compute a range from real data — never fabricated. */
  dollarFrame?: DollarFrame
  /** The specific next step, interpolated with this run's real numbers. Required when triggered. */
  action?: string
  /**
   * Optional pass/fail discriminator for a `triggered` finding — was this check clean,
   * or did it surface a real gap? Most modules (M8, M5) only ever render findings as
   * narrative text and don't need this. M2 AgentReady's free scanner needs a numeric
   * score, so its rules set this explicitly rather than the score computation
   * fragile-string-matching the `action` text for a "no gap" prefix. Undefined for any
   * rule that doesn't set it — never inferred.
   */
  passed?: boolean
}

/** A finding is a rule's static metadata merged with one run's DetectionResult. */
export interface Finding extends DetectionResult {
  ruleId: string
  title: string
  severity: Severity
  citation: Citation
  remediationTemplate: string
  ruleVersion: string
  addedBecause: string
}

export interface Rule<TSnapshot> {
  id: string
  title: string
  severity: Severity
  citation: Citation
  /** Static template describing the general remediation category (the specific `action` on the
   *  Finding carries the real numbers). */
  remediationTemplate: string
  /** Semver — bump on any change to detection logic or thresholds. */
  version: string
  /** The delivery, mis-parse, or complaint that created this rule. Required, not decorative. */
  addedBecause: string
  /** Pure. Must never throw on missing/partial data — return `status: 'insufficient'` instead. */
  detect(snapshot: TSnapshot): DetectionResult
}

export interface Rulebook<TSnapshot> {
  module: string
  /** Semver — bump on any rule added/removed/changed. */
  version: string
  rules: Rule<TSnapshot>[]
}
