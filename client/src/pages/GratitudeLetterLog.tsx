import { useState, useCallback } from 'react'
import { Heart, Plus, Trash2, Save, Star, BookOpen, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'gratitude_letter_log'

interface GratitudeLetterEntry {
  id: string
  date: string
  recipient: string
  relationship: 'family' | 'friend' | 'mentor' | 'colleague' | 'stranger' | 'past-self' | 'future-self' | 'other'
  subject: string
  letter: string
  mood: 1 | 2 | 3 | 4 | 5
  delivered: boolean
  deliveredDate: string
  deliveryMethod: 'in-person' | 'email' | 'letter' | 'text' | 'not-delivered'
  impact: string
  tags: string[]
}

type RelationshipType = GratitudeLetterEntry['relationship']
type DeliveryMethod = GratitudeLetterEntry['deliveryMethod']

const RELATIONSHIP_CONFIG: Record<RelationshipType, { emoji: string; label: string }> = {
  family:        { emoji: '👨‍👩‍👧', label: 'Family' },
  friend:        { emoji: '👫', label: 'Friend' },
  mentor:        { emoji: '🎓', label: 'Mentor' },
  colleague:     { emoji: '💼', label: 'Colleague' },
  stranger:      { emoji: '🌍', label: 'Stranger' },
  'past-self':   { emoji: '🕐', label: 'Past Self' },
  'future-self': { emoji: '🔮', label: 'Future Self' },
  other:         { emoji: '🔲', label: 'Other' },
}

const DELIVERY_METHODS: { value: DeliveryMethod; label: string }[] = [
  { value: 'in-person', label: 'In Person' },
  { value: 'email',     label: 'Email' },
  { value: 'letter',    label: 'Letter' },
  { value: 'text',      label: 'Text' },
  { value: 'not-delivered', label: 'Not Delivered' },
]

const MOOD_EMOJIS: Record<number, string> = { 1: '😢', 2: '😕', 3: '😌', 4: '😊', 5: '🥰' }

function load(): GratitudeLetterEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const blankForm = (): Omit<GratitudeLetterEntry, 'id'> => ({
  date: today(),
  recipient: '',
  relationship: 'friend',
  subject: '',
  letter: '',
  mood: 3,
  delivered: false,
  deliveredDate: '',
  deliveryMethod: 'not-delivered',
  impact: '',
  tags: [],
})

export default function GratitudeLetterLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<GratitudeLetterEntry[]>(load)
  const [form, setForm] = useState<Omit<GratitudeLetterEntry, 'id'>>(blankForm)
  const [tagsInput, setTagsInput] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterRelationship, setFilterRelationship] = useState<RelationshipType | 'all'>('all')
  const [showForm, setShowForm] = useState(false)

  const persist = useCallback((updated: GratitudeLetterEntry[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setEntries(updated)
  }, [])

  function save() {
    if (!form.recipient.trim() || !form.letter.trim()) return
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const entry: GratitudeLetterEntry = {
      id: Date.now().toString(),
      ...form,
      tags,
    }
    persist([entry, ...entries])
    toastSuccess('Letter of gratitude written! 💌')
    setForm(blankForm())
    setTagsInput('')
    setShowForm(false)
  }

  function remove(id: string) {
    persist(entries.filter(e => e.id !== id))
  }

  // Stats
  const total = entries.length
  const deliveredCount = entries.filter(e => e.delivered).length
  const avgMood = total ? (entries.reduce((s, e) => s + e.mood, 0) / total) : 0

  const relCounts: Partial<Record<RelationshipType, number>> = {}
  for (const e of entries) {
    relCounts[e.relationship] = (relCounts[e.relationship] ?? 0) + 1
  }
  const topRelationship = Object.entries(relCounts).sort((a, b) => b[1] - a[1])[0]

  // Filter
  const filtered = (filterRelationship === 'all' ? entries : entries.filter(e => e.relationship === filterRelationship))
    .sort((a, b) => b.date.localeCompare(a.date))

  // SVG bar chart data
  const relTypes = Object.keys(RELATIONSHIP_CONFIG) as RelationshipType[]
  const maxRelCount = Math.max(1, ...relTypes.map(r => relCounts[r] ?? 0))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-pink-400" />
            Gratitude Letter Log
          </h1>
          <p className="text-slate-400 text-sm mt-1">Write letters of gratitude — delivered or not, they transform you.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Write Letter
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-pink-400">{total}</div>
          <div className="text-xs text-slate-500">Total Letters</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{deliveredCount}</div>
          <div className="text-xs text-slate-500">Delivered</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">
            {topRelationship ? RELATIONSHIP_CONFIG[topRelationship[0] as RelationshipType].emoji : '—'}
          </div>
          <div className="text-xs text-slate-500">
            {topRelationship ? RELATIONSHIP_CONFIG[topRelationship[0] as RelationshipType].label : 'N/A'}
          </div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">
            {avgMood ? MOOD_EMOJIS[Math.round(avgMood)] : '—'}
          </div>
          <div className="text-xs text-slate-500">Avg Mood</div>
        </div>
      </div>

      {/* Write letter form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-pink-500/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-pink-400" />
            <h3 className="font-semibold text-white">Write a Gratitude Letter</h3>
          </div>

          {/* Recipient */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Recipient name</label>
            <input
              className="game-input w-full"
              placeholder="Who is this letter to?"
              value={form.recipient}
              onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
              autoFocus
            />
          </div>

          {/* Relationship chips */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Relationship</label>
            <div className="flex flex-wrap gap-1.5">
              {relTypes.map(r => (
                <button
                  key={r}
                  onClick={() => setForm(f => ({ ...f, relationship: r }))}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    form.relationship === r
                      ? 'bg-pink-600/40 text-pink-300 border border-pink-500/40'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {RELATIONSHIP_CONFIG[r].emoji} {RELATIONSHIP_CONFIG[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">What are you grateful for?</label>
            <input
              className="game-input w-full"
              placeholder="Subject of this letter..."
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
          </div>

          {/* Letter */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Your letter</label>
            <textarea
              className="game-input w-full resize-none"
              rows={7}
              placeholder={`Dear ${form.recipient || '[name]'}, I'm writing because...`}
              value={form.letter}
              onChange={e => setForm(f => ({ ...f, letter: e.target.value }))}
            />
          </div>

          {/* Mood while writing */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Mood while writing</label>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setForm(f => ({ ...f, mood: n }))}
                  className={`flex-1 py-2 rounded-xl text-xl transition-all ${
                    form.mood === n ? 'bg-pink-600/30 ring-1 ring-pink-500/60' : 'bg-slate-800 opacity-50 hover:opacity-80'
                  }`}
                >
                  {MOOD_EMOJIS[n]}
                </button>
              ))}
            </div>
          </div>

          {/* Delivered toggle */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Was this letter delivered?</label>
            <div className="flex gap-2">
              <button
                onClick={() => setForm(f => ({ ...f, delivered: true, deliveryMethod: f.deliveryMethod === 'not-delivered' ? 'email' : f.deliveryMethod }))}
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${form.delivered ? 'bg-green-600/30 text-green-300 border border-green-500/40' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
              >
                Yes, delivered
              </button>
              <button
                onClick={() => setForm(f => ({ ...f, delivered: false, deliveryMethod: 'not-delivered' }))}
                className={`px-4 py-2 rounded-xl text-sm transition-colors ${!form.delivered ? 'bg-slate-600 text-slate-200' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
              >
                Not delivered
              </button>
            </div>
          </div>

          {/* Delivery details */}
          {form.delivered && (
            <div className="space-y-3 p-3 bg-green-900/10 rounded-xl border border-green-500/20">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Delivery method</label>
                <div className="flex flex-wrap gap-1.5">
                  {DELIVERY_METHODS.filter(m => m.value !== 'not-delivered').map(m => (
                    <button
                      key={m.value}
                      onClick={() => setForm(f => ({ ...f, deliveryMethod: m.value }))}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        form.deliveryMethod === m.value
                          ? 'bg-green-600/30 text-green-300 border border-green-500/40'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Delivered date</label>
                <input
                  type="date"
                  className="game-input"
                  value={form.deliveredDate}
                  onChange={e => setForm(f => ({ ...f, deliveredDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Impact / what happened after</label>
                <textarea
                  className="game-input w-full resize-none"
                  rows={3}
                  placeholder="How did they respond? What changed?"
                  value={form.impact}
                  onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tags (comma separated)</label>
            <input
              className="game-input w-full"
              placeholder="e.g. childhood, healing, gratitude"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setForm(blankForm()); setTagsInput('') }}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!form.recipient.trim() || !form.letter.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Save className="w-4 h-4" /> Save Letter
            </button>
          </div>
        </div>
      )}

      {/* Delivered vs Undelivered */}
      {total > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Delivered vs Undelivered</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: total ? `${(deliveredCount / total) * 100}%` : '0%' }}
              />
            </div>
            <div className="flex gap-4 text-sm flex-shrink-0">
              <span className="text-green-400">{deliveredCount} sent</span>
              <span className="text-slate-400">{total - deliveredCount} kept</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {total - deliveredCount > 0
              ? 'Research shows gratitude letters help even when never sent.'
              : 'Every letter delivered — that takes courage.'}
          </p>
        </div>
      )}

      {/* Relationship breakdown SVG bars */}
      {total > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Letters by Relationship</h3>
          <svg viewBox={`0 0 400 ${relTypes.length * 28 + 8}`} width="100%" style={{ display: 'block' }}>
            {relTypes.map((r, i) => {
              const count = relCounts[r] ?? 0
              const barW = count > 0 ? (count / maxRelCount) * 220 : 0
              const y = i * 28 + 4
              const cfg = RELATIONSHIP_CONFIG[r]
              return (
                <g key={r}>
                  <text x={120} y={y + 10} textAnchor="end" dominantBaseline="middle"
                    fontSize={10} fill="#94a3b8" fontFamily="sans-serif">
                    {cfg.emoji} {cfg.label}
                  </text>
                  <rect x={126} y={y} width={Math.max(barW, 0)} height={18} rx={4} fill="#ec4899" opacity={0.7} />
                  {count > 0 && (
                    <text x={130 + barW} y={y + 9} dominantBaseline="middle"
                      fontSize={9} fill="#f9a8d4" fontFamily="monospace">
                      {count}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilterRelationship('all')}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${filterRelationship === 'all' ? 'bg-pink-600/40 text-pink-300' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
        >
          All
        </button>
        {relTypes.map(r => (
          <button
            key={r}
            onClick={() => setFilterRelationship(r)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${filterRelationship === r ? 'bg-pink-600/40 text-pink-300' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
          >
            {RELATIONSHIP_CONFIG[r].emoji} {RELATIONSHIP_CONFIG[r].label}
          </button>
        ))}
      </div>

      {/* Letter gallery */}
      <div className="space-y-3">
        {filtered.map(entry => (
          <div key={entry.id} className="game-card overflow-hidden border border-slate-700/50">
            <button
              className="w-full p-4 text-left"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-200">{entry.recipient}</span>
                    <span className="text-sm">{RELATIONSHIP_CONFIG[entry.relationship].emoji}</span>
                    <span className="text-xs text-slate-500">{RELATIONSHIP_CONFIG[entry.relationship].label}</span>
                    {entry.delivered && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-500/30">
                        Delivered
                      </span>
                    )}
                    <span className="text-sm">{MOOD_EMOJIS[entry.mood]}</span>
                  </div>
                  {entry.subject && (
                    <div className="text-xs text-pink-300/80 mb-1 font-medium">{entry.subject}</div>
                  )}
                  <p className="text-sm text-slate-400">
                    {entry.letter.slice(0, 100)}{entry.letter.length > 100 ? '…' : ''}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                    <Calendar className="w-3 h-3" />
                    {formatDate(entry.date)}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {expandedId === entry.id
                    ? <ChevronUp className="w-4 h-4 text-slate-500" />
                    : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </div>
            </button>

            {expandedId === entry.id && (
              <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-3">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {entry.letter}
                </pre>
                {entry.delivered && entry.impact && (
                  <div className="p-3 bg-green-900/10 rounded-xl border border-green-500/20">
                    <p className="text-xs text-green-400 font-medium mb-1">Impact after delivery:</p>
                    <p className="text-xs text-slate-300">{entry.impact}</p>
                  </div>
                )}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => remove(entry.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="mb-1">No letters yet.</p>
            <p className="text-sm text-slate-600 mb-5">
              You don't have to send it for it to matter.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Write Your First Letter
            </button>
          </div>
        )}
      </div>

      {/* Stars decoration */}
      {total >= 5 && (
        <div className="game-card p-4 text-center border border-yellow-500/10">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
          <p className="text-sm text-slate-300">
            You've written <span className="text-yellow-400 font-semibold">{total}</span> gratitude letters.
            {deliveredCount > 0 && ` ${deliveredCount} delivered to people who matter.`}
          </p>
        </div>
      )}
    </div>
  )
}
