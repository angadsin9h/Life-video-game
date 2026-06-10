import React, { useState, useEffect } from 'react'
import { Star, Plus, Trash2, X, CheckCircle, ChevronRight, ChevronLeft, Edit2, Save } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-affirmation-builder'

type AffirmationCategory = 'identity' | 'capability' | 'abundance' | 'health' | 'relationships' | 'purpose'

type Affirmation = {
  id: string
  text: string
  category: AffirmationCategory
  created: string
  active: boolean
  practiceCount: number
  lastPracticed: string
  believabilityScore: number
  notes: string
}

type PracticeMethod = 'reading' | 'writing' | 'speaking' | 'visualization'
type PracticeMood = 'skeptical' | 'neutral' | 'open' | 'believing' | 'embodied'

type PracticeSession = {
  id: string
  date: string
  affirmationIds: string[]
  method: PracticeMethod
  mood: PracticeMood
  duration: number
  insights: string
}

type StorageShape = {
  affirmations: Affirmation[]
  sessions: PracticeSession[]
}

const CAT_CONFIG: Record<AffirmationCategory, { label: string; color: string; hex: string }> = {
  identity:      { label: 'Identity',      color: 'text-violet-400',  hex: '#a78bfa' },
  capability:    { label: 'Capability',    color: 'text-sky-400',     hex: '#38bdf8' },
  abundance:     { label: 'Abundance',     color: 'text-amber-400',   hex: '#fbbf24' },
  health:        { label: 'Health',        color: 'text-emerald-400', hex: '#34d399' },
  relationships: { label: 'Relationships', color: 'text-pink-400',    hex: '#f472b6' },
  purpose:       { label: 'Purpose',       color: 'text-orange-400',  hex: '#fb923c' },
}

const CATEGORIES = Object.keys(CAT_CONFIG) as AffirmationCategory[]

const STARTER_TEMPLATES = [
  'I am...', 'I have...', 'I attract...', 'I release...', 'I create...', 'I embrace...',
]

const PRESET_AFFIRMATIONS: Record<AffirmationCategory, string[]> = {
  identity: [
    'I am becoming the most authentic version of myself every day.',
    'I am worthy of love, success, and deep fulfillment.',
    'I am grounded, confident, and at peace with who I am.',
    'I am a person of integrity whose actions align with my values.',
    'I am constantly evolving — my identity is not fixed, it is chosen.',
  ],
  capability: [
    'I have the skills and resilience to overcome any challenge.',
    'I am capable of learning anything I set my mind to.',
    'I have done hard things before and I will do them again.',
    'I trust my ability to figure things out, step by step.',
    'I am resourceful, creative, and equal to every task.',
  ],
  abundance: [
    'I attract wealth, opportunity, and prosperity into my life.',
    'There is more than enough for me — abundance flows freely.',
    'I am open to receiving all the good the universe offers.',
    'Money comes to me easily and I use it wisely.',
    'I live in a world of infinite possibilities.',
  ],
  health: [
    'My body is strong, capable, and healing every day.',
    'I nourish my body with love, movement, and good food.',
    'My energy levels are high and I wake up feeling restored.',
    'I listen to my body and give it exactly what it needs.',
    'Every cell in my body vibrates with health and vitality.',
  ],
  relationships: [
    'I attract deep, loving, and supportive relationships.',
    'I give and receive love freely and without fear.',
    'My presence adds genuine value to the lives of others.',
    'I communicate with clarity, kindness, and confidence.',
    'I am surrounded by people who celebrate and elevate me.',
  ],
  purpose: [
    'I am here for a reason and I am living it deliberately.',
    'My work creates meaningful impact in the world.',
    'I align my daily actions with my highest purpose.',
    'I am driven by contribution, not just achievement.',
    'Every day I get closer to the fullest expression of my potential.',
  ],
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getStreakFromSessions(sessions: PracticeSession[]): number {
  if (sessions.length === 0) return 0
  const days = [...new Set(sessions.map(s => s.date))].sort().reverse()
  let streak = 0
  const now = new Date()
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(now)
    expected.setDate(expected.getDate() - i)
    if (days[i] === expected.toISOString().split('T')[0]) streak++
    else break
  }
  return streak
}

function believabilityColor(score: number): string {
  if (score <= 3) return '#ef4444'
  if (score <= 6) return '#eab308'
  return '#22c55e'
}

function believabilityLabel(score: number): string {
  if (score <= 2) return 'Skeptical'
  if (score <= 4) return 'Doubtful'
  if (score <= 6) return 'Building'
  if (score <= 8) return 'Believing'
  return 'Embodied'
}

type Tab = 'library' | 'practice' | 'log' | 'progress'

export default function AffirmationBuilder() {
  const { toastSuccess } = useToast()

  const [data, setData] = useState<StorageShape>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as StorageShape
    } catch { /**/ }

    const presets: Affirmation[] = CATEGORIES.flatMap(cat =>
      PRESET_AFFIRMATIONS[cat].map((text, i) => ({
        id: `preset-${cat}-${i}`,
        text,
        category: cat,
        created: todayStr(),
        active: i === 0,
        practiceCount: 0,
        lastPracticed: '',
        believabilityScore: 5,
        notes: '',
      }))
    )
    return { affirmations: presets, sessions: [] }
  })

  const [tab, setTab] = useState<Tab>('library')
  const [catFilter, setCatFilter] = useState<AffirmationCategory | 'all'>('all')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newText, setNewText] = useState('')
  const [newCat, setNewCat] = useState<AffirmationCategory>('identity')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const [practiceIdx, setPracticeIdx] = useState(0)
  const [practicedIds, setPracticedIds] = useState<Set<string>>(new Set())
  const [updatingScore, setUpdatingScore] = useState<string | null>(null)
  const [tempScore, setTempScore] = useState(5)

  const [sessionForm, setSessionForm] = useState<{
    method: PracticeMethod
    mood: PracticeMood
    duration: number
    insights: string
    selectedIds: string[]
  }>({
    method: 'reading',
    mood: 'neutral',
    duration: 5,
    insights: '',
    selectedIds: [],
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  function updateData(partial: Partial<StorageShape>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  function addAffirmation() {
    if (!newText.trim()) return
    const a: Affirmation = {
      id: Date.now().toString(),
      text: newText.trim(),
      category: newCat,
      created: todayStr(),
      active: true,
      practiceCount: 0,
      lastPracticed: '',
      believabilityScore: 5,
      notes: '',
    }
    updateData({ affirmations: [a, ...data.affirmations] })
    setNewText('')
    setShowAddForm(false)
    toastSuccess('Affirmation created', 'Believe it more every day')
  }

  function deleteAffirmation(id: string) {
    updateData({ affirmations: data.affirmations.filter(a => a.id !== id) })
  }

  function toggleActive(id: string) {
    updateData({
      affirmations: data.affirmations.map(a =>
        a.id === id ? { ...a, active: !a.active } : a
      ),
    })
  }

  function saveEdit(id: string) {
    updateData({
      affirmations: data.affirmations.map(a =>
        a.id === id ? { ...a, text: editText.trim() } : a
      ),
    })
    setEditingId(null)
  }

  function updateBelievability(id: string, score: number) {
    updateData({
      affirmations: data.affirmations.map(a =>
        a.id === id ? { ...a, believabilityScore: score } : a
      ),
    })
    setUpdatingScore(null)
    toastSuccess('Believability updated')
  }

  const activeAffirmations = data.affirmations.filter(a => a.active)
  const practiceList = activeAffirmations
  const currentPractice = practiceList[practiceIdx] ?? null

  function markPracticed(id: string) {
    setPracticedIds(prev => new Set(prev).add(id))
    updateData({
      affirmations: data.affirmations.map(a =>
        a.id === id
          ? { ...a, practiceCount: a.practiceCount + 1, lastPracticed: todayStr() }
          : a
      ),
    })
    if (practiceIdx < practiceList.length - 1) {
      setPracticeIdx(i => i + 1)
    }
    toastSuccess('Practiced!')
  }

  function logSession() {
    if (sessionForm.selectedIds.length === 0) return
    const s: PracticeSession = {
      id: Date.now().toString(),
      date: todayStr(),
      affirmationIds: sessionForm.selectedIds,
      method: sessionForm.method,
      mood: sessionForm.mood,
      duration: sessionForm.duration,
      insights: sessionForm.insights,
    }
    updateData({ sessions: [s, ...data.sessions] })
    setSessionForm({ method: 'reading', mood: 'neutral', duration: 5, insights: '', selectedIds: [] })
    toastSuccess('Session logged', `${s.duration} min of ${s.method}`)
  }

  const streak = getStreakFromSessions(data.sessions)
  const filtered = catFilter === 'all'
    ? data.affirmations
    : data.affirmations.filter(a => a.category === catFilter)

  const METHODS: PracticeMethod[] = ['reading', 'writing', 'speaking', 'visualization']
  const MOODS: PracticeMood[] = ['skeptical', 'neutral', 'open', 'believing', 'embodied']

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Star className="w-7 h-7 text-amber-400" />
          Affirmation Builder
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Build beliefs one practice session at a time</p>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{data.affirmations.length}</div>
          <div className="text-xs text-slate-500">Affirmations</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{data.sessions.length}</div>
          <div className="text-xs text-slate-500">Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{activeAffirmations.length}</div>
          <div className="text-xs text-slate-500">Active</div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
        {(['library', 'practice', 'log', 'progress'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              tab === t ? 'bg-violet-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── LIBRARY TAB ── */}
      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCatFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                catFilter === 'all' ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-slate-700 text-slate-500 hover:border-slate-500'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  catFilter === cat
                    ? `border-current ${CAT_CONFIG[cat].color} bg-slate-800`
                    : 'border-slate-700 text-slate-500 hover:border-slate-500'
                }`}
              >
                {CAT_CONFIG[cat].label}
              </button>
            ))}
            <button
              onClick={() => setShowAddForm(s => !s)}
              className="ml-auto flex items-center gap-1 px-3 py-1 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          {showAddForm && (
            <div className="game-card p-4 border border-amber-500/20 space-y-3 bg-gradient-to-br from-amber-950/20 to-slate-900">
              <p className="text-xs text-slate-400 font-semibold">Starter templates</p>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_TEMPLATES.map(t => (
                  <button
                    key={t}
                    onClick={() => setNewText(prev => prev ? prev : t.replace('...', ' '))}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Write your affirmation in present tense..."
                className="game-input w-full h-16 resize-none text-sm"
                autoFocus
              />
              <div className="flex gap-2 items-center">
                <select
                  value={newCat}
                  onChange={e => setNewCat(e.target.value as AffirmationCategory)}
                  className="game-input text-sm flex-1"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CAT_CONFIG[c].label}</option>
                  ))}
                </select>
                <button
                  onClick={addAffirmation}
                  disabled={!newText.trim()}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewText('') }}
                  className="px-3 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(aff => (
              <div
                key={aff.id}
                className="game-card p-4 space-y-2"
                style={{ borderLeft: `3px solid ${aff.active ? CAT_CONFIG[aff.category].hex : '#334155'}` }}
              >
                {editingId === aff.id ? (
                  <div className="flex gap-2 items-start">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="game-input flex-1 resize-none text-sm h-16"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => saveEdit(aff.id)}
                        className="p-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg"
                      >
                        <Save className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className={`flex-1 text-sm leading-relaxed ${aff.active ? 'text-slate-200' : 'text-slate-500'}`}>
                      {aff.text}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(aff.id); setEditText(aff.text) }}
                        className="p-1 text-slate-600 hover:text-slate-400"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAffirmation(aff.id)}
                        className="p-1 text-slate-700 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs ${CAT_CONFIG[aff.category].color}`}>
                    {CAT_CONFIG[aff.category].label}
                  </span>
                  <button
                    onClick={() => toggleActive(aff.id)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      aff.active
                        ? 'border-emerald-600 text-emerald-400 bg-emerald-500/10'
                        : 'border-slate-700 text-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {aff.active ? 'Active' : 'Inactive'}
                  </button>
                  <span className="text-xs text-slate-600">×{aff.practiceCount}</span>
                </div>

                {/* Believability bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Believability: <span style={{ color: believabilityColor(aff.believabilityScore) }}>
                        {believabilityLabel(aff.believabilityScore)} ({aff.believabilityScore}/10)
                      </span>
                    </span>
                    <button
                      onClick={() => { setUpdatingScore(aff.id); setTempScore(aff.believabilityScore) }}
                      className="text-xs text-slate-600 hover:text-slate-400"
                    >
                      Update
                    </button>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(aff.believabilityScore / 10) * 100}%`,
                        backgroundColor: believabilityColor(aff.believabilityScore),
                      }}
                    />
                  </div>
                  {updatingScore === aff.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="range" min={1} max={10} value={tempScore}
                        onChange={e => setTempScore(Number(e.target.value))}
                        className="flex-1 h-1"
                        style={{ accentColor: believabilityColor(tempScore) }}
                      />
                      <span className="text-xs text-white w-4">{tempScore}</span>
                      <button
                        onClick={() => updateBelievability(aff.id, tempScore)}
                        className="text-xs px-2 py-1 bg-emerald-700 text-white rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setUpdatingScore(null)}
                        className="text-xs text-slate-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRACTICE TAB ── */}
      {tab === 'practice' && (
        <div className="space-y-4">
          {practiceList.length === 0 ? (
            <div className="game-card p-10 text-center">
              <Star className="w-12 h-12 mx-auto mb-3 text-slate-700" />
              <p className="text-slate-500 text-sm">No active affirmations</p>
              <p className="text-slate-600 text-xs mt-1">Activate some in the Library tab</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{practicedIds.size} / {practiceList.length} practiced today</span>
                <button
                  onClick={() => { setPracticeIdx(0); setPracticedIds(new Set()) }}
                  className="text-violet-400 hover:text-violet-300"
                >
                  Reset
                </button>
              </div>

              {/* Progress dots */}
              <div className="flex gap-1.5 flex-wrap">
                {practiceList.map((a, i) => (
                  <button
                    key={a.id}
                    onClick={() => setPracticeIdx(i)}
                    className="w-2.5 h-2.5 rounded-full transition-all"
                    style={{
                      backgroundColor: practicedIds.has(a.id)
                        ? '#22c55e'
                        : i === practiceIdx
                        ? CAT_CONFIG[a.category].hex
                        : '#334155',
                    }}
                  />
                ))}
              </div>

              {currentPractice && (
                <div className="game-card p-8 text-center bg-gradient-to-br from-violet-950/30 to-slate-900 border border-violet-500/20 space-y-6">
                  <div className="space-y-1">
                    <span className={`text-xs uppercase tracking-wider ${CAT_CONFIG[currentPractice.category].color}`}>
                      {CAT_CONFIG[currentPractice.category].label}
                    </span>
                    <p className="text-2xl font-semibold text-white leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                      "{currentPractice.text}"
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-slate-500">Current believability</p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-slate-700/60 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(currentPractice.believabilityScore / 10) * 100}%`,
                            backgroundColor: believabilityColor(currentPractice.believabilityScore),
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: believabilityColor(currentPractice.believabilityScore) }}>
                        {believabilityLabel(currentPractice.believabilityScore)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setPracticeIdx(i => Math.max(0, i - 1))}
                      disabled={practiceIdx === 0}
                      className="p-2 text-slate-600 hover:text-slate-400 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => markPracticed(currentPractice.id)}
                      disabled={practicedIds.has(currentPractice.id)}
                      className="flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-600 disabled:bg-emerald-800 disabled:text-emerald-300 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {practicedIds.has(currentPractice.id) ? 'Practiced' : 'I practiced this'}
                    </button>
                    <button
                      onClick={() => setPracticeIdx(i => Math.min(practiceList.length - 1, i + 1))}
                      disabled={practiceIdx === practiceList.length - 1}
                      className="p-2 text-slate-600 hover:text-slate-400 disabled:opacity-30"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {practicedIds.size === practiceList.length && (
                    <p className="text-emerald-400 text-sm font-semibold">
                      All affirmations practiced today!
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── LOG TAB ── */}
      {tab === 'log' && (
        <div className="space-y-4">
          <div className="game-card p-5 space-y-4 border border-amber-500/10 bg-gradient-to-br from-amber-950/10 to-slate-900">
            <h3 className="text-sm font-semibold text-white">Log Practice Session</h3>

            <div>
              <p className="text-xs text-slate-400 mb-2">Affirmations practiced</p>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {data.affirmations.filter(a => a.active).map(a => (
                  <label key={a.id} className="flex items-start gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={sessionForm.selectedIds.includes(a.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSessionForm(f => ({ ...f, selectedIds: [...f.selectedIds, a.id] }))
                        } else {
                          setSessionForm(f => ({ ...f, selectedIds: f.selectedIds.filter(id => id !== a.id) }))
                        }
                      }}
                      className="mt-0.5 accent-amber-500"
                    />
                    <span className="text-xs text-slate-300 group-hover:text-slate-200 leading-relaxed">{a.text}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1">Method</p>
                <select
                  value={sessionForm.method}
                  onChange={e => setSessionForm(f => ({ ...f, method: e.target.value as PracticeMethod }))}
                  className="game-input w-full text-sm capitalize"
                >
                  {METHODS.map(m => (
                    <option key={m} value={m} className="capitalize">{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Mood</p>
                <select
                  value={sessionForm.mood}
                  onChange={e => setSessionForm(f => ({ ...f, mood: e.target.value as PracticeMood }))}
                  className="game-input w-full text-sm capitalize"
                >
                  {MOODS.map(m => (
                    <option key={m} value={m} className="capitalize">{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1">Duration: <span className="text-white">{sessionForm.duration} min</span></p>
              <input
                type="range" min={1} max={60} value={sessionForm.duration}
                onChange={e => setSessionForm(f => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400"
              />
            </div>

            <textarea
              value={sessionForm.insights}
              onChange={e => setSessionForm(f => ({ ...f, insights: e.target.value }))}
              placeholder="Any insights or reflections from this session..."
              className="game-input w-full h-16 resize-none text-sm"
            />

            <button
              onClick={logSession}
              disabled={sessionForm.selectedIds.length === 0}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Log Session
            </button>
          </div>

          {data.sessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400">Recent Sessions</h3>
              {data.sessions.slice(0, 10).map(s => (
                <div key={s.id} className="game-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-white capitalize">{s.method}</span>
                      <span className="text-xs text-slate-500 capitalize">{s.mood}</span>
                      <span className="text-xs text-amber-400">{s.duration}m</span>
                      <span className="text-xs text-slate-600">{s.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{s.affirmationIds.length} affirmation{s.affirmationIds.length !== 1 ? 's' : ''}</p>
                    {s.insights && <p className="text-xs text-slate-400 mt-0.5 italic truncate">"{s.insights}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === 'progress' && (
        <div className="space-y-4">
          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Believability by Affirmation</h3>
            <div className="space-y-3">
              {data.affirmations.filter(a => a.active).map(a => (
                <div key={a.id} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-400 leading-snug flex-1 line-clamp-1">{a.text}</p>
                    <span
                      className="text-xs font-semibold flex-shrink-0"
                      style={{ color: believabilityColor(a.believabilityScore) }}
                    >
                      {a.believabilityScore}/10
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(a.believabilityScore / 10) * 100}%`,
                        backgroundColor: believabilityColor(a.believabilityScore),
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.affirmations.filter(a => a.active).length === 0 && (
                <p className="text-slate-600 text-sm text-center py-4">No active affirmations</p>
              )}
            </div>
          </div>

          {/* Practice trend SVG line chart */}
          {data.sessions.length >= 2 && (
            <div className="game-card p-5">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Practice Trend (sessions over time)</h3>
              <SessionTrendChart sessions={data.sessions} />
            </div>
          )}

          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Method Breakdown</h3>
            {data.sessions.length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">No sessions logged yet</p>
            ) : (
              <div className="space-y-2">
                {METHODS.map(m => {
                  const count = data.sessions.filter(s => s.method === m).length
                  return (
                    <div key={m} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 capitalize w-24 flex-shrink-0">{m}</span>
                      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${(count / data.sessions.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="game-card p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Most Practiced</h3>
            {data.affirmations.filter(a => a.practiceCount > 0).length === 0 ? (
              <p className="text-slate-600 text-sm text-center py-4">Start practicing to see stats here</p>
            ) : (
              <div className="space-y-2">
                {[...data.affirmations]
                  .filter(a => a.practiceCount > 0)
                  .sort((a, b) => b.practiceCount - a.practiceCount)
                  .slice(0, 5)
                  .map(a => (
                    <div key={a.id} className="flex items-start gap-3">
                      <span className="text-xs text-amber-400 font-bold w-6 text-right flex-shrink-0 mt-0.5">×{a.practiceCount}</span>
                      <p className="text-xs text-slate-300 leading-snug">{a.text}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SessionTrendChart({ sessions }: { sessions: PracticeSession[] }) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

  const dayCounts: Record<string, number> = {}
  for (const s of sorted) {
    dayCounts[s.date] = (dayCounts[s.date] ?? 0) + 1
  }

  const days = Object.keys(dayCounts).sort().slice(-14)
  if (days.length < 2) return null

  const counts = days.map(d => dayCounts[d])
  const maxCount = Math.max(...counts, 1)

  const w = 460
  const h = 100
  const padX = 20
  const padY = 10
  const innerW = w - padX * 2
  const innerH = h - padY * 2

  const pts = counts.map((c, i) => {
    const x = padX + (i / (days.length - 1)) * innerW
    const y = padY + innerH - (c / maxCount) * innerH
    return `${x},${y}`
  })

  const pathD = pts.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ')
  const areaD = `${pathD} L ${padX + innerW},${padY + innerH} L ${padX},${padY + innerH} Z`

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxHeight: 100 }}>
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#trendGrad)" />
      <path d={pathD} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {counts.map((c, i) => {
        const x = padX + (i / (days.length - 1)) * innerW
        const y = padY + innerH - (c / maxCount) * innerH
        return <circle key={days[i]} cx={x} cy={y} r={3} fill="#a78bfa" />
      })}
    </svg>
  )
}
