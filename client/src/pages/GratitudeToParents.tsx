import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type RelType = 'mother' | 'father' | 'grandparent' | 'guardian' | 'mentor' | 'sibling' | 'other'
type MemoryType = 'childhood' | 'lesson' | 'sacrifice' | 'memory' | 'trait' | 'moment' | 'other'

interface GratitudeEntry {
  id: string
  date: string
  person: string
  relType: RelType
  memType: MemoryType
  content: string
  expressed: boolean
  expressedHow: string
  impact: number
  createdAt: string
}

const REL_CONFIG: Record<RelType, { label: string; emoji: string }> = {
  mother:      { label: 'Mother',      emoji: '👩' },
  father:      { label: 'Father',      emoji: '👨' },
  grandparent: { label: 'Grandparent', emoji: '👴' },
  guardian:    { label: 'Guardian',    emoji: '🧑' },
  mentor:      { label: 'Mentor',      emoji: '🎓' },
  sibling:     { label: 'Sibling',     emoji: '👫' },
  other:       { label: 'Other',       emoji: '💗' },
}

const MEM_CONFIG: Record<MemoryType, { label: string; color: string }> = {
  childhood: { label: 'Childhood Memory', color: '#f59e0b' },
  lesson:    { label: 'Life Lesson',      color: '#22c55e' },
  sacrifice: { label: 'Sacrifice',        color: '#ef4444' },
  memory:    { label: 'Core Memory',      color: '#6366f1' },
  trait:     { label: 'Trait I Admire',   color: '#a855f7' },
  moment:    { label: 'Special Moment',   color: '#ec4899' },
  other:     { label: 'Other',            color: '#94a3b8' },
}

const STORAGE_KEY = 'gratitude_parents'

export default function GratitudeToParents() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GratitudeEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<GratitudeEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], person: '', relType: 'mother',
    memType: 'lesson', content: '', expressed: false, expressedHow: '', impact: 5,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: GratitudeEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.content.trim()) return
    const e: GratitudeEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], person: '', relType: 'mother', memType: 'lesson', content: '', expressed: false, expressedHow: '', impact: 5 })
    setShowForm(false)
    toastSuccess('Gratitude recorded 💗')
  }

  const expressed = entries.filter(e => e.expressed).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-red-400" />
            Family Gratitude
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Honor the people who shaped you.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{expressed}</div>
          <div className="text-xs text-slate-500">Expressed</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-slate-400">{entries.length - expressed}</div>
          <div className="text-xs text-slate-500">Unexpressed</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Record Gratitude</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm" />
            <select value={form.relType} onChange={e => setForm(f => ({ ...f, relType: e.target.value as RelType }))} className="game-input text-sm flex-1">
              {(Object.entries(REL_CONFIG) as [RelType, typeof REL_CONFIG.mother][]).map(([k, r]) => (
                <option key={k} value={k}>{r.emoji} {r.label}</option>
              ))}
            </select>
          </div>
          <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
            placeholder="Their name" className="game-input w-full" autoFocus />
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(MEM_CONFIG) as [MemoryType, typeof MEM_CONFIG.lesson][]).map(([k, m]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, memType: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.memType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.memType === k ? { background: m.color + '30', color: m.color } : {}}>
                {m.label}
              </button>
            ))}
          </div>
          <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="What are you grateful for? Be specific... *" className="game-input w-full h-20 resize-none text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-28">Impact: {form.impact}/10</span>
            <input type="range" min={1} max={10} value={form.impact}
              onChange={e => setForm(f => ({ ...f, impact: Number(e.target.value) }))}
              className="flex-1 h-1 accent-red-400" />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.expressed} onChange={e => setForm(f => ({ ...f, expressed: e.target.checked }))} className="accent-green-400" />
            I've expressed this to them
          </label>
          {form.expressed && (
            <input value={form.expressedHow} onChange={e => setForm(f => ({ ...f, expressedHow: e.target.value }))}
              placeholder="How did you express it?" className="game-input w-full text-sm" />
          )}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-800 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const r = REL_CONFIG[e.relType]
          const m = MEM_CONFIG[e.memType]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${m.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.person || r.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: m.color + '20', color: m.color }}>{m.label}</span>
                    {e.expressed && <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/10 text-green-400">expressed</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{e.content}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  <p className="text-sm text-slate-300 italic">"{e.content}"</p>
                  {e.expressedHow && <p className="text-xs text-green-400">💬 {e.expressedHow}</p>}
                  <p className="text-xs text-slate-500">Impact: {e.impact}/10 · {e.date}</p>
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">Delete</button>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Record gratitude for those who shaped you.</p>
          </div>
        )}
      </div>
    </div>
  )
}
