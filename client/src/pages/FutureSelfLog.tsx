import { useState, useEffect } from 'react'
import { Star, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type FutureTimeframe = '1-year' | '3-years' | '5-years' | '10-years' | '20-years' | 'end-of-life'
type FutureAspect = 'identity' | 'relationships' | 'career' | 'health' | 'finances' | 'wisdom' | 'contribution' | 'experiences' | 'character' | 'legacy'

interface FutureSelfEntry {
  id: string
  timeframe: FutureTimeframe
  aspect: FutureAspect
  futureDescription: string
  howTheyThink: string
  whatTheyBelieve: string
  howTheySpendTime: string
  messageToNow: string
  bridgeAction: string
  connectionScore: number
  date: string
  createdAt: string
}

const TIME_CONFIG: Record<FutureTimeframe, { label: string; color: string }> = {
  '1-year':    { label: '1 Year',       color: '#22c55e' },
  '3-years':   { label: '3 Years',      color: '#3b82f6' },
  '5-years':   { label: '5 Years',      color: '#6366f1' },
  '10-years':  { label: '10 Years',     color: '#a855f7' },
  '20-years':  { label: '20 Years',     color: '#ec4899' },
  'end-of-life':{ label: 'End of Life', color: '#94a3b8' },
}

const ASPECT_CONFIG: Record<FutureAspect, { label: string; emoji: string; color: string }> = {
  identity:      { label: 'Identity',      emoji: '🪞', color: '#6366f1' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  career:        { label: 'Career',        emoji: '💼', color: '#f59e0b' },
  health:        { label: 'Health',        emoji: '💪', color: '#22c55e' },
  finances:      { label: 'Finances',      emoji: '💰', color: '#84cc16' },
  wisdom:        { label: 'Wisdom',        emoji: '📚', color: '#a855f7' },
  contribution:  { label: 'Contribution',  emoji: '🤝', color: '#10b981' },
  experiences:   { label: 'Experiences',   emoji: '🌍', color: '#3b82f6' },
  character:     { label: 'Character',     emoji: '⚔️', color: '#f97316' },
  legacy:        { label: 'Legacy',        emoji: '🌳', color: '#94a3b8' },
}

const STORAGE_KEY = 'future_self_log'

export default function FutureSelfLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<FutureSelfEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<FutureSelfEntry, 'id' | 'createdAt'>>({
    timeframe: '5-years', aspect: 'identity', futureDescription: '',
    howTheyThink: '', whatTheyBelieve: '', howTheySpendTime: '',
    messageToNow: '', bridgeAction: '', connectionScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: FutureSelfEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.futureDescription.trim()) return
    const e: FutureSelfEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, futureDescription: '', howTheyThink: '', whatTheyBelieve: '', howTheySpendTime: '', messageToNow: '', bridgeAction: '' }))
    setShowForm(false)
    toastSuccess('Future self visualized — become who you are meant to be 🌟')
  }

  const avgConnection = entries.length ? Math.round(entries.reduce((s, e) => s + e.connectionScore, 0) / entries.length) : 0
  const longTerm = entries.filter(e => e.timeframe === '10-years' || e.timeframe === '20-years' || e.timeframe === 'end-of-life').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-violet-400" />
            Future Self Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Visualize and connect with your future self across all dimensions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Visualize
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Visualizations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-slate-400">{longTerm}</div>
          <div className="text-xs text-slate-500">Long-Term</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{avgConnection}/10</div>
          <div className="text-xs text-slate-500">Connection</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Future Self Visualization</h3>
          <div className="flex gap-2">
            <select value={form.timeframe} onChange={e => setForm(f => ({ ...f, timeframe: e.target.value as FutureTimeframe }))} className="game-input text-sm flex-1">
              {(Object.entries(TIME_CONFIG) as [FutureTimeframe, typeof TIME_CONFIG['1-year']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.label}</option>
              ))}
            </select>
            <select value={form.aspect} onChange={e => setForm(f => ({ ...f, aspect: e.target.value as FutureAspect }))} className="game-input text-sm flex-1">
              {(Object.entries(ASPECT_CONFIG) as [FutureAspect, typeof ASPECT_CONFIG.identity][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.futureDescription} onChange={e => setForm(f => ({ ...f, futureDescription: e.target.value }))}
            placeholder="Describe your future self in this aspect *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.howTheyThink} onChange={e => setForm(f => ({ ...f, howTheyThink: e.target.value }))}
            placeholder="How does your future self think differently?" className="game-input w-full text-sm" />
          <input value={form.whatTheyBelieve} onChange={e => setForm(f => ({ ...f, whatTheyBelieve: e.target.value }))}
            placeholder="What does your future self believe?" className="game-input w-full text-sm" />
          <input value={form.howTheySpendTime} onChange={e => setForm(f => ({ ...f, howTheySpendTime: e.target.value }))}
            placeholder="How does your future self spend their time?" className="game-input w-full text-sm" />
          <input value={form.messageToNow} onChange={e => setForm(f => ({ ...f, messageToNow: e.target.value }))}
            placeholder="Message from your future self to you now" className="game-input w-full text-sm" />
          <input value={form.bridgeAction} onChange={e => setForm(f => ({ ...f, bridgeAction: e.target.value }))}
            placeholder="One action to bridge now to then" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Connection strength: {form.connectionScore}/10</p>
            <input type="range" min={1} max={10} value={form.connectionScore}
              onChange={e => setForm(f => ({ ...f, connectionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-violet-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">Save Vision</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const t = TIME_CONFIG[e.timeframe]
          const a = ASPECT_CONFIG[e.aspect]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  <span className="text-xs text-violet-400">🌟 {e.connectionScore}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.futureDescription}</p>
                {e.messageToNow && <p className="text-xs text-yellow-300/70 mt-0.5 italic">"{e.messageToNow}"</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your future self is already there, waiting for you to catch up.</p>
          </div>
        )}
      </div>
    </div>
  )
}
