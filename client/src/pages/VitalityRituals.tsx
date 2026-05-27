import { useState, useEffect } from 'react'
import { Zap, Plus, X, CheckCircle2, Circle, Flame, Star, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Category = 'Morning' | 'Midday' | 'Evening' | 'Anytime'
type TargetFreq = 'Daily' | 'Weekdays' | 'Weekends' | 'Weekly'

interface VitalityRitual {
  id: string
  name: string
  emoji: string
  category: Category
  targetFrequency: TargetFreq
  completions: string[]
  createdAt: string
}

const STORAGE_KEY = 'vitality_rituals'
const CATEGORIES: Category[] = ['Morning', 'Midday', 'Evening', 'Anytime']
const TARGET_FREQS: TargetFreq[] = ['Daily', 'Weekdays', 'Weekends', 'Weekly']

const IDEAS: Array<{ name: string; emoji: string; category: Category }> = [
  { name: 'Cold Shower', emoji: '🚿', category: 'Morning' },
  { name: 'Sunlight', emoji: '☀️', category: 'Morning' },
  { name: 'Meditation', emoji: '🧘', category: 'Morning' },
  { name: 'Movement', emoji: '💪', category: 'Anytime' },
  { name: 'Journaling', emoji: '✍️', category: 'Morning' },
  { name: 'Breathwork', emoji: '🌬️', category: 'Anytime' },
  { name: 'Gratitude', emoji: '🙏', category: 'Evening' },
  { name: 'Hydration', emoji: '💧', category: 'Morning' },
]

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

function getStreak(completions: string[]): number {
  if (completions.length === 0) return 0
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (completions.includes(ds)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

const CAT_COLORS: Record<Category, string> = {
  Morning: 'text-amber-400',
  Midday: 'text-blue-400',
  Evening: 'text-violet-400',
  Anytime: 'text-green-400',
}

const CAT_BG: Record<Category, string> = {
  Morning: 'bg-amber-500/10 border-amber-500/20',
  Midday: 'bg-blue-500/10 border-blue-500/20',
  Evening: 'bg-violet-500/10 border-violet-500/20',
  Anytime: 'bg-green-500/10 border-green-500/20',
}

export default function VitalityRituals() {
  const { toastSuccess } = useToast()

  const [rituals, setRituals] = useState<VitalityRitual[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('⚡')
  const [category, setCategory] = useState<Category>('Morning')
  const [targetFrequency, setTargetFrequency] = useState<TargetFreq>('Daily')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRituals(JSON.parse(stored))
    } catch { /**/ }
  }, [])

  function save(updated: VitalityRitual[]) {
    setRituals(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /**/ }
  }

  function addRitual() {
    if (!name.trim() || rituals.length >= 8) return
    const newRitual: VitalityRitual = {
      id: Date.now().toString(),
      name: name.trim(),
      emoji,
      category,
      targetFrequency,
      completions: [],
      createdAt: todayStr(),
    }
    save([...rituals, newRitual])
    toastSuccess('Ritual added!', name.trim())
    setName('')
    setEmoji('⚡')
    setCategory('Morning')
    setTargetFrequency('Daily')
    setShowForm(false)
  }

  function quickAdd(idea: typeof IDEAS[0]) {
    if (rituals.length >= 8) return
    const newRitual: VitalityRitual = {
      id: Date.now().toString(),
      name: idea.name,
      emoji: idea.emoji,
      category: idea.category,
      targetFrequency: 'Daily',
      completions: [],
      createdAt: todayStr(),
    }
    save([...rituals, newRitual])
    toastSuccess('Ritual added!', idea.name)
  }

  function toggleToday(id: string) {
    const today = todayStr()
    const updated = rituals.map(r => {
      if (r.id !== id) return r
      const already = r.completions.includes(today)
      const completions = already
        ? r.completions.filter(c => c !== today)
        : [...r.completions, today]
      return { ...r, completions }
    })
    save(updated)
    const ritual = rituals.find(r => r.id === id)
    if (ritual && !ritual.completions.includes(today)) {
      toastSuccess('Ritual complete!', ritual.name)
    }
  }

  function deleteRitual(id: string) {
    save(rituals.filter(r => r.id !== id))
  }

  const today = todayStr()
  const days7 = last7Days()
  const completedToday = rituals.filter(r => r.completions.includes(today)).length
  const energyScore = rituals.length > 0 ? Math.round((completedToday / rituals.length) * 100) : 0
  const totalAllTime = rituals.reduce((s, r) => s + r.completions.length, 0)

  const availableIdeas = IDEAS.filter(idea => !rituals.some(r => r.name === idea.name))

  const grouped: Partial<Record<Category, VitalityRitual[]>> = {}
  for (const r of rituals) {
    if (!grouped[r.category]) grouped[r.category] = []
    grouped[r.category]!.push(r)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Vitality Rituals</h1>
              <p className="text-slate-400 text-sm">Daily practices that keep you high-vibe</p>
            </div>
          </div>
          {rituals.length < 8 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors font-medium"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Add Ritual'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="game-card p-4 text-center">
            <div className="text-3xl font-bold text-amber-400">{energyScore}%</div>
            <div className="text-xs text-slate-400 mt-1">Energy Ritual Score</div>
            <div className="text-xs text-slate-500">{completedToday}/{rituals.length} today</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{rituals.length}/8</div>
            <div className="text-xs text-slate-400 mt-1">Active Rituals</div>
          </div>
          <div className="game-card p-4 text-center">
            <div className="text-3xl font-bold text-violet-400">{totalAllTime}</div>
            <div className="text-xs text-slate-400 mt-1">Total Completions</div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="game-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-amber-300">New Vitality Ritual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Name</label>
                <input
                  className="game-input w-full"
                  placeholder="e.g. Morning walk"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Emoji</label>
                <input
                  className="game-input w-full"
                  placeholder="⚡"
                  value={emoji}
                  onChange={e => setEmoji(e.target.value)}
                  maxLength={4}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Category</label>
                <select className="game-input w-full" value={category} onChange={e => setCategory(e.target.value as Category)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Target Frequency</label>
                <select className="game-input w-full" value={targetFrequency} onChange={e => setTargetFrequency(e.target.value as TargetFreq)}>
                  {TARGET_FREQS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={addRitual}
              disabled={!name.trim()}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 rounded-xl transition-colors font-medium"
            >
              Add Ritual
            </button>
          </div>
        )}

        {/* Ideas */}
        {availableIdeas.length > 0 && rituals.length < 8 && (
          <div className="game-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" /> Ritual Ideas
            </h2>
            <div className="flex flex-wrap gap-2">
              {availableIdeas.map(idea => (
                <button
                  key={idea.name}
                  onClick={() => quickAdd(idea)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                >
                  <span>{idea.emoji}</span>
                  <span>{idea.name}</span>
                  <Plus className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grouped by category */}
        {CATEGORIES.filter(cat => grouped[cat] && grouped[cat]!.length > 0).map(cat => (
          <div key={cat} className="space-y-2">
            <h2 className={`text-sm font-semibold ${CAT_COLORS[cat]} flex items-center gap-2`}>
              <Clock className="w-4 h-4" /> {cat} Stack ({grouped[cat]!.length})
            </h2>
            <div className="space-y-2">
              {grouped[cat]!.map(ritual => {
                const streak = getStreak(ritual.completions)
                const doneToday = ritual.completions.includes(today)
                return (
                  <div key={ritual.id} className={`game-card border ${CAT_BG[cat]} p-4 space-y-3`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{ritual.emoji}</span>
                        <div>
                          <div className="font-medium text-white">{ritual.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{ritual.targetFrequency}</span>
                            {streak > 0 && (
                              <span className="flex items-center gap-1 text-orange-400">
                                <Flame className="w-3 h-3" /> {streak}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleToday(ritual.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${doneToday ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                        >
                          {doneToday ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          {doneToday ? 'Done' : "Check off today"}
                        </button>
                        <button onClick={() => deleteRitual(ritual.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {/* 7-day grid */}
                    <div className="flex gap-1">
                      {days7.map(day => {
                        const done = ritual.completions.includes(day)
                        return (
                          <div
                            key={day}
                            title={day}
                            className={`flex-1 h-3 rounded-sm ${done ? 'bg-amber-400' : 'bg-slate-700'}`}
                          />
                        )
                      })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {ritual.completions.length} total completions
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {rituals.length === 0 && !showForm && (
          <div className="game-card p-12 text-center space-y-3">
            <Zap className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400">No vitality rituals yet.</p>
            <p className="text-slate-500 text-sm">Add from the ideas above or create your own.</p>
          </div>
        )}
      </div>
    </div>
  )
}
