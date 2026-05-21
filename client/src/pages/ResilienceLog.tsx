import { useState, useEffect } from 'react'
import { Shield, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ResilienceEvent = 'setback' | 'failure' | 'loss' | 'rejection' | 'crisis' | 'change' | 'conflict' | 'illness' | 'mistake' | 'other'
type ResilienceOutcome = 'bounced-back' | 'still-recovering' | 'transformed' | 'learned' | 'ongoing'

interface ResilienceEntry {
  id: string
  eventType: ResilienceEvent
  outcome: ResilienceOutcome
  event: string
  howIFelt: string
  whatHelped: string
  resourcesUsed: string
  lesson: string
  growthFromThis: string
  hardnessLevel: number
  recoveryDays: number
  date: string
  createdAt: string
}

const EVENT_CONFIG: Record<ResilienceEvent, { label: string; emoji: string; color: string }> = {
  setback:  { label: 'Setback',   emoji: '📉', color: '#f59e0b' },
  failure:  { label: 'Failure',   emoji: '❌', color: '#ef4444' },
  loss:     { label: 'Loss',      emoji: '💔', color: '#ec4899' },
  rejection:{ label: 'Rejection', emoji: '🚫', color: '#f97316' },
  crisis:   { label: 'Crisis',    emoji: '🆘', color: '#dc2626' },
  change:   { label: 'Change',    emoji: '🔄', color: '#3b82f6' },
  conflict: { label: 'Conflict',  emoji: '⚡', color: '#8b5cf6' },
  illness:  { label: 'Illness',   emoji: '🤒', color: '#84cc16' },
  mistake:  { label: 'Mistake',   emoji: '🙈', color: '#6366f1' },
  other:    { label: 'Other',     emoji: '💫', color: '#94a3b8' },
}

const OUTCOME_CONFIG: Record<ResilienceOutcome, { label: string; color: string; emoji: string }> = {
  'bounced-back':    { label: 'Bounced Back',    color: '#22c55e', emoji: '🚀' },
  'still-recovering':{ label: 'Recovering',      color: '#f59e0b', emoji: '🌱' },
  transformed:       { label: 'Transformed',     color: '#a855f7', emoji: '🦋' },
  learned:           { label: 'Learned',         color: '#3b82f6', emoji: '📚' },
  ongoing:           { label: 'Ongoing',         color: '#ef4444', emoji: '⏳' },
}

const STORAGE_KEY = 'resilience_log'

export default function ResilienceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ResilienceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ResilienceEntry, 'id' | 'createdAt'>>({
    eventType: 'setback', outcome: 'still-recovering', event: '', howIFelt: '',
    whatHelped: '', resourcesUsed: '', lesson: '', growthFromThis: '',
    hardnessLevel: 7, recoveryDays: 0,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ResilienceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.event.trim()) return
    const e: ResilienceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, event: '', howIFelt: '', whatHelped: '', resourcesUsed: '', lesson: '', growthFromThis: '' }))
    setShowForm(false)
    toastSuccess('Resilience logged — every storm makes you stronger 🛡️')
  }

  const bounced = entries.filter(e => e.outcome === 'bounced-back' || e.outcome === 'transformed').length
  const avgHardness = entries.length ? Math.round(entries.reduce((s, e) => s + e.hardnessLevel, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Shield className="w-7 h-7 text-blue-400" />
            Resilience Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document your recovery from adversity. Build your resilience story.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Events</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{bounced}</div>
          <div className="text-xs text-slate-500">Bounced Back</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{avgHardness}/10</div>
          <div className="text-xs text-slate-500">Avg Hardness</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Resilience Event</h3>
          <div className="flex gap-2">
            <select value={form.eventType} onChange={e => setForm(f => ({ ...f, eventType: e.target.value as ResilienceEvent }))} className="game-input text-sm flex-1">
              {(Object.entries(EVENT_CONFIG) as [ResilienceEvent, typeof EVENT_CONFIG.setback][]).map(([k, ev]) => (
                <option key={k} value={k}>{ev.emoji} {ev.label}</option>
              ))}
            </select>
            <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value as ResilienceOutcome }))} className="game-input text-sm flex-1">
              {(Object.entries(OUTCOME_CONFIG) as [ResilienceOutcome, typeof OUTCOME_CONFIG['bounced-back']][]).map(([k, o]) => (
                <option key={k} value={k}>{o.emoji} {o.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
            placeholder="What happened? Describe the adversity *" className="game-input w-full h-14 resize-none text-sm" autoFocus />
          <input value={form.howIFelt} onChange={e => setForm(f => ({ ...f, howIFelt: e.target.value }))}
            placeholder="How did you feel at the time?" className="game-input w-full text-sm" />
          <input value={form.whatHelped} onChange={e => setForm(f => ({ ...f, whatHelped: e.target.value }))}
            placeholder="What helped you through it?" className="game-input w-full text-sm" />
          <input value={form.resourcesUsed} onChange={e => setForm(f => ({ ...f, resourcesUsed: e.target.value }))}
            placeholder="Resources / support you drew on" className="game-input w-full text-sm" />
          <input value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
            placeholder="Key lesson learned" className="game-input w-full text-sm" />
          <input value={form.growthFromThis} onChange={e => setForm(f => ({ ...f, growthFromThis: e.target.value }))}
            placeholder="How did this make you stronger?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Hardness: {form.hardnessLevel}/10</p>
              <input type="range" min={1} max={10} value={form.hardnessLevel}
                onChange={e => setForm(f => ({ ...f, hardnessLevel: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Recovery: {form.recoveryDays} days</p>
              <input type="range" min={0} max={365} step={1} value={form.recoveryDays}
                onChange={e => setForm(f => ({ ...f, recoveryDays: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Log</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const ev = EVENT_CONFIG[e.eventType]
          const o = OUTCOME_CONFIG[e.outcome]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${o.color}` }}>
              <span className="text-2xl">{ev.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs">{o.emoji}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: o.color + '20', color: o.color }}>{o.label}</span>
                  <span className="text-xs text-slate-500">{ev.label}</span>
                  <span className="text-xs text-red-400">🔥 {e.hardnessLevel}/10</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{e.event}</p>
                {e.lesson && <p className="text-xs text-yellow-300/80 mt-0.5">💡 {e.lesson}</p>}
                {e.growthFromThis && <p className="text-xs text-green-300/70 mt-0.5">Growth: {e.growthFromThis}</p>}
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
            <p className="text-sm">Resilience is built in the storms, not the sunshine.</p>
          </div>
        )}
      </div>
    </div>
  )
}
