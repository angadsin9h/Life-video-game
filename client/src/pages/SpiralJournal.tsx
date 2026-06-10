import React, { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SpiralTheme = {
  id: string
  name: string
  description: string
  firstNoticed: string
  domain: 'relationships' | 'work' | 'identity' | 'health' | 'money' | 'creativity' | 'family' | 'purpose'
  resolved: boolean
  resolution: string
}

type SpiralEntry = {
  id: string
  date: string
  themeId: string
  occurrence: string
  newLayer: string
  emotion: string
  lessonThisTime: string
  growthLevel: number
}

const STORAGE_KEY = 'lq-spiral-journal'

const DOMAINS: { key: SpiralTheme['domain']; label: string; color: string }[] = [
  { key: 'relationships', label: 'Relationships', color: '#f43f5e' },
  { key: 'work',          label: 'Work',          color: '#3b82f6' },
  { key: 'identity',      label: 'Identity',      color: '#a855f7' },
  { key: 'health',        label: 'Health',        color: '#22c55e' },
  { key: 'money',         label: 'Money',         color: '#f59e0b' },
  { key: 'creativity',    label: 'Creativity',    color: '#f97316' },
  { key: 'family',        label: 'Family',        color: '#ec4899' },
  { key: 'purpose',       label: 'Purpose',       color: '#c084fc' },
]

const DOMAIN_COLOR: Record<SpiralTheme['domain'], string> = Object.fromEntries(
  DOMAINS.map(d => [d.key, d.color])
) as Record<SpiralTheme['domain'], string>

const BLANK_THEME: Omit<SpiralTheme, 'id'> = {
  name: '',
  description: '',
  firstNoticed: new Date().toISOString().split('T')[0],
  domain: 'relationships',
  resolved: false,
  resolution: '',
}

const BLANK_ENTRY: Omit<SpiralEntry, 'id'> = {
  date: new Date().toISOString().split('T')[0],
  themeId: '',
  occurrence: '',
  newLayer: '',
  emotion: '',
  lessonThisTime: '',
  growthLevel: 5,
}

function SpiralViz({ entries, color }: { entries: SpiralEntry[]; color: string }) {
  const W = 220
  const H = 220
  const cx = W / 2
  const cy = H / 2

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-600 text-xs">
        No entries yet
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const maxR = 90
  const minR = 18

  const points = sorted.map((e, i) => {
    const t = sorted.length === 1 ? 0.5 : i / (sorted.length - 1)
    const r = minR + t * (maxR - minR)
    const angle = i * 1.35 * Math.PI - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    return { x, y, r, t, e }
  })

  const pathD = points.length > 1
    ? points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')
    : ''

  return (
    <svg width={W} height={H} className="mx-auto">
      <defs>
        <style>{`@keyframes spiralDash { to { stroke-dashoffset: 0; } }`}</style>
      </defs>
      {pathD && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeOpacity="0.35"
          strokeDasharray="4 3"
        />
      )}
      {points.map((p, i) => {
        const brightness = 0.3 + p.t * 0.7
        const r = 5 + p.t * 5
        const alpha = Math.round(brightness * 255).toString(16).padStart(2, '0')
        return (
          <g key={p.e.id}>
            <circle cx={p.x} cy={p.y} r={r} fill={`${color}${alpha}`} stroke={color} strokeWidth="1" />
            <text x={p.x} y={p.y + 3.5} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">
              {p.e.growthLevel}
            </text>
          </g>
        )
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#475569" fontSize="8">
        {sorted.length} layer{sorted.length !== 1 ? 's' : ''}
      </text>
    </svg>
  )
}

function GrowthLine({ entries, color }: { entries: SpiralEntry[]; color: string }) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < 2) return null

  const W = 260
  const H = 60
  const pad = 12

  const xs = sorted.map((_, i) => pad + (i / (sorted.length - 1)) * (W - pad * 2))
  const ys = sorted.map(e => H - pad - ((e.growthLevel - 1) / 9) * (H - pad * 2))

  const pathD = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')

  return (
    <svg width={W} height={H} className="w-full">
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={3} fill={color} />
      ))}
      <text x={pad} y={H - 2} fill="#475569" fontSize="8">early</text>
      <text x={W - pad} y={H - 2} textAnchor="end" fill="#475569" fontSize="8">now</text>
    </svg>
  )
}

export default function SpiralJournal() {
  const { toastSuccess } = useToast()
  const [themes, setThemes] = useState<SpiralTheme[]>([])
  const [entries, setEntries] = useState<SpiralEntry[]>([])
  const [showThemeForm, setShowThemeForm] = useState(false)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [themeForm, setThemeForm] = useState<Omit<SpiralTheme, 'id'>>(BLANK_THEME)
  const [entryForm, setEntryForm] = useState<Omit<SpiralEntry, 'id'>>(BLANK_ENTRY)
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      setThemes(raw.themes || [])
      setEntries(raw.entries || [])
    } catch { /**/ }
  }, [])

  const persist = (t: SpiralTheme[], e: SpiralEntry[]) => {
    setThemes(t)
    setEntries(e)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ themes: t, entries: e }))
  }

  const submitTheme = () => {
    if (!themeForm.name.trim()) return
    const theme: SpiralTheme = { id: Date.now().toString(), ...themeForm }
    persist([theme, ...themes], entries)
    setThemeForm({ ...BLANK_THEME, firstNoticed: new Date().toISOString().split('T')[0] })
    setShowThemeForm(false)
    toastSuccess('Theme added — awareness is the first step')
  }

  const submitEntry = () => {
    if (!entryForm.themeId || !entryForm.occurrence.trim()) return
    const entry: SpiralEntry = { id: Date.now().toString(), ...entryForm }
    persist(themes, [entry, ...entries])
    setEntryForm({ ...BLANK_ENTRY, date: new Date().toISOString().split('T')[0], themeId: entryForm.themeId })
    setShowEntryForm(false)
    toastSuccess('Spiral layer logged — you are growing deeper')
  }

  const toggleResolved = (id: string) => {
    persist(
      themes.map(t => t.id === id ? { ...t, resolved: !t.resolved } : t),
      entries
    )
  }

  const deleteTheme = (id: string) => {
    persist(themes.filter(t => t.id !== id), entries.filter(e => e.themeId !== id))
  }

  const deleteEntry = (id: string) => {
    persist(themes, entries.filter(e => e.id !== id))
  }

  const distillWisdom = (themeId: string): string => {
    const themeEntries = entries.filter(e => e.themeId === themeId && e.lessonThisTime.trim())
    if (!themeEntries.length) return ''
    const latest = [...themeEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
    return latest.map(e => e.lessonThisTime).join('. ')
  }

  const activeThemes = themes.filter(t => !t.resolved)
  const resolvedThemes = themes.filter(t => t.resolved)
  const viewTheme = selectedThemeId ? themes.find(t => t.id === selectedThemeId) : null
  const viewEntries = selectedThemeId ? entries.filter(e => e.themeId === selectedThemeId) : []

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7" style={{ color: '#c084fc' }} />
            Spiral Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track recurring patterns. Transcend them.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowThemeForm(true); setShowEntryForm(false) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#c084fc33', border: '1px solid #c084fc44' }}
          >
            <Plus className="w-4 h-4" /> Theme
          </button>
          {themes.length > 0 && (
            <button
              onClick={() => {
                setEntryForm(f => ({ ...f, themeId: themes[0].id }))
                setShowEntryForm(true)
                setShowThemeForm(false)
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#f43f5e33', border: '1px solid #f43f5e44' }}
            >
              <Plus className="w-4 h-4" /> Log
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{themes.length}</div>
          <div className="text-xs text-slate-500">Themes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: '#f43f5e' }}>{entries.length}</div>
          <div className="text-xs text-slate-500">Layers</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{resolvedThemes.length}</div>
          <div className="text-xs text-slate-500">Resolved</div>
        </div>
      </div>

      {showThemeForm && (
        <div className="game-card p-4 space-y-3" style={{ border: '1px solid #c084fc33' }}>
          <h3 className="text-sm font-semibold text-white">Name a Recurring Theme</h3>
          <input
            value={themeForm.name}
            onChange={e => setThemeForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Theme name (e.g. Fear of abandonment) *"
            className="game-input w-full text-sm"
            autoFocus
          />
          <textarea
            value={themeForm.description}
            onChange={e => setThemeForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe this pattern as you understand it"
            className="game-input w-full h-14 resize-none text-sm"
          />
          <div className="flex gap-2">
            <select
              value={themeForm.domain}
              onChange={e => setThemeForm(f => ({ ...f, domain: e.target.value as SpiralTheme['domain'] }))}
              className="game-input text-sm flex-1"
            >
              {DOMAINS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
            <input
              type="date"
              value={themeForm.firstNoticed}
              onChange={e => setThemeForm(f => ({ ...f, firstNoticed: e.target.value }))}
              className="game-input text-sm flex-1"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={submitTheme} className="flex-1 py-2 text-white rounded-xl text-sm font-semibold" style={{ background: '#c084fc55' }}>
              Add Theme
            </button>
            <button onClick={() => setShowThemeForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showEntryForm && (
        <div className="game-card p-4 space-y-3" style={{ border: '1px solid #f43f5e33' }}>
          <h3 className="text-sm font-semibold text-white">Log a Spiral Occurrence</h3>
          <select
            value={entryForm.themeId}
            onChange={e => setEntryForm(f => ({ ...f, themeId: e.target.value }))}
            className="game-input w-full text-sm"
          >
            <option value="">Select theme *</option>
            {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <textarea
            value={entryForm.occurrence}
            onChange={e => setEntryForm(f => ({ ...f, occurrence: e.target.value }))}
            placeholder="How did it show up this time? *"
            className="game-input w-full h-14 resize-none text-sm"
            autoFocus
          />
          <input
            value={entryForm.newLayer}
            onChange={e => setEntryForm(f => ({ ...f, newLayer: e.target.value }))}
            placeholder="What's new or deeper about this vs last time?"
            className="game-input w-full text-sm"
          />
          <input
            value={entryForm.emotion}
            onChange={e => setEntryForm(f => ({ ...f, emotion: e.target.value }))}
            placeholder="Emotion present (e.g. shame, fear, grief)"
            className="game-input w-full text-sm"
          />
          <input
            value={entryForm.lessonThisTime}
            onChange={e => setEntryForm(f => ({ ...f, lessonThisTime: e.target.value }))}
            placeholder="Lesson or insight this time"
            className="game-input w-full text-sm"
          />
          <div>
            <p className="text-xs text-slate-500 mb-1">Growth level: <span className="font-bold" style={{ color: '#c084fc' }}>{entryForm.growthLevel}/10</span></p>
            <input
              type="range" min={1} max={10} value={entryForm.growthLevel}
              onChange={e => setEntryForm(f => ({ ...f, growthLevel: Number(e.target.value) }))}
              className="w-full h-1"
              style={{ accentColor: '#c084fc' }}
            />
          </div>
          <input
            type="date"
            value={entryForm.date}
            onChange={e => setEntryForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />
          <div className="flex gap-2">
            <button onClick={submitEntry} className="flex-1 py-2 text-white rounded-xl text-sm font-semibold" style={{ background: '#f43f5e55' }}>
              Log Spiral
            </button>
            <button onClick={() => setShowEntryForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {viewTheme && (
        <div className="game-card p-4 space-y-3" style={{ border: `1px solid ${DOMAIN_COLOR[viewTheme.domain]}44` }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">{viewTheme.name}</h3>
            <button onClick={() => setSelectedThemeId(null)} className="text-xs text-slate-500 hover:text-slate-300">
              Close
            </button>
          </div>
          <SpiralViz entries={viewEntries} color={DOMAIN_COLOR[viewTheme.domain]} />
          <div>
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Growth over time</p>
            <GrowthLine entries={viewEntries} color={DOMAIN_COLOR[viewTheme.domain]} />
          </div>
          {distillWisdom(viewTheme.id) && (
            <div className="p-3 rounded-lg" style={{ background: '#c084fc11', border: '1px solid #c084fc22' }}>
              <p className="text-xs text-purple-400 font-semibold mb-1">Wisdom Distilled</p>
              <p className="text-xs text-slate-300 italic">"{distillWisdom(viewTheme.id)}"</p>
            </div>
          )}
          <div className="space-y-2">
            {viewEntries
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(e => (
                <div key={e.id} className="bg-slate-800/50 rounded-lg p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{e.date}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: DOMAIN_COLOR[viewTheme.domain] }}>🌀 {e.growthLevel}/10</span>
                      <button onClick={() => deleteEntry(e.id)} className="text-slate-700 hover:text-red-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-300">{e.occurrence}</p>
                  {e.newLayer && <p className="text-purple-300/80">↳ New layer: {e.newLayer}</p>}
                  {e.emotion && <p className="text-rose-300/70">Felt: {e.emotion}</p>}
                  {e.lessonThisTime && <p className="text-amber-300/80">💡 {e.lessonThisTime}</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {activeThemes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Active Themes</h3>
          {activeThemes.map(t => {
            const themeEntries = entries.filter(e => e.themeId === t.id)
            const latestGrowth = themeEntries.length
              ? [...themeEntries].sort((a, b) => b.date.localeCompare(a.date))[0].growthLevel
              : null
            const expanded = expandedThemeId === t.id
            return (
              <div
                key={t.id}
                className="game-card p-3"
                style={{ borderLeft: `3px solid ${DOMAIN_COLOR[t.domain]}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{t.name}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: DOMAIN_COLOR[t.domain] + '22', color: DOMAIN_COLOR[t.domain] }}
                      >
                        {t.domain}
                      </span>
                      <span className="text-xs text-slate-500">🌀 {themeEntries.length} layer{themeEntries.length !== 1 ? 's' : ''}</span>
                      {latestGrowth !== null && (
                        <span className="text-xs" style={{ color: '#c084fc' }}>↑ {latestGrowth}/10</span>
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{t.description}</p>
                    )}
                    {expanded && distillWisdom(t.id) && (
                      <p className="text-xs text-purple-300/80 mt-1 italic">"{distillWisdom(t.id).slice(0, 120)}{distillWisdom(t.id).length > 120 ? '…' : ''}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedThemeId(selectedThemeId === t.id ? null : t.id)}
                      className="text-xs px-2 py-1 rounded text-slate-400 hover:text-white"
                      style={{ background: '#ffffff11' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => toggleResolved(t.id)}
                      className="text-slate-600 hover:text-green-400"
                      title="Mark resolved"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setExpandedThemeId(expanded ? null : t.id)}
                      className="text-slate-600 hover:text-slate-300"
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteTheme(t.id)}
                      className="text-slate-700 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {resolvedThemes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Transcended</h3>
          {resolvedThemes.map(t => (
            <div
              key={t.id}
              className="game-card p-3 opacity-60"
              style={{ borderLeft: '3px solid #22c55e' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-sm text-slate-400 line-through">{t.name}</span>
                  <span className="text-xs text-green-400">resolved</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleResolved(t.id)} className="text-slate-600 hover:text-slate-300">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteTheme(t.id)} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {t.resolution && (
                <p className="text-xs text-green-300/70 mt-1 ml-6">{t.resolution}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {themes.length === 0 && !showThemeForm && (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Life teaches in spirals. Name what keeps coming back.</p>
        </div>
      )}
    </div>
  )
}
