import { useState, useEffect } from 'react'
import { Trophy, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PRCategory = 'fitness' | 'mental' | 'skill' | 'social' | 'financial' | 'creative' | 'intellectual' | 'endurance' | 'other'

interface PersonalRecord {
  id: string
  category: PRCategory
  name: string
  description: string
  value: string
  unit: string
  previous: string
  improvementPct: number
  date: string
  context: string
  howAchieved: string
  isCurrent: boolean
  history: Array<{ date: string; value: string; notes: string }>
  createdAt: string
}

const CAT_CONFIG: Record<PRCategory, { label: string; emoji: string; color: string }> = {
  fitness:      { label: 'Fitness',      emoji: '🏋️', color: '#ef4444' },
  mental:       { label: 'Mental',       emoji: '🧠', color: '#a855f7' },
  skill:        { label: 'Skill',        emoji: '⚡', color: '#3b82f6' },
  social:       { label: 'Social',       emoji: '👥', color: '#ec4899' },
  financial:    { label: 'Financial',    emoji: '💰', color: '#22c55e' },
  creative:     { label: 'Creative',     emoji: '🎨', color: '#f97316' },
  intellectual: { label: 'Intellectual', emoji: '📚', color: '#6366f1' },
  endurance:    { label: 'Endurance',    emoji: '🏃', color: '#f59e0b' },
  other:        { label: 'Other',        emoji: '🏆', color: '#94a3b8' },
}

const STORAGE_KEY = 'personal_prs'

export default function PersonalPRs() {
  const { toastSuccess } = useToast()
  const [records, setRecords] = useState<PersonalRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [form, setForm] = useState<Omit<PersonalRecord, 'id' | 'createdAt' | 'history'>>({
    category: 'fitness', name: '', description: '', value: '', unit: '',
    previous: '', improvementPct: 0, date: new Date().toISOString().split('T')[0],
    context: '', howAchieved: '', isCurrent: true,
  })

  useEffect(() => {
    try { setRecords(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: PersonalRecord[]) => { setRecords(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim() || !form.value.trim()) return
    const r: PersonalRecord = {
      id: Date.now().toString(), ...form,
      history: [{ date: form.date, value: form.value, notes: form.context }],
      createdAt: new Date().toISOString(),
    }
    save([r, ...records])
    setForm(f => ({ ...f, name: '', description: '', value: '', previous: '', context: '', howAchieved: '', improvementPct: 0 }))
    setShowForm(false)
    toastSuccess('Personal record set! 🏆')
  }

  const updatePR = (id: string, value: string, context: string) => {
    save(records.map(r => r.id === id ? {
      ...r, value, previous: r.value, isCurrent: true,
      history: [...r.history, { date: new Date().toISOString().split('T')[0], value, notes: context }],
    } : r))
    toastSuccess('PR updated! 🏆')
  }

  const filtered = records.filter(r => filterCat === 'all' || r.category === filterCat)
  const current = records.filter(r => r.isCurrent).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Trophy className="w-7 h-7 text-yellow-400" />
            Personal Records
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your personal records across all life domains.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Set PR
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{records.length}</div>
          <div className="text-xs text-slate-500">Records</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{current}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{Object.keys(CAT_CONFIG).filter(k => records.some(r => r.category === k)).length}</div>
          <div className="text-xs text-slate-500">Domains</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCat('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === 'all' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(CAT_CONFIG) as [PRCategory, typeof CAT_CONFIG.fitness][]).map(([k, c]) => (
          <button key={k} onClick={() => setFilterCat(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterCat === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterCat === k ? { background: c.color + '30', color: c.color } : {}}>
            {c.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Set Personal Record</h3>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as PRCategory }))} className="game-input w-full text-sm">
            {(Object.entries(CAT_CONFIG) as [PRCategory, typeof CAT_CONFIG.fitness][]).map(([k, c]) => (
              <option key={k} value={k}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Record name (e.g., Bench Press, Longest Run) *" className="game-input w-full" autoFocus />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What does this measure?" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex gap-2">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Record Value *</p>
              <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                placeholder="e.g., 100" className="game-input w-full text-sm" />
            </div>
            <div className="w-20">
              <p className="text-xs text-slate-500 mb-1">Unit</p>
              <input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="kg, km..." className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Previous</p>
              <input value={form.previous} onChange={e => setForm(f => ({ ...f, previous: e.target.value }))}
                placeholder="e.g., 90" className="game-input w-full text-sm" />
            </div>
          </div>
          <input value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="Context / conditions" className="game-input w-full text-sm" />
          <input value={form.howAchieved} onChange={e => setForm(f => ({ ...f, howAchieved: e.target.value }))}
            placeholder="How did you achieve this?" className="game-input w-full text-sm" />
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Set Record!</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const c = CAT_CONFIG[r.category]
          const isExp = expanded === r.id
          return (
            <div key={r.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${c.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : r.id)}>
                <span className="text-2xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white text-sm">{r.name}</span>
                    <span className="text-lg font-bold" style={{ color: c.color }}>{r.value}{r.unit}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.label} · {r.date}{r.previous ? ` · was ${r.previous}${r.unit}` : ''}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {r.description && <p className="text-xs text-slate-300">{r.description}</p>}
                  {r.context && <p className="text-xs text-blue-300">📍 {r.context}</p>}
                  {r.howAchieved && <p className="text-xs text-green-300">💡 {r.howAchieved}</p>}
                  {r.history.length > 1 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">History:</p>
                      <div className="flex gap-3 overflow-x-auto">
                        {r.history.slice(-5).map((h, i) => (
                          <div key={i} className="text-center shrink-0">
                            <p className="text-xs font-bold" style={{ color: c.color }}>{h.value}{r.unit}</p>
                            <p className="text-xs text-slate-600">{h.date.slice(5)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input placeholder="New PR value" id={`pr-${r.id}`} className="game-input text-sm w-28" />
                    <button onClick={() => {
                      const el = document.getElementById(`pr-${r.id}`) as HTMLInputElement
                      if (el?.value) updatePR(r.id, el.value, '')
                    }} className="px-2 py-1 bg-yellow-700/30 text-yellow-400 rounded text-xs">New PR!</button>
                    <button onClick={() => save(records.filter(x => x.id !== r.id))} className="ml-auto text-slate-700 hover:text-red-400">
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
            <p className="text-sm">Track your records across every area of life — not just the gym.</p>
          </div>
        )}
      </div>
    </div>
  )
}
