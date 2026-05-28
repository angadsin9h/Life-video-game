import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CourageArea = 'social' | 'career' | 'creative' | 'physical' | 'emotional' | 'intellectual' | 'financial' | 'relational' | 'spiritual' | 'other'
type CourageType = 'action' | 'conversation' | 'decision' | 'vulnerability' | 'boundary' | 'risk' | 'refusal'

interface CourageEntry {
  id: string
  area: CourageArea
  courageType: CourageType
  situation: string
  whatIDid: string
  fear: string
  outcome: string
  growth: string
  fearLevel: number
  prideLevel: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<CourageArea, { label: string; emoji: string; color: string }> = {
  social:       { label: 'Social',       emoji: '👥', color: '#22c55e' },
  career:       { label: 'Career',       emoji: '💼', color: '#3b82f6' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#a855f7' },
  physical:     { label: 'Physical',     emoji: '💪', color: '#ef4444' },
  emotional:    { label: 'Emotional',    emoji: '❤️', color: '#ec4899' },
  intellectual: { label: 'Intellectual', emoji: '🧠', color: '#6366f1' },
  financial:    { label: 'Financial',    emoji: '💰', color: '#f59e0b' },
  relational:   { label: 'Relational',   emoji: '🤝', color: '#0ea5e9' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#84cc16' },
  other:        { label: 'Other',        emoji: '⚡', color: '#64748b' },
}

const TYPE_CONFIG: Record<CourageType, { label: string; color: string }> = {
  action:        { label: 'Courageous Action', color: '#ef4444' },
  conversation:  { label: 'Hard Conversation', color: '#f97316' },
  decision:      { label: 'Bold Decision',     color: '#f59e0b' },
  vulnerability: { label: 'Vulnerability',     color: '#ec4899' },
  boundary:      { label: 'Setting Boundary',  color: '#a855f7' },
  risk:          { label: 'Calculated Risk',   color: '#3b82f6' },
  refusal:       { label: 'Saying No',         color: '#22c55e' },
}

const STORAGE_KEY = 'courage_log'

export default function CourageLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CourageEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CourageEntry, 'id' | 'createdAt'>>({
    area: 'social', courageType: 'action', situation: '', whatIDid: '',
    fear: '', outcome: '', growth: '', fearLevel: 7, prideLevel: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CourageEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.situation.trim()) return
    const e: CourageEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, situation: '', whatIDid: '', fear: '', outcome: '', growth: '' }))
    setShowForm(false)
    toastSuccess('Courage logged! You faced your fear 🦁')
  }

  const avgFear = entries.length ? Math.round(entries.reduce((s, e) => s + e.fearLevel, 0) / entries.length) : 0
  const avgPride = entries.length ? Math.round(entries.reduce((s, e) => s + e.prideLevel, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-red-400" />
            Courage Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document every act of bravery — big and small.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Act
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Acts of Courage</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{avgFear}/10</div>
          <div className="text-xs text-slate-500">Avg Fear Faced</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgPride}/10</div>
          <div className="text-xs text-slate-500">Avg Pride</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Courageous Act</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as CourageArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [CourageArea, typeof AREA_CONFIG.social][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.courageType} onChange={e => setForm(f => ({ ...f, courageType: e.target.value as CourageType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [CourageType, typeof TYPE_CONFIG.action][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="Describe the situation / challenge you faced *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <textarea value={form.whatIDid} onChange={e => setForm(f => ({ ...f, whatIDid: e.target.value }))}
            placeholder="What courageous action did you take?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.fear} onChange={e => setForm(f => ({ ...f, fear: e.target.value }))}
            placeholder="What specific fear did you face?" className="game-input w-full text-sm" />
          <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            placeholder="Outcome / result (if known)" className="game-input w-full text-sm" />
          <input value={form.growth} onChange={e => setForm(f => ({ ...f, growth: e.target.value }))}
            placeholder="How did this help you grow?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Fear level: {form.fearLevel}/10</p>
              <input type="range" min={1} max={10} value={form.fearLevel}
                onChange={e => setForm(f => ({ ...f, fearLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Pride level: {form.prideLevel}/10</p>
              <input type="range" min={1} max={10} value={form.prideLevel}
                onChange={e => setForm(f => ({ ...f, prideLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-yellow-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Log Act</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const t = TYPE_CONFIG[e.courageType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-red-400">Fear {e.fearLevel}/10</span>
                  <span className="text-xs text-yellow-400">🏆 {e.prideLevel}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.situation}</p>
                {e.whatIDid && <p className="text-xs text-green-300 mt-0.5">→ {e.whatIDid}</p>}
                {e.growth && <p className="text-xs text-indigo-300/70 mt-0.5">💡 {e.growth}</p>}
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
            <p className="text-sm">Courage is a muscle. Log every rep.</p>
          </div>
        )}
      </div>
    </div>
  )
}
