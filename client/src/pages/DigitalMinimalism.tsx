import { useState, useEffect } from 'react'
import { Smartphone, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DigCategory = 'app' | 'service' | 'habit' | 'device' | 'notification' | 'content' | 'social' | 'email' | 'tool' | 'other'
type DigStatus = 'active' | 'reduced' | 'eliminated' | 'evaluating'

interface DigItem {
  id: string
  category: DigCategory
  name: string
  purpose: string
  actualValue: string
  timeSpent: number
  costPerMonth: number
  status: DigStatus
  action: string
  alternatives: string
  emotionalAttachment: number
  isEssential: boolean
  createdAt: string
}

const CAT_CONFIG: Record<DigCategory, { label: string; emoji: string; color: string }> = {
  app:          { label: 'App',           emoji: '📱', color: '#3b82f6' },
  service:      { label: 'Service',       emoji: '🌐', color: '#6366f1' },
  habit:        { label: 'Digital Habit', emoji: '🔄', color: '#f97316' },
  device:       { label: 'Device',        emoji: '💻', color: '#94a3b8' },
  notification: { label: 'Notification',  emoji: '🔔', color: '#f59e0b' },
  content:      { label: 'Content',       emoji: '📺', color: '#ec4899' },
  social:       { label: 'Social Media',  emoji: '👥', color: '#a855f7' },
  email:        { label: 'Email',         emoji: '📧', color: '#22c55e' },
  tool:         { label: 'Tool',          emoji: '🔧', color: '#0ea5e9' },
  other:        { label: 'Other',         emoji: '💡', color: '#84cc16' },
}

const STATUS_CONFIG: Record<DigStatus, { label: string; color: string }> = {
  active:      { label: 'Active',      color: '#ef4444' },
  reduced:     { label: 'Reduced',     color: '#f59e0b' },
  eliminated:  { label: 'Eliminated',  color: '#22c55e' },
  evaluating:  { label: 'Evaluating',  color: '#3b82f6' },
}

const STORAGE_KEY = 'digital_minimalism'

export default function DigitalMinimalism() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<DigItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<DigItem, 'id' | 'createdAt'>>({
    category: 'app', name: '', purpose: '', actualValue: '', timeSpent: 30,
    costPerMonth: 0, status: 'evaluating', action: '', alternatives: '',
    emotionalAttachment: 5, isEssential: false,
  })

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DigItem[]) => { setItems(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const i: DigItem = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([i, ...items])
    setForm(f => ({ ...f, name: '', purpose: '', actualValue: '', action: '', alternatives: '' }))
    setShowForm(false)
    toastSuccess('Digital item logged 📱')
  }

  const filtered = items.filter(i => filterCat === 'all' || i.category === filterCat)
  const eliminated = items.filter(i => i.status === 'eliminated').length
  const totalCost = items.filter(i => i.status === 'active').reduce((s, i) => s + i.costPerMonth, 0)
  const totalTime = items.reduce((s, i) => s + i.timeSpent, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Smartphone className="w-7 h-7 text-blue-400" />
            Digital Minimalism
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Audit your digital life and eliminate what doesn't serve you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Audit
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">${totalCost}</div>
          <div className="text-xs text-slate-500">$/month Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{totalTime}min</div>
          <div className="text-xs text-slate-500">Time Tracked</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{eliminated}</div>
          <div className="text-xs text-slate-500">Eliminated</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [DigCategory, typeof CAT_CONFIG.app][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Audit Digital Item</h3>
          <div className="flex gap-2">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as DigCategory }))} className="game-input text-sm flex-1">
              {(Object.entries(CAT_CONFIG) as [DigCategory, typeof CAT_CONFIG.app][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as DigStatus }))} className="game-input text-sm flex-1">
              {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="App / service / habit name *" className="game-input w-full" autoFocus />
          <input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
            placeholder="What is it supposed to do for you?" className="game-input w-full text-sm" />
          <input value={form.actualValue} onChange={e => setForm(f => ({ ...f, actualValue: e.target.value }))}
            placeholder="Does it actually provide value? Why / why not?" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Daily time (min)</p>
              <input type="number" value={form.timeSpent} min={0}
                onChange={e => setForm(f => ({ ...f, timeSpent: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Cost/month ($)</p>
              <input type="number" value={form.costPerMonth} min={0} step={0.5}
                onChange={e => setForm(f => ({ ...f, costPerMonth: Number(e.target.value) }))}
                className="game-input w-full text-sm" />
            </div>
          </div>
          <input value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            placeholder="Action: Delete / Limit / Keep / Replace" className="game-input w-full text-sm" />
          <input value={form.alternatives} onChange={e => setForm(f => ({ ...f, alternatives: e.target.value }))}
            placeholder="Analog or better alternatives" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Emotional attachment: {form.emotionalAttachment}/10</p>
              <input type="range" min={0} max={10} value={form.emotionalAttachment}
                onChange={e => setForm(f => ({ ...f, emotionalAttachment: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isEssential} onChange={e => setForm(f => ({ ...f, isEssential: e.target.checked }))} />
              Essential
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(i => {
          const c = CAT_CONFIG[i.category]
          const s = STATUS_CONFIG[i.status]
          const isExp = expanded === i.id
          return (
            <div key={i.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : i.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{i.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                    {i.isEssential && <span className="text-xs text-green-400">✓ essential</span>}
                  </div>
                  <p className="text-xs text-slate-500">{i.timeSpent}min/day{i.costPerMonth > 0 ? ` · $${i.costPerMonth}/mo` : ''}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {i.purpose && <p className="text-xs text-slate-400">🎯 Purpose: {i.purpose}</p>}
                  {i.actualValue && <p className="text-xs text-slate-300">💡 {i.actualValue}</p>}
                  {i.action && <p className="text-xs text-yellow-300">→ Action: {i.action}</p>}
                  {i.alternatives && <p className="text-xs text-green-300">♻️ Alt: {i.alternatives}</p>}
                  <p className="text-xs text-slate-500">Emotional attachment: {i.emotionalAttachment}/10</p>
                  <div className="flex gap-2 items-center">
                    <select value={i.status} onChange={ev => save(items.map(x => x.id === i.id ? { ...x, status: ev.target.value as DigStatus } : x))}
                      className="text-xs bg-transparent text-slate-500 border border-slate-700 rounded px-1 py-0.5">
                      {Object.entries(STATUS_CONFIG).map(([k, st]) => <option key={k} value={k}>{st.label}</option>)}
                    </select>
                    <button onClick={() => save(items.filter(x => x.id !== i.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <Smartphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">A cluttered digital life creates a cluttered mind. Audit it.</p>
          </div>
        )}
      </div>
    </div>
  )
}
