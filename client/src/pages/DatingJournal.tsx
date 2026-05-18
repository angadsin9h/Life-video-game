import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DateEntryType = 'first-date' | 'regular-date' | 'milestone' | 'reflection' | 'quality-time' | 'conflict' | 'growth' | 'gratitude'
type RelationshipPhase = 'dating' | 'exclusive' | 'committed' | 'engaged' | 'married' | 'single' | 'open'

interface DateEntry {
  id: string
  type: DateEntryType
  title: string
  who: string
  phase: RelationshipPhase
  whatHappened: string
  feelings: string
  whatILearned: string
  greenFlags: string
  redFlags: string
  nextStep: string
  connectionScore: number
  date: string
  createdAt: string
}

const TYPE_CONFIG: Record<DateEntryType, { label: string; emoji: string; color: string }> = {
  'first-date':   { label: 'First Date',    emoji: '✨', color: '#f59e0b' },
  'regular-date': { label: 'Date',          emoji: '🌹', color: '#ec4899' },
  milestone:      { label: 'Milestone',     emoji: '🎯', color: '#22c55e' },
  reflection:     { label: 'Reflection',    emoji: '🪞', color: '#6366f1' },
  'quality-time': { label: 'Quality Time',  emoji: '💕', color: '#a855f7' },
  conflict:       { label: 'Conflict',      emoji: '⚡', color: '#ef4444' },
  growth:         { label: 'Growth',        emoji: '🌱', color: '#84cc16' },
  gratitude:      { label: 'Gratitude',     emoji: '🙏', color: '#f97316' },
}

const PHASE_CONFIG: Record<RelationshipPhase, { label: string; color: string }> = {
  single:     { label: 'Single',     color: '#94a3b8' },
  dating:     { label: 'Dating',     color: '#f59e0b' },
  exclusive:  { label: 'Exclusive',  color: '#3b82f6' },
  committed:  { label: 'Committed',  color: '#22c55e' },
  engaged:    { label: 'Engaged',    color: '#a855f7' },
  married:    { label: 'Married',    color: '#f97316' },
  open:       { label: 'Open',       color: '#ec4899' },
}

const STORAGE_KEY = 'dating_journal'

export default function DatingJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<DateEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [form, setForm] = useState<Omit<DateEntry, 'id' | 'createdAt'>>({
    type: 'regular-date', title: '', who: '', phase: 'dating',
    whatHappened: '', feelings: '', whatILearned: '', greenFlags: '', redFlags: '',
    nextStep: '', connectionScore: 3, date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: DateEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.title.trim()) return
    const e: DateEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, title: '', who: '', whatHappened: '', feelings: '', whatILearned: '', greenFlags: '', redFlags: '', nextStep: '' }))
    setShowForm(false)
    toastSuccess('Entry saved 💖')
  }

  const filtered = entries.filter(e => filterType === 'all' || e.type === filterType)
  const avgConnection = entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.connectionScore, 0) / entries.length * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Dating Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your romantic journey with intention.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Entries</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-pink-400">{avgConnection}</div>
          <div className="text-xs text-slate-500">Avg Connection</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-red-400">{entries.filter(e => e.redFlags).length}</div>
          <div className="text-xs text-slate-500">Red Flags Noted</div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === 'all' ? 'bg-pink-600/20 text-pink-400 border border-pink-500/30' : 'bg-slate-800 text-slate-500'}`}>
          All
        </button>
        {(Object.entries(TYPE_CONFIG) as [DateEntryType, typeof TYPE_CONFIG['first-date']][]).map(([k, t]) => (
          <button key={k} onClick={() => setFilterType(k)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap ${filterType === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
            style={filterType === k ? { background: t.color + '30', color: t.color } : {}}>
            {t.emoji}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Entry</h3>
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as DateEntryType }))} className="game-input text-sm flex-1">
              {(Object.entries(TYPE_CONFIG) as [DateEntryType, typeof TYPE_CONFIG['first-date']][]).map(([k, t]) => (
                <option key={k} value={k}>{t.emoji} {t.label}</option>
              ))}
            </select>
            <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value as RelationshipPhase }))} className="game-input text-sm flex-1">
              {(Object.entries(PHASE_CONFIG) as [RelationshipPhase, typeof PHASE_CONFIG.single][]).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title *" className="game-input flex-1" autoFocus />
            <input value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))}
              placeholder="With who?" className="game-input flex-1 text-sm" />
          </div>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="game-input w-full text-sm" />
          <textarea value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What happened?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.feelings} onChange={e => setForm(f => ({ ...f, feelings: e.target.value }))}
            placeholder="How did you feel?" className="game-input w-full text-sm" />
          <input value={form.greenFlags} onChange={e => setForm(f => ({ ...f, greenFlags: e.target.value }))}
            placeholder="🟢 Green flags noticed..." className="game-input w-full text-sm" />
          <input value={form.redFlags} onChange={e => setForm(f => ({ ...f, redFlags: e.target.value }))}
            placeholder="🔴 Red flags / concerns..." className="game-input w-full text-sm" />
          <input value={form.nextStep} onChange={e => setForm(f => ({ ...f, nextStep: e.target.value }))}
            placeholder="Next step in relationship..." className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Connection score: {form.connectionScore}/5</p>
            <input type="range" min={1} max={5} value={form.connectionScore}
              onChange={e => setForm(f => ({ ...f, connectionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-pink-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(e => {
          const t = TYPE_CONFIG[e.type]
          const p = PHASE_CONFIG[e.phase]
          const isExp = expanded === e.id
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${t.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: p.color + '20', color: p.color }}>{p.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{t.label}{e.who && ` · ${e.who}`} · {e.date} · ❤️ {e.connectionScore}/5</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-1.5">
                  {e.whatHappened && <p className="text-xs text-slate-300">{e.whatHappened}</p>}
                  {e.feelings && <p className="text-xs text-pink-300">💭 {e.feelings}</p>}
                  {e.greenFlags && <p className="text-xs text-green-300">🟢 {e.greenFlags}</p>}
                  {e.redFlags && <p className="text-xs text-red-300">🔴 {e.redFlags}</p>}
                  {e.nextStep && <p className="text-xs text-blue-300">👣 {e.nextStep}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Navigate your romantic life with intention and clarity.</p>
          </div>
        )}
      </div>
    </div>
  )
}
