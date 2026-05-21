import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ContribType = 'mentoring' | 'volunteering' | 'teaching' | 'creating' | 'donating' | 'advocating' | 'listening' | 'organizing' | 'leading' | 'supporting'
type ImpactScope = 'individual' | 'group' | 'community' | 'organization' | 'city' | 'national' | 'global'

interface ContribEntry {
  id: string
  contribution: string
  contribType: ContribType
  impactScope: ImpactScope
  who: string
  whatYouDid: string
  outcome: string
  howItFelt: string
  timeInvested: number
  impactScore: number
  date: string
  createdAt: string
}

const CONTRIB_CONFIG: Record<ContribType, { label: string; emoji: string; color: string }> = {
  mentoring:   { label: 'Mentoring',   emoji: '🎓', color: '#f59e0b' },
  volunteering:{ label: 'Volunteering',emoji: '🤝', color: '#22c55e' },
  teaching:    { label: 'Teaching',    emoji: '📚', color: '#3b82f6' },
  creating:    { label: 'Creating',    emoji: '🎨', color: '#f97316' },
  donating:    { label: 'Donating',    emoji: '💝', color: '#ec4899' },
  advocating:  { label: 'Advocating',  emoji: '📢', color: '#a855f7' },
  listening:   { label: 'Listening',   emoji: '👂', color: '#6366f1' },
  organizing:  { label: 'Organizing',  emoji: '🗂️', color: '#84cc16' },
  leading:     { label: 'Leading',     emoji: '🚀', color: '#ef4444' },
  supporting:  { label: 'Supporting',  emoji: '🤗', color: '#0ea5e9' },
}

const SCOPE_CONFIG: Record<ImpactScope, { label: string; color: string }> = {
  individual:   { label: 'Individual',   color: '#94a3b8' },
  group:        { label: 'Group',        color: '#22c55e' },
  community:    { label: 'Community',    color: '#3b82f6' },
  organization: { label: 'Organization', color: '#6366f1' },
  city:         { label: 'City',         color: '#f59e0b' },
  national:     { label: 'National',     color: '#f97316' },
  global:       { label: 'Global',       color: '#a855f7' },
}

const STORAGE_KEY = 'social_contributions'

export default function SocialContributions() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ContribEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ContribEntry, 'id' | 'createdAt'>>({
    contribution: '', contribType: 'mentoring', impactScope: 'individual',
    who: '', whatYouDid: '', outcome: '', howItFelt: '',
    timeInvested: 60, impactScore: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ContribEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.contribution.trim()) return
    const e: ContribEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, contribution: '', who: '', whatYouDid: '', outcome: '', howItFelt: '' }))
    setShowForm(false)
    toastSuccess('Contribution logged — your impact ripples outward 🌊')
  }

  const totalHours = Math.round(entries.reduce((s, e) => s + e.timeInvested, 0) / 60)
  const avgImpact = entries.length ? Math.round(entries.reduce((s, e) => s + e.impactScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-teal-400" />
            Social Contributions
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track the impact and value you create for others.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Acts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Invested</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{avgImpact}/10</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Contribution</h3>
          <input value={form.contribution} onChange={e => setForm(f => ({ ...f, contribution: e.target.value }))}
            placeholder="What did you contribute? *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.contribType} onChange={e => setForm(f => ({ ...f, contribType: e.target.value as ContribType }))} className="game-input text-sm flex-1">
              {(Object.entries(CONTRIB_CONFIG) as [ContribType, typeof CONTRIB_CONFIG.mentoring][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.impactScope} onChange={e => setForm(f => ({ ...f, impactScope: e.target.value as ImpactScope }))} className="game-input text-sm flex-1">
              {(Object.entries(SCOPE_CONFIG) as [ImpactScope, typeof SCOPE_CONFIG.individual][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))}
            placeholder="Who benefited?" className="game-input w-full text-sm" />
          <textarea value={form.whatYouDid} onChange={e => setForm(f => ({ ...f, whatYouDid: e.target.value }))}
            placeholder="Specifically what did you do?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
            placeholder="What was the outcome / result?" className="game-input w-full text-sm" />
          <input value={form.howItFelt} onChange={e => setForm(f => ({ ...f, howItFelt: e.target.value }))}
            placeholder="How did giving feel?" className="game-input w-full text-sm" />
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Time: {form.timeInvested}min</p>
              <input type="range" min={5} max={480} step={5} value={form.timeInvested}
                onChange={e => setForm(f => ({ ...f, timeInvested: Number(e.target.value) }))}
                className="w-full h-1 accent-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Impact: {form.impactScore}/10</p>
              <input type="range" min={1} max={10} value={form.impactScore}
                onChange={e => setForm(f => ({ ...f, impactScore: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Log Contribution</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const c = CONTRIB_CONFIG[e.contribType]
          const s = SCOPE_CONFIG[e.impactScope]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.contribution}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                  <span className="text-xs text-teal-400">⏱ {e.timeInvested}m</span>
                  <span className="text-xs text-green-400">💚 {e.impactScore}/10</span>
                </div>
                {e.outcome && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{e.outcome}</p>}
                {e.howItFelt && <p className="text-xs text-pink-300/70 mt-0.5">{e.howItFelt}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The meaning of life is to give life meaning. Contribute.</p>
          </div>
        )}
      </div>
    </div>
  )
}
