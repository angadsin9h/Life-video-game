import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LifeDimension {
  key: string
  label: string
  emoji: string
  color: string
  route: string
  score: number | null      // 0-100
  lastDate: string | null   // ISO date
  totalEntries: number
  loggedToday: boolean
  trend: 'up' | 'down' | 'flat' | 'unknown'
}

export interface FeedItem {
  emoji: string
  label: string
  color: string
  summary: string
  time: string
  route: string
}

export interface LifeDataResult {
  dimensions: LifeDimension[]
  overallScore: number
  loggedToday: number
  totalDimensions: number
  strongestArea: LifeDimension | null
  weakestArea: LifeDimension | null
  mostNeglected: LifeDimension | null
  todayFeed: FeedItem[]
}

// ─── Dimension Config ─────────────────────────────────────────────────────────

interface DimConfig {
  key: string
  label: string
  emoji: string
  scoreField: string
  color: string
  route: string
}

export const DIMS: DimConfig[] = [
  { key: 'mindful_sleep_log',       label: 'Sleep',       emoji: '🌙', scoreField: 'sleepScore',        color: '#6366f1', route: '/mindful-sleep'      },
  { key: 'energy_budget_log',       label: 'Energy',      emoji: '⚡', scoreField: 'energyAfter',       color: '#f59e0b', route: '/energy-budget'       },
  { key: 'daily_excellence_log',    label: 'Excellence',  emoji: '⭐', scoreField: 'excellenceScore',   color: '#eab308', route: '/daily-excellence'    },
  { key: 'growth_mindset_log',      label: 'Growth',      emoji: '🌱', scoreField: 'growthScore',        color: '#22c55e', route: '/growth-mindset'      },
  { key: 'social_intelligence_log', label: 'Social',      emoji: '🌐', scoreField: 'socialScore',        color: '#3b82f6', route: '/social-intelligence' },
  { key: 'willpower_log',           label: 'Willpower',   emoji: '🔥', scoreField: 'willpowerScore',     color: '#ef4444', route: '/willpower-log'       },
  { key: 'joy_design_log',          label: 'Joy',         emoji: '☀️', scoreField: 'joyScore',           color: '#f97316', route: '/joy-design'          },
  { key: 'inner_peace_log',         label: 'Peace',       emoji: '🕊️', scoreField: 'peaceScore',         color: '#a855f7', route: '/inner-peace-log'     },
  { key: 'purpose_log',             label: 'Purpose',     emoji: '🧭', scoreField: 'alignmentScore',     color: '#10b981', route: '/purpose-log'         },
  { key: 'physical_peak_log',       label: 'Body',        emoji: '💪', scoreField: 'performanceScore',   color: '#22c55e', route: '/physical-peak'       },
  { key: 'neuroplasticity_log',     label: 'Mind',        emoji: '🧠', scoreField: 'sharpnessScore',     color: '#6366f1', route: '/neuroplasticity'     },
  { key: 'life_review_log',         label: 'Life Review', emoji: '📊', scoreField: 'satisfactionScore',  color: '#3b82f6', route: '/life-review'         },
  { key: 'resilient_thinking_log',  label: 'Resilience',  emoji: '🛡️', scoreField: 'resilienceScore',    color: '#ec4899', route: '/resilient-thinking'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeParseArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function normalizeScore(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const n = Number(raw)
  if (isNaN(n)) return null
  const clamped = n <= 10 ? n * 10 : n
  return Math.min(100, Math.max(0, clamped))
}

function getTrend(scores: number[]): 'up' | 'down' | 'flat' | 'unknown' {
  if (scores.length < 3) return 'unknown'
  const recent = scores.slice(-3)
  const prev = scores.slice(-6, -3)
  if (prev.length < 3) return 'unknown'
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length
  const avgPrev = prev.reduce((a, b) => a + b, 0) / prev.length
  const diff = avgRecent - avgPrev
  if (diff > 5) return 'up'
  if (diff < -5) return 'down'
  return 'flat'
}

interface LogEntry {
  date?: string
  createdAt?: string
  [key: string]: unknown
}

function buildDimension(cfg: DimConfig, today: string): LifeDimension {
  const entries = safeParseArray<LogEntry>(cfg.key)

  // Sort by date ascending
  const sorted = [...entries].sort((a, b) => {
    const da = a.date ?? a.createdAt ?? ''
    const db = b.date ?? b.createdAt ?? ''
    return da.localeCompare(db)
  })

  const totalEntries = sorted.length
  const lastEntry = sorted[sorted.length - 1] ?? null
  const lastDate = lastEntry ? (lastEntry.date ?? lastEntry.createdAt ?? null) as string | null : null
  const loggedToday = sorted.some(e => {
    const d = (e.date ?? e.createdAt ?? '') as string
    return d.startsWith(today)
  })

  // Scores for trend
  const allScores: number[] = sorted
    .map(e => normalizeScore(e[cfg.scoreField]))
    .filter((s): s is number => s !== null)

  const trend = getTrend(allScores)
  const latestScore = allScores.length > 0 ? allScores[allScores.length - 1] : null

  return {
    key: cfg.key,
    label: cfg.label,
    emoji: cfg.emoji,
    color: cfg.color,
    route: cfg.route,
    score: latestScore,
    lastDate: lastDate ? lastDate.split('T')[0] : null,
    totalEntries,
    loggedToday,
    trend,
  }
}

function buildTodayFeed(dims: LifeDimension[], today: string): FeedItem[] {
  const feed: FeedItem[] = []

  DIMS.forEach(cfg => {
    const dim = dims.find(d => d.key === cfg.key && d.label === cfg.label)
    if (!dim?.loggedToday) return
    const entries = safeParseArray<LogEntry>(cfg.key)
    const todayEntries = entries.filter(e => {
      const d = (e.date ?? e.createdAt ?? '') as string
      return d.startsWith(today)
    })
    const latest = todayEntries[todayEntries.length - 1]
    if (!latest) return
    const scoreRaw = normalizeScore(latest[cfg.scoreField])
    const score = scoreRaw !== null ? Math.round(scoreRaw) : null
    const time = (() => {
      const ts = (latest.createdAt ?? latest.date ?? '') as string
      if (!ts) return ''
      try {
        const d = new Date(ts)
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      } catch { return '' }
    })()

    feed.push({
      emoji: cfg.emoji,
      label: cfg.label,
      color: cfg.color,
      summary: score !== null ? `Score: ${score}/100` : 'Logged today',
      time,
      route: cfg.route,
    })
  })

  return feed
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLifeData(): LifeDataResult {
  const [result, setResult] = useState<LifeDataResult>(() => compute())

  function compute(): LifeDataResult {
    const today = new Date().toISOString().split('T')[0]

    // Deduplicate DIMS by key+label combination to avoid double-counting willpower
    const seen = new Set<string>()
    const uniqueDims = DIMS.filter(cfg => {
      const id = `${cfg.key}:${cfg.label}`
      if (seen.has(id)) return false
      seen.add(id)
      return true
    })

    const dimensions: LifeDimension[] = uniqueDims.map(cfg => buildDimension(cfg, today))

    const scoredDims = dimensions.filter(d => d.score !== null)
    const overallScore = scoredDims.length > 0
      ? Math.round(scoredDims.reduce((sum, d) => sum + (d.score ?? 0), 0) / scoredDims.length)
      : 0

    const loggedToday = dimensions.filter(d => d.loggedToday).length

    const strongestArea = scoredDims.length > 0
      ? scoredDims.reduce((best, d) => (d.score ?? 0) > (best.score ?? 0) ? d : best, scoredDims[0])
      : null

    const weakestArea = scoredDims.length > 0
      ? scoredDims.reduce((worst, d) => (d.score ?? 100) < (worst.score ?? 100) ? d : worst, scoredDims[0])
      : null

    // Most neglected: longest gap from today
    const withDates = dimensions.filter(d => d.lastDate !== null)
    const mostNeglected: LifeDimension | null = withDates.length > 0
      ? withDates.reduce((oldest, d) => {
          const a = d.lastDate ?? ''
          const b = oldest.lastDate ?? ''
          return a < b ? d : oldest
        }, withDates[0])
      : (dimensions.find(d => d.totalEntries === 0) ?? null)

    const todayFeed = buildTodayFeed(dimensions, today)

    return {
      dimensions,
      overallScore,
      loggedToday,
      totalDimensions: dimensions.length,
      strongestArea,
      weakestArea,
      mostNeglected,
      todayFeed,
    }
  }

  useEffect(() => {
    setResult(compute())
  }, [])

  return result
}
