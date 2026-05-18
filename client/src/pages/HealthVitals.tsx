import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2, TrendingUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface VitalEntry {
  id: string
  date: string
  time: string
  bloodPressureSys: number
  bloodPressureDia: number
  heartRate: number
  temperature: number
  weight: number
  bloodSugar: number
  oxygenSat: number
  notes: string
  createdAt: string
}

const STORAGE_KEY = 'health_vitals'

function avg(arr: number[]) {
  const valid = arr.filter(n => n > 0)
  return valid.length ? Math.round(valid.reduce((a, b) => a + b) / valid.length * 10) / 10 : 0
}

export default function HealthVitals() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<VitalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<VitalEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    bloodPressureSys: 0, bloodPressureDia: 0,
    heartRate: 0, temperature: 0, weight: 0, bloodSugar: 0, oxygenSat: 0, notes: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: VitalEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.date) return
    const e: VitalEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), bloodPressureSys: 0, bloodPressureDia: 0, heartRate: 0, temperature: 0, weight: 0, bloodSugar: 0, oxygenSat: 0, notes: '' })
    setShowForm(false)
    toastSuccess('Vitals logged ❤️')
  }

  const recent = entries.slice(0, 10)
  const avgHR = avg(recent.map(e => e.heartRate))
  const avgWeight = avg(recent.map(e => e.weight))
  const lastEntry = entries[0]

  const getBPColor = (sys: number, dia: number) => {
    if (!sys) return '#94a3b8'
    if (sys < 120 && dia < 80) return '#22c55e'
    if (sys < 130) return '#84cc16'
    if (sys < 140) return '#f59e0b'
    return '#ef4444'
  }

  const getHRColor = (hr: number) => {
    if (!hr) return '#94a3b8'
    if (hr >= 60 && hr <= 100) return '#22c55e'
    if (hr >= 50 && hr <= 110) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-red-400" />
            Health Vitals
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Monitor and track your key health metrics.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {lastEntry && (
        <div className="game-card p-4 border border-red-500/20">
          <p className="text-xs text-slate-500 mb-3">Latest reading — {lastEntry.date} {lastEntry.time}</p>
          <div className="grid grid-cols-3 gap-3">
            {lastEntry.bloodPressureSys > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: getBPColor(lastEntry.bloodPressureSys, lastEntry.bloodPressureDia) }}>
                  {lastEntry.bloodPressureSys}/{lastEntry.bloodPressureDia}
                </div>
                <div className="text-xs text-slate-500">BP mmHg</div>
              </div>
            )}
            {lastEntry.heartRate > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold" style={{ color: getHRColor(lastEntry.heartRate) }}>{lastEntry.heartRate}</div>
                <div className="text-xs text-slate-500">BPM</div>
              </div>
            )}
            {lastEntry.weight > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{lastEntry.weight}</div>
                <div className="text-xs text-slate-500">kg</div>
              </div>
            )}
            {lastEntry.temperature > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-orange-400">{lastEntry.temperature}°</div>
                <div className="text-xs text-slate-500">Temp °C</div>
              </div>
            )}
            {lastEntry.oxygenSat > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">{lastEntry.oxygenSat}%</div>
                <div className="text-xs text-slate-500">SpO₂</div>
              </div>
            )}
            {lastEntry.bloodSugar > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">{lastEntry.bloodSugar}</div>
                <div className="text-xs text-slate-500">mg/dL</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Records</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{avgHR > 0 ? avgHR : '—'}</div>
          <div className="text-xs text-slate-500">Avg HR</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400 flex items-center justify-center gap-1">
            {avgWeight > 0 ? avgWeight : '—'}
            {avgWeight > 0 && <TrendingUp className="w-3 h-3" />}
          </div>
          <div className="text-xs text-slate-500">Avg Weight</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Vitals</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="game-input text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Blood Pressure (sys/dia)</p>
              <div className="flex gap-1">
                <input type="number" value={form.bloodPressureSys || ''} placeholder="120"
                  onChange={e => setForm(f => ({ ...f, bloodPressureSys: Number(e.target.value) }))}
                  className="game-input text-sm w-full" />
                <input type="number" value={form.bloodPressureDia || ''} placeholder="80"
                  onChange={e => setForm(f => ({ ...f, bloodPressureDia: Number(e.target.value) }))}
                  className="game-input text-sm w-full" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Heart Rate (bpm)</p>
              <input type="number" value={form.heartRate || ''} placeholder="72"
                onChange={e => setForm(f => ({ ...f, heartRate: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Weight (kg)</p>
              <input type="number" value={form.weight || ''} placeholder="70" step="0.1"
                onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Temperature (°C)</p>
              <input type="number" value={form.temperature || ''} placeholder="36.6" step="0.1"
                onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">SpO₂ (%)</p>
              <input type="number" value={form.oxygenSat || ''} placeholder="98"
                onChange={e => setForm(f => ({ ...f, oxygenSat: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Blood Sugar (mg/dL)</p>
              <input type="number" value={form.bloodSugar || ''} placeholder="90"
                onChange={e => setForm(f => ({ ...f, bloodSugar: Number(e.target.value) }))}
                className="game-input text-sm w-full" />
            </div>
          </div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes..." className="game-input w-full h-10 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {entries.map(e => (
          <div key={e.id} className="game-card p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">{e.date} {e.time}</span>
              </div>
              <div className="flex gap-3 mt-0.5 flex-wrap">
                {e.bloodPressureSys > 0 && (
                  <span className="text-xs" style={{ color: getBPColor(e.bloodPressureSys, e.bloodPressureDia) }}>
                    BP {e.bloodPressureSys}/{e.bloodPressureDia}
                  </span>
                )}
                {e.heartRate > 0 && <span className="text-xs" style={{ color: getHRColor(e.heartRate) }}>HR {e.heartRate}</span>}
                {e.weight > 0 && <span className="text-xs text-blue-400">{e.weight}kg</span>}
                {e.temperature > 0 && <span className="text-xs text-orange-400">{e.temperature}°C</span>}
                {e.oxygenSat > 0 && <span className="text-xs text-cyan-400">O₂ {e.oxygenSat}%</span>}
              </div>
              {e.notes && <p className="text-xs text-slate-600 mt-0.5">{e.notes}</p>}
            </div>
            <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track your vitals to stay on top of your health.</p>
          </div>
        )}
      </div>
    </div>
  )
}
