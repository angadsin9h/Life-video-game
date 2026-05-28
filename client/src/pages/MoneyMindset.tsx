import { useEffect, useState } from 'react'
import { TrendingUp, Plus, Trash2, RefreshCw, Star, BookOpen, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ── Types ──────────────────────────────────────────────────────────────────

type BeliefCategory = 'Abundance' | 'Scarcity' | 'Neutral' | 'Insight' | 'Goal' | 'Gratitude'

interface BeliefEntry {
  id: string
  date: string
  belief: string
  category: BeliefCategory
  reframe: string
}

interface Affirmation {
  id: string
  text: string
  daily: boolean
  createdAt: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const ENTRIES_KEY = 'money_mindset'
const AFFIRMATIONS_KEY = 'money_affirmations'

const CATEGORIES: BeliefCategory[] = ['Abundance', 'Scarcity', 'Neutral', 'Insight', 'Goal', 'Gratitude']

const CATEGORY_META: Record<BeliefCategory, { color: string; bg: string }> = {
  Abundance: { color: '#22c55e', bg: '#14532d33' },
  Scarcity:  { color: '#ef4444', bg: '#7f1d1d33' },
  Neutral:   { color: '#94a3b8', bg: '#1e293b'   },
  Insight:   { color: '#60a5fa', bg: '#1e3a5f33' },
  Goal:      { color: '#a78bfa', bg: '#2e1065aa' },
  Gratitude: { color: '#facc15', bg: '#422006aa' },
}

const PRESET_AFFIRMATIONS: string[] = [
  'Money flows to me easily',
  'I am worthy of abundance',
  'I make smart financial decisions',
  'I give generously and receive abundantly',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function startOfWeek(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}

function loadEntries(): BeliefEntry[] {
  try { return JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]') } catch { return [] }
}

function loadAffirmations(): Affirmation[] {
  try { return JSON.parse(localStorage.getItem(AFFIRMATIONS_KEY) || '[]') } catch { return [] }
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MoneyMindset() {
  const { toastSuccess } = useToast()

  const [entries, setEntries] = useState<BeliefEntry[]>([])
  const [affirmations, setAffirmations] = useState<Affirmation[]>([])

  // Belief form state
  const [showBeliefForm, setShowBeliefForm] = useState(false)
  const [beliefText, setBeliefText] = useState('')
  const [beliefCategory, setBeliefCategory] = useState<BeliefCategory>('Neutral')
  const [beliefReframe, setBeliefReframe] = useState('')
  const [beliefDate, setBeliefDate] = useState(today())

  // Reframe editing state
  const [editingReframe, setEditingReframe] = useState<string | null>(null)
  const [reframeText, setReframeText] = useState('')

  // Affirmation form state
  const [showAffirmForm, setShowAffirmForm] = useState(false)
  const [affirmText, setAffirmText] = useState('')

  // ── Load from localStorage ─────────────────────────────────────────────

  useEffect(() => {
    setEntries(loadEntries())
    setAffirmations(loadAffirmations())
  }, [])

  // ── Persist helpers ────────────────────────────────────────────────────

  function persistEntries(next: BeliefEntry[]) {
    setEntries(next)
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
  }

  function persistAffirmations(next: Affirmation[]) {
    setAffirmations(next)
    localStorage.setItem(AFFIRMATIONS_KEY, JSON.stringify(next))
  }

  // ── Belief actions ─────────────────────────────────────────────────────

  function addBelief() {
    if (!beliefText.trim()) return
    const entry: BeliefEntry = {
      id: Date.now().toString(),
      date: beliefDate,
      belief: beliefText.trim(),
      category: beliefCategory,
      reframe: beliefCategory === 'Scarcity' ? beliefReframe.trim() : '',
    }
    persistEntries([entry, ...entries])
    setBeliefText('')
    setBeliefCategory('Neutral')
    setBeliefReframe('')
    setBeliefDate(today())
    setShowBeliefForm(false)
    toastSuccess('Money belief logged', `Category: ${entry.category}`)
  }

  function removeBelief(id: string) {
    persistEntries(entries.filter(e => e.id !== id))
  }

  function saveReframe(id: string) {
    persistEntries(entries.map(e => e.id === id ? { ...e, reframe: reframeText.trim() } : e))
    setEditingReframe(null)
    toastSuccess('Reframe saved', 'Keep building that abundance mindset!')
  }

  function cancelBeliefForm() {
    setShowBeliefForm(false)
    setBeliefText('')
    setBeliefReframe('')
    setBeliefCategory('Neutral')
    setBeliefDate(today())
  }

  // ── Affirmation actions ────────────────────────────────────────────────

  function addAffirmation(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (affirmations.some(a => a.text.toLowerCase() === trimmed.toLowerCase())) {
      toastSuccess('Already added', 'This affirmation is already in your list.')
      return
    }
    const aff: Affirmation = {
      id: Date.now().toString(),
      text: trimmed,
      daily: false,
      createdAt: today(),
    }
    persistAffirmations([aff, ...affirmations])
    setAffirmText('')
    setShowAffirmForm(false)
    toastSuccess('Affirmation added!')
  }

  function toggleDaily(id: string) {
    persistAffirmations(affirmations.map(a => a.id === id ? { ...a, daily: !a.daily } : a))
  }

  function removeAffirmation(id: string) {
    persistAffirmations(affirmations.filter(a => a.id !== id))
  }

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalEntries = entries.length
  const scarcityCount = entries.filter(e => e.category === 'Scarcity').length
  const abundanceCount = entries.filter(e => e.category === 'Abundance').length
  const weekStart = startOfWeek()
  const thisWeek = entries.filter(e => e.date >= weekStart).length

  const scarcityPct = totalEntries > 0 ? Math.round((scarcityCount / totalEntries) * 100) : null
  const abundancePct = totalEntries > 0 ? Math.round((abundanceCount / totalEntries) * 100) : null

  const scarcityWithoutReframe = entries.filter(e => e.category === 'Scarcity' && !e.reframe)

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <TrendingUp className="w-7 h-7 text-green-400" />
            Money Mindset
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Journal your financial beliefs and build abundance</p>
        </div>
        <button
          onClick={() => setShowBeliefForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Belief
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-white">{totalEntries}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-red-400">{scarcityPct !== null ? `${scarcityPct}%` : '—'}</div>
          <div className="text-xs text-slate-500">Scarcity</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{abundancePct !== null ? `${abundancePct}%` : '—'}</div>
          <div className="text-xs text-slate-500">Abundance</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{thisWeek}</div>
          <div className="text-xs text-slate-500">This Week</div>
        </div>
      </div>

      {/* Belief Form */}
      {showBeliefForm && (
        <div className="game-card p-5 space-y-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-300">Log a Money Belief</h3>
            <button onClick={cancelBeliefForm} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">What belief or thought came up?</label>
            <textarea
              value={beliefText}
              onChange={e => setBeliefText(e.target.value)}
              placeholder="e.g. I'll never have enough money, or money comes easily when I provide value..."
              className="game-input w-full h-20 resize-none"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat]
                const active = beliefCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setBeliefCategory(cat)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={
                      active
                        ? { background: meta.bg, color: meta.color, border: `1px solid ${meta.color}` }
                        : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                    }
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Date</label>
            <input
              type="date"
              value={beliefDate}
              onChange={e => setBeliefDate(e.target.value)}
              className="game-input"
            />
          </div>

          {beliefCategory === 'Scarcity' && (
            <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-semibold">Reframe this scarcity belief (optional)</span>
              </div>
              <textarea
                value={beliefReframe}
                onChange={e => setBeliefReframe(e.target.value)}
                placeholder="What's a more empowering way to see this? e.g. I am learning to create more value..."
                className="game-input w-full h-16 resize-none"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={addBelief}
              disabled={!beliefText.trim()}
              className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Save Belief
            </button>
            <button
              onClick={cancelBeliefForm}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Beliefs List */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Belief Journal
          </h2>
          {entries.map(entry => {
            const meta = CATEGORY_META[entry.category]
            const isEditingThis = editingReframe === entry.id
            return (
              <div
                key={entry.id}
                className="game-card p-4 space-y-2"
                style={{ borderLeft: `3px solid ${meta.color}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {entry.category}
                      </span>
                      <span className="text-xs text-slate-500">{entry.date}</span>
                    </div>
                    <p className="text-sm text-slate-300">{entry.belief}</p>
                  </div>
                  <button
                    onClick={() => removeBelief(entry.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Reframe section — only for Scarcity entries */}
                {entry.category === 'Scarcity' && (
                  <div className="mt-2">
                    {entry.reframe && !isEditingThis ? (
                      <div
                        className="flex items-start gap-2 p-2 bg-green-950/30 border border-green-500/20 rounded-lg cursor-pointer hover:border-green-400/40 transition-colors"
                        onClick={() => { setEditingReframe(entry.id); setReframeText(entry.reframe) }}
                        title="Click to edit reframe"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-green-300">{entry.reframe}</p>
                      </div>
                    ) : isEditingThis ? (
                      <div className="space-y-2">
                        <textarea
                          value={reframeText}
                          onChange={e => setReframeText(e.target.value)}
                          className="game-input w-full h-14 resize-none text-xs"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveReframe(entry.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Save Reframe
                          </button>
                          <button
                            onClick={() => setEditingReframe(null)}
                            className="px-3 py-1 bg-slate-700 text-slate-400 rounded-lg text-xs hover:bg-slate-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingReframe(entry.id); setReframeText('') }}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-400 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Add Reframe
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Scarcity without reframe nudge */}
      {scarcityWithoutReframe.length > 0 && (
        <div className="game-card p-4 border border-orange-500/20 bg-orange-950/10">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">Reframes Needed</span>
          </div>
          <p className="text-xs text-slate-400">
            {scarcityWithoutReframe.length} scarcity belief{scarcityWithoutReframe.length > 1 ? 's' : ''} without a
            reframe. Shifting scarcity into abundance is one of the most powerful mindset changes you can make.
          </p>
        </div>
      )}

      {/* Affirmations Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Money Affirmations
          </h2>
          <button
            onClick={() => setShowAffirmForm(v => !v)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom
          </button>
        </div>

        {/* Custom affirmation form */}
        {showAffirmForm && (
          <div className="game-card p-4 space-y-3 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Custom Affirmation</span>
              <button onClick={() => { setShowAffirmForm(false); setAffirmText('') }} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={affirmText}
              onChange={e => setAffirmText(e.target.value)}
              placeholder="Write your custom money affirmation..."
              className="game-input w-full"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') addAffirmation(affirmText) }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => addAffirmation(affirmText)}
                disabled={!affirmText.trim()}
                className="flex-1 py-1.5 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Add Affirmation
              </button>
              <button
                onClick={() => { setShowAffirmForm(false); setAffirmText('') }}
                className="px-4 py-1.5 bg-slate-700 text-slate-400 rounded-xl text-sm hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick-add preset affirmations */}
        <div className="game-card p-4 space-y-2">
          <p className="text-xs text-slate-500 mb-3">Quick-add preset affirmations:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_AFFIRMATIONS.map(preset => {
              const alreadyAdded = affirmations.some(a => a.text.toLowerCase() === preset.toLowerCase())
              return (
                <button
                  key={preset}
                  onClick={() => addAffirmation(preset)}
                  disabled={alreadyAdded}
                  className="px-2.5 py-1 rounded-lg text-xs transition-all"
                  style={
                    alreadyAdded
                      ? { background: '#14532d33', color: '#22c55e', cursor: 'default' }
                      : { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
                  }
                >
                  {alreadyAdded ? '✓ ' : '+ '}{preset}
                </button>
              )
            })}
          </div>
        </div>

        {/* Affirmations list */}
        {affirmations.length > 0 && (
          <div className="space-y-2">
            {affirmations.map(aff => (
              <div
                key={aff.id}
                className="game-card p-3 flex items-center gap-3"
                style={aff.daily ? { borderLeft: '3px solid #facc15' } : {}}
              >
                <button
                  onClick={() => toggleDaily(aff.id)}
                  title={aff.daily ? 'Remove from daily practice' : 'Mark as daily practice'}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: aff.daily ? '#facc15' : '#475569' }}
                >
                  <Star className="w-4 h-4" fill={aff.daily ? 'currentColor' : 'none'} />
                </button>
                <p className="flex-1 text-sm text-slate-300">{aff.text}</p>
                {aff.daily && (
                  <span className="text-xs text-yellow-500 font-semibold flex-shrink-0">Daily</span>
                )}
                <button
                  onClick={() => removeAffirmation(aff.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {entries.length === 0 && !showBeliefForm && (
        <div className="text-center py-12 text-slate-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">No money beliefs logged yet.</p>
          <p className="text-sm mb-5">Awareness is the first step to transforming your relationship with money.</p>
          <button
            onClick={() => setShowBeliefForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Log Your First Belief
          </button>
        </div>
      )}
    </div>
  )
}
