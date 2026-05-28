import { useState, useEffect } from 'react'
import { Apple, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type NutritionCategory = 'protein' | 'veggies' | 'hydration' | 'fasting' | 'gut-health' | 'sugar-free' | 'whole-food' | 'mindful-eating' | 'supplements' | 'other'

interface NutritionWin {
  id: string
  category: NutritionCategory
  title: string
  description: string
  howFelt: string
  wouldRepeat: boolean
  energyImpact: number
  date: string
  createdAt: string
}

const CAT_CONFIG: Record<NutritionCategory, { label: string; emoji: string; color: string }> = {
  protein:          { label: 'Protein',        emoji: '🥩', color: '#ef4444' },
  veggies:          { label: 'Veggies',        emoji: '🥦', color: '#22c55e' },
  hydration:        { label: 'Hydration',      emoji: '💧', color: '#3b82f6' },
  fasting:          { label: 'Fasting',        emoji: '⏰', color: '#f59e0b' },
  'gut-health':     { label: 'Gut Health',     emoji: '🦠', color: '#84cc16' },
  'sugar-free':     { label: 'Sugar-Free',     emoji: '🚫', color: '#f97316' },
  'whole-food':     { label: 'Whole Food',     emoji: '🌾', color: '#a855f7' },
  'mindful-eating': { label: 'Mindful Eating', emoji: '🧘', color: '#6366f1' },
  supplements:      { label: 'Supplements',    emoji: '💊', color: '#0ea5e9' },
  other:            { label: 'Other',          emoji: '🍽️', color: '#94a3b8' },
}

const STORAGE_KEY = 'nutrition_wins'

export default function NutritionWins() {
  const { toastSuccess } = useToast()
  const [wins, setWins] = useState<NutritionWin[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<NutritionWin, 'id' | 'createdAt'>>({
    category: 'veggies', title: '', description: '', howFelt: '',
    wouldRepeat: true, energyImpact: 7, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setWins(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: NutritionWin[]) => { setWins(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const w: NutritionWin = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([w, ...wins])
    setForm(f => ({ ...f, title: '', description: '', howFelt: '' }))
    setShowForm(false)
    toastSuccess('Nutrition win logged 🥦')
  }

  const filtered = wins.filter(w => filterCat === 'all' || w.category === filterCat)
  const today = wins.filter(w => w.date === new Date().toISOString().split('T')[0]).length
  const wouldRepeat = wins.filter(w => w.wouldRepeat).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Apple className="w-7 h-7 text-green-400" />
            Nutrition Wins
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Celebrate your healthy food choices and track what works.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Win
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{wins.length}</div>
          <div className="text-xs text-slate-500">Total Wins</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{today}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{wouldRepeat}</div>
          <div className="text-xs text-slate-500">Worth Repeating</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [NutritionCategory, typeof CAT_CONFIG.veggies][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Nutrition Win</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as NutritionCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [NutritionCategory, typeof CAT_CONFIG.veggies][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="What did you do? *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the meal / choice..." className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.howFelt} onChange={e => setForm(f => ({ ...f, howFelt: e.target.value }))}
            placeholder="How did you feel afterwards?" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Energy impact: {form.energyImpact}/10</p>
              <input type="range" min={1} max={10} value={form.energyImpact}
                onChange={e => setForm(f => ({ ...f, energyImpact: Number(e.target.value) }))}
                className="w-full h-1 accent-green-400" />
            </div>
            <div className="flex flex-col gap-1">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-xs" />
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={form.wouldRepeat} onChange={e => setForm(f => ({ ...f, wouldRepeat: e.target.checked }))} />
                Would repeat
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Log!</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(w => {
          const c = CAT_CONFIG[w.category]
          return (
            <div key={w.id} className="game-card p-3 flex items-center gap-3" style={{ borderLeft: `3px solid ${c.color}` }}>
              <span className="text-2xl">{c.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{w.title}</span>
                  {w.wouldRepeat && <span className="text-xs text-green-400">🔄</span>}
                </div>
                <p className="text-xs text-slate-500">{c.label} · {w.date} · energy {w.energyImpact}/10</p>
              </div>
              <button onClick={() => save(wins.filter(x => x.id !== w.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Apple className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Food is information for your body. Log what makes you thrive.</p>
          </div>
        )}
      </div>
    </div>
  )
}
