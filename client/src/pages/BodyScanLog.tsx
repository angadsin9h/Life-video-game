import { useState, useEffect } from 'react'
import { Wind, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BodyArea = 'head' | 'neck' | 'shoulders' | 'chest' | 'abdomen' | 'lower-back' | 'hips' | 'legs' | 'feet' | 'arms' | 'hands' | 'overall'
type SensationType = 'tension' | 'pain' | 'tingling' | 'warmth' | 'numbness' | 'lightness' | 'heaviness' | 'ease'

interface BodyScanEntry {
  id: string
  date: string
  time: string
  areas: { area: BodyArea; sensation: SensationType; intensity: number }[]
  overallFeeling: number
  notes: string
  mood: string
  createdAt: string
}

const AREA_CONFIG: Record<BodyArea, { label: string; emoji: string }> = {
  head:         { label: 'Head',        emoji: '🧠' },
  neck:         { label: 'Neck',        emoji: '🦴' },
  shoulders:    { label: 'Shoulders',   emoji: '💪' },
  chest:        { label: 'Chest',       emoji: '❤️' },
  abdomen:      { label: 'Abdomen',     emoji: '🫁' },
  'lower-back': { label: 'Lower Back',  emoji: '🔙' },
  hips:         { label: 'Hips',        emoji: '🦵' },
  legs:         { label: 'Legs',        emoji: '🦵' },
  feet:         { label: 'Feet',        emoji: '🦶' },
  arms:         { label: 'Arms',        emoji: '💪' },
  hands:        { label: 'Hands',       emoji: '✋' },
  overall:      { label: 'Overall',     emoji: '🧘' },
}

const SENSATION_CONFIG: Record<SensationType, { label: string; color: string }> = {
  tension:  { label: 'Tension',   color: '#ef4444' },
  pain:     { label: 'Pain',      color: '#dc2626' },
  tingling: { label: 'Tingling',  color: '#a855f7' },
  warmth:   { label: 'Warmth',    color: '#f97316' },
  numbness: { label: 'Numbness',  color: '#94a3b8' },
  lightness:{ label: 'Lightness', color: '#22c55e' },
  heaviness:{ label: 'Heaviness', color: '#6366f1' },
  ease:     { label: 'Ease',      color: '#3b82f6' },
}

const STORAGE_KEY = 'body_scan_log'

export default function BodyScanLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BodyScanEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedArea, setSelectedArea] = useState<BodyArea>('overall')
  const [selectedSensation, setSelectedSensation] = useState<SensationType>('ease')
  const [selectedIntensity, setSelectedIntensity] = useState(5)
  const [areas, setAreas] = useState<BodyScanEntry['areas']>([])
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    overallFeeling: 7, notes: '', mood: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BodyScanEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addArea = () => {
    if (areas.find(a => a.area === selectedArea)) {
      setAreas(areas.map(a => a.area === selectedArea ? { ...a, sensation: selectedSensation, intensity: selectedIntensity } : a))
    } else {
      setAreas([...areas, { area: selectedArea, sensation: selectedSensation, intensity: selectedIntensity }])
    }
  }

  const submit = () => {
    const e: BodyScanEntry = {
      id: Date.now().toString(), ...form, areas,
      createdAt: new Date().toISOString(),
    }
    save([e, ...entries])
    setAreas([])
    setForm({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), overallFeeling: 7, notes: '', mood: '' })
    setShowForm(false)
    toastSuccess('Body scan logged 🧘')
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Wind className="w-7 h-7 text-teal-400" />
            Body Scan Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track body sensations and mindfulness check-ins.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Scan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400">
            {entries.length ? Math.round(entries.slice(0,7).reduce((s,e) => s + e.overallFeeling, 0) / Math.min(entries.length,7) * 10) / 10 : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Feeling</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">
            {entries.reduce((s, e) => s + e.areas.length, 0)}
          </div>
          <div className="text-xs text-slate-500">Areas Logged</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-teal-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Body Scan</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="game-input text-sm" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Overall feeling: {form.overallFeeling}/10</p>
            <input type="range" min={1} max={10} value={form.overallFeeling}
              onChange={e => setForm(f => ({ ...f, overallFeeling: Number(e.target.value) }))}
              className="w-full h-1 accent-teal-400" />
          </div>
          <div className="border border-slate-700 rounded-xl p-3 space-y-2">
            <p className="text-xs text-slate-500">Add area sensation:</p>
            <div className="flex gap-2">
              <select value={selectedArea} onChange={e => setSelectedArea(e.target.value as BodyArea)} className="game-input text-sm flex-1">
                {(Object.entries(AREA_CONFIG) as [BodyArea, typeof AREA_CONFIG.head][]).map(([k, a]) => (
                  <option key={k} value={k}>{a.emoji} {a.label}</option>
                ))}
              </select>
              <select value={selectedSensation} onChange={e => setSelectedSensation(e.target.value as SensationType)} className="game-input text-sm flex-1">
                {(Object.entries(SENSATION_CONFIG) as [SensationType, typeof SENSATION_CONFIG.ease][]).map(([k, s]) => (
                  <option key={k} value={k}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Intensity: {selectedIntensity}</span>
              <input type="range" min={1} max={10} value={selectedIntensity}
                onChange={e => setSelectedIntensity(Number(e.target.value))}
                className="flex-1 h-1 accent-teal-400" />
              <button onClick={addArea} className="px-3 py-1 bg-teal-700/30 text-teal-400 rounded-lg text-xs">Add</button>
            </div>
          </div>
          {areas.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {areas.map(a => {
                const ac = AREA_CONFIG[a.area]
                const sc = SENSATION_CONFIG[a.sensation]
                return (
                  <span key={a.area} className="text-xs px-2 py-0.5 rounded-full cursor-pointer"
                    style={{ background: sc.color + '20', color: sc.color }}
                    onClick={() => setAreas(areas.filter(x => x.area !== a.area))}>
                    {ac.emoji} {ac.label}: {sc.label} ({a.intensity}) ×
                  </span>
                )
              })}
            </div>
          )}
          <input value={form.mood} onChange={e => setForm(f => ({ ...f, mood: e.target.value }))}
            placeholder="Current mood..." className="game-input w-full text-sm" />
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes and observations..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Save Scan</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="game-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">{e.date} {e.time}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-teal-400">Feeling: {e.overallFeeling}/10</span>
                <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {e.areas.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {e.areas.map(a => {
                  const ac = AREA_CONFIG[a.area]
                  const sc = SENSATION_CONFIG[a.sensation]
                  return (
                    <span key={a.area} className="text-xs px-1.5 py-0.5 rounded"
                      style={{ background: sc.color + '20', color: sc.color }}>
                      {ac.emoji} {sc.label}
                    </span>
                  )
                })}
              </div>
            )}
            {e.notes && <p className="text-xs text-slate-500 mt-1">{e.notes}</p>}
          </div>
        ))}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Wind className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Check in with your body through mindful scanning.</p>
          </div>
        )}
      </div>
    </div>
  )
}
