import { useState, useEffect } from 'react'
import { AlertTriangle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type AllergyType = 'food' | 'environmental' | 'medication' | 'chemical' | 'insect' | 'other'
type Severity = 'mild' | 'moderate' | 'severe' | 'life-threatening'
type ReactionStatus = 'active' | 'managed' | 'outgrown'

interface AllergyEntry {
  id: string
  allergen: string
  type: AllergyType
  severity: Severity
  status: ReactionStatus
  symptoms: string
  diagnosed: boolean
  diagnosedDate: string
  treatment: string
  notes: string
  createdAt: string
}

interface ReactionLog {
  id: string
  allergenId: string
  date: string
  exposure: string
  symptoms: string
  severity: Severity
  treatment: string
  duration: string
  createdAt: string
}

const TYPE_CONFIG: Record<AllergyType, { label: string; emoji: string; color: string }> = {
  food:          { label: 'Food',         emoji: '🍽️', color: '#f59e0b' },
  environmental: { label: 'Environmental',emoji: '🌿', color: '#22c55e' },
  medication:    { label: 'Medication',   emoji: '💊', color: '#3b82f6' },
  chemical:      { label: 'Chemical',     emoji: '⚗️', color: '#a855f7' },
  insect:        { label: 'Insect',       emoji: '🐝', color: '#f97316' },
  other:         { label: 'Other',        emoji: '⚠️', color: '#94a3b8' },
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; emoji: string }> = {
  mild:             { label: 'Mild',             color: '#22c55e', emoji: '🟡' },
  moderate:         { label: 'Moderate',         color: '#f59e0b', emoji: '🟠' },
  severe:           { label: 'Severe',           color: '#ef4444', emoji: '🔴' },
  'life-threatening':{ label: 'Life-Threatening', color: '#7f1d1d', emoji: '🚨' },
}

const STATUS_CONFIG: Record<ReactionStatus, { label: string; color: string }> = {
  active:   { label: 'Active',   color: '#ef4444' },
  managed:  { label: 'Managed',  color: '#f59e0b' },
  outgrown: { label: 'Outgrown', color: '#22c55e' },
}

const STORAGE_KEY = 'allergy_log'
const REACTION_KEY = 'allergy_reactions'

export default function AllergyLog() {
  const { toastSuccess } = useToast()
  const [allergies, setAllergies] = useState<AllergyEntry[]>([])
  const [reactions, setReactions] = useState<ReactionLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showReaction, setShowReaction] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<AllergyEntry, 'id' | 'createdAt'>>({
    allergen: '', type: 'food', severity: 'moderate', status: 'active',
    symptoms: '', diagnosed: false, diagnosedDate: '', treatment: '', notes: '',
  })
  const [reactionForm, setReactionForm] = useState({
    date: new Date().toISOString().split('T')[0], exposure: '', symptoms: '',
    severity: 'mild' as Severity, treatment: '', duration: '',
  })

  useEffect(() => {
    try {
      setAllergies(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setReactions(JSON.parse(localStorage.getItem(REACTION_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveAllergies = (u: AllergyEntry[]) => { setAllergies(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveReactions = (u: ReactionLog[]) => { setReactions(u); localStorage.setItem(REACTION_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.allergen.trim()) return
    const e: AllergyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveAllergies([e, ...allergies])
    setForm({ allergen: '', type: 'food', severity: 'moderate', status: 'active', symptoms: '', diagnosed: false, diagnosedDate: '', treatment: '', notes: '' })
    setShowForm(false)
    toastSuccess('Allergy logged')
  }

  const logReaction = (allergenId: string) => {
    if (!reactionForm.symptoms.trim()) return
    const r: ReactionLog = { id: Date.now().toString(), allergenId, ...reactionForm, createdAt: new Date().toISOString() }
    saveReactions([r, ...reactions])
    setReactionForm({ date: new Date().toISOString().split('T')[0], exposure: '', symptoms: '', severity: 'mild', treatment: '', duration: '' })
    setShowReaction(null)
    toastSuccess('Reaction logged')
  }

  const active = allergies.filter(a => a.status === 'active').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <AlertTriangle className="w-7 h-7 text-yellow-400" />
            Allergy Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track allergies, sensitivities, and reactions.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{active}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{allergies.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{reactions.length}</div>
          <div className="text-xs text-slate-500">Reactions</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-yellow-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Allergy</h3>
          <div className="flex gap-2">
            <input value={form.allergen} onChange={e => setForm(f => ({ ...f, allergen: e.target.value }))}
              placeholder="Allergen name *" className="game-input flex-1" autoFocus />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as AllergyType }))} className="game-input text-sm">
              {(Object.entries(TYPE_CONFIG) as [AllergyType, typeof TYPE_CONFIG.food][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {(Object.entries(SEVERITY_CONFIG) as [Severity, typeof SEVERITY_CONFIG.mild][]).map(([k, s]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, severity: k }))}
                className={`flex-1 py-1.5 rounded-xl text-xs ${form.severity === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.severity === k ? { background: s.color + '30', color: s.color } : {}}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          <textarea value={form.symptoms} onChange={e => setForm(f => ({ ...f, symptoms: e.target.value }))}
            placeholder="Typical symptoms..." className="game-input w-full h-14 resize-none text-sm" />
          <input value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))}
            placeholder="Treatment / medication" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.diagnosed} onChange={e => setForm(f => ({ ...f, diagnosed: e.target.checked }))} className="accent-yellow-400" />
            Formally diagnosed
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {allergies.map(a => {
          const t = TYPE_CONFIG[a.type]
          const s = SEVERITY_CONFIG[a.severity]
          const st = STATUS_CONFIG[a.status]
          const isExp = expanded === a.id
          const allergyReactions = reactions.filter(r => r.allergenId === a.id)
          return (
            <div key={a.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : a.id)}>
                <span className="text-2xl">{t.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{a.allergen}</span>
                    <span className="text-xs">{s.emoji}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                    {a.diagnosed && <span className="text-xs text-blue-400">🩺</span>}
                  </div>
                  <p className="text-xs text-slate-500">{t.label} · {allergyReactions.length} reactions logged</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {a.symptoms && <p className="text-xs text-slate-400"><span className="text-slate-500">Symptoms: </span>{a.symptoms}</p>}
                  {a.treatment && <p className="text-xs text-blue-400">💊 {a.treatment}</p>}

                  {showReaction === a.id ? (
                    <div className="space-y-2 bg-slate-800/30 p-3 rounded-xl">
                      <p className="text-xs font-medium text-white">Log Reaction</p>
                      <div className="flex gap-2">
                        <input type="date" value={reactionForm.date} onChange={e => setReactionForm(f => ({ ...f, date: e.target.value }))} className="game-input text-sm flex-1" />
                        <input value={reactionForm.duration} onChange={e => setReactionForm(f => ({ ...f, duration: e.target.value }))}
                          placeholder="Duration" className="game-input text-sm flex-1" />
                      </div>
                      <input value={reactionForm.exposure} onChange={e => setReactionForm(f => ({ ...f, exposure: e.target.value }))}
                        placeholder="How exposed?" className="game-input w-full text-sm" />
                      <input value={reactionForm.symptoms} onChange={e => setReactionForm(f => ({ ...f, symptoms: e.target.value }))}
                        placeholder="Symptoms *" className="game-input w-full text-sm" />
                      <input value={reactionForm.treatment} onChange={e => setReactionForm(f => ({ ...f, treatment: e.target.value }))}
                        placeholder="Treatment used" className="game-input w-full text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => logReaction(a.id)} className="flex-1 py-1.5 bg-yellow-700 text-white rounded-xl text-xs">Log</button>
                        <button onClick={() => setShowReaction(null)} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-xl text-xs">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowReaction(a.id)} className="text-xs px-2.5 py-1 bg-yellow-700/20 text-yellow-400 rounded-xl hover:bg-yellow-700/40">
                      + Log Reaction
                    </button>
                  )}

                  {allergyReactions.slice(0, 3).map(r => (
                    <div key={r.id} className="text-xs text-slate-500 flex gap-2">
                      <span>{r.date}</span>
                      <span className="text-slate-400">{r.symptoms.slice(0, 40)}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-1">
                    <select value={a.status} onChange={e => saveAllergies(allergies.map(x => x.id === a.id ? { ...x, status: e.target.value as ReactionStatus } : x))}
                      className="game-input text-xs flex-1">
                      {(Object.entries(STATUS_CONFIG) as [ReactionStatus, typeof STATUS_CONFIG.active][]).map(([k, st2]) => (
                        <option key={k} value={k}>{st2.label}</option>
                      ))}
                    </select>
                    <button onClick={() => saveAllergies(allergies.filter(x => x.id !== a.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {allergies.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Track your allergies and sensitivities for better health awareness.</p>
          </div>
        )}
      </div>
    </div>
  )
}
