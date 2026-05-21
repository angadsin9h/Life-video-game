import { useState, useEffect } from 'react'
import { User, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type IdentityDomain = 'self' | 'professional' | 'relational' | 'physical' | 'intellectual' | 'spiritual' | 'creative' | 'civic' | 'parent' | 'other'
type IdentityType = 'current' | 'aspired' | 'releasing' | 'transitioning' | 'embodied'

interface IdentityEntry {
  id: string
  domain: IdentityDomain
  identityType: IdentityType
  statement: string
  evidence: string
  habits: string
  beliefs: string
  environment: string
  votesForThis: string
  strength: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<IdentityDomain, { label: string; emoji: string; color: string }> = {
  self:         { label: 'Self',         emoji: '🧬', color: '#a855f7' },
  professional: { label: 'Professional', emoji: '💼', color: '#3b82f6' },
  relational:   { label: 'Relational',   emoji: '❤️', color: '#ec4899' },
  physical:     { label: 'Physical',     emoji: '💪', color: '#ef4444' },
  intellectual: { label: 'Intellectual', emoji: '🧠', color: '#6366f1' },
  spiritual:    { label: 'Spiritual',    emoji: '✨', color: '#84cc16' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#f97316' },
  civic:        { label: 'Civic',        emoji: '🌍', color: '#22c55e' },
  parent:       { label: 'Parent',       emoji: '👨‍👩‍👧', color: '#f59e0b' },
  other:        { label: 'Other',        emoji: '⭐', color: '#94a3b8' },
}

const TYPE_CONFIG: Record<IdentityType, { label: string; color: string; emoji: string }> = {
  current:      { label: 'Current',      color: '#3b82f6', emoji: '📍' },
  aspired:      { label: 'Aspired',      color: '#a855f7', emoji: '🚀' },
  releasing:    { label: 'Releasing',    color: '#ef4444', emoji: '🔓' },
  transitioning:{ label: 'Transitioning',color: '#f59e0b', emoji: '🦋' },
  embodied:     { label: 'Embodied',     color: '#22c55e', emoji: '✅' },
}

const STORAGE_KEY = 'identity_log'

export default function IdentityLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<IdentityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<IdentityEntry, 'id' | 'createdAt'>>({
    domain: 'self', identityType: 'aspired', statement: '', evidence: '',
    habits: '', beliefs: '', environment: '', votesForThis: '', strength: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: IdentityEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.statement.trim()) return
    const e: IdentityEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, statement: '', evidence: '', habits: '', beliefs: '', environment: '', votesForThis: '' }))
    setShowForm(false)
    toastSuccess('Identity logged — you become what you repeatedly do 🧬')
  }

  const embodied = entries.filter(e => e.identityType === 'embodied').length
  const aspired = entries.filter(e => e.identityType === 'aspired').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <User className="w-7 h-7 text-purple-400" />
            Identity Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define who you are. Design who you're becoming.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Identities</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{aspired}</div>
          <div className="text-xs text-slate-500">Aspired</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{embodied}</div>
          <div className="text-xs text-slate-500">Embodied</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Define Identity</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as IdentityDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [IdentityDomain, typeof DOMAIN_CONFIG.self][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.identityType} onChange={e => setForm(f => ({ ...f, identityType: e.target.value as IdentityType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [IdentityType, typeof TYPE_CONFIG.current][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))}
            placeholder="I am... (identity statement) *" className="game-input w-full text-sm" autoFocus />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence that supports this identity" className="game-input w-full text-sm" />
          <input value={form.habits} onChange={e => setForm(f => ({ ...f, habits: e.target.value }))}
            placeholder="Habits that reinforce this identity" className="game-input w-full text-sm" />
          <input value={form.beliefs} onChange={e => setForm(f => ({ ...f, beliefs: e.target.value }))}
            placeholder="Beliefs that support this identity" className="game-input w-full text-sm" />
          <input value={form.votesForThis} onChange={e => setForm(f => ({ ...f, votesForThis: e.target.value }))}
            placeholder="Last vote you cast for this identity (action)" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Strength: {form.strength}/10</p>
            <input type="range" min={1} max={10} value={form.strength}
              onChange={e => setForm(f => ({ ...f, strength: Number(e.target.value) }))}
              className="w-full h-1 accent-purple-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Define</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const t = TYPE_CONFIG[e.identityType]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${t.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{t.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-slate-500">{d.label}</span>
                  <span className="text-xs text-purple-400">💪 {e.strength}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{e.statement}</p>
                {e.habits && <p className="text-xs text-green-300/80 mt-0.5">Habits: {e.habits}</p>}
                {e.votesForThis && <p className="text-xs text-blue-300/70 mt-0.5">Vote: {e.votesForThis}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every action is a vote for the person you want to become.</p>
          </div>
        )}
      </div>
    </div>
  )
}
