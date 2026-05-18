import { useState, useEffect } from 'react'
import { Briefcase, Plus, Trash2, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type NegOutcome = 'win' | 'lose' | 'draw' | 'pending'
type NegContext = 'salary' | 'price' | 'contract' | 'conflict' | 'deadline' | 'resources' | 'personal' | 'other'

interface NegEntry {
  id: string
  date: string
  context: NegContext
  counterpart: string
  stake: string
  myGoal: string
  theirGoal: string
  tactics: string
  outcome: NegOutcome
  result: string
  lesson: string
  preparation: number
  confidence: number
  createdAt: string
}

const CONTEXT_CONFIG: Record<NegContext, { label: string; emoji: string; color: string }> = {
  salary:    { label: 'Salary',     emoji: '💰', color: '#22c55e' },
  price:     { label: 'Price',      emoji: '🏷️', color: '#f59e0b' },
  contract:  { label: 'Contract',   emoji: '📋', color: '#3b82f6' },
  conflict:  { label: 'Conflict',   emoji: '⚡', color: '#ef4444' },
  deadline:  { label: 'Deadline',   emoji: '⏰', color: '#f97316' },
  resources: { label: 'Resources',  emoji: '🔧', color: '#a855f7' },
  personal:  { label: 'Personal',   emoji: '👥', color: '#ec4899' },
  other:     { label: 'Other',      emoji: '🤝', color: '#94a3b8' },
}

const OUTCOME_CONFIG: Record<NegOutcome, { label: string; color: string }> = {
  win:     { label: 'Win',     color: '#22c55e' },
  lose:    { label: 'Loss',    color: '#ef4444' },
  draw:    { label: 'Draw',    color: '#f59e0b' },
  pending: { label: 'Pending', color: '#6366f1' },
}

const STORAGE_KEY = 'negotiation_log'

export default function NegotiationLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<NegEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<NegEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], context: 'salary', counterpart: '', stake: '',
    myGoal: '', theirGoal: '', tactics: '', outcome: 'pending', result: '', lesson: '',
    preparation: 5, confidence: 5,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: NegEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.counterpart.trim() || !form.stake.trim()) return
    const e: NegEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], context: 'salary', counterpart: '', stake: '', myGoal: '', theirGoal: '', tactics: '', outcome: 'pending', result: '', lesson: '', preparation: 5, confidence: 5 })
    setShowForm(false)
    toastSuccess('Negotiation logged 🤝')
  }

  const wins = entries.filter(e => e.outcome === 'win').length
  const winRate = entries.filter(e => e.outcome !== 'pending').length
    ? ((wins / entries.filter(e => e.outcome !== 'pending').length) * 100).toFixed(0)
    : '—'

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Briefcase className="w-7 h-7 text-green-400" />
            Negotiation Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track negotiations and improve your skills.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{wins}</div>
          <div className="text-xs text-slate-500">Wins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{winRate}%</div>
          <div className="text-xs text-slate-500">Win Rate</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Negotiation</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm" />
            <select value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value as NegContext }))} className="game-input text-sm flex-1">
              {(Object.entries(CONTEXT_CONFIG) as [NegContext, typeof CONTEXT_CONFIG.salary][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.counterpart} onChange={e => setForm(f => ({ ...f, counterpart: e.target.value }))}
              placeholder="Counterpart *" className="game-input flex-1" autoFocus />
            <input value={form.stake} onChange={e => setForm(f => ({ ...f, stake: e.target.value }))}
              placeholder="What's at stake *" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            <textarea value={form.myGoal} onChange={e => setForm(f => ({ ...f, myGoal: e.target.value }))}
              placeholder="My goal/position" className="game-input w-full h-14 resize-none text-sm flex-1" />
            <textarea value={form.theirGoal} onChange={e => setForm(f => ({ ...f, theirGoal: e.target.value }))}
              placeholder="Their likely goal" className="game-input w-full h-14 resize-none text-sm flex-1" />
          </div>
          <textarea value={form.tactics} onChange={e => setForm(f => ({ ...f, tactics: e.target.value }))}
            placeholder="Tactics I used..." className="game-input w-full h-14 resize-none text-sm" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28">Preparation: {form.preparation}/10</span>
              <input type="range" min={1} max={10} value={form.preparation}
                onChange={e => setForm(f => ({ ...f, preparation: Number(e.target.value) }))}
                className="flex-1 h-1 accent-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-28">Confidence: {form.confidence}/10</span>
              <input type="range" min={1} max={10} value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
                className="flex-1 h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(OUTCOME_CONFIG) as [NegOutcome, typeof OUTCOME_CONFIG.win][]).map(([k, o]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, outcome: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.outcome === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.outcome === k ? { background: o.color + '30', color: o.color } : {}}>
                {o.label}
              </button>
            ))}
          </div>
          <textarea value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}
            placeholder="What was the actual result?" className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="What did I learn?" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CONTEXT_CONFIG[e.context]
          const o = OUTCOME_CONFIG[e.outcome]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${o.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.counterpart}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: o.color + '20', color: o.color }}>{o.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{e.stake} · {e.date}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {e.myGoal && <p className="text-xs text-slate-400"><span className="text-slate-500">My goal: </span>{e.myGoal}</p>}
                  {e.theirGoal && <p className="text-xs text-slate-400"><span className="text-slate-500">Their goal: </span>{e.theirGoal}</p>}
                  {e.tactics && <p className="text-xs text-slate-400"><span className="text-slate-500">Tactics: </span>{e.tactics}</p>}
                  {e.result && <p className="text-sm text-white">📊 {e.result}</p>}
                  {e.lesson && <p className="text-sm text-teal-400 italic">💡 {e.lesson}</p>}
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Prep: {e.preparation}/10</span>
                    <span>Confidence: {e.confidence}/10</span>
                  </div>
                  <div className="flex gap-2">
                    {(Object.keys(OUTCOME_CONFIG) as NegOutcome[]).map(ok => (
                      <button key={ok} onClick={() => save(entries.map(x => x.id === e.id ? { ...x, outcome: ok } : x))}
                        className={`px-2 py-0.5 rounded-full text-xs ${e.outcome === ok ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                        style={e.outcome === ok ? { background: OUTCOME_CONFIG[ok].color + '30', color: OUTCOME_CONFIG[ok].color } : {}}>
                        {OUTCOME_CONFIG[ok].label}
                      </button>
                    ))}
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">Delete</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start logging your negotiations to improve your skills.</p>
          </div>
        )}
      </div>
    </div>
  )
}
