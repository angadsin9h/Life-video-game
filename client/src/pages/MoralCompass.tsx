import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EthicalDomain = 'honesty' | 'fairness' | 'compassion' | 'responsibility' | 'integrity' | 'courage' | 'respect' | 'justice' | 'care' | 'loyalty'
type EntryType = 'dilemma' | 'decision' | 'principle' | 'test' | 'reflection' | 'commitment'

interface MoralEntry {
  id: string
  domain: EthicalDomain
  type: EntryType
  title: string
  situation: string
  considerations: string
  decision: string
  outcome: string
  lesson: string
  alignment: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<EthicalDomain, { label: string; emoji: string; color: string }> = {
  honesty:       { label: 'Honesty',       emoji: '🪞', color: '#3b82f6' },
  fairness:      { label: 'Fairness',      emoji: '⚖️', color: '#f59e0b' },
  compassion:    { label: 'Compassion',    emoji: '❤️', color: '#ec4899' },
  responsibility:{ label: 'Responsibility',emoji: '🏋️', color: '#22c55e' },
  integrity:     { label: 'Integrity',     emoji: '💎', color: '#6366f1' },
  courage:       { label: 'Courage',       emoji: '🦁', color: '#f97316' },
  respect:       { label: 'Respect',       emoji: '🙏', color: '#a855f7' },
  justice:       { label: 'Justice',       emoji: '⚔️', color: '#ef4444' },
  care:          { label: 'Care',          emoji: '🌿', color: '#84cc16' },
  loyalty:       { label: 'Loyalty',       emoji: '🐾', color: '#0ea5e9' },
}

const ENTRY_TYPE_CONFIG: Record<EntryType, { label: string; emoji: string }> = {
  dilemma:    { label: 'Dilemma',    emoji: '🤔' },
  decision:   { label: 'Decision',   emoji: '✅' },
  principle:  { label: 'Principle',  emoji: '📜' },
  test:       { label: 'Moral Test', emoji: '⚡' },
  reflection: { label: 'Reflection', emoji: '🪞' },
  commitment: { label: 'Commitment', emoji: '🤝' },
}

const STORAGE_KEY = 'moral_compass'

export default function MoralCompass() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MoralEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterDomain, setFilterDomain] = useState<string>('all')
  const [form, setForm] = useState<Omit<MoralEntry, 'id' | 'createdAt'>>({
    domain: 'integrity', type: 'reflection', title: '', situation: '',
    considerations: '', decision: '', outcome: '', lesson: '', alignment: 4,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MoralEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: MoralEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', situation: '', considerations: '', decision: '', outcome: '', lesson: '' }))
    setShowForm(false)
    toastSuccess('Moral entry logged 🧭')
  }

  const filtered = entries.filter(e => filterDomain === 'all' || e.domain === filterDomain)
  const avgAlignment = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.alignment, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Moral Compass
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Navigate ethical dilemmas and track moral growth.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgAlignment}</div>
          <div className="text-xs text-slate-500">Avg Alignment</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{entries.filter(e => e.type === 'commitment').length}</div>
          <div className="text-xs text-slate-500">Commitments</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterDomain('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(DOMAIN_CONFIG) as [EthicalDomain, typeof DOMAIN_CONFIG.honesty][]).map(([k, d]) => (
          <button key={k} onClick={() => setFilterDomain(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterDomain === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterDomain === k ? { background: d.color + '30', color: d.color } : {}}>
            {d.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Moral Entry</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as EthicalDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [EthicalDomain, typeof DOMAIN_CONFIG.honesty][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as EntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(ENTRY_TYPE_CONFIG) as [EntryType, typeof ENTRY_TYPE_CONFIG.dilemma][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title *" className="game-input w-full" autoFocus />
          <textarea value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value }))}
            placeholder="The situation / dilemma..." className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.considerations} onChange={e => setForm(f => ({ ...f, considerations: e.target.value }))}
            placeholder="Competing considerations..." className="game-input w-full text-sm" />
          <input value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}
            placeholder="What you decided / did..." className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Lesson or growth from this..." className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Value alignment: {form.alignment}/5</p>
            <input type="range" min={1} max={5} value={form.alignment}
              onChange={e => setForm(f => ({ ...f, alignment: Number(e.target.value) }))}
              className="w-full h-1 accent-blue-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const t = ENTRY_TYPE_CONFIG[e.type]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${d.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-white text-sm">{e.title}</span>
                  <p className="text-xs text-slate-500">{d.label} · {t.label} · Alignment {e.alignment}/5</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.situation && <p className="text-xs text-slate-300">{e.situation}</p>}
                  {e.considerations && <p className="text-xs text-yellow-300">⚖️ {e.considerations}</p>}
                  {e.decision && <p className="text-xs text-green-300">✅ {e.decision}</p>}
                  {e.lesson && <p className="text-xs text-blue-300">💡 {e.lesson}</p>}
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
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Live by your values. Navigate life with integrity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
