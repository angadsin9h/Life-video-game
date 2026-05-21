import { useState, useEffect } from 'react'
import { Brain, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ShiftArea = 'identity' | 'scarcity' | 'failure' | 'control' | 'relationships' | 'time' | 'money' | 'health' | 'purpose' | 'other'
type ShiftType = 'fixed-to-growth' | 'scarcity-to-abundance' | 'victim-to-creator' | 'past-to-present' | 'fear-to-curiosity' | 'reaction-to-response' | 'other'

interface MindsetShiftEntry {
  id: string
  area: ShiftArea
  shiftType: ShiftType
  oldMindset: string
  newMindset: string
  triggerMoment: string
  howItChanged: string
  evidence: string
  depth: number
  isLandmark: boolean
  date: string
  createdAt: string
}

const AREA_CONFIG: Record<ShiftArea, { label: string; emoji: string; color: string }> = {
  identity:      { label: 'Identity',      emoji: '🪞', color: '#a855f7' },
  scarcity:      { label: 'Scarcity',      emoji: '💸', color: '#f59e0b' },
  failure:       { label: 'Failure',       emoji: '📉', color: '#ef4444' },
  control:       { label: 'Control',       emoji: '🔗', color: '#6366f1' },
  relationships: { label: 'Relationships', emoji: '❤️', color: '#ec4899' },
  time:          { label: 'Time',          emoji: '⏰', color: '#0ea5e9' },
  money:         { label: 'Money',         emoji: '💰', color: '#22c55e' },
  health:        { label: 'Health',        emoji: '💪', color: '#f97316' },
  purpose:       { label: 'Purpose',       emoji: '🎯', color: '#3b82f6' },
  other:         { label: 'Other',         emoji: '💭', color: '#94a3b8' },
}

const SHIFT_CONFIG: Record<ShiftType, { label: string; color: string }> = {
  'fixed-to-growth':      { label: 'Fixed → Growth',      color: '#22c55e' },
  'scarcity-to-abundance':{ label: 'Scarcity → Abundance', color: '#f59e0b' },
  'victim-to-creator':    { label: 'Victim → Creator',    color: '#a855f7' },
  'past-to-present':      { label: 'Past → Present',      color: '#3b82f6' },
  'fear-to-curiosity':    { label: 'Fear → Curiosity',    color: '#0ea5e9' },
  'reaction-to-response': { label: 'Reaction → Response', color: '#ec4899' },
  other:                  { label: 'Other Shift',          color: '#94a3b8' },
}

const STORAGE_KEY = 'mindset_shifts_v2'

export default function MindsetShifts() {
  const { toastSuccess } = useToast()
  const [shifts, setShifts] = useState<MindsetShiftEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<MindsetShiftEntry, 'id' | 'createdAt'>>({
    area: 'identity', shiftType: 'fixed-to-growth', oldMindset: '', newMindset: '',
    triggerMoment: '', howItChanged: '', evidence: '', depth: 7, isLandmark: false,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setShifts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MindsetShiftEntry[]) => { setShifts(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.oldMindset.trim()) return
    const s: MindsetShiftEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([s, ...shifts])
    setForm(f => ({ ...f, oldMindset: '', newMindset: '', triggerMoment: '', howItChanged: '', evidence: '', isLandmark: false }))
    setShowForm(false)
    toastSuccess('Mindset shift recorded — you\'re rewiring 🧠')
  }

  const landmarks = shifts.filter(s => s.isLandmark).length
  const avgDepth = shifts.length ? Math.round(shifts.reduce((s, e) => s + e.depth, 0) / shifts.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Brain className="w-7 h-7 text-purple-400" />
            Mindset Shifts
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document the moments your perspective transformed.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Record
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{shifts.length}</div>
          <div className="text-xs text-slate-500">Shifts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{landmarks}</div>
          <div className="text-xs text-slate-500">Landmark Shifts</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{avgDepth}/10</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Record Mindset Shift</h3>
          <div className="flex gap-2">
            <select value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value as ShiftArea }))} className="game-input text-sm flex-1">
              {(Object.entries(AREA_CONFIG) as [ShiftArea, typeof AREA_CONFIG.identity][]).map(([k, a]) => (
                <option key={k} value={k}>{a.emoji} {a.label}</option>
              ))}
            </select>
            <select value={form.shiftType} onChange={e => setForm(f => ({ ...f, shiftType: e.target.value as ShiftType }))} className="game-input text-sm flex-1">
              {(Object.entries(SHIFT_CONFIG) as [ShiftType, typeof SHIFT_CONFIG['fixed-to-growth']][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.oldMindset} onChange={e => setForm(f => ({ ...f, oldMindset: e.target.value }))}
            placeholder="The old belief / perspective *" className="game-input w-full h-12 resize-none text-sm line-through text-red-300" autoFocus />
          <textarea value={form.newMindset} onChange={e => setForm(f => ({ ...f, newMindset: e.target.value }))}
            placeholder="The new belief / perspective →" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.triggerMoment} onChange={e => setForm(f => ({ ...f, triggerMoment: e.target.value }))}
            placeholder="What triggered or catalyzed this shift?" className="game-input w-full text-sm" />
          <input value={form.howItChanged} onChange={e => setForm(f => ({ ...f, howItChanged: e.target.value }))}
            placeholder="How has this changed your actions?" className="game-input w-full text-sm" />
          <input value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="Evidence the new mindset is working" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Depth of shift: {form.depth}/10</p>
              <input type="range" min={1} max={10} value={form.depth}
                onChange={e => setForm(f => ({ ...f, depth: Number(e.target.value) }))}
                className="w-full h-1 accent-purple-400" />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isLandmark} onChange={e => setForm(f => ({ ...f, isLandmark: e.target.checked }))} />
              🌟 Landmark
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Record Shift</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {shifts.map(s => {
          const a = AREA_CONFIG[s.area]
          const t = SHIFT_CONFIG[s.shiftType]
          return (
            <div key={s.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${a.color}` }}>
              <span className="text-2xl">{a.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: t.color + '20', color: t.color }}>{t.label}</span>
                  {s.isLandmark && <span className="text-xs text-yellow-400">🌟 Landmark</span>}
                  <span className="text-xs text-purple-400">🧠 {s.depth}/10</span>
                </div>
                <p className="text-xs text-red-300/70 mt-1 line-through">{s.oldMindset}</p>
                <p className="text-xs text-green-300 mt-0.5">→ {s.newMindset}</p>
                {s.evidence && <p className="text-xs text-slate-500 mt-0.5">✓ {s.evidence}</p>}
              </div>
              <button onClick={() => save(shifts.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {shifts.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Every shift in mindset is a shift in destiny. Record yours.</p>
          </div>
        )}
      </div>
    </div>
  )
}
