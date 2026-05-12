import { useEffect, useState } from 'react'
import { Heart, Plus, Trash2, X, Edit3, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Value {
  id: string
  name: string
  description: string
  color: string
  alignment: number
}

const PRESET_VALUES = [
  { name: 'Integrity', description: 'Being honest and having strong moral principles' },
  { name: 'Growth', description: 'Continuous learning and self-improvement' },
  { name: 'Health', description: 'Physical and mental well-being' },
  { name: 'Family', description: 'Deep relationships with loved ones' },
  { name: 'Freedom', description: 'Independence and self-determination' },
  { name: 'Creativity', description: 'Expressing and creating unique ideas' },
  { name: 'Excellence', description: 'Doing everything to the best of your ability' },
  { name: 'Courage', description: 'Acting despite fear or uncertainty' },
  { name: 'Service', description: 'Helping and contributing to others' },
  { name: 'Mindfulness', description: 'Being present and aware in each moment' },
  { name: 'Adventure', description: 'Seeking new experiences and challenges' },
  { name: 'Balance', description: 'Harmony between all areas of life' },
]

const VALUE_COLORS = ['#8b5cf6', '#06b6d4', '#22c55e', '#f97316', '#ec4899', '#eab308', '#ef4444', '#3b82f6', '#a78bfa', '#34d399']

const ALIGNMENT_LABELS = ['Not aligned', 'Barely aligned', 'Somewhat', 'Mostly', 'Well aligned', 'Fully aligned']

function ValueCard({ value, onUpdate, onDelete }: {
  value: Value
  onUpdate: (id: string, updates: Partial<Value>) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(value.name)
  const [desc, setDesc] = useState(value.description)

  const save = () => {
    onUpdate(value.id, { name, description: desc })
    setEditing(false)
  }

  return (
    <div className="game-card p-4 border-l-4" style={{ borderLeftColor: value.color }}>
      {editing ? (
        <div className="space-y-2">
          <input value={name} onChange={e => setName(e.target.value)} className="game-input w-full font-semibold" autoFocus />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="game-input w-full text-sm resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg"><Check className="w-3 h-3" /> Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-slate-700 text-slate-400 text-xs rounded-lg hover:bg-slate-600"><X className="w-3 h-3" /></button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-bold text-slate-100" style={{ color: value.color }}>{value.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{value.description}</div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setEditing(true)} className="p-1 text-slate-600 hover:text-slate-400 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(value.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Life alignment</span>
              <span className="text-xs font-semibold" style={{ color: value.color }}>{ALIGNMENT_LABELS[value.alignment]}</span>
            </div>
            <input type="range" min="0" max="5" value={value.alignment}
              onChange={e => onUpdate(value.id, { alignment: parseInt(e.target.value) })}
              className="w-full" style={{ accentColor: value.color }} />
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(value.alignment / 5) * 100}%`, backgroundColor: value.color }} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function Values() {
  const { toastSuccess } = useToast()
  const [values, setValues] = useState<Value[]>(() => {
    const stored = localStorage.getItem('personal_values')
    return stored ? JSON.parse(stored) : []
  })
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [colorIdx, setColorIdx] = useState(0)

  const persist = (v: Value[]) => {
    setValues(v)
    localStorage.setItem('personal_values', JSON.stringify(v))
  }

  const addValue = () => {
    if (!newName.trim()) return
    const v: Value = {
      id: Date.now().toString(),
      name: newName.trim(),
      description: newDesc.trim(),
      color: VALUE_COLORS[colorIdx % VALUE_COLORS.length],
      alignment: 3,
    }
    persist([...values, v])
    setNewName('')
    setNewDesc('')
    setColorIdx(c => c + 1)
    setShowAdd(false)
    toastSuccess('Value added!')
  }

  const addPreset = (preset: typeof PRESET_VALUES[0]) => {
    if (values.find(v => v.name === preset.name)) return
    const v: Value = {
      id: Date.now().toString(),
      name: preset.name,
      description: preset.description,
      color: VALUE_COLORS[values.length % VALUE_COLORS.length],
      alignment: 3,
    }
    persist([...values, v])
  }

  const updateValue = (id: string, updates: Partial<Value>) => {
    persist(values.map(v => v.id === id ? { ...v, ...updates } : v))
  }

  const deleteValue = (id: string) => {
    persist(values.filter(v => v.id !== id))
  }

  const avgAlignment = values.length > 0
    ? (values.reduce((s, v) => s + v.alignment, 0) / values.length).toFixed(1)
    : null

  const lowAlignment = values.filter(v => v.alignment <= 2)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Personal Values
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {values.length > 0
              ? `${values.length} core values · avg alignment ${avgAlignment}/5`
              : 'Define what matters most to you'}
          </p>
        </div>
        <button onClick={() => setShowAdd(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
            showAdd ? 'bg-slate-700 text-slate-300' : 'bg-pink-600 hover:bg-pink-500 text-white'
          }`}>
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Add Value'}
        </button>
      </div>

      {/* Stats */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-2xl font-bold text-pink-400">{values.length}</div>
            <div className="text-xs text-slate-500">Core values</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-2xl font-bold text-violet-400">{avgAlignment}</div>
            <div className="text-xs text-slate-500">Avg alignment</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{values.filter(v => v.alignment >= 4).length}</div>
            <div className="text-xs text-slate-500">Well aligned</div>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <input autoFocus placeholder="Value name…" value={newName}
            onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addValue()}
            className="game-input w-full font-semibold" />
          <textarea placeholder="Brief description…" rows={2} value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="game-input w-full text-sm resize-none" />
          <div className="flex gap-1.5 flex-wrap">
            {VALUE_COLORS.map((c, i) => (
              <button key={i} onClick={() => setColorIdx(i)}
                className={`w-6 h-6 rounded-full transition-all ${colorIdx === i ? 'scale-125 ring-2 ring-white' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <button onClick={addValue} disabled={!newName.trim()}
            className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
            Add Value
          </button>
        </div>
      )}

      {/* Low alignment warning */}
      {lowAlignment.length > 0 && (
        <div className="game-card p-3 border border-red-500/20 bg-red-900/5">
          <div className="text-xs text-red-400 font-semibold mb-1">⚠️ Values misalignment detected</div>
          <div className="text-xs text-slate-500">
            You're not living in alignment with: {lowAlignment.map(v => v.name).join(', ')}
          </div>
        </div>
      )}

      {/* Values list */}
      {values.length > 0 ? (
        <div className="space-y-3">
          {values.map(v => (
            <ValueCard key={v.id} value={v} onUpdate={updateValue} onDelete={deleteValue} />
          ))}
        </div>
      ) : !showAdd ? (
        <>
          <div className="text-center py-6 text-slate-600">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No values defined yet</p>
            <p className="text-xs mt-1">Knowing your values guides better decisions</p>
          </div>
          {/* Presets */}
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Common Values</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_VALUES.map(p => (
                <button key={p.name} onClick={() => addPreset(p)}
                  className="game-card p-2 text-left hover:border-pink-500/40 transition-all">
                  <div className="text-sm font-semibold text-slate-300">{p.name}</div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-tight">{p.description}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {values.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Add from presets</h3>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_VALUES.filter(p => !values.find(v => v.name === p.name)).map(p => (
              <button key={p.name} onClick={() => addPreset(p)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-700 transition-colors">
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
