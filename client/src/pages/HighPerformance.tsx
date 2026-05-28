import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PerformanceDomain = 'cognitive' | 'physical' | 'emotional' | 'creative' | 'leadership' | 'communication' | 'strategic' | 'technical' | 'social' | 'spiritual'
type PerformanceZone = 'survival' | 'comfort' | 'learning' | 'growth' | 'peak'

interface HighPerformanceEntry {
  id: string
  domain: PerformanceDomain
  zone: PerformanceZone
  taskPerformed: string
  energyStateEntering: string
  peakMoment: string
  whatElevatedYou: string
  whatHeldYouBack: string
  recoveryNeeded: string
  protocolUsed: string
  nextLevelTarget: string
  performanceScore: number
  date: string
  createdAt: string
}

const DOMAIN_CONFIG: Record<PerformanceDomain, { label: string; emoji: string; color: string }> = {
  cognitive:     { label: 'Cognitive',     emoji: '🧠', color: '#6366f1' },
  physical:      { label: 'Physical',      emoji: '💪', color: '#22c55e' },
  emotional:     { label: 'Emotional',     emoji: '❤️', color: '#ec4899' },
  creative:      { label: 'Creative',      emoji: '🎨', color: '#f59e0b' },
  leadership:    { label: 'Leadership',    emoji: '👑', color: '#a855f7' },
  communication: { label: 'Communication', emoji: '🗣️', color: '#3b82f6' },
  strategic:     { label: 'Strategic',     emoji: '🎯', color: '#f97316' },
  technical:     { label: 'Technical',     emoji: '⚙️', color: '#94a3b8' },
  social:        { label: 'Social',        emoji: '🌐', color: '#10b981' },
  spiritual:     { label: 'Spiritual',     emoji: '✨', color: '#eab308' },
}

const ZONE_CONFIG: Record<PerformanceZone, { label: string; color: string }> = {
  survival: { label: 'Survival', color: '#ef4444' },
  comfort:  { label: 'Comfort',  color: '#f97316' },
  learning: { label: 'Learning', color: '#f59e0b' },
  growth:   { label: 'Growth',   color: '#3b82f6' },
  peak:     { label: 'Peak',     color: '#22c55e' },
}

const STORAGE_KEY = 'high_performance_log'

export default function HighPerformance() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<HighPerformanceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<HighPerformanceEntry, 'id' | 'createdAt'>>({
    domain: 'cognitive', zone: 'growth', taskPerformed: '',
    energyStateEntering: '', peakMoment: '', whatElevatedYou: '',
    whatHeldYouBack: '', recoveryNeeded: '', protocolUsed: '', nextLevelTarget: '', performanceScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: HighPerformanceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.taskPerformed.trim()) return
    const e: HighPerformanceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, taskPerformed: '', energyStateEntering: '', peakMoment: '', whatElevatedYou: '', whatHeldYouBack: '', recoveryNeeded: '', protocolUsed: '', nextLevelTarget: '' }))
    setShowForm(false)
    toastSuccess('Performance logged — high performance is a habit of mind, body, and spirit 🏆')
  }

  const peakGrowth = entries.filter(e => e.zone === 'peak' || e.zone === 'growth').length
  const avgPerformance = entries.length ? Math.round(entries.reduce((s, e) => s + e.performanceScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-amber-400" />
            High Performance
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track and optimize your peak performance across all domains.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{peakGrowth}</div>
          <div className="text-xs text-slate-500">Growth+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgPerformance}/10</div>
          <div className="text-xs text-slate-500">Avg Performance</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Performance Session</h3>
          <div className="flex gap-2">
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value as PerformanceDomain }))} className="game-input text-sm flex-1">
              {(Object.entries(DOMAIN_CONFIG) as [PerformanceDomain, typeof DOMAIN_CONFIG.cognitive][]).map(([k, d]) => (
                <option key={k} value={k}>{d.emoji} {d.label}</option>
              ))}
            </select>
            <select value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value as PerformanceZone }))} className="game-input text-sm flex-1">
              {(Object.entries(ZONE_CONFIG) as [PerformanceZone, typeof ZONE_CONFIG.growth][]).map(([k, z]) => (
                <option key={k} value={k}>{z.label}</option>
              ))}
            </select>
          </div>
          <input value={form.taskPerformed} onChange={e => setForm(f => ({ ...f, taskPerformed: e.target.value }))}
            placeholder="Task or activity performed *" className="game-input w-full text-sm" autoFocus />
          <input value={form.energyStateEntering} onChange={e => setForm(f => ({ ...f, energyStateEntering: e.target.value }))}
            placeholder="Your energy state entering the session" className="game-input w-full text-sm" />
          <input value={form.peakMoment} onChange={e => setForm(f => ({ ...f, peakMoment: e.target.value }))}
            placeholder="The peak moment in this session" className="game-input w-full text-sm" />
          <input value={form.whatElevatedYou} onChange={e => setForm(f => ({ ...f, whatElevatedYou: e.target.value }))}
            placeholder="What elevated your performance" className="game-input w-full text-sm" />
          <input value={form.whatHeldYouBack} onChange={e => setForm(f => ({ ...f, whatHeldYouBack: e.target.value }))}
            placeholder="What held you back from peak" className="game-input w-full text-sm" />
          <input value={form.recoveryNeeded} onChange={e => setForm(f => ({ ...f, recoveryNeeded: e.target.value }))}
            placeholder="Recovery needed after this session" className="game-input w-full text-sm" />
          <input value={form.protocolUsed} onChange={e => setForm(f => ({ ...f, protocolUsed: e.target.value }))}
            placeholder="Protocol or ritual that helped" className="game-input w-full text-sm" />
          <input value={form.nextLevelTarget} onChange={e => setForm(f => ({ ...f, nextLevelTarget: e.target.value }))}
            placeholder="Next level target in this domain" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Performance level: {form.performanceScore}/10</p>
            <input type="range" min={1} max={10} value={form.performanceScore}
              onChange={e => setForm(f => ({ ...f, performanceScore: Number(e.target.value) }))}
              className="w-full h-1 accent-amber-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const d = DOMAIN_CONFIG[e.domain]
          const z = ZONE_CONFIG[e.zone]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${d.color}` }}>
              <span className="text-2xl">{d.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{d.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: z.color + '20', color: z.color }}>{z.label}</span>
                  <span className="text-xs text-amber-400">🏆 {e.performanceScore}/10</span>
                </div>
                {e.taskPerformed && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.taskPerformed}</p>}
                {e.nextLevelTarget && <p className="text-xs text-yellow-300/70 mt-0.5 line-clamp-1">→ {e.nextLevelTarget}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">High performance is the result of high standards, relentlessly maintained.</p>
          </div>
        )}
      </div>
    </div>
  )
}
