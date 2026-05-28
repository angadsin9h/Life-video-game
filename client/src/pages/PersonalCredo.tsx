import { useState, useEffect } from 'react'
import { Scroll, Plus, Trash2, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type CredoPillar = 'character' | 'relationships' | 'work' | 'health' | 'money' | 'spirituality' | 'learning' | 'service' | 'family' | 'other'
type CredoType = 'belief' | 'principle' | 'commitment' | 'standard' | 'rule' | 'vow'

interface CredoEntry {
  id: string
  pillar: CredoPillar
  credoType: CredoType
  statement: string
  whyItMatters: string
  howILiveIt: string
  source: string
  strength: number
  isCoreCreed: boolean
  createdAt: string
}

const PILLAR_CONFIG: Record<CredoPillar, { label: string; emoji: string; color: string }> = {
  character:     { label: 'Character',     emoji: '⚔️', color: '#f59e0b' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  work:          { label: 'Work',          emoji: '💼', color: '#3b82f6' },
  health:        { label: 'Health',        emoji: '💪', color: '#ef4444' },
  money:         { label: 'Money',         emoji: '💰', color: '#22c55e' },
  spirituality:  { label: 'Spirituality',  emoji: '✨', color: '#a855f7' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#6366f1' },
  service:       { label: 'Service',       emoji: '🤝', color: '#0ea5e9' },
  family:        { label: 'Family',        emoji: '🏠', color: '#f97316' },
  other:         { label: 'Other',         emoji: '📜', color: '#94a3b8' },
}

const TYPE_CONFIG: Record<CredoType, { label: string; color: string }> = {
  belief:     { label: 'I Believe',    color: '#a855f7' },
  principle:  { label: 'Principle',    color: '#3b82f6' },
  commitment: { label: 'I Commit To',  color: '#22c55e' },
  standard:   { label: 'My Standard', color: '#f59e0b' },
  rule:       { label: 'Life Rule',    color: '#ef4444' },
  vow:        { label: 'I Vow',        color: '#ec4899' },
}

const STORAGE_KEY = 'personal_credo'

export default function PersonalCredo() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<CredoEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<CredoEntry, 'id' | 'createdAt'>>({
    pillar: 'character', credoType: 'belief', statement: '', whyItMatters: '',
    howILiveIt: '', source: '', strength: 9, isCoreCreed: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CredoEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.statement.trim()) return
    const e: CredoEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, statement: '', whyItMatters: '', howILiveIt: '', source: '', isCoreCreed: false }))
    setShowForm(false)
    toastSuccess('Credo added to your creed 📜')
  }

  const coreCount = entries.filter(e => e.isCoreCreed).length
  const pillarCount = [...new Set(entries.map(e => e.pillar))].length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Scroll className="w-7 h-7 text-amber-400" />
            Personal Credo
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define your creed — the beliefs and principles you live by.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Creeds</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{coreCount}</div>
          <div className="text-xs text-slate-500">Core Beliefs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{pillarCount}</div>
          <div className="text-xs text-slate-500">Life Pillars</div>
        </div>
      </div>

      {entries.filter(e => e.isCoreCreed).length > 0 && (
        <div className="game-card p-3 border border-amber-500/20 space-y-2">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider">Core Creed</p>
          {entries.filter(e => e.isCoreCreed).map(e => (
            <p key={e.id} className="text-sm text-white">⚔️ {e.statement}</p>
          ))}
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add to Your Credo</h3>
          <div className="flex gap-2">
            <select value={form.pillar} onChange={e => setForm(f => ({ ...f, pillar: e.target.value as CredoPillar }))} className="game-input text-sm flex-1">
              {(Object.entries(PILLAR_CONFIG) as [CredoPillar, typeof PILLAR_CONFIG.character][]).map(([k, p]) => (
                <option key={k} value={k}>{p.emoji} {p.label}</option>
              ))}
            </select>
            <select value={form.credoType} onChange={e => setForm(f => ({ ...f, credoType: e.target.value as CredoType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [CredoType, typeof TYPE_CONFIG.belief][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))}
            placeholder="I believe / I commit to / My standard is... *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.whyItMatters} onChange={e => setForm(f => ({ ...f, whyItMatters: e.target.value }))}
            placeholder="Why this matters deeply to you" className="game-input w-full text-sm" />
          <input value={form.howILiveIt} onChange={e => setForm(f => ({ ...f, howILiveIt: e.target.value }))}
            placeholder="How you live this out daily" className="game-input w-full text-sm" />
          <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            placeholder="Where this belief came from (optional)" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Conviction strength: {form.strength}/10</p>
              <input type="range" min={1} max={10} value={form.strength}
                onChange={e => setForm(f => ({ ...f, strength: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isCoreCreed} onChange={e => setForm(f => ({ ...f, isCoreCreed: e.target.checked }))} />
              Core Creed
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Add to Credo</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const p = PILLAR_CONFIG[e.pillar]
          const t = TYPE_CONFIG[e.credoType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${p.color}` }}>
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-slate-500">{p.label}</span>
                  {e.isCoreCreed && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  <span className="text-xs text-amber-400">💪 {e.strength}/10</span>
                </div>
                <p className="text-sm text-white mt-1">{e.statement}</p>
                {e.howILiveIt && <p className="text-xs text-green-300 mt-0.5">→ {e.howILiveIt}</p>}
                {e.whyItMatters && <p className="text-xs text-slate-500 mt-0.5">{e.whyItMatters}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Scroll className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">What do you stand for? Write your creed.</p>
          </div>
        )}
      </div>
    </div>
  )
}
