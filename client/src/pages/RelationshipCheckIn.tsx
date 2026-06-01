import { useState } from 'react'
import { Users, Heart, Plus, Trash2, Save, Star, Target, TrendingUp, ChevronDown, ChevronUp, Calendar, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'relationship_checkin_log'
const PEOPLE_KEY = 'relationship_checkin_people'

interface Person {
  id: string
  name: string
  relationship: 'partner' | 'family' | 'close-friend' | 'friend' | 'colleague' | 'mentor' | 'mentee'
  contactGoal: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  notes: string
}

interface RelationshipCheckInEntry {
  id: string
  personId: string
  date: string
  connectionScore: 1|2|3|4|5|6|7|8|9|10
  qualityTimeMinutes: number
  interactionType: 'in-person' | 'call' | 'text' | 'video' | 'activity' | 'meal'
  howTheySeemed: string
  whatYouAppreciated: string
  whatNeedsAttention: string
  nextAction: string
  feeling: 1|2|3|4|5
}

const RELATIONSHIP_LABELS: Record<Person['relationship'], string> = {
  'partner': 'Partner',
  'family': 'Family',
  'close-friend': 'Close Friend',
  'friend': 'Friend',
  'colleague': 'Colleague',
  'mentor': 'Mentor',
  'mentee': 'Mentee',
}

const RELATIONSHIP_COLORS: Record<Person['relationship'], string> = {
  'partner': 'text-pink-400',
  'family': 'text-amber-400',
  'close-friend': 'text-violet-400',
  'friend': 'text-blue-400',
  'colleague': 'text-slate-300',
  'mentor': 'text-green-400',
  'mentee': 'text-teal-400',
}

const CONTACT_GOAL_DAYS: Record<Person['contactGoal'], number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
}

const INTERACTION_TYPES: { value: RelationshipCheckInEntry['interactionType']; label: string; emoji: string }[] = [
  { value: 'in-person', label: 'In-person', emoji: '🤝' },
  { value: 'call', label: 'Call', emoji: '📞' },
  { value: 'text', label: 'Text', emoji: '💬' },
  { value: 'video', label: 'Video', emoji: '📹' },
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'meal', label: 'Meal', emoji: '🍽' },
]

const SCORE_COLORS = [
  '', '#ef4444', '#f97316', '#fb923c', '#facc15', '#a3e635',
  '#4ade80', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa'
]

function loadPeople(): Person[] {
  try {
    const raw = localStorage.getItem(PEOPLE_KEY)
    if (raw) return JSON.parse(raw) as Person[]
  } catch { /* ignore */ }
  return []
}

function savePeople(people: Person[]) {
  try { localStorage.setItem(PEOPLE_KEY, JSON.stringify(people)) } catch { /* ignore */ }
}

function loadEntries(): RelationshipCheckInEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as RelationshipCheckInEntry[]
  } catch { /* ignore */ }
  return []
}

function saveEntries(entries: RelationshipCheckInEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* ignore */ }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - then.getTime()) / 86400000)
}

function healthBadge(days: number | null, goal: Person['contactGoal']): { label: string; color: string; bg: string } {
  if (days === null) return { label: 'No check-in', color: 'text-slate-400', bg: 'bg-slate-700/50' }
  const goalDays = CONTACT_GOAL_DAYS[goal]
  if (days <= goalDays) return { label: 'On track', color: 'text-green-400', bg: 'bg-green-500/10' }
  if (days <= goalDays * 2) return { label: 'Overdue', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
  return { label: 'Neglected', color: 'text-red-400', bg: 'bg-red-500/10' }
}

const EMPTY_FORM = {
  personId: '',
  date: todayStr(),
  connectionScore: 7 as RelationshipCheckInEntry['connectionScore'],
  qualityTimeMinutes: 30,
  interactionType: 'in-person' as RelationshipCheckInEntry['interactionType'],
  howTheySeemed: '',
  whatYouAppreciated: '',
  whatNeedsAttention: '',
  nextAction: '',
  feeling: 3 as RelationshipCheckInEntry['feeling'],
}

const EMPTY_PERSON: Omit<Person, 'id'> = {
  name: '',
  relationship: 'friend',
  contactGoal: 'weekly',
  notes: '',
}

export default function RelationshipCheckIn() {
  const { toastSuccess } = useToast()
  const [people, setPeople] = useState<Person[]>(loadPeople)
  const [entries, setEntries] = useState<RelationshipCheckInEntry[]>(loadEntries)

  const [tab, setTab] = useState<'dashboard' | 'log' | 'people' | 'trend'>('dashboard')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [personForm, setPersonForm] = useState({ ...EMPTY_PERSON })
  const [trendPersonId, setTrendPersonId] = useState('')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  // ─── People ───────────────────────────────────────────────────────────────
  function handleAddPerson() {
    if (!personForm.name.trim()) return
    const p: Person = { id: Date.now().toString(), ...personForm, name: personForm.name.trim() }
    const updated = [...people, p]
    setPeople(updated)
    savePeople(updated)
    setPersonForm({ ...EMPTY_PERSON })
    toastSuccess('Person added', p.name)
  }

  function handleDeletePerson(id: string) {
    const updated = people.filter(p => p.id !== id)
    setPeople(updated)
    savePeople(updated)
  }

  // ─── Check-in ─────────────────────────────────────────────────────────────
  function handleSaveCheckIn() {
    if (!form.personId) return
    const entry: RelationshipCheckInEntry = {
      id: Date.now().toString(),
      ...form,
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    saveEntries(updated)
    setForm({ ...EMPTY_FORM })
    toastSuccess('Check-in logged! 💝')
  }

  // ─── Per-person helpers ────────────────────────────────────────────────────
  function personEntries(personId: string) {
    return entries.filter(e => e.personId === personId).sort((a, b) => b.date.localeCompare(a.date))
  }

  function lastCheckIn(personId: string) {
    const pe = personEntries(personId)
    return pe[0] ?? null
  }

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalCheckIns = entries.length
  const avgConnectionScore = entries.length
    ? (entries.reduce((s, e) => s + e.connectionScore, 0) / entries.length).toFixed(1)
    : '—'

  const relTypeCounts: Partial<Record<Person['relationship'], number>> = {}
  entries.forEach(e => {
    const p = people.find(p => p.id === e.personId)
    if (p) relTypeCounts[p.relationship] = (relTypeCounts[p.relationship] ?? 0) + 1
  })
  const mostConnectedType = (Object.entries(relTypeCounts) as [Person['relationship'], number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const overdueCount = people.filter(p => {
    const lc = lastCheckIn(p.id)
    const days = lc ? daysSince(lc.date) : null
    const badge = healthBadge(days, p.contactGoal)
    return badge.label === 'Overdue' || badge.label === 'Neglected'
  }).length

  // ─── Trend chart ──────────────────────────────────────────────────────────
  const trendEntries = trendPersonId
    ? entries.filter(e => e.personId === trendPersonId).sort((a, b) => a.date.localeCompare(b.date)).slice(-20)
    : []

  const W = 400; const H = 200; const PAD = { top: 16, right: 16, bottom: 24, left: 28 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  function trendX(i: number) {
    return PAD.left + (trendEntries.length > 1 ? (i / (trendEntries.length - 1)) * chartW : chartW / 2)
  }
  function trendY(score: number) {
    return PAD.top + chartH - ((score - 1) / 9) * chartH
  }

  const trendPolyline = trendEntries.map((e, i) => `${trendX(i)},${trendY(e.connectionScore)}`).join(' ')

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Heart className="w-6 h-6 text-pink-400" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
          Relationship Check-In
        </h1>
      </div>
      <p className="text-slate-400 text-sm mb-5">Track your connections — nurture what matters most.</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="game-card text-center p-3">
          <Users className="w-4 h-4 text-pink-400 mx-auto mb-1" />
          <div className="text-xl font-black text-pink-400" style={{ fontFamily: 'Orbitron, monospace' }}>{people.length}</div>
          <div className="text-xs text-slate-400">People</div>
        </div>
        <div className="game-card text-center p-3">
          <Calendar className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalCheckIns}</div>
          <div className="text-xs text-slate-400">Check-ins</div>
        </div>
        <div className="game-card text-center p-3">
          <Star className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-xl font-black text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>{avgConnectionScore}</div>
          <div className="text-xs text-slate-400">Avg Score</div>
        </div>
        <div className="game-card text-center p-3">
          <Target className="w-4 h-4 text-red-400 mx-auto mb-1" />
          <div className="text-xl font-black text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>{overdueCount}</div>
          <div className="text-xs text-slate-400">Overdue</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['dashboard', 'log', 'people', 'trend'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {t === 'dashboard' ? 'Dashboard' : t === 'log' ? 'Log Check-in' : t === 'people' ? 'People' : 'Trend'}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-3">
          {mostConnectedType && (
            <div className="game-card border border-pink-500/20 p-3 text-sm">
              <span className="text-slate-400">Most connected type: </span>
              <span className={`font-semibold ${RELATIONSHIP_COLORS[mostConnectedType]}`}>
                {RELATIONSHIP_LABELS[mostConnectedType]}
              </span>
            </div>
          )}
          {people.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Heart className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">Add people in the People tab to get started.</p>
            </div>
          )}
          {people.map(person => {
            const pe = personEntries(person.id)
            const lc = pe[0] ?? null
            const days = lc ? daysSince(lc.date) : null
            const badge = healthBadge(days, person.contactGoal)
            const last3Scores = pe.slice(0, 3).reverse().map(e => e.connectionScore)
            const lastNextAction = pe[0]?.nextAction ?? ''

            return (
              <div key={person.id} className="game-card">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-slate-100">{person.name}</span>
                    <span className={`ml-2 text-xs ${RELATIONSHIP_COLORS[person.relationship]}`}>
                      {RELATIONSHIP_LABELS[person.relationship]}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color} ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                  {lc ? (
                    <span>{days}d ago · {lc.date}</span>
                  ) : (
                    <span>Never checked in</span>
                  )}
                  <span>Goal: {person.contactGoal}</span>
                </div>

                {/* Mini bar chart — last 3 scores */}
                {last3Scores.length > 0 && (
                  <div className="flex items-end gap-1 mb-2" title="Last 3 connection scores">
                    {last3Scores.map((score, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <div
                          className="w-5 rounded-sm"
                          style={{ height: `${(score / 10) * 28}px`, backgroundColor: SCORE_COLORS[score] }}
                        />
                        <span className="text-xs text-slate-500">{score}</span>
                      </div>
                    ))}
                    <span className="text-xs text-slate-600 ml-1 self-end mb-0.5">last {last3Scores.length}</span>
                  </div>
                )}

                {lastNextAction && (
                  <div className="text-xs text-slate-400 bg-slate-800/50 rounded px-2 py-1">
                    <span className="text-slate-500">Next: </span>{lastNextAction}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── LOG CHECK-IN TAB ──────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div className="game-card border border-pink-500/20">
          <h3 className="font-bold text-pink-300 mb-4 flex items-center gap-2">
            <Save className="w-4 h-4" /> Log a Check-In
          </h3>

          {people.length === 0 ? (
            <p className="text-sm text-slate-400">Add people in the People tab first.</p>
          ) : (
            <div className="space-y-4">
              {/* Person selector */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Person</label>
                <select
                  className="game-input w-full"
                  value={form.personId}
                  onChange={e => setForm(f => ({ ...f, personId: e.target.value }))}
                >
                  <option value="">Select a person...</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {RELATIONSHIP_LABELS[p.relationship]}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  className="game-input w-full"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              {/* Connection score */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">Connection Score</label>
                <div className="flex flex-wrap gap-1.5">
                  {([1,2,3,4,5,6,7,8,9,10] as RelationshipCheckInEntry['connectionScore'][]).map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, connectionScore: n }))}
                      className={`w-9 h-9 rounded-lg text-sm font-bold border transition-all ${form.connectionScore === n ? 'text-white border-transparent' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                      style={form.connectionScore === n ? { backgroundColor: SCORE_COLORS[n], borderColor: SCORE_COLORS[n] } : {}}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality time */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">Quality Time (minutes)</label>
                <input
                  type="number"
                  className="game-input w-full"
                  value={form.qualityTimeMinutes}
                  min={0}
                  onChange={e => setForm(f => ({ ...f, qualityTimeMinutes: Math.max(0, Number(e.target.value)) }))}
                />
              </div>

              {/* Interaction type */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">Interaction Type</label>
                <div className="flex flex-wrap gap-2">
                  {INTERACTION_TYPES.map(it => (
                    <button
                      key={it.value}
                      onClick={() => setForm(f => ({ ...f, interactionType: it.value }))}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${form.interactionType === it.value ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                    >
                      {it.emoji} {it.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text fields */}
              <div>
                <label className="text-xs text-slate-400 block mb-1">How they seemed</label>
                <textarea
                  className="game-input w-full resize-none"
                  rows={2}
                  placeholder="Brief note on their state..."
                  value={form.howTheySeemed}
                  onChange={e => setForm(f => ({ ...f, howTheySeemed: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">What you appreciated</label>
                <textarea
                  className="game-input w-full resize-none"
                  rows={2}
                  placeholder="What did you appreciate about them today?"
                  value={form.whatYouAppreciated}
                  onChange={e => setForm(f => ({ ...f, whatYouAppreciated: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">What needs attention</label>
                <textarea
                  className="game-input w-full resize-none"
                  rows={2}
                  placeholder="Any tension, drift, or unmet needs?"
                  value={form.whatNeedsAttention}
                  onChange={e => setForm(f => ({ ...f, whatNeedsAttention: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Next action for them</label>
                <input
                  className="game-input w-full"
                  placeholder="What will you do for them next?"
                  value={form.nextAction}
                  onChange={e => setForm(f => ({ ...f, nextAction: e.target.value }))}
                />
              </div>

              {/* Feeling */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">Your feeling after this interaction</label>
                <div className="flex gap-2">
                  {(['😔','😟','😐','🙂','😄'] as const).map((emoji, i) => {
                    const val = (i + 1) as RelationshipCheckInEntry['feeling']
                    return (
                      <button
                        key={val}
                        onClick={() => setForm(f => ({ ...f, feeling: val }))}
                        className={`text-2xl px-2 py-1 rounded-lg border transition-all ${form.feeling === val ? 'border-pink-500 bg-pink-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                      >
                        {emoji}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                disabled={!form.personId}
                onClick={handleSaveCheckIn}
              >
                <Save className="w-4 h-4" /> Save Check-In
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PEOPLE TAB ────────────────────────────────────────────────────── */}
      {tab === 'people' && (
        <div className="space-y-4">
          {/* Add person form */}
          <div className="game-card border border-pink-500/20">
            <h3 className="font-bold text-pink-300 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add a Person
            </h3>
            <div className="space-y-3">
              <input
                className="game-input w-full"
                placeholder="Name..."
                value={personForm.name}
                onChange={e => setPersonForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAddPerson()}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Relationship</label>
                  <select
                    className="game-input w-full"
                    value={personForm.relationship}
                    onChange={e => setPersonForm(f => ({ ...f, relationship: e.target.value as Person['relationship'] }))}
                  >
                    {(Object.entries(RELATIONSHIP_LABELS) as [Person['relationship'], string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Contact Goal</label>
                  <select
                    className="game-input w-full"
                    value={personForm.contactGoal}
                    onChange={e => setPersonForm(f => ({ ...f, contactGoal: e.target.value as Person['contactGoal'] }))}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
              <input
                className="game-input w-full"
                placeholder="Notes (optional)..."
                value={personForm.notes}
                onChange={e => setPersonForm(f => ({ ...f, notes: e.target.value }))}
              />
              <button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                disabled={!personForm.name.trim()}
                onClick={handleAddPerson}
              >
                <Plus className="w-4 h-4" /> Add Person
              </button>
            </div>
          </div>

          {/* People list */}
          <div className="space-y-2">
            {people.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No people added yet.</p>
              </div>
            )}
            {people.map(p => {
              const lc = lastCheckIn(p.id)
              const days = lc ? daysSince(lc.date) : null
              const badge = healthBadge(days, p.contactGoal)
              return (
                <div key={p.id} className="game-card flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-100">{p.name}</span>
                      <span className={`text-xs ${RELATIONSHIP_COLORS[p.relationship]}`}>
                        {RELATIONSHIP_LABELS[p.relationship]}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${badge.color} ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Goal: {p.contactGoal} · {days !== null ? `${days}d since last` : 'Never checked in'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePerson(p.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TREND TAB ─────────────────────────────────────────────────────── */}
      {tab === 'trend' && (
        <div className="space-y-4">
          <div className="game-card">
            <h3 className="font-bold text-pink-300 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Connection Score Trend
            </h3>
            {people.length === 0 ? (
              <p className="text-sm text-slate-400">Add people first.</p>
            ) : (
              <>
                <select
                  className="game-input w-full mb-4"
                  value={trendPersonId}
                  onChange={e => setTrendPersonId(e.target.value)}
                >
                  <option value="">Select a person...</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                {trendPersonId && trendEntries.length === 0 && (
                  <p className="text-sm text-slate-400">No check-ins for this person yet.</p>
                )}

                {trendEntries.length >= 2 && (
                  <div className="overflow-x-auto">
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: '220px' }}>
                      {/* Grid lines */}
                      {[1,3,5,7,10].map(v => {
                        const y = trendY(v)
                        return (
                          <g key={v}>
                            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#1e293b" strokeWidth="1" />
                            <text x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#475569">{v}</text>
                          </g>
                        )
                      })}
                      {/* Line */}
                      <polyline
                        points={trendPolyline}
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      {/* Dots */}
                      {trendEntries.map((e, i) => (
                        <g key={e.id}>
                          <circle
                            cx={trendX(i)}
                            cy={trendY(e.connectionScore)}
                            r={4}
                            fill={SCORE_COLORS[e.connectionScore]}
                            stroke="#0f172a"
                            strokeWidth="1.5"
                          />
                        </g>
                      ))}
                      {/* X-axis labels */}
                      {trendEntries.map((e, i) => {
                        if (trendEntries.length > 8 && i % 3 !== 0) return null
                        return (
                          <text key={e.id} x={trendX(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#475569">
                            {e.date.slice(5)}
                          </text>
                        )
                      })}
                    </svg>
                  </div>
                )}

                {trendEntries.length === 1 && (
                  <p className="text-sm text-slate-400">Log at least 2 check-ins to see a trend.</p>
                )}
              </>
            )}
          </div>

          {/* Recent entries for trend person */}
          {trendPersonId && trendEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" /> Check-In History
              </h4>
              {[...trendEntries].reverse().slice(0, 10).map(e => {
                const isExpanded = expandedEntryId === e.id
                const it = INTERACTION_TYPES.find(it => it.value === e.interactionType)
                return (
                  <div key={e.id} className="game-card">
                    <button
                      className="w-full flex items-center justify-between text-left"
                      onClick={() => setExpandedEntryId(isExpanded ? null : e.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{it?.emoji ?? '💬'}</span>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{e.date}</div>
                          <div className="text-xs text-slate-400">{it?.label} · {e.qualityTimeMinutes}min</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: SCORE_COLORS[e.connectionScore] }}
                        >
                          {e.connectionScore}/10
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="mt-3 space-y-2 text-sm border-t border-slate-700 pt-3">
                        {e.howTheySeemed && <div><span className="text-slate-500">Seemed: </span><span className="text-slate-300">{e.howTheySeemed}</span></div>}
                        {e.whatYouAppreciated && <div><span className="text-slate-500">Appreciated: </span><span className="text-slate-300">{e.whatYouAppreciated}</span></div>}
                        {e.whatNeedsAttention && <div><span className="text-slate-500">Needs attention: </span><span className="text-slate-300">{e.whatNeedsAttention}</span></div>}
                        {e.nextAction && <div><span className="text-slate-500">Next action: </span><span className="text-slate-300">{e.nextAction}</span></div>}
                        <div className="text-xs text-slate-500">Feeling: {'😔😟😐🙂😄'[e.feeling - 1]}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
