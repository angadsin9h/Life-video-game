import { useState, useEffect } from 'react'
import { Droplets, Plus, Trash2, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ProductStep = 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'mask' | 'eye-cream' | 'oil' | 'other'
type Routine = 'am' | 'pm' | 'weekly'
type SkinType = 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive'

interface Product {
  id: string
  name: string
  brand: string
  step: ProductStep
  routine: Routine[]
  notes: string
  rating: number
  active: boolean
  startDate: string
  createdAt: string
}

interface DailyLog {
  [date: string]: {
    am: string[]
    pm: string[]
    skinFeeling: number
    notes: string
  }
}

const STEP_CONFIG: Record<ProductStep, { label: string; emoji: string; order: number }> = {
  cleanser:    { label: 'Cleanser',    emoji: '🫧', order: 1 },
  toner:       { label: 'Toner',       emoji: '💧', order: 2 },
  treatment:   { label: 'Treatment',   emoji: '⚗️', order: 3 },
  serum:       { label: 'Serum',       emoji: '💉', order: 4 },
  'eye-cream': { label: 'Eye Cream',   emoji: '👁️', order: 5 },
  moisturizer: { label: 'Moisturizer', emoji: '🧴', order: 6 },
  oil:         { label: 'Face Oil',    emoji: '✨', order: 7 },
  sunscreen:   { label: 'Sunscreen',   emoji: '☀️', order: 8 },
  mask:        { label: 'Mask',        emoji: '🎭', order: 9 },
  other:       { label: 'Other',       emoji: '🌸', order: 10 },
}

const STORAGE_KEY = 'skincare_products'
const LOG_KEY = 'skincare_log'

export default function SkinCareLog() {
  const { toastSuccess } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [log, setLog] = useState<DailyLog>({})
  const [showForm, setShowForm] = useState(false)
  const [activeRoutine, setActiveRoutine] = useState<'am' | 'pm'>('am')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [form, setForm] = useState<Omit<Product, 'id' | 'createdAt'>>({
    name: '', brand: '', step: 'moisturizer', routine: ['am', 'pm'],
    notes: '', rating: 0, active: true, startDate: new Date().toISOString().split('T')[0],
  })
  const [skinNote, setSkinNote] = useState('')
  const [skinFeeling, setSkinFeeling] = useState(7)

  useEffect(() => {
    try {
      setProducts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setLog(JSON.parse(localStorage.getItem(LOG_KEY) || '{}'))
    } catch { /**/ }
  }, [])

  const saveProducts = (u: Product[]) => { setProducts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveLog = (u: DailyLog) => { setLog(u); localStorage.setItem(LOG_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const p: Product = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveProducts([p, ...products])
    setForm({ name: '', brand: '', step: 'moisturizer', routine: ['am', 'pm'], notes: '', rating: 0, active: true, startDate: new Date().toISOString().split('T')[0] })
    setShowForm(false)
    toastSuccess(`${form.name} added ✨`)
  }

  const toggleCheck = (productId: string) => {
    const dayLog = log[selectedDate] || { am: [], pm: [], skinFeeling: 7, notes: '' }
    const routine = activeRoutine
    const checked = dayLog[routine].includes(productId)
    const updated = {
      ...dayLog,
      [routine]: checked ? dayLog[routine].filter(id => id !== productId) : [...dayLog[routine], productId],
    }
    saveLog({ ...log, [selectedDate]: updated })
  }

  const saveSkinNote = () => {
    const dayLog = log[selectedDate] || { am: [], pm: [], skinFeeling: 7, notes: '' }
    saveLog({ ...log, [selectedDate]: { ...dayLog, skinFeeling, notes: skinNote } })
    toastSuccess('Skin note saved!')
  }

  const routineProducts = products
    .filter(p => p.active && p.routine.includes(activeRoutine))
    .sort((a, b) => STEP_CONFIG[a.step].order - STEP_CONFIG[b.step].order)

  const dayLog = log[selectedDate] || { am: [], pm: [], skinFeeling: 7, notes: '' }
  const checkedCount = dayLog[activeRoutine].length
  const streak = (() => {
    let count = 0
    const d = new Date()
    while (true) {
      const dateStr = d.toISOString().split('T')[0]
      const dl = log[dateStr]
      if (dl && (dl.am.length > 0 || dl.pm.length > 0)) {
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
            <Droplets className="w-7 h-7 text-pink-400" />
            Skin Care Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your skincare routine and products.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{products.filter(p => p.active).length}</div>
          <div className="text-xs text-slate-500">Products</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{checkedCount}</div>
          <div className="text-xs text-slate-500">Done Today</div>
        </div>
      </div>

      {/* Date and routine selector */}
      <div className="flex gap-2">
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="game-input text-sm flex-1" />
        <button onClick={() => setActiveRoutine('am')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${activeRoutine === 'am' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          ☀️ AM
        </button>
        <button onClick={() => setActiveRoutine('pm')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${activeRoutine === 'pm' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
          🌙 PM
        </button>
      </div>

      {/* Routine checklist */}
      {routineProducts.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">{activeRoutine === 'am' ? '☀️ Morning' : '🌙 Evening'} Routine</span>
            <span className="text-xs text-slate-500">{checkedCount}/{routineProducts.length}</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full mb-3">
            <div className="h-full bg-pink-500 rounded-full transition-all"
              style={{ width: `${routineProducts.length ? (checkedCount / routineProducts.length) * 100 : 0}%` }} />
          </div>
          <div className="space-y-2">
            {routineProducts.map(p => {
              const checked = dayLog[activeRoutine].includes(p.id)
              const s = STEP_CONFIG[p.step]
              return (
                <div key={p.id} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleCheck(p.id)}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${checked ? 'border-pink-500 bg-pink-500' : 'border-slate-600'}`}>
                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm">{s.emoji}</span>
                  <div className="flex-1">
                    <span className={`text-sm ${checked ? 'text-slate-500 line-through' : 'text-white'}`}>{p.name}</span>
                    {p.brand && <span className="text-xs text-slate-600 ml-1.5">{p.brand}</span>}
                  </div>
                  <span className="text-xs text-slate-600">{s.label}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={skinNote} onChange={e => setSkinNote(e.target.value)}
              placeholder="How does skin feel today?" className="game-input flex-1 text-xs" />
            <button onClick={saveSkinNote} className="px-3 py-1.5 bg-pink-700/30 text-pink-400 rounded-xl text-xs hover:bg-pink-700/50">Save</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Product</h3>
          <div className="flex gap-2">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Product name *" className="game-input flex-1" autoFocus />
            <input value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              placeholder="Brand" className="game-input flex-1 text-sm" />
          </div>
          <select value={form.step} onChange={e => setForm(f => ({ ...f, step: e.target.value as ProductStep }))} className="game-input text-sm w-full">
            {(Object.entries(STEP_CONFIG) as [ProductStep, typeof STEP_CONFIG.moisturizer][])
              .sort(([,a],[,b]) => a.order - b.order)
              .map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
          </select>
          <div className="flex gap-2">
            {(['am', 'pm', 'weekly'] as Routine[]).map(r => (
              <button key={r} onClick={() => setForm(f => ({
                ...f, routine: f.routine.includes(r) ? f.routine.filter(x => x !== r) : [...f.routine, r],
              }))}
                className={`flex-1 py-1.5 rounded-xl text-xs uppercase ${form.routine.includes(r) ? 'bg-pink-700/30 text-pink-400' : 'bg-slate-800 text-slate-500'}`}>
                {r}
              </button>
            ))}
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes about this product..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Product list */}
      {products.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-600 uppercase tracking-wider">All Products</p>
          {products.map(p => {
            const s = STEP_CONFIG[p.step]
            return (
              <div key={p.id} className={`game-card p-3 flex items-center gap-3 ${!p.active ? 'opacity-50' : ''}`}>
                <span className="text-xl">{s.emoji}</span>
                <div className="flex-1">
                  <span className="text-sm text-white">{p.name}</span>
                  {p.brand && <span className="text-xs text-slate-600 ml-1.5">{p.brand}</span>}
                  <p className="text-xs text-slate-500">{s.label} · {p.routine.join('/')} routine</p>
                </div>
                <button onClick={() => saveProducts(products.map(x => x.id === p.id ? { ...x, active: !x.active } : x))}
                  className="text-xs text-slate-600 hover:text-slate-300">{p.active ? 'Pause' : 'Activate'}</button>
                <button onClick={() => saveProducts(products.filter(x => x.id !== p.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {products.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Droplets className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Add your skincare products and track your daily routine.</p>
        </div>
      )}
    </div>
  )
}
