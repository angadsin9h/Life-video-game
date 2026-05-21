import { useState, useEffect } from 'react'
import { Globe, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ContributionScale = 'individual' | 'family' | 'community' | 'organization' | 'society' | 'global'
type ContributionType = 'knowledge' | 'time' | 'money' | 'skills' | 'emotional-support' | 'mentoring' | 'creation' | 'advocacy' | 'service' | 'inspiration'

interface ContributionEntry {
  id: string
  scale: ContributionScale
  type: ContributionType
  title: string
  description: string
  whoItHelped: string
  measuredImpact: string
  howItFelt: string
  whatItCostYou: string
  wouldDoAgain: boolean
  impactScore: number
  date: string
  createdAt: string
}

const SCALE_CONFIG: Record<ContributionScale, { label: string; emoji: string; color: string }> = {
  individual:   { label: 'Individual',   emoji: '👤', color: '#ec4899' },
  family:       { label: 'Family',       emoji: '👨‍👩‍👧', color: '#f59e0b' },
  community:    { label: 'Community',    emoji: '🏘️', color: '#22c55e' },
  organization: { label: 'Organization', emoji: '🏢', color: '#3b82f6' },
  society:      { label: 'Society',      emoji: '🌆', color: '#6366f1' },
  global:       { label: 'Global',       emoji: '🌍', color: '#a855f7' },
}

const TYPE_CONFIG: Record<ContributionType, { label: string; emoji: string }> = {
  knowledge:        { label: 'Knowledge',         emoji: '📚' },
  time:             { label: 'Time',              emoji: '⏰' },
  money:            { label: 'Money',             emoji: '💰' },
  skills:           { label: 'Skills',            emoji: '⚒️' },
  'emotional-support': { label: 'Emotional Support', emoji: '❤️' },
  mentoring:        { label: 'Mentoring',         emoji: '🎓' },
  creation:         { label: 'Creation',          emoji: '🎨' },
  advocacy:         { label: 'Advocacy',          emoji: '📣' },
  service:          { label: 'Service',           emoji: '🤝' },
  inspiration:      { label: 'Inspiration',       emoji: '✨' },
}

const STORAGE_KEY = 'contribution_log'

export default function ContributionLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ContributionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ContributionEntry, 'id' | 'createdAt'>>({
    scale: 'community', type: 'service', title: '', description: '',
    whoItHelped: '', measuredImpact: '', howItFelt: '',
    whatItCostYou: '', wouldDoAgain: true, impactScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ContributionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: ContributionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', description: '', whoItHelped: '', measuredImpact: '', howItFelt: '', whatItCostYou: '' }))
    setShowForm(false)
    toastSuccess('Contribution recorded — you are making the world better 🌍')
  }

  const avgImpact = entries.length ? Math.round(entries.reduce((s, e) => s + e.impactScore, 0) / entries.length) : 0
  const global = entries.filter(e => e.scale === 'global' || e.scale === 'society').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-emerald-400" />
            Contribution Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track how you give value and make an impact in the world.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Contributions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{global}</div>
          <div className="text-xs text-slate-500">High Scale</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{avgImpact}/10</div>
          <div className="text-xs text-slate-500">Avg Impact</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-emerald-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Contribution</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Contribution title *" className="game-input w-full text-sm" autoFocus />
          <div className="flex gap-2">
            <select value={form.scale} onChange={e => setForm(f => ({ ...f, scale: e.target.value as ContributionScale }))} className="game-input text-sm flex-1">
              {(Object.entries(SCALE_CONFIG) as [ContributionScale, typeof SCALE_CONFIG.community][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ContributionType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [ContributionType, typeof TYPE_CONFIG.service][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what you did" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.whoItHelped} onChange={e => setForm(f => ({ ...f, whoItHelped: e.target.value }))}
            placeholder="Who did it help?" className="game-input w-full text-sm" />
          <input value={form.measuredImpact} onChange={e => setForm(f => ({ ...f, measuredImpact: e.target.value }))}
            placeholder="Measurable or observable impact" className="game-input w-full text-sm" />
          <input value={form.howItFelt} onChange={e => setForm(f => ({ ...f, howItFelt: e.target.value }))}
            placeholder="How did contributing feel?" className="game-input w-full text-sm" />
          <input value={form.whatItCostYou} onChange={e => setForm(f => ({ ...f, whatItCostYou: e.target.value }))}
            placeholder="What did it cost you (time, energy, money)?" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={form.wouldDoAgain}
              onChange={e => setForm(f => ({ ...f, wouldDoAgain: e.target.checked }))} className="accent-emerald-400" />
            Would do this again
          </label>
          <div>
            <p className="text-xs text-slate-500 mb-1">Impact score: {form.impactScore}/10</p>
            <input type="range" min={1} max={10} value={form.impactScore}
              onChange={e => setForm(f => ({ ...f, impactScore: Number(e.target.value) }))}
              className="w-full h-1 accent-emerald-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold">Record Contribution</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const sc = SCALE_CONFIG[e.scale]
          const t = TYPE_CONFIG[e.type]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${sc.color}` }}>
              <span className="text-2xl">{sc.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{e.title}</span>
                  <span className="text-xs">{t.emoji} {t.label}</span>
                  <span className="text-xs text-emerald-400">🌍 {e.impactScore}/10</span>
                  {e.wouldDoAgain && <span className="text-xs text-green-400">✓ Again</span>}
                </div>
                {e.whoItHelped && <p className="text-xs text-slate-400 mt-1">Helped: {e.whoItHelped}</p>}
                {e.measuredImpact && <p className="text-xs text-green-300/70 mt-0.5">Impact: {e.measuredImpact}</p>}
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
            <p className="text-sm">The meaning of life is to find your gift. The purpose is to give it away.</p>
          </div>
        )}
      </div>
    </div>
  )
}
