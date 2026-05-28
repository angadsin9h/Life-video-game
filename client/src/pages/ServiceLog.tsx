import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ServiceType = 'volunteering' | 'mentoring' | 'donating' | 'helping' | 'teaching' | 'advocacy' | 'caregiving' | 'listening' | 'creating' | 'praying'
type ServiceScale = 'individual' | 'family' | 'community' | 'city' | 'national' | 'global'

interface ServiceLogEntry {
  id: string
  serviceType: ServiceType
  scale: ServiceScale
  whoYouServed: string
  whatYouDid: string
  howLong: string
  impactObserved: string
  howItFeltToServe: string
  whatYouLearned: string
  continueHow: string
  fulfillmentScore: number
  date: string
  createdAt: string
}

const SERVICE_CONFIG: Record<ServiceType, { label: string; emoji: string; color: string }> = {
  volunteering: { label: 'Volunteering', emoji: '🙌', color: '#22c55e' },
  mentoring:    { label: 'Mentoring',    emoji: '🎓', color: '#f59e0b' },
  donating:     { label: 'Donating',     emoji: '💝', color: '#ec4899' },
  helping:      { label: 'Helping',      emoji: '🤝', color: '#3b82f6' },
  teaching:     { label: 'Teaching',     emoji: '📚', color: '#6366f1' },
  advocacy:     { label: 'Advocacy',     emoji: '📢', color: '#ef4444' },
  caregiving:   { label: 'Caregiving',   emoji: '🏥', color: '#f97316' },
  listening:    { label: 'Listening',    emoji: '👂', color: '#a855f7' },
  creating:     { label: 'Creating',     emoji: '🎨', color: '#10b981' },
  praying:      { label: 'Praying',      emoji: '🙏', color: '#94a3b8' },
}

const SCALE_CONFIG: Record<ServiceScale, { label: string; color: string }> = {
  individual: { label: 'Individual', color: '#3b82f6' },
  family:     { label: 'Family',     color: '#22c55e' },
  community:  { label: 'Community',  color: '#f59e0b' },
  city:       { label: 'City',       color: '#f97316' },
  national:   { label: 'National',   color: '#ef4444' },
  global:     { label: 'Global',     color: '#a855f7' },
}

const STORAGE_KEY = 'service_log'

export default function ServiceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ServiceLogEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<ServiceLogEntry, 'id' | 'createdAt'>>({
    serviceType: 'helping', scale: 'individual', whoYouServed: '',
    whatYouDid: '', howLong: '', impactObserved: '',
    howItFeltToServe: '', whatYouLearned: '', continueHow: '', fulfillmentScore: 8,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ServiceLogEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatYouDid.trim()) return
    const e: ServiceLogEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whoYouServed: '', whatYouDid: '', howLong: '', impactObserved: '', howItFeltToServe: '', whatYouLearned: '', continueHow: '' }))
    setShowForm(false)
    toastSuccess('Service logged — the greatest among you is the servant of all 🙌')
  }

  const bigImpact = entries.filter(e => e.scale === 'community' || e.scale === 'city' || e.scale === 'national' || e.scale === 'global').length
  const avgFulfill = entries.length ? Math.round(entries.reduce((s, e) => s + e.fulfillmentScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-green-400" />
            Service Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your acts of service and the lives you touch.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Acts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{bigImpact}</div>
          <div className="text-xs text-slate-500">Community+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{avgFulfill}/10</div>
          <div className="text-xs text-slate-500">Fulfillment</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Service Act</h3>
          <div className="flex gap-2">
            <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value as ServiceType }))} className="game-input text-sm flex-1">
              {(Object.entries(SERVICE_CONFIG) as [ServiceType, typeof SERVICE_CONFIG.helping][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.scale} onChange={e => setForm(f => ({ ...f, scale: e.target.value as ServiceScale }))} className="game-input text-sm flex-1">
              {(Object.entries(SCALE_CONFIG) as [ServiceScale, typeof SCALE_CONFIG.community][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <input value={form.whoYouServed} onChange={e => setForm(f => ({ ...f, whoYouServed: e.target.value }))}
            placeholder="Who did you serve?" className="game-input w-full text-sm" autoFocus />
          <textarea value={form.whatYouDid} onChange={e => setForm(f => ({ ...f, whatYouDid: e.target.value }))}
            placeholder="What did you do? *" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howLong} onChange={e => setForm(f => ({ ...f, howLong: e.target.value }))}
            placeholder="How long / how much?" className="game-input w-full text-sm" />
          <input value={form.impactObserved} onChange={e => setForm(f => ({ ...f, impactObserved: e.target.value }))}
            placeholder="Impact you observed" className="game-input w-full text-sm" />
          <input value={form.howItFeltToServe} onChange={e => setForm(f => ({ ...f, howItFeltToServe: e.target.value }))}
            placeholder="How did serving feel?" className="game-input w-full text-sm" />
          <input value={form.whatYouLearned} onChange={e => setForm(f => ({ ...f, whatYouLearned: e.target.value }))}
            placeholder="What you learned from this" className="game-input w-full text-sm" />
          <input value={form.continueHow} onChange={e => setForm(f => ({ ...f, continueHow: e.target.value }))}
            placeholder="How will you continue this service?" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Fulfillment: {form.fulfillmentScore}/10</p>
            <input type="range" min={1} max={10} value={form.fulfillmentScore}
              onChange={e => setForm(f => ({ ...f, fulfillmentScore: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const st = SERVICE_CONFIG[e.serviceType]
          const sc = SCALE_CONFIG[e.scale]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${st.color}` }}>
              <span className="text-2xl">{st.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{st.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sc.color + '20', color: sc.color }}>{sc.label}</span>
                  <span className="text-xs text-green-400">🙌 {e.fulfillmentScore}/10</span>
                </div>
                {e.whatYouDid && <p className="text-xs text-slate-300 mt-1 line-clamp-1">{e.whatYouDid}</p>}
                {e.impactObserved && <p className="text-xs text-teal-300/70 mt-0.5">→ {e.impactObserved}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">The meaning of life is to find your gift. The purpose is to give it away.</p>
          </div>
        )}
      </div>
    </div>
  )
}
