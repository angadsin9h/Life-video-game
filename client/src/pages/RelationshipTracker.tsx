import { useState } from 'react'
import { Users, Heart, Plus, X, MessageSquare, Clock, Star, Award, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'relationship_tracker_log'
const PEOPLE_KEY = 'relationship_tracker_people'

type RelationshipType = 'Partner' | 'Family' | 'Close Friend' | 'Friend' | 'Mentor' | 'Colleague' | 'Community'
type InteractionType =
  | 'Deep Conversation'
  | 'Fun/Laughter'
  | 'Support Given'
  | 'Support Received'
  | 'Conflict'
  | 'Repair'
  | 'Quality Time'
  | 'Brief Check-in'
  | 'Collaboration'
  | 'Celebration'
type DurationType = '< 15 min' | '15-30 min' | '30-60 min' | '1-2 hours' | '2+ hours'

interface Person {
  id: string
  personName: string
  relationshipType: RelationshipType
  addedAt: string
}

interface InteractionEntry {
  id: string
  personId: string
  personName: string
  interactionType: InteractionType
  quality: number
  duration: DurationType
  notes: string
  reciprocityFelt: number
  connectionScore: number
  date: string
  createdAt: string
}

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

function loadEntries(): InteractionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as InteractionEntry[]
  } catch { /* ignore */ }
  return []
}

function saveEntries(entries: InteractionEntry[]) {
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

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  'Partner': 'text-pink-400',
  'Family': 'text-amber-400',
  'Close Friend': 'text-violet-400',
  'Friend': 'text-blue-400',
  'Mentor': 'text-green-400',
  'Colleague': 'text-slate-300',
  'Community': 'text-teal-400',
}

const INTERACTION_TYPES: InteractionType[] = [
  'Deep Conversation', 'Fun/Laughter', 'Support Given', 'Support Received',
  'Conflict', 'Repair', 'Quality Time', 'Brief Check-in', 'Collaboration', 'Celebration',
]
const DURATION_OPTIONS: DurationType[] = ['< 15 min', '15-30 min', '30-60 min', '1-2 hours', '2+ hours']
const RELATIONSHIP_TYPES: RelationshipType[] = ['Partner', 'Family', 'Close Friend', 'Friend', 'Mentor', 'Colleague', 'Community']

const DEFAULT_INTERACTION = {
  personId: '',
  interactionType: 'Deep Conversation' as InteractionType,
  quality: 7,
  duration: '30-60 min' as DurationType,
  notes: '',
  reciprocityFelt: 7,
}

export default function RelationshipTracker() {
  const { toastSuccess } = useToast()
  const [people, setPeople] = useState<Person[]>(loadPeople)
  const [entries, setEntries] = useState<InteractionEntry[]>(loadEntries)

  const [tab, setTab] = useState<'log' | 'people' | 'map'>('map')

  // Add person form
  const [newPersonName, setNewPersonName] = useState('')
  const [newPersonType, setNewPersonType] = useState<RelationshipType>('Friend')

  // Interaction form
  const [interForm, setInterForm] = useState({ ...DEFAULT_INTERACTION })

  function handleAddPerson() {
    if (!newPersonName.trim()) return
    const p: Person = {
      id: Date.now().toString(),
      personName: newPersonName.trim(),
      relationshipType: newPersonType,
      addedAt: new Date().toISOString(),
    }
    const updated = [...people, p]
    setPeople(updated)
    savePeople(updated)
    toastSuccess('Person added', p.personName)
    setNewPersonName('')
    setNewPersonType('Friend')
  }

  function handleRemovePerson(id: string) {
    const updated = people.filter(p => p.id !== id)
    setPeople(updated)
    savePeople(updated)
  }

  function handleLogInteraction() {
    if (!interForm.personId) return
    const person = people.find(p => p.id === interForm.personId)
    if (!person) return
    const connectionScore = Math.round(((interForm.quality + interForm.reciprocityFelt) / 2) * 10)
    const entry: InteractionEntry = {
      id: Date.now().toString(),
      personId: interForm.personId,
      personName: person.personName,
      interactionType: interForm.interactionType,
      quality: interForm.quality,
      duration: interForm.duration,
      notes: interForm.notes,
      reciprocityFelt: interForm.reciprocityFelt,
      connectionScore,
      date: todayStr(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...entries, entry]
    setEntries(updated)
    saveEntries(updated)
    toastSuccess('Interaction logged', `${person.personName} — Score ${connectionScore}/100`)
    setInterForm({ ...DEFAULT_INTERACTION })
  }

  // Health map computations
  const healthMap = people.map(person => {
    const personEntries = entries.filter(e => e.personId === person.id)
    const avgScore = personEntries.length
      ? personEntries.reduce((s, e) => s + e.connectionScore, 0) / personEntries.length
      : 0
    const lastEntry = personEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
    const daysSinceLast = lastEntry ? daysSince(lastEntry.date) : null
    return { person, personEntries, avgScore, lastEntry, daysSinceLast }
  }).sort((a, b) => b.avgScore - a.avgScore)

  const bestRelationship = healthMap[0] ?? null
  const totalInteractions = entries.length

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-6 h-6 text-pink-400" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
          Relationship Tracker
        </h1>
      </div>
      <p className="text-slate-400 text-sm mb-4">Track meaningful interactions and relationship health.</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="game-card text-center p-3">
          <Users className="w-4 h-4 text-pink-400 mx-auto mb-1" />
          <div className="text-xl font-black text-pink-400" style={{ fontFamily: 'Orbitron, monospace' }}>{people.length}</div>
          <div className="text-xs text-slate-400">People</div>
        </div>
        <div className="game-card text-center p-3">
          <MessageSquare className="w-4 h-4 text-blue-400 mx-auto mb-1" />
          <div className="text-xl font-black text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{totalInteractions}</div>
          <div className="text-xs text-slate-400">Interactions</div>
        </div>
        <div className="game-card text-center p-3">
          <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <div className="text-sm font-bold text-amber-400 truncate">{bestRelationship?.person.personName ?? '—'}</div>
          <div className="text-xs text-slate-400">Best Avg</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['map', 'log', 'people'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-pink-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {t === 'map' ? 'Health Map' : t === 'log' ? 'Log Interaction' : 'People'}
          </button>
        ))}
      </div>

      {/* HEALTH MAP TAB */}
      {tab === 'map' && (
        <div className="space-y-3">
          {healthMap.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              <Heart className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-sm">Add people and log interactions to see your health map.</p>
            </div>
          )}
          {healthMap.map(({ person, personEntries, avgScore, daysSinceLast }) => {
            const contactWarning = daysSinceLast !== null && daysSinceLast > 14
            const contactCaution = daysSinceLast !== null && daysSinceLast > 7 && daysSinceLast <= 14
            return (
              <div key={person.id} className={`game-card border ${contactWarning ? 'border-red-500/30' : contactCaution ? 'border-amber-500/30' : 'border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-slate-100">{person.personName}</span>
                    <span className={`ml-2 text-xs ${RELATIONSHIP_COLORS[person.relationshipType]}`}>
                      {person.relationshipType}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-pink-400">{avgScore > 0 ? `${avgScore.toFixed(0)}/100` : '—'}</div>
                    {daysSinceLast !== null && (
                      <div className={`text-xs flex items-center gap-1 justify-end ${contactWarning ? 'text-red-400' : contactCaution ? 'text-amber-400' : 'text-slate-500'}`}>
                        {(contactWarning || contactCaution) && <AlertCircle className="w-3 h-3" />}
                        <Clock className="w-3 h-3" />{daysSinceLast}d ago
                      </div>
                    )}
                    {daysSinceLast === null && <div className="text-xs text-slate-600">No interactions</div>}
                  </div>
                </div>
                {avgScore > 0 && (
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill bg-pink-500"
                      style={{ width: `${avgScore}%` }}
                    />
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-1">{personEntries.length} interaction{personEntries.length !== 1 ? 's' : ''}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* LOG INTERACTION TAB */}
      {tab === 'log' && (
        <div className="game-card border border-pink-500/20">
          <h3 className="font-bold text-pink-300 mb-4">Log an Interaction</h3>
          {people.length === 0 ? (
            <p className="text-sm text-slate-400">Add people first in the People tab.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Person</label>
                <select className="game-input w-full mt-1"
                  value={interForm.personId}
                  onChange={e => setInterForm(f => ({ ...f, personId: e.target.value }))}>
                  <option value="">Select a person...</option>
                  {people.map(p => <option key={p.id} value={p.id}>{p.personName} ({p.relationshipType})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Interaction Type</label>
                <select className="game-input w-full mt-1"
                  value={interForm.interactionType}
                  onChange={e => setInterForm(f => ({ ...f, interactionType: e.target.value as InteractionType }))}>
                  {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Quality: {interForm.quality}/10</label>
                <input type="range" min={1} max={10} value={interForm.quality}
                  onChange={e => setInterForm(f => ({ ...f, quality: Number(e.target.value) }))}
                  className="w-full accent-pink-500 mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Duration</label>
                <select className="game-input w-full mt-1"
                  value={interForm.duration}
                  onChange={e => setInterForm(f => ({ ...f, duration: e.target.value as DurationType }))}>
                  {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">What made it meaningful?</label>
                <input className="game-input w-full mt-1" placeholder="Notes..."
                  value={interForm.notes} onChange={e => setInterForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Reciprocity Felt: {interForm.reciprocityFelt}/10</label>
                <input type="range" min={1} max={10} value={interForm.reciprocityFelt}
                  onChange={e => setInterForm(f => ({ ...f, reciprocityFelt: Number(e.target.value) }))}
                  className="w-full accent-pink-500 mt-1" />
              </div>
              <div className="bg-slate-800/50 rounded-lg px-3 py-2 text-sm text-slate-300">
                Connection Score: <span className="text-pink-400 font-bold">
                  {Math.round(((interForm.quality + interForm.reciprocityFelt) / 2) * 10)}/100
                </span>
              </div>
              <button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm py-2 rounded-lg font-semibold disabled:opacity-40"
                disabled={!interForm.personId}
                onClick={handleLogInteraction}>
                Log Interaction
              </button>
            </div>
          )}
        </div>
      )}

      {/* PEOPLE TAB */}
      {tab === 'people' && (
        <div className="space-y-3">
          <div className="game-card border border-pink-500/20">
            <h3 className="font-bold text-pink-300 mb-3">Add a Person</h3>
            <div className="flex gap-2 mb-3">
              <input className="game-input flex-1" placeholder="Name..."
                value={newPersonName} onChange={e => setNewPersonName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPerson()} />
              <select className="game-input" value={newPersonType}
                onChange={e => setNewPersonType(e.target.value as RelationshipType)}>
                {RELATIONSHIP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
              onClick={handleAddPerson}>
              <Plus className="w-4 h-4" /> Add Person
            </button>
          </div>

          <div className="space-y-2">
            {people.map(p => {
              const pEntries = entries.filter(e => e.personId === p.id)
              const avgScore = pEntries.length
                ? pEntries.reduce((s, e) => s + e.connectionScore, 0) / pEntries.length
                : 0
              return (
                <div key={p.id} className="game-card flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-100">{p.personName}</span>
                    <span className={`ml-2 text-xs ${RELATIONSHIP_COLORS[p.relationshipType]}`}>
                      {p.relationshipType}
                    </span>
                    <div className="text-xs text-slate-500">{pEntries.length} interactions · avg {avgScore > 0 ? `${avgScore.toFixed(0)}/100` : '—'}</div>
                  </div>
                  <button onClick={() => handleRemovePerson(p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
            {people.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                <Star className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm">No people added yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
