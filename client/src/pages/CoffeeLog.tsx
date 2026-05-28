import { useState, useEffect } from 'react'
import { Flame, Plus, Trash2, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BrewMethod = 'espresso' | 'pourover' | 'frenchpress' | 'aeropress' | 'chemex' | 'moka' | 'coldbrew' | 'drip' | 'other'
type RoastLevel = 'light' | 'medium' | 'mediumdark' | 'dark'

interface CoffeeEntry {
  id: string
  date: string
  time: string
  method: BrewMethod
  origin: string
  roaster: string
  roastLevel: RoastLevel
  grindSize: string
  dose: number
  water: number
  brewTime: string
  tasting: string
  rating: number
  notes: string
}

const METHOD_CONFIG: Record<BrewMethod, { label: string; emoji: string }> = {
  espresso:   { label: 'Espresso',    emoji: '☕' },
  pourover:   { label: 'Pour Over',   emoji: '🫗' },
  frenchpress:{ label: 'French Press',emoji: '🫖' },
  aeropress:  { label: 'Aeropress',   emoji: '🔧' },
  chemex:     { label: 'Chemex',      emoji: '⚗️' },
  moka:       { label: 'Moka Pot',    emoji: '🍵' },
  coldbrew:   { label: 'Cold Brew',   emoji: '🧊' },
  drip:       { label: 'Drip',        emoji: '💧' },
  other:      { label: 'Other',       emoji: '☕' },
}

const ROAST_CONFIG: Record<RoastLevel, { label: string; color: string }> = {
  light:      { label: 'Light',       color: '#d4a574' },
  medium:     { label: 'Medium',      color: '#a0522d' },
  mediumdark: { label: 'Medium Dark', color: '#6b3a2a' },
  dark:       { label: 'Dark',        color: '#3d1a0e' },
}

const STORAGE_KEY = 'coffee_log'

export default function CoffeeLog() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [entries, setEntries] = useState<CoffeeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [form, setForm] = useState<Omit<CoffeeEntry, 'id'>>({
    date: today, time: new Date().toTimeString().slice(0,5), method: 'pourover', origin: '', roaster: '', roastLevel: 'medium',
    grindSize: '', dose: 20, water: 300, brewTime: '', tasting: '', rating: 4, notes: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: CoffeeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.origin.trim() && !form.roaster.trim() && !form.notes.trim()) { toastSuccess('Add some details first'); return }
    const e: CoffeeEntry = { id: Date.now().toString(), ...form }
    save([e, ...entries])
    setForm({ date: today, time: new Date().toTimeString().slice(0,5), method: 'pourover', origin: '', roaster: '', roastLevel: 'medium', grindSize: '', dose: 20, water: 300, brewTime: '', tasting: '', rating: 4, notes: '' })
    setShowForm(false)
    toastSuccess(`${METHOD_CONFIG[form.method].emoji} Brew logged!`)
  }

  const displayed = filterMethod === 'all' ? entries : entries.filter(e => e.method === filterMethod)
  const totalBrews = entries.length
  const avgRating = totalBrews ? (entries.reduce((s, e) => s + e.rating, 0) / totalBrews).toFixed(1) : '—'
  const topOrigins = entries.reduce((acc, e) => { if (e.origin) acc[e.origin] = (acc[e.origin] || 0) + 1; return acc }, {} as Record<string, number>)
  const topOrigin = Object.entries(topOrigins).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flame className="w-7 h-7 text-amber-600" />
            Coffee Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your brews, beans, and tasting notes.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Brew
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{totalBrews}</div>
          <div className="text-xs text-slate-500">Brews</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{avgRating}</div>
          <div className="text-xs text-slate-500">Avg Rating</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-white truncate">{topOrigin || '—'}</div>
          <div className="text-xs text-slate-500">Top Origin</div>
        </div>
      </div>

      {/* Method filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilterMethod('all')}
          className={`px-2.5 py-1 rounded-full text-xs ${filterMethod === 'all' ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>All</button>
        {(Object.entries(METHOD_CONFIG) as [BrewMethod, typeof METHOD_CONFIG.espresso][]).map(([k, m]) => (
          <button key={k} onClick={() => setFilterMethod(k)}
            className={`px-2.5 py-1 rounded-full text-xs ${filterMethod === k ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Brew</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              className="game-input text-sm w-28" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(METHOD_CONFIG) as [BrewMethod, typeof METHOD_CONFIG.espresso][]).map(([k, m]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, method: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.method === k ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
              placeholder="Origin (e.g., Ethiopia, Colombia)" className="game-input flex-1 text-sm" autoFocus />
            <input value={form.roaster} onChange={e => setForm(f => ({ ...f, roaster: e.target.value }))}
              placeholder="Roaster" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2">
            {(Object.entries(ROAST_CONFIG) as [RoastLevel, typeof ROAST_CONFIG.light][]).map(([k, r]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, roastLevel: k }))}
                className={`flex-1 py-1 rounded-lg text-xs text-center ${form.roastLevel === k ? 'ring-1 ring-amber-400 text-amber-400' : 'bg-slate-800 text-slate-500'}`}
                style={form.roastLevel === k ? { background: r.color + '30' } : {}}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1 flex-col">
              <span className="text-xs text-slate-500">Dose (g)</span>
              <input type="number" value={form.dose} min={0} step={0.1}
                onChange={e => setForm(f => ({ ...f, dose: Number(e.target.value) }))}
                className="game-input w-full text-sm text-center" />
            </div>
            <div className="flex items-center gap-1 flex-col">
              <span className="text-xs text-slate-500">Water (ml)</span>
              <input type="number" value={form.water} min={0}
                onChange={e => setForm(f => ({ ...f, water: Number(e.target.value) }))}
                className="game-input w-full text-sm text-center" />
            </div>
            <div className="flex items-center gap-1 flex-col">
              <span className="text-xs text-slate-500">Brew Time</span>
              <input value={form.brewTime} onChange={e => setForm(f => ({ ...f, brewTime: e.target.value }))}
                placeholder="3:30" className="game-input w-full text-sm text-center" />
            </div>
          </div>
          <textarea value={form.tasting} onChange={e => setForm(f => ({ ...f, tasting: e.target.value }))}
            placeholder="Tasting notes (fruity, nutty, chocolate, floral...)" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className={`text-xl ${form.rating >= n ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Save Brew</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {displayed.map(e => {
          const m = METHOD_CONFIG[e.method]
          const r = ROAST_CONFIG[e.roastLevel]
          return (
            <div key={e.id} className="game-card p-4 flex gap-3">
              <span className="text-2xl flex-shrink-0">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">{m.label}</span>
                  {e.origin && <span className="text-xs text-amber-400">{e.origin}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded text-amber-300/70" style={{ background: r.color + '30' }}>{r.label}</span>
                </div>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{e.date} {e.time}</span>
                  {e.roaster && <span>{e.roaster}</span>}
                  {e.dose > 0 && <span>{e.dose}g:{e.water}ml</span>}
                  {e.brewTime && <span>{e.brewTime}</span>}
                </div>
                {e.tasting && <p className="text-xs text-slate-400 mt-1 italic">"{e.tasting}"</p>}
                <div className="flex items-center gap-1 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} className={`w-3 h-3 ${e.rating >= n ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {displayed.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Flame className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No brews logged yet. Start your coffee journey!</p>
          </div>
        )}
      </div>
    </div>
  )
}
