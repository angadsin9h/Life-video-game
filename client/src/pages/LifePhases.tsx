import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PhaseTheme = 'formation' | 'exploration' | 'building' | 'crisis' | 'transformation' | 'integration' | 'contribution' | 'reflection' | 'renewal' | 'transcendence'
type PhaseStatus = 'past' | 'current' | 'emerging' | 'future'

interface LifePhaseEntry {
  id: string
  phaseName: string
  theme: PhaseTheme
  status: PhaseStatus
  ageRange: string
  keyEvents: string
  dominantFeelings: string
  mainChallenge: string
  biggestGrowth: string
  whatDefinesIt: string
  lessonCarried: string
  importanceScore: number
  date: string
  createdAt: string
}

const THEME_CONFIG: Record<PhaseTheme, { label: string; emoji: string; color: string }> = {
  formation:      { label: 'Formation',      emoji: '🌱', color: '#22c55e' },
  exploration:    { label: 'Exploration',    emoji: '🗺️', color: '#3b82f6' },
  building:       { label: 'Building',       emoji: '🏗️', color: '#f59e0b' },
  crisis:         { label: 'Crisis',         emoji: '⚡', color: '#ef4444' },
  transformation: { label: 'Transformation', emoji: '🦋', color: '#a855f7' },
  integration:    { label: 'Integration',    emoji: '🧩', color: '#6366f1' },
  contribution:   { label: 'Contribution',   emoji: '🌍', color: '#10b981' },
  reflection:     { label: 'Reflection',     emoji: '🪞', color: '#94a3b8' },
  renewal:        { label: 'Renewal',        emoji: '🌅', color: '#ec4899' },
  transcendence:  { label: 'Transcendence',  emoji: '✨', color: '#eab308' },
}

const STATUS_CONFIG: Record<PhaseStatus, { label: string; color: string }> = {
  past:     { label: 'Past',     color: '#94a3b8' },
  current:  { label: 'Current',  color: '#22c55e' },
  emerging: { label: 'Emerging', color: '#f59e0b' },
  future:   { label: 'Future',   color: '#6366f1' },
}

const STORAGE_KEY = 'life_phases_log'

export default function LifePhases() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<LifePhaseEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifePhaseEntry, 'id' | 'createdAt'>>({
    phaseName: '', theme: 'building', status: 'current', ageRange: '',
    keyEvents: '', dominantFeelings: '', mainChallenge: '',
    biggestGrowth: '', whatDefinesIt: '', lessonCarried: '', importanceScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifePhaseEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.phaseName.trim()) return
    const e: LifePhaseEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, phaseName: '', ageRange: '', keyEvents: '', dominantFeelings: '', mainChallenge: '', biggestGrowth: '', whatDefinesIt: '', lessonCarried: '' }))
    setShowForm(false)
    toastSuccess('Life phase documented — your story has chapters, each one essential 📖')
  }

  const current = entries.filter(e => e.status === 'current').length
  const avgImportance = entries.length ? Math.round(entries.reduce((s, e) => s + e.importanceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-slate-400" />
            Life Phases
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Map the chapters and phases of your life journey.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add Phase
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Phases</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{current}</div>
          <div className="text-xs text-slate-500">Current</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-slate-400">{avgImportance}/10</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-slate-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Document Life Phase</h3>
          <input value={form.phaseName} onChange={e => setForm(f => ({ ...f, phaseName: e.target.value }))}
            placeholder="Phase name (e.g., 'The Lost Years', 'The Awakening') *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value as PhaseTheme }))} className="game-input text-sm flex-1">
              {(Object.entries(THEME_CONFIG) as [PhaseTheme, typeof THEME_CONFIG.building][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PhaseStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [PhaseStatus, typeof STATUS_CONFIG.current][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.ageRange} onChange={e => setForm(f => ({ ...f, ageRange: e.target.value }))}
            placeholder="Age range (e.g., 18-23, 23-present)" className="game-input w-full text-sm" />
          <input value={form.keyEvents} onChange={e => setForm(f => ({ ...f, keyEvents: e.target.value }))}
            placeholder="Key events that defined this phase" className="game-input w-full text-sm" />
          <input value={form.dominantFeelings} onChange={e => setForm(f => ({ ...f, dominantFeelings: e.target.value }))}
            placeholder="Dominant feelings or themes" className="game-input w-full text-sm" />
          <input value={form.mainChallenge} onChange={e => setForm(f => ({ ...f, mainChallenge: e.target.value }))}
            placeholder="Main challenge or shadow of this phase" className="game-input w-full text-sm" />
          <input value={form.biggestGrowth} onChange={e => setForm(f => ({ ...f, biggestGrowth: e.target.value }))}
            placeholder="Biggest growth or gift from this phase" className="game-input w-full text-sm" />
          <input value={form.whatDefinesIt} onChange={e => setForm(f => ({ ...f, whatDefinesIt: e.target.value }))}
            placeholder="In one line: what defines this phase?" className="game-input w-full text-sm" />
          <input value={form.lessonCarried} onChange={e => setForm(f => ({ ...f, lessonCarried: e.target.value }))}
            placeholder="Lesson you carry forward from it" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Life impact: {form.importanceScore}/10</p>
            <input type="range" min={1} max={10} value={form.importanceScore}
              onChange={e => setForm(f => ({ ...f, importanceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-slate-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-semibold">Save Phase</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = THEME_CONFIG[e.theme]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{t.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.phaseName}</span>
                  {e.ageRange && <span className="text-xs text-slate-500">Age {e.ageRange}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs" style={{ color: t.color }}>{t.label}</span>
                </div>
                {e.whatDefinesIt && <p className="text-xs text-slate-300 mt-1 line-clamp-1 italic">"{e.whatDefinesIt}"</p>}
                {e.lessonCarried && <p className="text-xs text-green-300/70 mt-0.5">→ {e.lessonCarried}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your life is a hero's journey with distinct chapters. Map them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
