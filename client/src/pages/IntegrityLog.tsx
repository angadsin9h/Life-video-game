import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type IntegrityDomain = 'words-actions' | 'values-behavior' | 'commitments' | 'relationships' | 'finances' | 'health' | 'work' | 'self-care' | 'boundaries' | 'honesty'
type IntegrityStatus = 'aligned' | 'gap-noticed' | 'gap-closed' | 'working-on-it' | 'needs-repair'

interface IntegrityEntry {
  id: string
  domain: IntegrityDomain
  status: IntegrityStatus
  whatYouSaid: string
  whatYouDid: string
  theGap: string
  whyItHappened: string
  howToClose: string
  lesson: string
  integrityScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<IntegrityDomain, { label: string; emoji: string; color: string }> = {
  'words-actions':   { label: 'Words vs Actions',  emoji: '🗣️', color: '#3b82f6' },
  'values-behavior': { label: 'Values vs Behavior', emoji: '⚖️', color: '#6366f1' },
  commitments:       { label: 'Commitments',        emoji: '🤝', color: '#22c55e' },
  relationships:     { label: 'Relationships',      emoji: '❤️', color: '#ec4899' },
  finances:          { label: 'Finances',            emoji: '💰', color: '#f59e0b' },
  health:            { label: 'Health',              emoji: '💪', color: '#84cc16' },
  work:              { label: 'Work',                emoji: '💼', color: '#f97316' },
  'self-care':       { label: 'Self-Care',           emoji: '🌿', color: '#10b981' },
  boundaries:        { label: 'Boundaries',          emoji: '🛡️', color: '#a855f7' },
  honesty:           { label: 'Honesty',             emoji: '🔍', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<IntegrityStatus, { label: string; color: string; emoji: string }> = {
  aligned:        { label: 'Aligned',        color: '#22c55e', emoji: '✅' },
  'gap-noticed':  { label: 'Gap Noticed',    color: '#f59e0b', emoji: '⚠️' },
  'gap-closed':   { label: 'Gap Closed',     color: '#3b82f6', emoji: '🔒' },
  'working-on-it':{ label: 'Working On It',  color: '#a855f7', emoji: '🔧' },
  'needs-repair': { label: 'Needs Repair',   color: '#ef4444', emoji: '❗' },
}

const STORAGE_KEY = 'integrity_log'

export default function IntegrityLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<IntegrityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<IntegrityEntry, 'id' | 'createdAt'>>({
    domain: 'words-actions', status: 'gap-noticed', whatYouSaid: '',
    whatYouDid: '', theGap: '', whyItHappened: '', howToClose: '',
    lesson: '', integrityScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: IntegrityEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.theGap.trim() && !form.whatYouSaid.trim()) return
    const e: IntegrityEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatYouSaid: '', whatYouDid: '', theGap: '', whyItHappened: '', howToClose: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Integrity check logged — self-honesty is the highest courage 🛡️')
  }

  const aligned = entries.filter(e => e.status === 'aligned' || e.status === 'gap-closed').length
  const avgScore = entries.length ? Math.round(entries.reduce((s, e) => s + e.integrityScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Integrity Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track alignment between your values, words, and actions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Check-Ins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{aligned}</div>
          <div className="text-xs text-slate-500">Aligned</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Integrity</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Integrity Check</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as IntegrityDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [IntegrityDomain, typeof DOMAIN_CONFIG.commitments][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as IntegrityStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [IntegrityStatus, typeof STATUS_CONFIG.aligned][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whatYouSaid} onChange={e => setForm(f => ({ ...f, whatYouSaid: e.target.value }))}
            placeholder="What did you say / commit to / intend?" className="game-input w-full text-sm" autoFocus />
          <input value={form.whatYouDid} onChange={e => setForm(f => ({ ...f, whatYouDid: e.target.value }))}
            placeholder="What did you actually do?" className="game-input w-full text-sm" />
          <textarea value={form.theGap} onChange={e => setForm(f => ({ ...f, theGap: e.target.value }))}
            placeholder="Describe the gap (or alignment) *" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whyItHappened} onChange={e => setForm(f => ({ ...f, whyItHappened: e.target.value }))}
            placeholder="Why did this gap happen?" className="game-input w-full text-sm" />
          <input value={form.howToClose} onChange={e => setForm(f => ({ ...f, howToClose: e.target.value }))}
            placeholder="How will you close or repair this gap?" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="What does this teach you?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Integrity score: {form.integrityScore}/10</p>
            <input type="range" min={1} max={10} value={form.integrityScore}
              onChange={e => setForm(f => ({ ...f, integrityScore: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Log Integrity</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const s = STATUS_CONFIG[e.status]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.emoji} {s.label}</span>
                  <span className="text-xs text-blue-400">🛡️ {e.integrityScore}/10</span>
                </div>
                {e.theGap && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.theGap}</p>}
                {e.howToClose && <p className="text-xs text-green-300/70 mt-0.5">→ {e.howToClose}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Integrity is doing the right thing even when nobody is watching.</p>
          </div>
        )}
      </div>
    </div>
  )
}
