import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AbundanceArea = 'wealth' | 'love' | 'health' | 'opportunity' | 'time' | 'creativity' | 'friendship' | 'knowledge' | 'joy' | 'meaning'
type AbundanceMindshiftLevel = 'scarcity' | 'awareness' | 'shifting' | 'abundant' | 'overflowing'

interface AbundanceEntry {
  id: string
  area: AbundanceArea
  mindshift: AbundanceMindshiftLevel
  scarcityBelief: string
  abundanceEvidence: string
  giftsAlreadyPresent: string
  howYouAreEnough: string
  gratitudeMoment: string
  abundanceAction: string
  whatYouGave: string
  expansionScore: number
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<AbundanceArea, { label: string; emoji: string; color: string }> = {
  wealth:     { label: 'Wealth',      emoji: '💰', color: '#f59e0b' },
  love:       { label: 'Love',        emoji: '❤️', color: '#ec4899' },
  health:     { label: 'Health',      emoji: '💪', color: '#22c55e' },
  opportunity:{ label: 'Opportunity', emoji: '🚪', color: '#3b82f6' },
  time:       { label: 'Time',        emoji: '⏰', color: '#6366f1' },
  creativity: { label: 'Creativity',  emoji: '🎨', color: '#f97316' },
  friendship: { label: 'Friendship',  emoji: '🤝', color: '#10b981' },
  knowledge:  { label: 'Knowledge',   emoji: '📚', color: '#a855f7' },
  joy:        { label: 'Joy',         emoji: '☀️', color: '#eab308' },
  meaning:    { label: 'Meaning',     emoji: '✨', color: '#94a3b8' },
}

const MINDSHIFT_CONFIG: Record<AbundanceMindshiftLevel, { label: string; color: string }> = {
  scarcity:   { label: 'Scarcity',   color: '#ef4444' },
  awareness:  { label: 'Awareness',  color: '#f97316' },
  shifting:   { label: 'Shifting',   color: '#f59e0b' },
  abundant:   { label: 'Abundant',   color: '#3b82f6' },
  overflowing:{ label: 'Overflowing', color: '#22c55e' },
}

const STORAGE_KEY = 'abundance_log'

export default function AbundanceLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<AbundanceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<AbundanceEntry, 'id' | 'createdAt'>>({
    area: 'wealth', mindshift: 'shifting', scarcityBelief: '',
    abundanceEvidence: '', giftsAlreadyPresent: '', howYouAreEnough: '',
    gratitudeMoment: '', abundanceAction: '', whatYouGave: '', expansionScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: AbundanceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.giftsAlreadyPresent.trim()) return
    const e: AbundanceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, scarcityBelief: '', abundanceEvidence: '', giftsAlreadyPresent: '', howYouAreEnough: '', gratitudeMoment: '', abundanceAction: '', whatYouGave: '' }))
    setShowForm(false)
    toastSuccess('Abundance logged — what you appreciate, appreciates ☀️')
  }

  const overflowing = entries.filter(e => e.mindshift === 'overflowing' || e.mindshift === 'abundant').length
  const avgExpansion = entries.length ? Math.round(entries.reduce((s, e) => s + e.expansionScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-yellow-400" />
            Abundance Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Shift from scarcity to abundance in every dimension of life.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Shifts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{overflowing}</div>
          <div className="text-xs text-slate-500">Abundant+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{avgExpansion}/10</div>
          <div className="text-xs text-slate-500">Avg Expansion</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Abundance Shift</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as AbundanceArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [AbundanceArea, typeof AREA_CONFIG.wealth][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.mindshift} onChange={e => setForm(f => ({ ...f, mindshift: e.target.value as AbundanceMindshiftLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(MINDSHIFT_CONFIG) as [AbundanceMindshiftLevel, typeof MINDSHIFT_CONFIG.abundant][]).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>
          <input value={form.scarcityBelief} onChange={e => setForm(f => ({ ...f, scarcityBelief: e.target.value }))}
            placeholder="Scarcity belief you are working with" className="game-input w-full text-sm" autoFocus />
          <input value={form.abundanceEvidence} onChange={e => setForm(f => ({ ...f, abundanceEvidence: e.target.value }))}
            placeholder="Evidence of abundance that already exists" className="game-input w-full text-sm" />
          <input value={form.giftsAlreadyPresent} onChange={e => setForm(f => ({ ...f, giftsAlreadyPresent: e.target.value }))}
            placeholder="Gifts already present in your life *" className="game-input w-full text-sm" />
          <input value={form.howYouAreEnough} onChange={e => setForm(f => ({ ...f, howYouAreEnough: e.target.value }))}
            placeholder="How you are already enough" className="game-input w-full text-sm" />
          <input value={form.gratitudeMoment} onChange={e => setForm(f => ({ ...f, gratitudeMoment: e.target.value }))}
            placeholder="A moment of pure gratitude today" className="game-input w-full text-sm" />
          <input value={form.abundanceAction} onChange={e => setForm(f => ({ ...f, abundanceAction: e.target.value }))}
            placeholder="Abundance action you took (investing, giving)" className="game-input w-full text-sm" />
          <input value={form.whatYouGave} onChange={e => setForm(f => ({ ...f, whatYouGave: e.target.value }))}
            placeholder="What you gave freely today" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Abundance expansion: {form.expansionScore}/10</p>
            <input type="range" min={1} max={10} value={form.expansionScore}
              onChange={e => setForm(f => ({ ...f, expansionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-yellow-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const a = AREA_CONFIG[e.area]
          const m = MINDSHIFT_CONFIG[e.mindshift]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{a.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: m.color + '20', color: m.color }}>{m.label}</span>
                  <span className="text-xs text-yellow-400">☀️ {e.expansionScore}/10</span>
                </div>
                {e.giftsAlreadyPresent && <p className="text-xs text-green-300/70 mt-1 line-clamp-1">🎁 {e.giftsAlreadyPresent}</p>}
                {e.gratitudeMoment && <p className="text-xs text-amber-300/70 mt-0.5 line-clamp-1">✨ {e.gratitudeMoment}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Abundance is not about having everything. It is about being grateful for everything you have.</p>
          </div>
        )}
      </div>
    </div>
  )
}
