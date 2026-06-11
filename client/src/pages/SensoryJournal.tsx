import React, { useState, useEffect } from 'react'
import { Eye, Music, Hand, Apple, Wind, Activity, Sparkles, Plus, X, Star, Shuffle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Sense = 'sight' | 'sound' | 'touch' | 'taste' | 'smell' | 'movement' | 'inner'

type SensoryEntry = {
  id: string
  date: string
  sense: Sense
  description: string
  intensity: number
  setting: string
  mood: number
  intention: boolean
  gratitude: string
}

const STORAGE_KEY = 'lq-sensoryjournal'

const SENSE_CONFIG: Record<Sense, {
  label: string
  color: string
  bg: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  prompt: string
}> = {
  sight:    { label: 'Sight',    color: '#f59e0b', bg: '#78350f',  Icon: Eye,      prompt: 'What did you see that moved you?' },
  sound:    { label: 'Sound',    color: '#3b82f6', bg: '#1e3a5f',  Icon: Music,    prompt: 'What did you hear that resonated?' },
  touch:    { label: 'Touch',    color: '#f43f5e', bg: '#4c0519',  Icon: Hand,     prompt: 'What did you feel against your skin or body?' },
  taste:    { label: 'Taste',    color: '#22c55e', bg: '#14532d',  Icon: Apple,    prompt: 'What flavour or texture delighted you?' },
  smell:    { label: 'Smell',    color: '#a855f7', bg: '#3b0764',  Icon: Wind,     prompt: 'What scent caught your attention?' },
  movement: { label: 'Movement', color: '#fb923c', bg: '#431407',  Icon: Activity, prompt: 'What movement did your body experience?' },
  inner:    { label: 'Inner',    color: '#e2e8f0', bg: '#1e293b',  Icon: Sparkles, prompt: 'What inner sensation or feeling arose?' },
}

const SENSES: Sense[] = ['sight', 'sound', 'touch', 'taste', 'smell', 'movement', 'inner']

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function AlivenessScore(entries: SensoryEntry[]): number {
  if (entries.length === 0) return 0
  const avgIntensity = entries.reduce((s, e) => s + e.intensity, 0) / entries.length
  const days = new Set(entries.map(e => e.date)).size
  const recentDays = Math.min(days, 30)
  return Math.min(100, Math.round(avgIntensity * Math.log1p(recentDays) * 3))
}

type BubbleEntry = SensoryEntry & { bx: number; by: number; r: number }

function buildBubbles(entries: SensoryEntry[]): BubbleEntry[] {
  const W = 600
  const H = 340
  const placed: BubbleEntry[] = []
  const sorted = [...entries].sort((a, b) => b.intensity - a.intensity)
  const attempts = 120
  for (const e of sorted) {
    const r = 12 + e.intensity * 4
    let best: { bx: number; by: number } | null = null
    for (let t = 0; t < attempts; t++) {
      const bx = r + Math.random() * (W - 2 * r)
      const by = r + Math.random() * (H - 2 * r)
      const overlap = placed.some(p => {
        const dx = p.bx - bx
        const dy = p.by - by
        return Math.sqrt(dx * dx + dy * dy) < p.r + r + 3
      })
      if (!overlap) { best = { bx, by }; break }
    }
    if (best) placed.push({ ...e, ...best, r })
  }
  return placed
}

export default function SensoryJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SensoryEntry[]>([])
  const [tab, setTab] = useState<'capture' | 'garden' | 'balance' | 'best'>('garden')
  const [showForm, setShowForm] = useState(false)
  const [selectedBubble, setSelectedBubble] = useState<SensoryEntry | null>(null)
  const [bubbles, setBubbles] = useState<BubbleEntry[]>([])

  const [form, setForm] = useState<Omit<SensoryEntry, 'id'>>({
    date: todayISO(),
    sense: 'sight',
    description: '',
    intensity: 7,
    setting: '',
    mood: 7,
    intention: false,
    gratitude: '',
  })

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SensoryEntry[]
        setEntries(parsed)
        setBubbles(buildBubbles(parsed))
      }
    } catch { /**/ }
  }, [])

  const persist = (updated: SensoryEntry[]) => {
    setEntries(updated)
    setBubbles(buildBubbles(updated))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submitEntry = () => {
    if (!form.description.trim()) return
    const entry: SensoryEntry = { ...form, id: newId() }
    persist([entry, ...entries])
    toastSuccess('Moment captured', `${SENSE_CONFIG[form.sense].label} — intensity ${form.intensity}`)
    setShowForm(false)
    setForm({ date: todayISO(), sense: 'sight', description: '', intensity: 7, setting: '', mood: 7, intention: false, gratitude: '' })
    setTab('garden')
  }

  const deleteEntry = (id: string) => {
    persist(entries.filter(e => e.id !== id))
    if (selectedBubble?.id === id) setSelectedBubble(null)
  }

  const senseCounts: Record<Sense, number> = {
    sight: 0, sound: 0, touch: 0, taste: 0, smell: 0, movement: 0, inner: 0,
  }
  entries.forEach(e => { senseCounts[e.sense] = (senseCounts[e.sense] ?? 0) + 1 })
  const maxCount = Math.max(1, ...Object.values(senseCounts))
  const totalEntries = entries.length
  const aliveness = AlivenessScore(entries)
  const top5 = [...entries].sort((a, b) => b.intensity - a.intensity).slice(0, 5)

  const donutData: { sense: Sense; count: number; startAngle: number; endAngle: number }[] = []
  let angle = -Math.PI / 2
  SENSES.forEach(sense => {
    const count = senseCounts[sense]
    const sweep = totalEntries > 0 ? (count / totalEntries) * 2 * Math.PI : 0
    donutData.push({ sense, count, startAngle: angle, endAngle: angle + sweep })
    angle += sweep
  })

  function arcPath(cx: number, cy: number, r: number, startA: number, endA: number): string {
    const x1 = cx + r * Math.cos(startA)
    const y1 = cy + r * Math.sin(startA)
    const x2 = cx + r * Math.cos(endA)
    const y2 = cy + r * Math.sin(endA)
    const large = endA - startA > Math.PI ? 1 : 0
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
              <Sparkles className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>
                Sensory Journal
              </h1>
              <p className="text-sm text-slate-400">Practice mindful sensory awareness</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setTab('capture') }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Capture Moment
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalEntries}</div>
            <div className="text-xs text-slate-400 mt-1">Moments Captured</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{aliveness}</div>
            <div className="text-xs text-slate-400 mt-1">Sensory Aliveness Score</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">
              {entries.length > 0 ? (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1) : '—'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Avg Intensity</div>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl w-fit">
          {(['garden', 'balance', 'best', 'capture'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'garden' ? '🌺 Garden' : t === 'balance' ? '⚖️ Balance' : t === 'best' ? '✨ Best' : '+ Capture'}
            </button>
          ))}
        </div>

        {tab === 'garden' && (
          <div className="game-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-purple-400">Sensory Garden</h2>
              <button
                onClick={() => setBubbles(buildBubbles(entries))}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <Shuffle className="w-3 h-3" /> Rearrange
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Circles sized by intensity — click to explore.</p>
            {entries.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Your sensory garden is empty.<br />Capture your first moment!</p>
              </div>
            ) : (
              <div className="relative" style={{ paddingBottom: '56.67%' }}>
                <svg
                  viewBox="0 0 600 340"
                  className="absolute inset-0 w-full h-full"
                  style={{ background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)', borderRadius: 12 }}
                >
                  {bubbles.map(b => {
                    const cfg = SENSE_CONFIG[b.sense]
                    return (
                      <g key={b.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedBubble(b)}>
                        <circle
                          cx={b.bx} cy={b.by} r={b.r}
                          fill={cfg.color}
                          fillOpacity={0.18}
                          stroke={cfg.color}
                          strokeWidth={1.5}
                          strokeOpacity={0.7}
                        />
                        <circle cx={b.bx} cy={b.by} r={3} fill={cfg.color} fillOpacity={0.9} />
                        {b.r > 22 && (
                          <text x={b.bx} y={b.by + b.r + 11} textAnchor="middle" fill={cfg.color} fontSize={8} fillOpacity={0.7}>
                            {b.description.slice(0, 18)}{b.description.length > 18 ? '…' : ''}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>
            )}

            {selectedBubble && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.75)' }}
                onClick={() => setSelectedBubble(null)}
              >
                <div
                  className="game-card p-6 max-w-sm w-full relative"
                  style={{ borderColor: SENSE_CONFIG[selectedBubble.sense].color + '60' }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelectedBubble(null)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    {(() => {
                      const SIcon = SENSE_CONFIG[selectedBubble.sense].Icon
                      return <SIcon className="w-5 h-5" style={{ color: SENSE_CONFIG[selectedBubble.sense].color }} />
                    })()}
                    <span className="font-semibold" style={{ color: SENSE_CONFIG[selectedBubble.sense].color }}>
                      {SENSE_CONFIG[selectedBubble.sense].label}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">{selectedBubble.date}</span>
                  </div>
                  <p className="text-white font-medium mb-2">{selectedBubble.description}</p>
                  {selectedBubble.setting && <p className="text-xs text-slate-400 mb-2">📍 {selectedBubble.setting}</p>}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-sm"
                          style={{ background: i < selectedBubble.intensity ? SENSE_CONFIG[selectedBubble.sense].color : '#1e293b' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">Intensity {selectedBubble.intensity}/10</span>
                  </div>
                  {selectedBubble.gratitude && (
                    <p className="text-xs text-slate-300 italic border-l-2 border-purple-500 pl-2">
                      "{selectedBubble.gratitude}"
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-slate-500">
                      {selectedBubble.intention ? '✦ Intentional' : '✧ Spontaneous'} · Mood {selectedBubble.mood}/10
                    </span>
                    <button
                      onClick={() => deleteEntry(selectedBubble.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'balance' && (
          <div className="space-y-6">
            <div className="game-card p-6">
              <h2 className="text-lg font-semibold text-purple-400 mb-4">Sense Balance</h2>
              <div className="flex items-center gap-8">
                <svg viewBox="-1 -1 102 102" className="w-48 h-48 flex-shrink-0">
                  {totalEntries === 0 ? (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="20" />
                  ) : (
                    donutData.map(({ sense, count, startAngle, endAngle }) => {
                      if (count === 0) return null
                      const path = arcPath(50, 50, 40, startAngle, endAngle)
                      return (
                        <path
                          key={sense}
                          d={path}
                          fill={SENSE_CONFIG[sense].color}
                          fillOpacity={0.8}
                          stroke="#030712"
                          strokeWidth={1}
                        />
                      )
                    })
                  )}
                  <circle cx="50" cy="50" r="24" fill="#030712" />
                  <text x="50" y="54" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="bold">
                    {totalEntries}
                  </text>
                </svg>
                <div className="flex-1 space-y-2">
                  {SENSES.map(sense => {
                    const cfg = SENSE_CONFIG[sense]
                    const SIcon = cfg.Icon
                    const count = senseCounts[sense]
                    const pct = Math.round((count / Math.max(1, totalEntries)) * 100)
                    return (
                      <div key={sense} className="flex items-center gap-2">
                        <SIcon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
                        <span className="text-xs text-slate-400 w-16">{cfg.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(count / maxCount) * 100}%`, background: cfg.color }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                        <span className="text-xs text-slate-600 w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="game-card p-6">
              <h2 className="text-sm font-semibold text-slate-400 mb-4">Mindfulness Score Breakdown</h2>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-black" style={{ fontFamily: 'Orbitron, monospace', background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {aliveness}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Sensory Aliveness Score</div>
                </div>
                <div className="flex-1 space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between">
                    <span>Avg intensity</span>
                    <span className="text-white">{entries.length > 0 ? (entries.reduce((s, e) => s + e.intensity, 0) / entries.length).toFixed(1) : '—'}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Days logged</span>
                    <span className="text-white">{new Set(entries.map(e => e.date)).size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Intentional moments</span>
                    <span className="text-white">{entries.filter(e => e.intention).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Senses explored</span>
                    <span className="text-white">{SENSES.filter(s => senseCounts[s] > 0).length}/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'best' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-purple-400 mb-2">Top 5 Moments</h2>
            {top5.length === 0 ? (
              <div className="game-card p-8 text-center text-slate-600">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No entries yet. Capture your first sensory moment!</p>
              </div>
            ) : (
              top5.map((e, i) => {
                const cfg = SENSE_CONFIG[e.sense]
                const SIcon = cfg.Icon
                return (
                  <div
                    key={e.id}
                    className="game-card p-5 border-l-4"
                    style={{ borderLeftColor: cfg.color }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: cfg.color + '20', color: cfg.color }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SIcon className="w-4 h-4" style={{ color: cfg.color }} />
                          <span className="text-sm font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                          <span className="text-xs text-slate-500">{e.date}</span>
                          <span className="ml-auto text-xs font-bold text-white">{e.intensity}/10</span>
                        </div>
                        <p className="text-white font-medium mb-1">{e.description}</p>
                        {e.setting && <p className="text-xs text-slate-400 mb-1">📍 {e.setting}</p>}
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: 10 }).map((_, j) => (
                            <div
                              key={j}
                              className="h-1.5 flex-1 rounded-full"
                              style={{ background: j < e.intensity ? cfg.color : '#1e293b' }}
                            />
                          ))}
                        </div>
                        {e.gratitude && (
                          <p className="text-xs text-slate-300 italic border-l-2 pl-2" style={{ borderLeftColor: cfg.color + '60' }}>
                            "{e.gratitude}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 'capture' && (
          <div className="game-card p-6">
            <h2 className="text-lg font-semibold text-purple-400 mb-4">Capture a Sensory Moment</h2>

            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-2 block">Which sense?</label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {SENSES.map(sense => {
                  const cfg = SENSE_CONFIG[sense]
                  const SIcon = cfg.Icon
                  return (
                    <button
                      key={sense}
                      onClick={() => setForm(f => ({ ...f, sense }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        form.sense === sense ? 'text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                      style={form.sense === sense ? { borderColor: cfg.color, background: cfg.bg + 'cc', color: cfg.color } : {}}
                    >
                      <SIcon className="w-5 h-5" />
                      <span className="text-xs">{cfg.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2 italic">{SENSE_CONFIG[form.sense].prompt}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What did you notice?</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={SENSE_CONFIG[form.sense].prompt}
                  className="game-input w-full resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  Intensity: <span style={{ color: SENSE_CONFIG[form.sense].color }}>{form.intensity}/10</span>
                </label>
                <input
                  type="range" min={1} max={10} value={form.intensity}
                  onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: SENSE_CONFIG[form.sense].color }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Where were you?</label>
                  <input
                    type="text"
                    value={form.setting}
                    onChange={e => setForm(f => ({ ...f, setting: e.target.value }))}
                    placeholder="Setting / location"
                    className="game-input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Mood: {form.mood}/10</label>
                  <input
                    type="range" min={1} max={10} value={form.mood}
                    onChange={e => setForm(f => ({ ...f, mood: Number(e.target.value) }))}
                    className="w-full accent-pink-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Gratitude — what did this make you appreciate?</label>
                <input
                  type="text"
                  value={form.gratitude}
                  onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
                  placeholder="I'm grateful for..."
                  className="game-input w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, intention: !f.intention }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                    form.intention
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${form.intention ? 'bg-purple-500 border-purple-500' : 'border-slate-600'}`}>
                    {form.intention ? '✓' : ''}
                  </span>
                  Intentional (vs spontaneous)
                </button>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="game-input text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitEntry}
                  disabled={!form.description.trim()}
                  className="flex-1 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: form.description.trim() ? SENSE_CONFIG[form.sense].color : '#334155' }}
                >
                  Save Moment
                </button>
                <button
                  onClick={() => setTab('garden')}
                  className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
