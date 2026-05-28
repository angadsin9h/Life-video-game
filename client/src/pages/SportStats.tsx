import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Sport = 'running' | 'cycling' | 'swimming' | 'tennis' | 'basketball' | 'soccer' | 'golf' | 'climbing' | 'rowing' | 'other'
type ResultType = 'personal-best' | 'race' | 'match' | 'training' | 'milestone'

interface SportResult {
  id: string
  date: string
  sport: Sport
  type: ResultType
  title: string
  value: string
  unit: string
  previousBest: string
  isPB: boolean
  notes: string
  createdAt: string
}

const SPORT_CONFIG: Record<Sport, { label: string; emoji: string; color: string }> = {
  running:    { label: 'Running',    emoji: '🏃', color: '#22c55e' },
  cycling:    { label: 'Cycling',    emoji: '🚴', color: '#3b82f6' },
  swimming:   { label: 'Swimming',   emoji: '🏊', color: '#0ea5e9' },
  tennis:     { label: 'Tennis',     emoji: '🎾', color: '#84cc16' },
  basketball: { label: 'Basketball', emoji: '🏀', color: '#f97316' },
  soccer:     { label: 'Soccer',     emoji: '⚽', color: '#22c55e' },
  golf:       { label: 'Golf',       emoji: '⛳', color: '#84cc16' },
  climbing:   { label: 'Climbing',   emoji: '🧗', color: '#f59e0b' },
  rowing:     { label: 'Rowing',     emoji: '🚣', color: '#3b82f6' },
  other:      { label: 'Other',      emoji: '🏅', color: '#a855f7' },
}

const TYPE_CONFIG: Record<ResultType, { label: string; color: string }> = {
  'personal-best': { label: 'Personal Best', color: '#f59e0b' },
  race:            { label: 'Race Result',   color: '#6366f1' },
  match:           { label: 'Match',         color: '#ef4444' },
  training:        { label: 'Training',      color: '#22c55e' },
  milestone:       { label: 'Milestone',     color: '#ec4899' },
}

const STORAGE_KEY = 'sport_stats'

export default function SportStats() {
  const { toastSuccess } = useToast()
  const [results, setResults] = useState<SportResult[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterSport, setFilterSport] = useState<string>('all')
  const [form, setForm] = useState<Omit<SportResult, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], sport: 'running', type: 'training',
    title: '', value: '', unit: 'km', previousBest: '', isPB: false, notes: '',
  })

  useEffect(() => {
    try { setResults(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SportResult[]) => { setResults(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const r: SportResult = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([r, ...results])
    setForm({ date: new Date().toISOString().split('T')[0], sport: form.sport, type: 'training', title: '', value: '', unit: form.unit, previousBest: '', isPB: false, notes: '' })
    setShowForm(false)
    toastSuccess(form.isPB ? '🏆 New Personal Best!' : 'Result logged!')
  }

  const pbs = results.filter(r => r.isPB).length
  const sportsUsed = [...new Set(results.map(r => r.sport))].length
  const filtered = results.filter(r => filterSport === 'all' || r.sport === filterSport)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Sport Stats
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Record results, PRs, and milestones across all sports.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{results.length}</div>
          <div className="text-xs text-slate-500">Results</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{pbs}</div>
          <div className="text-xs text-slate-500">Personal Bests</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{sportsUsed}</div>
          <div className="text-xs text-slate-500">Sports</div>
        </div>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterSport('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterSport === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {[...new Set(results.map(r => r.sport))].map(sport => {
          const c = SPORT_CONFIG[sport]
          return (
            <button key={sport} onClick={() => setFilterSport(sport)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterSport === sport ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={filterSport === sport ? { background: c.color + '30', color: c.color } : {}}>
              {c.emoji} {c.label}
            </button>
          )
        })}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Result</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value as Sport }))} className="game-input text-sm flex-1">
              {(Object.entries(SPORT_CONFIG) as [Sport, typeof SPORT_CONFIG.running][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(TYPE_CONFIG) as [ResultType, typeof TYPE_CONFIG.training][]).map(([k, t]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.type === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.type === k ? { background: t.color + '30', color: t.color } : {}}>
                {t.label}
              </button>
            ))}
          </div>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Title (e.g. 5K run, Tennis match) *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
              placeholder="Result value" className="game-input flex-1 text-sm" />
            <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              placeholder="Unit (km, min, pts)" className="game-input w-28 text-sm" />
          </div>
          <input value={form.previousBest} onChange={e => setForm(f => ({ ...f, previousBest: e.target.value }))}
            placeholder="Previous best (optional)" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.isPB} onChange={e => setForm(f => ({ ...f, isPB: e.target.checked }))} className="accent-yellow-400" />
            🏆 This is a personal best!
          </label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes / conditions / how it felt" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const s = SPORT_CONFIG[r.sport]
          const t = TYPE_CONFIG[r.type]
          const isExp = expanded === r.id
          return (
            <div key={r.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${r.isPB ? '#f59e0b' : s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : r.id)}>
                <span className="text-2xl">{r.isPB ? '🏆' : s.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{r.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {r.date}{r.value && ` · ${r.value} ${r.unit}`}
                    {r.previousBest && ` (prev: ${r.previousBest})`}
                  </p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {r.notes && <p className="text-sm text-slate-300">{r.notes}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => save(results.map(x => x.id === r.id ? { ...x, isPB: !x.isPB } : x))}
                      className="text-xs text-slate-500 hover:text-yellow-400">
                      {r.isPB ? 'Remove PB' : '🏆 Mark as PB'}
                    </button>
                    <button onClick={() => save(results.filter(x => x.id !== r.id))} className="text-xs text-slate-700 hover:text-red-400 ml-auto">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track your athletic results and personal bests.</p>
          </div>
        )}
      </div>
    </div>
  )
}
