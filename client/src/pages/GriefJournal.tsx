import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Stage = 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance' | 'meaning'

interface GriefEntry {
  id: string
  date: string
  loss: string
  stage: Stage
  feeling: string
  memory: string
  gratitude: string
  message: string
  private: boolean
  createdAt: string
}

const STAGES: Record<Stage, { label: string; color: string; desc: string }> = {
  denial:      { label: 'Denial',      color: '#94a3b8', desc: 'Numbness, disbelief, shock' },
  anger:       { label: 'Anger',       color: '#ef4444', desc: 'Frustration, guilt, resentment' },
  bargaining:  { label: 'Bargaining',  color: '#f59e0b', desc: '"What if" and "If only"' },
  depression:  { label: 'Depression',  color: '#6366f1', desc: 'Sadness, withdrawal, despair' },
  acceptance:  { label: 'Acceptance',  color: '#22c55e', desc: 'Learning to live with loss' },
  meaning:     { label: 'Finding Meaning', color: '#a855f7', desc: 'Growth, purpose, legacy' },
}

const STORAGE_KEY = 'grief_journal'

export default function GriefJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GriefEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<GriefEntry, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    loss: '', stage: 'denial', feeling: '', memory: '', gratitude: '', message: '', private: false,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: GriefEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.loss.trim() && !form.feeling.trim()) return
    const entry: GriefEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([entry, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], loss: '', stage: 'denial', feeling: '', memory: '', gratitude: '', message: '', private: false })
    setShowForm(false)
    toastSuccess('Entry saved 💜')
  }

  const del = (id: string) => save(entries.filter(e => e.id !== id))

  const stageCounts = Object.keys(STAGES).reduce((acc, s) => ({ ...acc, [s]: entries.filter(e => e.stage === s).length }), {} as Record<string, number>)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Grief Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">A safe space to process loss and find meaning.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      {/* Stages map */}
      <div className="game-card p-4 space-y-2">
        <p className="text-xs text-slate-500 mb-3">Grief stages — your journey is not linear</p>
        {(Object.entries(STAGES) as [Stage, typeof STAGES.denial][]).map(([key, s]) => (
          <div key={key} className="flex items-center gap-3">
            <div className="w-24 text-xs text-right" style={{ color: s.color }}>{s.label}</div>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${entries.length ? (stageCounts[key] / entries.length) * 100 : 0}%`, background: s.color }} />
            </div>
            <span className="text-xs text-slate-600 w-4">{stageCounts[key]}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">New Entry</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm" />
            <input value={form.loss} onChange={e => setForm(f => ({ ...f, loss: e.target.value }))}
              placeholder="What/who did you lose?" className="game-input flex-1 text-sm" autoFocus />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Where are you today?</p>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(STAGES) as [Stage, typeof STAGES.denial][]).map(([key, s]) => (
                <button key={key} onClick={() => setForm(f => ({ ...f, stage: key }))}
                  className={`p-2 rounded-lg text-xs text-center transition-all ${form.stage === key ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                  style={form.stage === key ? { background: s.color + '30', color: s.color, border: `1px solid ${s.color}40` } : {}}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <textarea value={form.feeling} onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))}
            placeholder="How are you feeling right now? (no filter needed)" className="game-input w-full h-20 resize-none text-sm" />
          <textarea value={form.memory} onChange={e => setForm(f => ({ ...f, memory: e.target.value }))}
            placeholder="A memory you want to hold onto..." className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.gratitude} onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
            placeholder="Something you are grateful for, even now..." className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="A message to who/what you lost (optional)" className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save Entry</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(entry => {
          const stg = STAGES[entry.stage]
          const isExp = expanded === entry.id
          return (
            <div key={entry.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${stg.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : entry.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{entry.loss || 'Entry'}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: stg.color + '20', color: stg.color }}>{stg.label}</span>
                  </div>
                  <span className="text-xs text-slate-600">{entry.date}</span>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-3">
                  {entry.feeling && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Feelings</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{entry.feeling}</p>
                    </div>
                  )}
                  {entry.memory && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Memory</p>
                      <p className="text-sm text-slate-300 leading-relaxed italic">"{entry.memory}"</p>
                    </div>
                  )}
                  {entry.gratitude && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Gratitude</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{entry.gratitude}</p>
                    </div>
                  )}
                  {entry.message && (
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Message</p>
                      <p className="text-sm text-slate-300 leading-relaxed italic">"{entry.message}"</p>
                    </div>
                  )}
                  <button onClick={() => del(entry.id)} className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3 h-3" /> Delete entry
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Grief is love with nowhere to go.</p>
            <p className="text-sm mt-1 opacity-70">Writing can help it find its way.</p>
          </div>
        )}
      </div>
    </div>
  )
}
