import { useState, useEffect } from 'react'
import { User, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type BLSituation = 'presentation' | 'meeting' | 'social' | 'date' | 'interview' | 'confrontation' | 'public' | 'casual' | 'other'
type BLAspect = 'posture' | 'eye-contact' | 'gestures' | 'voice' | 'facial' | 'space' | 'touch' | 'mirroring' | 'breathing' | 'other'

interface BLEntry {
  id: string
  situation: BLSituation
  aspect: BLAspect
  observation: string
  whatDid: string
  impact: string
  improvement: string
  confidence: number
  date: string
  createdAt: string
}

const SITUATION_CONFIG: Record<BLSituation, { label: string; emoji: string; color: string }> = {
  presentation: { label: 'Presentation', emoji: '🎤', color: '#ef4444' },
  meeting:      { label: 'Meeting',      emoji: '💼', color: '#3b82f6' },
  social:       { label: 'Social',       emoji: '👥', color: '#22c55e' },
  date:         { label: 'Date',         emoji: '❤️', color: '#ec4899' },
  interview:    { label: 'Interview',    emoji: '📋', color: '#f59e0b' },
  confrontation:{ label: 'Confrontation',emoji: '⚡', color: '#f97316' },
  public:       { label: 'Public',       emoji: '🏟️', color: '#a855f7' },
  casual:       { label: 'Casual',       emoji: '😊', color: '#84cc16' },
  other:        { label: 'Other',        emoji: '🌀', color: '#94a3b8' },
}

const ASPECT_CONFIG: Record<BLAspect, { label: string; color: string }> = {
  posture:    { label: 'Posture',     color: '#3b82f6' },
  'eye-contact': { label: 'Eye Contact', color: '#22c55e' },
  gestures:   { label: 'Gestures',    color: '#f59e0b' },
  voice:      { label: 'Voice',       color: '#a855f7' },
  facial:     { label: 'Facial Expr.', color: '#ec4899' },
  space:      { label: 'Spacing',     color: '#f97316' },
  touch:      { label: 'Touch',       color: '#ef4444' },
  mirroring:  { label: 'Mirroring',   color: '#0ea5e9' },
  breathing:  { label: 'Breathing',   color: '#84cc16' },
  other:      { label: 'Other',       color: '#94a3b8' },
}

const TIPS = [
  'Power pose for 2 min before high-stakes events',
  'Hold eye contact for 3-5 seconds then look away naturally',
  'Slow down your speech — confidence sounds unhurried',
  'Take up space — don\'t fold your arms or make yourself small',
  'Mirror the other person\'s energy subtly',
  'Deep belly breathing calms the nervous system instantly',
]

const STORAGE_KEY = 'body_language_log'

export default function BodyLanguageLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<BLEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<BLEntry, 'id' | 'createdAt'>>({
    situation: 'social', aspect: 'posture', observation: '', whatDid: '',
    impact: '', improvement: '', confidence: 6, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: BLEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.observation.trim()) return
    const e: BLEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, observation: '', whatDid: '', impact: '', improvement: '' }))
    setShowForm(false)
    toastSuccess('Body language logged 🤝')
  }

  const avgConfidence = entries.length ? Math.round(entries.reduce((s, e) => s + e.confidence, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <User className="w-7 h-7 text-blue-400" />
            Body Language Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Study your non-verbal communication and improve it consciously.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Observations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-blue-400">{avgConfidence}/10</div>
          <div className="text-xs text-slate-500">Avg Confidence</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{new Set(entries.map(e => e.aspect)).size}</div>
          <div className="text-xs text-slate-500">Areas Practiced</div>
        </div>
      </div>

      <div className="game-card p-3 space-y-1.5">
        <p className="text-xs font-semibold text-slate-400">Quick Tips:</p>
        {TIPS.map((t, i) => (
          <p key={i} className="text-xs text-slate-500">💡 {t}</p>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Observation</h3>
          <div className="flex gap-2">
            <select value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value as BLSituation }))} className="game-input text-sm flex-1">
              {(Object.entries(SITUATION_CONFIG) as [BLSituation, typeof SITUATION_CONFIG.social][]).map(([k, c]) => (
                <option key={k} value={k}>{c.emoji} {c.label}</option>
              ))}
            </select>
            <select value={form.aspect} onChange={e => setForm(f => ({ ...f, aspect: e.target.value as BLAspect }))} className="game-input text-sm flex-1">
              {(Object.entries(ASPECT_CONFIG) as [BLAspect, typeof ASPECT_CONFIG.posture][]).map(([k, a]) => (
                <option key={k} value={k}>{a.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.observation} onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
            placeholder="What did you notice about your body language? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.whatDid} onChange={e => setForm(f => ({ ...f, whatDid: e.target.value }))}
            placeholder="What did you actually do?" className="game-input w-full text-sm" />
          <input value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="What was the impact on others?" className="game-input w-full text-sm" />
          <input value={form.improvement} onChange={e => setForm(f => ({ ...f, improvement: e.target.value }))}
            placeholder="What to do differently next time" className="game-input w-full text-sm" />
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Confidence felt: {form.confidence}/10</p>
              <input type="range" min={1} max={10} value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: Number(e.target.value) }))}
                className="w-full h-1 accent-blue-400" />
            </div>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input text-xs" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const sit = SITUATION_CONFIG[e.situation]
          const asp = ASPECT_CONFIG[e.aspect]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${asp.color}` }}>
              <span className="text-2xl">{sit.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: asp.color + '20', color: asp.color }}>{asp.label}</span>
                  <span className="text-xs text-slate-500">{sit.label} · {e.date}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{e.observation}</p>
                {e.improvement && <p className="text-xs text-green-300 mt-0.5">→ Next time: {e.improvement}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">93% of communication is non-verbal. Master your body, master your message.</p>
          </div>
        )}
      </div>
    </div>
  )
}
