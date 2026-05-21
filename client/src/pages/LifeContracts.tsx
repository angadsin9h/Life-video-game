import { useState, useEffect } from 'react'
import { FileText, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ContractArea = 'health' | 'career' | 'relationships' | 'finance' | 'mindset' | 'creativity' | 'spiritual' | 'learning' | 'habits' | 'other'
type ContractStatus = 'active' | 'fulfilled' | 'broken' | 'renewed' | 'expired'

interface LifeContract {
  id: string
  area: ContractArea
  status: ContractStatus
  title: string
  commitment: string
  terms: string
  consequences: string
  rewards: string
  witness: string
  startDate: string
  endDate: string
  commitment_level: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<ContractArea, { label: string; emoji: string; color: string }> = {
  health:        { label: 'Health',        emoji: '💪', color: '#ef4444' },
  career:        { label: 'Career',        emoji: '💼', color: '#3b82f6' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  finance:       { label: 'Finance',       emoji: '💰', color: '#22c55e' },
  mindset:       { label: 'Mindset',       emoji: '🧠', color: '#a855f7' },
  creativity:    { label: 'Creativity',    emoji: '🎨', color: '#f97316' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#84cc16' },
  learning:      { label: 'Learning',      emoji: '📚', color: '#6366f1' },
  habits:        { label: 'Habits',        emoji: '🔄', color: '#f59e0b' },
  other:         { label: 'Other',         emoji: '📋', color: '#94a3b8' },
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; emoji: string }> = {
  active:    { label: 'Active',    color: '#22c55e', emoji: '✅' },
  fulfilled: { label: 'Fulfilled', color: '#a855f7', emoji: '🏆' },
  broken:    { label: 'Broken',    color: '#ef4444', emoji: '💔' },
  renewed:   { label: 'Renewed',   color: '#3b82f6', emoji: '🔄' },
  expired:   { label: 'Expired',   color: '#94a3b8', emoji: '⏱️' },
}

const STORAGE_KEY = 'life_contracts'

export default function LifeContracts() {
  const { toastSuccess } = useToast()
  const [contracts, setContracts] = useState<LifeContract[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<LifeContract, 'id' | 'createdAt'>>({
    area: 'habits', status: 'active', title: '', commitment: '', terms: '',
    consequences: '', rewards: '', witness: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', commitment_level: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setContracts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: LifeContract[]) => { setContracts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const c: LifeContract = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([c, ...contracts])
    setForm(f => ({ ...f, title: '', commitment: '', terms: '', consequences: '', rewards: '', witness: '', endDate: '' }))
    setShowForm(false)
    toastSuccess('Life contract signed — your word is your bond 📜')
  }

  const active = contracts.filter(c => c.status === 'active').length
  const fulfilled = contracts.filter(c => c.status === 'fulfilled').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <FileText className="w-7 h-7 text-blue-400" />
            Life Contracts
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Formal commitments to yourself. Your word is sacred.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Sign
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{contracts.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{fulfilled}</div>
          <div className="text-xs text-slate-500">Fulfilled</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Sign Life Contract</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ContractArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ContractArea, typeof AREA_CONFIG.health][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContractStatus }))} className="game-input text-sm flex-1">
              {(Object.entries(STATUS_CONFIG) as [ContractStatus, typeof STATUS_CONFIG.active][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Contract title *" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.commitment} onChange={e => setForm(f => ({ ...f, commitment: e.target.value }))}
            placeholder="I commit to..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
            placeholder="Terms and conditions of this contract" className="game-input w-full text-sm" />
          <input value={form.consequences} onChange={e => setForm(f => ({ ...f, consequences: e.target.value }))}
            placeholder="Consequences if broken" className="game-input w-full text-sm" />
          <input value={form.rewards} onChange={e => setForm(f => ({ ...f, rewards: e.target.value }))}
            placeholder="Rewards when fulfilled" className="game-input w-full text-sm" />
          <input value={form.witness} onChange={e => setForm(f => ({ ...f, witness: e.target.value }))}
            placeholder="Witness (person who holds you accountable)" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">End date</p>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Commitment: {form.commitment_level}/10</p>
              <input type="range" min={1} max={10} value={form.commitment_level}
                onChange={e => setForm(f => ({ ...f, commitment_level: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400 mt-3" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Sign Contract</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contracts.map(c => {
          const a = AREA_CONFIG[c.area]
          const s = STATUS_CONFIG[c.status]
          return (
            <div key={c.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{s.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-slate-500">{a.label}</span>
                  <span className="text-xs text-blue-400">⚡ {c.commitment_level}/10</span>
                </div>
                <p className="text-xs font-medium text-white mt-1">{c.title}</p>
                {c.commitment && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.commitment}</p>}
                {c.endDate && <p className="text-xs text-blue-300/70 mt-0.5">Until: {c.endDate}</p>}
              </div>
              <button onClick={() => save(contracts.filter(x => x.id !== c.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {contracts.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">A contract with yourself is the most important agreement you'll ever sign.</p>
          </div>
        )}
      </div>
    </div>
  )
}
