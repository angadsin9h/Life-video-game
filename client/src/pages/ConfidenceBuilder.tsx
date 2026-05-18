import { useState, useEffect } from 'react'
import { Zap, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ConfidenceArea = 'social' | 'professional' | 'physical' | 'creative' | 'intellectual' | 'emotional' | 'financial' | 'leadership'
type ConfidenceEntryType = 'win' | 'affirmation' | 'evidence' | 'goal' | 'challenge-completed' | 'feedback-received'

interface ConfidenceEntry {
  id: string
  area: ConfidenceArea
  type: ConfidenceEntryType
  content: string
  context: string
  impact: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<ConfidenceArea, { label: string; emoji: string; color: string }> = {
  social:        { label: 'Social',       emoji: '🗣️', color: '#3b82f6' },
  professional:  { label: 'Professional', emoji: '💼', color: '#f59e0b' },
  physical:      { label: 'Physical',     emoji: '💪', color: '#22c55e' },
  creative:      { label: 'Creative',     emoji: '🎨', color: '#a855f7' },
  intellectual:  { label: 'Intellectual', emoji: '🧠', color: '#6366f1' },
  emotional:     { label: 'Emotional',    emoji: '❤️', color: '#ec4899' },
  financial:     { label: 'Financial',    emoji: '💰', color: '#84cc16' },
  leadership:    { label: 'Leadership',   emoji: '🦁', color: '#f97316' },
}

const ENTRY_TYPE_CONFIG: Record<ConfidenceEntryType, { label: string; emoji: string }> = {
  win:                    { label: 'Win',                emoji: '🏆' },
  affirmation:            { label: 'Affirmation',        emoji: '✨' },
  evidence:               { label: 'Evidence',           emoji: '📋' },
  goal:                   { label: 'Goal',               emoji: '🎯' },
  'challenge-completed':  { label: 'Challenge Done',     emoji: '✅' },
  'feedback-received':    { label: 'Positive Feedback',  emoji: '💬' },
}

const STORAGE_KEY = 'confidence_builder'

export default function ConfidenceBuilder() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ConfidenceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterArea, setFilterArea] = useState<string>('all')
  const [form, setForm] = useState<Omit<ConfidenceEntry, 'id' | 'createdAt'>>({
    area: 'social', type: 'win', content: '', context: '',
    impact: 3, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ConfidenceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim()) return
    const e: ConfidenceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, content: '', context: '' }))
    setShowForm(false)
    toastSuccess('Confidence entry added ⚡')
  }

  const filtered = entries.filter(e => filterArea === 'all' || e.area === filterArea)
  const areaScores: Record<string, number> = {}
  entries.forEach(e => { areaScores[e.area] = (areaScores[e.area] || 0) + e.impact })
  const topArea = Object.entries(areaScores).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Confidence Builder
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build unshakeable self-belief with evidence.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Evidence</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{entries.filter(e => e.type === 'win').length}</div>
          <div className="text-xs text-slate-500">Wins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400 text-xs leading-tight">
            {topArea ? AREA_CONFIG[topArea[0] as ConfidenceArea]?.emoji : '—'}
          </div>
          <div className="text-xs text-slate-500">Top Area</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(AREA_CONFIG) as [ConfidenceArea, typeof AREA_CONFIG.social][]).map(([k, a]) => (
          <button key={k} onClick={() => setFilterArea(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterArea === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterArea === k ? { background: a.color + '30', color: a.color } : {}}>
            {a.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Confidence Evidence</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ConfidenceArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ConfidenceArea, typeof AREA_CONFIG.social][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ConfidenceEntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(ENTRY_TYPE_CONFIG) as [ConfidenceEntryType, typeof ENTRY_TYPE_CONFIG.win][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="What happened? What is the evidence? *" className="game-input w-full h-14 resize-none" autoFocus />
          <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="Context / background..." className="game-input w-full text-sm" />
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Impact: {form.impact}/5</p>
              <input type="range" min={1} max={5} value={form.impact}
                onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const a = AREA_CONFIG[e.area]
          const t = ENTRY_TYPE_CONFIG[e.type]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${a.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm truncate">{e.content}</p>
                  <p className="text-xs text-slate-500">{a.label} · {t.label} · Impact {'●'.repeat(e.impact)}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.context && <p className="text-xs text-slate-400">📎 {e.context}</p>}
                  <p className="text-xs text-slate-500">{e.date}</p>
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Build confidence with evidence. Every win matters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
