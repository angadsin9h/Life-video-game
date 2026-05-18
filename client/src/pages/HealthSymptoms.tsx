import { useState, useEffect } from 'react'
import { Activity, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Severity = 1 | 2 | 3 | 4 | 5

interface SymptomEntry {
  id: string
  date: string
  time: string
  symptom: string
  severity: Severity
  duration: string
  triggers: string
  relievers: string
  bodyArea: string
  notes: string
  createdAt: string
}

interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  startDate: string
  notes: string
  active: boolean
}

const BODY_AREAS = ['Head', 'Neck', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'Skin', 'Whole body', 'Other']
const SEVERITY_LABELS = ['', 'Mild', 'Moderate', 'Notable', 'Severe', 'Extreme']
const SEVERITY_COLORS = ['', '#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444']

const STORAGE_KEY = 'health_symptoms'
const MEDS_KEY = 'health_meds'

export default function HealthSymptoms() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SymptomEntry[]>([])
  const [meds, setMeds] = useState<Medication[]>([])
  const [tab, setTab] = useState<'symptoms' | 'medications'>('symptoms')
  const [showForm, setShowForm] = useState(false)
  const [showMedForm, setShowMedForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<SymptomEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    symptom: '', severity: 3, duration: '', triggers: '', relievers: '', bodyArea: 'Other', notes: '',
  })
  const [medForm, setMedForm] = useState({ name: '', dose: '', frequency: '', startDate: new Date().toISOString().split('T')[0], notes: '' })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setMeds(JSON.parse(localStorage.getItem(MEDS_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveEntries = (u: SymptomEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveMeds = (u: Medication[]) => { setMeds(u); localStorage.setItem(MEDS_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.symptom.trim()) return
    const e: SymptomEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveEntries([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0, 5), symptom: '', severity: 3, duration: '', triggers: '', relievers: '', bodyArea: 'Other', notes: '' })
    setShowForm(false)
    toastSuccess('Symptom logged')
  }

  const addMed = () => {
    if (!medForm.name.trim()) return
    const m: Medication = { id: Date.now().toString(), ...medForm, active: true }
    saveMeds([...meds, m])
    setMedForm({ name: '', dose: '', frequency: '', startDate: new Date().toISOString().split('T')[0], notes: '' })
    setShowMedForm(false)
    toastSuccess('Medication added')
  }

  const recentSymptoms = [...new Set(entries.slice(0, 20).map(e => e.symptom))].slice(0, 5)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Activity className="w-7 h-7 text-red-400" />
          Health Symptoms
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track symptoms and medications for health awareness.</p>
      </div>

      <div className="game-card p-3 flex items-center gap-2 border border-yellow-500/20 bg-yellow-500/5">
        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">For informational tracking only. Always consult a healthcare professional for medical advice.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['symptoms', 'medications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
            {t === 'symptoms' ? `Symptoms (${entries.length})` : `Medications (${meds.filter(m => m.active).length})`}
          </button>
        ))}
      </div>

      {tab === 'symptoms' && (
        <>
          <button onClick={() => setShowForm(true)}
            className="w-full py-2.5 border border-dashed border-red-700/50 rounded-xl text-red-400 text-sm flex items-center gap-2 justify-center hover:border-red-600">
            <Plus className="w-4 h-4" /> Log symptom
          </button>

          {showForm && (
            <div className="game-card p-4 border border-red-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">Log Symptom</h3>
              <div className="flex gap-2">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm flex-1" />
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="game-input text-sm w-24" />
              </div>
              <input value={form.symptom} onChange={e => setForm(f => ({ ...f, symptom: e.target.value }))}
                placeholder="Symptom (e.g., Headache, Nausea) *" className="game-input w-full" autoFocus
                list="symptoms-list" />
              <datalist id="symptoms-list">
                {recentSymptoms.map(s => <option key={s} value={s} />)}
              </datalist>
              <div>
                <p className="text-xs text-slate-500 mb-2">Severity: <span style={{ color: SEVERITY_COLORS[form.severity] }}>{SEVERITY_LABELS[form.severity]}</span></p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setForm(f => ({ ...f, severity: n as Severity }))}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={form.severity === n ? { background: SEVERITY_COLORS[n] + '30', color: SEVERITY_COLORS[n], border: `1px solid ${SEVERITY_COLORS[n]}50` } : { background: '#1e293b', color: '#64748b' }}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <select value={form.bodyArea} onChange={e => setForm(f => ({ ...f, bodyArea: e.target.value }))} className="game-input text-sm flex-1">
                  {BODY_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="Duration (e.g., 2h)" className="game-input flex-1 text-sm" />
              </div>
              <input value={form.triggers} onChange={e => setForm(f => ({ ...f, triggers: e.target.value }))}
                placeholder="Possible triggers" className="game-input w-full text-sm" />
              <input value={form.relievers} onChange={e => setForm(f => ({ ...f, relievers: e.target.value }))}
                placeholder="What helped?" className="game-input w-full text-sm" />
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..." className="game-input w-full h-14 resize-none text-sm" />
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Save</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {entries.map(e => {
              const isExp = expanded === e.id
              const sColor = SEVERITY_COLORS[e.severity]
              return (
                <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${sColor}` }}>
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{e.symptom}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sColor + '20', color: sColor }}>{SEVERITY_LABELS[e.severity]}</span>
                        {e.bodyArea && e.bodyArea !== 'Other' && <span className="text-xs text-slate-600">{e.bodyArea}</span>}
                      </div>
                      <span className="text-xs text-slate-600">{e.date} {e.time}</span>
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </div>
                  {isExp && (
                    <div className="border-t border-slate-800 p-3 space-y-1.5">
                      {e.duration && <p className="text-xs text-slate-400">Duration: {e.duration}</p>}
                      {e.triggers && <p className="text-xs text-slate-400">Triggers: {e.triggers}</p>}
                      {e.relievers && <p className="text-xs text-green-400">Relievers: {e.relievers}</p>}
                      {e.notes && <p className="text-xs text-slate-500 italic">{e.notes}</p>}
                      <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400 mt-2">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {entries.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-500">
                <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No symptoms logged. Stay healthy!</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'medications' && (
        <div className="space-y-3">
          <button onClick={() => setShowMedForm(true)}
            className="w-full py-2.5 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Add medication
          </button>
          {showMedForm && (
            <div className="game-card p-4 border border-red-500/20 space-y-2">
              <div className="flex gap-2">
                <input value={medForm.name} onChange={e => setMedForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Medication name *" className="game-input flex-1" autoFocus />
                <input value={medForm.dose} onChange={e => setMedForm(f => ({ ...f, dose: e.target.value }))}
                  placeholder="Dose" className="game-input w-28 text-sm" />
              </div>
              <div className="flex gap-2">
                <input value={medForm.frequency} onChange={e => setMedForm(f => ({ ...f, frequency: e.target.value }))}
                  placeholder="Frequency" className="game-input flex-1 text-sm" />
                <input type="date" value={medForm.startDate} onChange={e => setMedForm(f => ({ ...f, startDate: e.target.value }))}
                  className="game-input text-sm" />
              </div>
              <input value={medForm.notes} onChange={e => setMedForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes" className="game-input w-full text-sm" />
              <div className="flex gap-2">
                <button onClick={addMed} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Add</button>
                <button onClick={() => setShowMedForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          {meds.map(m => (
            <div key={m.id} className={`game-card p-4 flex gap-3 ${!m.active ? 'opacity-50' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 text-xl">💊</div>
              <div className="flex-1">
                <div className="font-medium text-white">{m.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {m.dose && <span>{m.dose} · </span>}
                  {m.frequency && <span>{m.frequency} · </span>}
                  <span>since {m.startDate}</span>
                </div>
                {m.notes && <p className="text-xs text-slate-600 mt-0.5 italic">{m.notes}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => saveMeds(meds.map(x => x.id === m.id ? { ...x, active: !x.active } : x))}
                  className={`text-xs px-2 py-1 rounded-lg ${m.active ? 'bg-green-700/30 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                  {m.active ? 'Active' : 'Stopped'}
                </button>
                <button onClick={() => saveMeds(meds.filter(x => x.id !== m.id))} className="p-1 text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {meds.length === 0 && !showMedForm && (
            <div className="text-center py-10 text-slate-500 text-sm">No medications tracked.</div>
          )}
        </div>
      )}
    </div>
  )
}
