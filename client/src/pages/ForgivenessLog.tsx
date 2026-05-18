import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ForgivenessStage = 'unacknowledged' | 'processing' | 'working' | 'forgiven' | 'released'
type PersonType = 'self' | 'parent' | 'partner' | 'friend' | 'colleague' | 'stranger' | 'other'

interface ForgivenessEntry {
  id: string
  person: string
  personType: PersonType
  event: string
  impact: string
  stage: ForgivenessStage
  insights: string
  letteredWritten: boolean
  stageHistory: { stage: ForgivenessStage; date: string }[]
  createdAt: string
}

const STAGE_CONFIG: Record<ForgivenessStage, { label: string; color: string; emoji: string; desc: string }> = {
  unacknowledged: { label: 'Unacknowledged', color: '#ef4444', emoji: '😶', desc: 'Still raw' },
  processing:     { label: 'Processing',     color: '#f97316', emoji: '🔄', desc: 'Working through it' },
  working:        { label: 'Working On It',  color: '#f59e0b', emoji: '🌱', desc: 'Actively forgiving' },
  forgiven:       { label: 'Forgiven',       color: '#22c55e', emoji: '✨', desc: 'Found forgiveness' },
  released:       { label: 'Released',       color: '#a855f7', emoji: '🕊️', desc: 'Let go completely' },
}

const TYPE_CONFIG: Record<PersonType, { label: string; emoji: string }> = {
  self:      { label: 'Myself',    emoji: '🪞' },
  parent:    { label: 'Parent',    emoji: '👨‍👩‍👧' },
  partner:   { label: 'Partner',   emoji: '💑' },
  friend:    { label: 'Friend',    emoji: '👫' },
  colleague: { label: 'Colleague', emoji: '💼' },
  stranger:  { label: 'Stranger',  emoji: '👤' },
  other:     { label: 'Other',     emoji: '💗' },
}

const STAGE_ORDER: ForgivenessStage[] = ['unacknowledged', 'processing', 'working', 'forgiven', 'released']

const STORAGE_KEY = 'forgiveness_log'

export default function ForgivenessLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ForgivenessEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<ForgivenessEntry, 'id' | 'createdAt' | 'stageHistory'>>({
    person: '', personType: 'other', event: '', impact: '',
    stage: 'processing', insights: '', letteredWritten: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ForgivenessEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.event.trim()) return
    const e: ForgivenessEntry = {
      id: Date.now().toString(), ...form,
      stageHistory: [{ stage: form.stage, date: new Date().toISOString().split('T')[0] }],
      createdAt: new Date().toISOString(),
    }
    save([e, ...entries])
    setForm({ person: '', personType: 'other', event: '', impact: '', stage: 'processing', insights: '', letteredWritten: false })
    setShowForm(false)
    toastSuccess('Entry added 🕊️')
  }

  const advanceStage = (id: string) => {
    save(entries.map(e => {
      if (e.id !== id) return e
      const currentIdx = STAGE_ORDER.indexOf(e.stage)
      if (currentIdx >= STAGE_ORDER.length - 1) return e
      const nextStage = STAGE_ORDER[currentIdx + 1]
      return {
        ...e, stage: nextStage,
        stageHistory: [...e.stageHistory, { stage: nextStage, date: new Date().toISOString().split('T')[0] }],
      }
    }))
    toastSuccess('Progress made 🌱')
  }

  const released = entries.filter(e => e.stage === 'released').length
  const inProgress = entries.filter(e => e.stage !== 'released').length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-purple-400" />
            Forgiveness Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your forgiveness journey — for others and yourself.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{inProgress}</div>
          <div className="text-xs text-slate-500">In Progress</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400">{released}</div>
          <div className="text-xs text-slate-500">Released</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-purple-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Entry</h3>
          <div className="flex gap-2">
            <select value={form.personType} onChange={e => setForm(f => ({ ...f, personType: e.target.value as PersonType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [PersonType, typeof TYPE_CONFIG.other][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <input value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              placeholder="Name (optional)" className="game-input flex-1 text-sm" autoFocus />
          </div>
          <textarea value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))}
            placeholder="What happened? What are you forgiving? *" className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
            placeholder="How has this affected you?" className="game-input w-full h-14 resize-none text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-2">Current stage:</p>
            <div className="flex gap-2 flex-wrap">
              {STAGE_ORDER.map(s => {
                const c = STAGE_CONFIG[s]
                return (
                  <button key={s} onClick={() => setForm(f => ({ ...f, stage: s }))}
                    className={`px-2.5 py-1 rounded-full text-xs ${form.stage === s ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                    style={form.stage === s ? { background: c.color + '30', color: c.color } : {}}>
                    {c.emoji} {c.label}
                  </button>
                )
              })}
            </div>
          </div>
          <textarea value={form.insights} onChange={e => setForm(f => ({ ...f, insights: e.target.value }))}
            placeholder="Insights, compassion, understanding..." className="game-input w-full h-12 resize-none text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={form.letteredWritten} onChange={e => setForm(f => ({ ...f, letteredWritten: e.target.checked }))} className="accent-purple-400" />
            I've written a forgiveness letter (unsent)
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = STAGE_CONFIG[e.stage]
          const t = TYPE_CONFIG[e.personType]
          const isExp = expanded === e.id
          const canAdvance = STAGE_ORDER.indexOf(e.stage) < STAGE_ORDER.length - 1
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">{s.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.person || t.label}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: s.color + '20', color: s.color }}>{s.label}</span>
                    {e.letteredWritten && <span className="text-xs text-blue-400">✉️</span>}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{e.event}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {/* Stage progress bar */}
                  <div className="flex gap-1">
                    {STAGE_ORDER.map((st, i) => {
                      const currentIdx = STAGE_ORDER.indexOf(e.stage)
                      return (
                        <div key={st} className="flex-1 h-1.5 rounded-full" style={{
                          background: i <= currentIdx ? STAGE_CONFIG[st].color : '#1e293b',
                        }} />
                      )
                    })}
                  </div>
                  {e.impact && <p className="text-xs text-slate-400"><span className="text-slate-500">Impact: </span>{e.impact}</p>}
                  {e.insights && <p className="text-sm text-teal-400 italic">💡 {e.insights}</p>}
                  <div className="flex gap-2">
                    {canAdvance && (
                      <button onClick={() => advanceStage(e.id)}
                        className="flex-1 py-1.5 bg-purple-700/20 text-purple-400 rounded-xl text-xs hover:bg-purple-700/40">
                        → Advance Stage
                      </button>
                    )}
                    <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Forgiveness sets you free — not them.</p>
          </div>
        )}
      </div>
    </div>
  )
}
