import { useState, useEffect } from 'react'
import { Users, Plus, X, TrendingUp, MessageSquare, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type InteractionType =
  | 'Gave Value'
  | 'Received Value'
  | 'Made Introduction'
  | 'Collaborated'
  | 'Mentored'
  | 'Was Mentored'
  | 'Celebrated Someone'
  | 'Was Celebrated'
  | 'Resolved Conflict'
  | 'Built Trust'
  | 'Networked'
  | 'Deep Conversation'

type ReciprocityBalance = 'I gave more' | 'Balanced' | 'I received more'
type RelationshipDepthChange = 'Deepened' | 'Maintained' | 'Neutral' | 'Slight tension' | 'Damaged — repaired'

interface SocialCapitalEntry {
  id: string
  interactionType: InteractionType
  person: string
  context: string
  valueExchanged: string
  reciprocityBalance: ReciprocityBalance
  relationshipDepthChange: RelationshipDepthChange
  socialLearning: string
  followUpNeeded: boolean
  socialScore: number
  date: string
  createdAt: string
}

const INTERACTION_TYPES: InteractionType[] = [
  'Gave Value', 'Received Value', 'Made Introduction', 'Collaborated',
  'Mentored', 'Was Mentored', 'Celebrated Someone', 'Was Celebrated',
  'Resolved Conflict', 'Built Trust', 'Networked', 'Deep Conversation',
]

const RECIPROCITY_OPTIONS: ReciprocityBalance[] = ['I gave more', 'Balanced', 'I received more']
const DEPTH_OPTIONS: RelationshipDepthChange[] = ['Deepened', 'Maintained', 'Neutral', 'Slight tension', 'Damaged — repaired']

const STORAGE_KEY = 'social_capital_log'

const defaultForm = (): Omit<SocialCapitalEntry, 'id' | 'createdAt'> => ({
  interactionType: 'Gave Value',
  person: '',
  context: '',
  valueExchanged: '',
  reciprocityBalance: 'Balanced',
  relationshipDepthChange: 'Deepened',
  socialLearning: '',
  followUpNeeded: false,
  socialScore: 7,
  date: new Date().toISOString().split('T')[0],
})

function topPeople(entries: SocialCapitalEntry[]): Array<{ name: string; count: number }> {
  const counts: Record<string, number> = {}
  for (const e of entries) {
    if (e.person.trim()) counts[e.person.trim()] = (counts[e.person.trim()] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

function getMostCommon(arr: string[]): string | null {
  if (!arr.length) return null
  const counts: Record<string, number> = {}
  for (const v of arr) counts[v] = (counts[v] ?? 0) + 1
  return arr.reduce((a, b) => (counts[a] ?? 0) >= (counts[b] ?? 0) ? a : b)
}

const depthColor: Record<RelationshipDepthChange, string> = {
  'Deepened': 'text-green-400',
  'Maintained': 'text-blue-400',
  'Neutral': 'text-slate-400',
  'Slight tension': 'text-amber-400',
  'Damaged — repaired': 'text-violet-400',
}

export default function SocialCapitalLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SocialCapitalEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: SocialCapitalEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.person.trim() || !form.context.trim()) return
    const entry: SocialCapitalEntry = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(defaultForm())
    setShowForm(false)
    toastSuccess('Social capital logged — relationships are your greatest asset.')
  }

  const followUps = entries.filter(e => e.followUpNeeded)
  const topType = getMostCommon(entries.map(e => e.interactionType))
  const people = topPeople(entries)
  const last7 = entries.slice(0, 7)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-green-400" />
            Social Capital Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your social investments with intention.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Interactions</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-sm font-semibold text-green-300 truncate">{topType ?? '—'}</div>
          <div className="text-xs text-slate-500">Top Type</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-amber-400">{followUps.length}</div>
          <div className="text-xs text-slate-500">Follow-ups</div>
        </div>
      </div>

      {/* Top People */}
      {people.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Top People</h3>
          <div className="flex flex-wrap gap-2">
            {people.map(p => (
              <span key={p.name} className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-lg text-xs">
                <span className="text-slate-200">{p.name}</span>
                <span className="text-green-400 font-bold">{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups needed */}
      {followUps.length > 0 && (
        <div className="game-card p-4 border border-amber-500/20">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Follow-ups Needed
          </h3>
          <div className="space-y-1.5">
            {followUps.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center gap-2 text-xs">
                <span className="text-slate-300 font-medium">{e.person}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 truncate">{e.context}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Log Social Interaction</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <select
            value={form.interactionType}
            onChange={e => setForm(f => ({ ...f, interactionType: e.target.value as InteractionType }))}
            className="game-input w-full text-sm"
          >
            {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <input
            value={form.person}
            onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
            placeholder="Who was involved? *"
            className="game-input w-full text-sm"
            autoFocus
          />
          <input
            value={form.context}
            onChange={e => setForm(f => ({ ...f, context: e.target.value }))}
            placeholder="What happened? *"
            className="game-input w-full text-sm"
          />
          <input
            value={form.valueExchanged}
            onChange={e => setForm(f => ({ ...f, valueExchanged: e.target.value }))}
            placeholder="What was given or received?"
            className="game-input w-full text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.reciprocityBalance}
              onChange={e => setForm(f => ({ ...f, reciprocityBalance: e.target.value as ReciprocityBalance }))}
              className="game-input text-sm"
            >
              {RECIPROCITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <select
              value={form.relationshipDepthChange}
              onChange={e => setForm(f => ({ ...f, relationshipDepthChange: e.target.value as RelationshipDepthChange }))}
              className="game-input text-sm"
            >
              {DEPTH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <input
            value={form.socialLearning}
            onChange={e => setForm(f => ({ ...f, socialLearning: e.target.value }))}
            placeholder="What did you learn about people or yourself?"
            className="game-input w-full text-sm"
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">Social Score: <span className="text-green-400">{form.socialScore}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.socialScore}
              onChange={e => setForm(f => ({ ...f, socialScore: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.followUpNeeded}
              onChange={e => setForm(f => ({ ...f, followUpNeeded: e.target.checked }))}
              className="w-4 h-4 accent-amber-400 rounded"
            />
            <span className="text-sm text-slate-300">Follow-up needed</span>
          </label>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
              Log Entry
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Last 7 */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Interactions</h2>
        {last7.map(e => (
          <div key={e.id} className="game-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 bg-green-900/50 text-green-300 rounded">{e.interactionType}</span>
                  <span className="text-sm font-semibold text-slate-200">{e.person}</span>
                  {e.followUpNeeded && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{e.context}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium ${depthColor[e.relationshipDepthChange]}`}>{e.relationshipDepthChange}</span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-500">{e.reciprocityBalance}</span>
                  <span className="text-xs text-green-400 font-semibold ml-auto">Score: {e.socialScore}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">{e.date}</div>
                <button
                  onClick={() => save(entries.filter(x => x.id !== e.id))}
                  className="text-slate-700 hover:text-red-400 mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Invest in relationships — they compound over time.</p>
          </div>
        )}
      </div>

      {entries.length > 7 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{entries.length - 7} more entries in history</span>
        </div>
      )}
    </div>
  )
}
