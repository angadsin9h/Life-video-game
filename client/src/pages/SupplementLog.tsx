import { useState, useEffect } from 'react'
import { Pill, Plus, Trash2, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SupplementCategory = 'vitamin' | 'mineral' | 'protein' | 'probiotic' | 'herb' | 'omega' | 'amino' | 'other'
type Frequency = 'daily' | 'twice' | 'weekly' | 'asneeded'

interface Supplement {
  id: string
  name: string
  category: SupplementCategory
  dosage: string
  frequency: Frequency
  timing: string
  purpose: string
  brand: string
  active: boolean
  startDate: string
  notes: string
  createdAt: string
}

interface DoseLog {
  [date: string]: string[] // supplement IDs taken
}

const CAT_CONFIG: Record<SupplementCategory, { label: string; emoji: string; color: string }> = {
  vitamin:   { label: 'Vitamin',     emoji: '🍊', color: '#f59e0b' },
  mineral:   { label: 'Mineral',     emoji: '💎', color: '#6366f1' },
  protein:   { label: 'Protein',     emoji: '💪', color: '#22c55e' },
  probiotic: { label: 'Probiotic',   emoji: '🦠', color: '#3b82f6' },
  herb:      { label: 'Herb',        emoji: '🌿', color: '#84cc16' },
  omega:     { label: 'Omega/Fish',  emoji: '🐟', color: '#0ea5e9' },
  amino:     { label: 'Amino Acid',  emoji: '🧬', color: '#a855f7' },
  other:     { label: 'Other',       emoji: '💊', color: '#94a3b8' },
}

const FREQ_CONFIG: Record<Frequency, { label: string }> = {
  daily:    { label: 'Daily'       },
  twice:    { label: 'Twice/day'   },
  weekly:   { label: 'Weekly'      },
  asneeded: { label: 'As needed'   },
}

const STORAGE_KEY = 'supplement_log'
const DOSE_KEY = 'supplement_doses'

export default function SupplementLog() {
  const { toastSuccess } = useToast()
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [doses, setDoses] = useState<DoseLog>({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Supplement, 'id' | 'createdAt'>>({
    name: '', category: 'vitamin', dosage: '', frequency: 'daily',
    timing: 'morning', purpose: '', brand: '', active: true, startDate: new Date().toISOString().split('T')[0], notes: '',
  })

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    try {
      setSupplements(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setDoses(JSON.parse(localStorage.getItem(DOSE_KEY) || '{}'))
    } catch { /**/ }
  }, [])

  const saveSupplements = (u: Supplement[]) => { setSupplements(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveDoses = (u: DoseLog) => { setDoses(u); localStorage.setItem(DOSE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const s: Supplement = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveSupplements([s, ...supplements])
    setForm({ name: '', category: 'vitamin', dosage: '', frequency: 'daily', timing: 'morning', purpose: '', brand: '', active: true, startDate: new Date().toISOString().split('T')[0], notes: '' })
    setShowForm(false)
    toastSuccess(`${form.name} added 💊`)
  }

  const toggleDose = (suppId: string) => {
    const todayDoses = doses[today] || []
    const taken = todayDoses.includes(suppId)
    const updated = taken ? todayDoses.filter(id => id !== suppId) : [...todayDoses, suppId]
    saveDoses({ ...doses, [today]: updated })
    if (!taken) toastSuccess('Supplement logged ✓')
  }

  const todayDoses = doses[today] || []
  const active = supplements.filter(s => s.active)
  const takenToday = active.filter(s => todayDoses.includes(s.id)).length
  const streak = (() => {
    let count = 0
    const d = new Date()
    while (true) {
      const dateStr = d.toISOString().split('T')[0]
      const dayDoses = doses[dateStr] || []
      if (active.length > 0 && dayDoses.length >= active.length * 0.7) {
        count++
        d.setDate(d.getDate() - 1)
      } else break
    }
    return count
  })()

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Pill className="w-7 h-7 text-teal-400" />
            Supplement Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track vitamins, minerals, and supplements.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{active.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">{takenToday}/{active.length}</div>
          <div className="text-xs text-slate-500">Taken Today</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
      </div>

      {/* Today's check-off */}
      {active.length > 0 && (
        <div className="game-card p-4 border border-teal-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Today — {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="text-xs text-slate-500">{takenToday}/{active.length} taken</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full mb-3">
            <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${active.length ? (takenToday / active.length) * 100 : 0}%` }} />
          </div>
          <div className="space-y-2">
            {active.map(s => {
              const taken = todayDoses.includes(s.id)
              const c = CAT_CONFIG[s.category]
              return (
                <div key={s.id} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleDose(s.id)}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${taken ? 'border-teal-500 bg-teal-500' : 'border-slate-600'}`}>
                    {taken && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm">{c.emoji}</span>
                  <div className="flex-1">
                    <span className={`text-sm ${taken ? 'text-slate-500 line-through' : 'text-white'}`}>{s.name}</span>
                    {s.dosage && <span className="text-xs text-slate-600 ml-1.5">{s.dosage}</span>}
                  </div>
                  <span className="text-xs text-slate-600">{s.timing}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Supplement</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *" className="game-input flex-1" autoFocus />
            <input value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
              placeholder="Dose (e.g. 500mg)" className="game-input w-32 text-sm" />
          </div>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as SupplementCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [SupplementCategory, typeof CAT_CONFIG.vitamin][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value as Frequency }))} className="game-input text-sm flex-1">
              {(Object.entries(FREQ_CONFIG) as [Frequency, typeof FREQ_CONFIG.daily][]).map(([k, fr]) => (
                <option key={k} value={k}>{fr.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.timing} onChange={e => setForm(f => ({ ...f, timing: e.target.value }))}
              placeholder="When (e.g. morning, with food)" className="game-input flex-1 text-sm" />
            <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              placeholder="Brand" className="game-input flex-1 text-sm" />
          </div>
          <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="Purpose / why taking it" className="game-input w-full text-sm" />
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {supplements.filter(s => !s.active).length > 0 && (
        <div>
          <p className="text-xs text-slate-600 mb-2 uppercase tracking-wider">Inactive</p>
          <div className="space-y-1">
            {supplements.filter(s => !s.active).map(s => {
              const c = CAT_CONFIG[s.category]
              return (
                <div key={s.id} className="game-card p-3 flex items-center gap-3 opacity-50">
                  <span>{c.emoji}</span>
                  <span className="text-sm text-slate-400 flex-1 line-through">{s.name}</span>
                  <button onClick={() => saveSupplements(supplements.map(x => x.id === s.id ? { ...x, active: true } : x))}
                    className="text-xs text-teal-500 hover:text-teal-300">Reactivate</button>
                  <button onClick={() => saveSupplements(supplements.filter(x => x.id !== s.id))}
                    className="text-xs text-slate-700 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {supplements.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Pill className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Add your daily supplements to track your regimen.</p>
        </div>
      )}
    </div>
  )
}
