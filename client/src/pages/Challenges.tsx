import { useEffect, useState } from 'react'
import axios from 'axios'
import { Swords, CheckCircle2, Circle, XCircle, Plus, Flame } from 'lucide-react'

interface Template {
  id: string
  title: string
  emoji: string
  duration: number
  description: string
  requirement: string
  rarity: string
  reward_xp: number
  color: string
}

interface DailyResult {
  date: string
  passed: boolean
}

interface Progress {
  daysCompleted: number
  daysPassed: number
  daysTotal: number
  dailyResults: DailyResult[]
}

interface ActiveChallenge {
  id: number
  challenge_id: string
  title: string
  start_date: string
  end_date: string
  completed: number
  abandoned: number
  template: Template | null
  progress: Progress
}

const RARITY_COLORS: Record<string, string> = {
  common: 'text-slate-400 border-slate-600',
  uncommon: 'text-green-400 border-green-600',
  rare: 'text-blue-400 border-blue-600',
  epic: 'text-violet-400 border-violet-600',
  legendary: 'text-yellow-400 border-yellow-500',
}

const COLOR_MAP: Record<string, string> = {
  green: 'bar-health',
  cyan: 'bar-mind',
  violet: 'bar-work',
  yellow: 'bar-social',
  orange: 'bar-growth',
}

export default function Challenges() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [active, setActive] = useState<ActiveChallenge[]>([])
  const [history, setHistory] = useState<ActiveChallenge[]>([])
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [tab, setTab] = useState<'browse' | 'active' | 'history'>('browse')

  const load = async () => {
    const [tRes, aRes, hRes] = await Promise.all([
      axios.get<Template[]>('/api/challenges/templates'),
      axios.get<ActiveChallenge[]>('/api/challenges/active'),
      axios.get<ActiveChallenge[]>('/api/challenges/history'),
    ])
    setTemplates(tRes.data)
    setActive(aRes.data)
    setHistory(hRes.data)
  }

  useEffect(() => { load().catch(console.error) }, [])

  const enroll = async (id: string) => {
    setEnrolling(id)
    try {
      await axios.post('/api/challenges/enroll', { challenge_id: id })
      await load()
      setTab('active')
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        alert('Already enrolled!')
      }
    } finally {
      setEnrolling(null)
    }
  }

  const abandon = async (id: number) => {
    if (!confirm('Abandon this challenge? Progress will be lost.')) return
    await axios.delete(`/api/challenges/${id}`)
    await load()
  }

  const isEnrolled = (templateId: string) => active.some(a => a.challenge_id === templateId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Swords className="w-8 h-8 text-red-400" />
          Challenges
        </h1>
        <p className="text-slate-400 mt-1">Multi-day quests that push you to the next level</p>
      </div>

      {/* Active challenge summary */}
      {active.length > 0 && (
        <div className="flex items-center gap-3 bg-violet-900/30 border border-violet-500/40 rounded-xl px-4 py-3">
          <Flame className="w-5 h-5 text-violet-400 animate-streak-fire flex-shrink-0" />
          <div className="text-sm text-violet-300">
            <span className="font-bold">{active.length} active challenge{active.length > 1 ? 's' : ''}</span> — log your activities to make progress!
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['browse', 'active', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-violet-600 text-white border border-violet-500' : 'bg-slate-700 text-slate-400 border border-slate-600 hover:text-slate-200'
            }`}
          >
            {t === 'browse' ? 'Browse' : t === 'active' ? `Active (${active.length})` : `History (${history.length})`}
          </button>
        ))}
      </div>

      {/* Browse tab */}
      {tab === 'browse' && (
        <div className="space-y-3">
          {templates.map(t => {
            const enrolled = isEnrolled(t.id)
            const rarityClass = RARITY_COLORS[t.rarity] ?? RARITY_COLORS.common
            return (
              <div
                key={t.id}
                className={`game-card p-5 border transition-all ${enrolled ? 'border-violet-500/50 bg-violet-500/5' : 'border-slate-700 hover:border-slate-600'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0 animate-float">{t.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-200 text-lg">{t.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${rarityClass}`}>
                        {t.rarity}
                      </span>
                      <span className="text-xs text-slate-500">{t.duration} days</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{t.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-yellow-400 font-semibold">+{t.reward_xp.toLocaleString()} XP</span>
                      <span className="text-slate-500">on completion</span>
                    </div>
                  </div>
                  <button
                    onClick={() => !enrolled && enroll(t.id)}
                    disabled={enrolled || enrolling === t.id}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      enrolled
                        ? 'bg-violet-900/40 text-violet-400 border border-violet-500/40 cursor-default'
                        : 'game-btn-primary hover:scale-105'
                    }`}
                  >
                    {enrolled ? (
                      <><CheckCircle2 className="w-4 h-4" /> Enrolled</>
                    ) : enrolling === t.id ? (
                      'Starting...'
                    ) : (
                      <><Plus className="w-4 h-4" /> Start</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Active tab */}
      {tab === 'active' && (
        <div className="space-y-4">
          {active.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No active challenges.</p>
              <button onClick={() => setTab('browse')} className="text-violet-400 text-sm mt-2 hover:underline">Browse challenges →</button>
            </div>
          ) : active.map(c => {
            const { daysCompleted, daysPassed, daysTotal, dailyResults } = c.progress
            const pct = daysTotal > 0 ? Math.round((daysCompleted / daysTotal) * 100) : 0
            const barColor = COLOR_MAP[c.template?.color ?? ''] ?? 'bar-work'
            const daysLeft = daysTotal - daysPassed
            return (
              <div key={c.id} className="game-card p-5 border border-violet-500/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.template?.emoji ?? '⚔️'}</span>
                    <div>
                      <div className="font-bold text-slate-200">{c.title}</div>
                      <div className="text-xs text-slate-500">{c.start_date} → {c.end_date}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => abandon(c.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                    title="Abandon challenge"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-2 flex justify-between text-xs text-slate-400">
                  <span>{daysCompleted}/{daysTotal} days completed</span>
                  <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Challenge ended'}</span>
                </div>
                <div className="stat-bar h-2 mb-4">
                  <div className={`stat-bar-fill ${barColor} transition-all duration-1000`} style={{ width: `${pct}%` }} />
                </div>

                {/* Daily dot grid */}
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: daysTotal }, (_, i) => {
                    const result = dailyResults[i]
                    const isFuture = i >= daysPassed
                    return (
                      <div
                        key={i}
                        title={result ? `${result.date}: ${result.passed ? '✓' : '✗'}` : `Day ${i + 1}`}
                        className={`w-5 h-5 rounded-sm transition-all ${
                          isFuture
                            ? 'bg-slate-700 border border-slate-600'
                            : result?.passed
                            ? 'bg-green-500'
                            : 'bg-red-800/60 border border-red-700/40'
                        }`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> Completed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-800/60 border border-red-700/40 inline-block" /> Missed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-700 border border-slate-600 inline-block" /> Future</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No completed or past challenges yet.</p>
            </div>
          ) : history.map(c => {
            const { daysCompleted, daysTotal } = c.progress
            const success = daysCompleted === daysTotal
            return (
              <div
                key={c.id}
                className={`game-card p-4 flex items-center gap-3 border ${
                  success ? 'border-green-600/40 bg-green-900/10' : c.abandoned ? 'border-red-700/30 opacity-60' : 'border-slate-700'
                }`}
              >
                <span className="text-2xl">{c.template?.emoji ?? '⚔️'}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-200">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.start_date} · {daysCompleted}/{daysTotal} days</div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${
                  success ? 'bg-green-800 text-green-300'
                  : c.abandoned ? 'bg-slate-700 text-slate-400'
                  : 'bg-red-900 text-red-300'
                }`}>
                  {success ? '✓ Completed' : c.abandoned ? 'Abandoned' : '✗ Failed'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
