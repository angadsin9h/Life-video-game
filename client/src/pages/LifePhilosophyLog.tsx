import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PhilosophySchool = 'stoicism' | 'buddhism' | 'existentialism' | 'taoism' | 'humanism' | 'pragmatism' | 'virtue-ethics' | 'epicureanism' | 'personal' | 'other'
type InsightType = 'principle' | 'paradox' | 'question' | 'realization' | 'teaching' | 'mantra' | 'axiom' | 'hypothesis'

interface PhilosophyEntry {
  id: string
  school: PhilosophySchool
  insightType: InsightType
  insight: string
  application: string
  source: string
  challenge: string
  implication: string
  depth: number
  date: string
  createdAt: string
}

const SCHOOL_CONFIG: Record<PhilosophySchool, { label: string; emoji: string; color: string }> = {
  stoicism:       { label: 'Stoicism',       emoji: '⚔️', color: '#3b82f6' },
  buddhism:       { label: 'Buddhism',       emoji: '☸️', color: '#f59e0b' },
  existentialism: { label: 'Existentialism', emoji: '🌑', color: '#6366f1' },
  taoism:         { label: 'Taoism',         emoji: '☯️', color: '#22c55e' },
  humanism:       { label: 'Humanism',       emoji: '🌍', color: '#ec4899' },
  pragmatism:     { label: 'Pragmatism',     emoji: '⚙️', color: '#f97316' },
  'virtue-ethics':{ label: 'Virtue Ethics',  emoji: '🛡️', color: '#84cc16' },
  epicureanism:   { label: 'Epicureanism',   emoji: '🌹', color: '#a855f7' },
  personal:       { label: 'Personal',       emoji: '💡', color: '#0ea5e9' },
  other:          { label: 'Other',          emoji: '🔮', color: '#94a3b8' },
}

const TYPE_CONFIG: Record<InsightType, { label: string; emoji: string }> = {
  principle:   { label: 'Principle',   emoji: '📜' },
  paradox:     { label: 'Paradox',     emoji: '🔄' },
  question:    { label: 'Question',    emoji: '❓' },
  realization: { label: 'Realization', emoji: '💡' },
  teaching:    { label: 'Teaching',    emoji: '🧑‍🏫' },
  mantra:      { label: 'Mantra',      emoji: '🔮' },
  axiom:       { label: 'Axiom',       emoji: '⚡' },
  hypothesis:  { label: 'Hypothesis',  emoji: '🔬' },
}

const STORAGE_KEY = 'life_philosophy_log'

export default function LifePhilosophyLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<PhilosophyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<PhilosophyEntry, 'id' | 'createdAt'>>({
    school: 'stoicism', insightType: 'principle', insight: '', application: '',
    source: '', challenge: '', implication: '', depth: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PhilosophyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.insight.trim()) return
    const e: PhilosophyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, insight: '', application: '', source: '', challenge: '', implication: '' }))
    setShowForm(false)
    toastSuccess('Philosophical insight logged — wisdom grows 🦉')
  }

  const avgDepth = entries.length ? Math.round(entries.reduce((s, e) => s + e.depth, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Philosophy Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture philosophical insights. Build your worldview.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Insights</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{new Set(entries.map(e => e.school)).size}</div>
          <div className="text-xs text-slate-500">Schools</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgDepth}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Insight</h3>
          <div className="flex gap-2">
            <select value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value as PhilosophySchool }))} className="game-input text-sm flex-1">
              {(Object.entries(SCHOOL_CONFIG) as [PhilosophySchool, typeof SCHOOL_CONFIG.stoicism][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.insightType} onChange={e => setForm(f => ({ ...f, insightType: e.target.value as InsightType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [InsightType, typeof TYPE_CONFIG.principle][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.insight} onChange={e => setForm(f => ({ ...f, insight: e.target.value }))}
            placeholder="The philosophical insight *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.application} onChange={e => setForm(f => ({ ...f, application: e.target.value }))}
            placeholder="How does this apply to your life?" className="game-input w-full text-sm" />
          <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            placeholder="Source (book, philosopher, own thinking)" className="game-input w-full text-sm" />
          <input value={form.challenge} onChange={e => setForm(f => ({ ...f, challenge: e.target.value }))}
            placeholder="Where does this challenge you?" className="game-input w-full text-sm" />
          <input value={form.implication} onChange={e => setForm(f => ({ ...f, implication: e.target.value }))}
            placeholder="Key implication for how you live" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Depth: {form.depth}/10</p>
            <input type="range" min={1} max={10} value={form.depth}
              onChange={e => setForm(f => ({ ...f, depth: Number(e.target.value) }))}
              className="w-full h-1 accent-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SCHOOL_CONFIG[e.school]
          const t = TYPE_CONFIG[e.insightType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{t.emoji} {t.label}</span>
                  <span className="text-xs text-slate-500">{s.label}</span>
                  <span className="text-xs text-indigo-400">🔮 {e.depth}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1 line-clamp-3">{e.insight}</p>
                {e.application && <p className="text-xs text-green-300/80 mt-0.5">Apply: {e.application}</p>}
                {e.source && <p className="text-xs text-slate-500 mt-0.5">Source: {e.source}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Philosophy is the examined life. Examine yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}
