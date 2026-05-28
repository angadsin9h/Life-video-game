import { useState, useEffect } from 'react'
import { Zap, Plus, X, CheckCircle2, Circle, Flame, Star, Trophy } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Category = 'Morning' | 'Midday' | 'Evening' | 'Anytime'
type TargetFreq = 'Daily' | 'Weekdays' | 'Weekends' | 'Weekly'

interface Ritual {
  id: string
  name: string
  emoji: string
  category: Category
  targetFrequency: TargetFreq
  completions: string[]
  createdAt: string
}

const STORAGE_KEY = 'energy_rituals'
const CATEGORIES: Category[] = ['Morning', 'Midday', 'Evening', 'Anytime']
const TARGET_FREQS: TargetFreq[] = ['Daily', 'Weekdays', 'Weekends', 'Weekly']

const RITUAL_IDEAS = [
  { name: 'Cold Shower', emoji: '🚿', category: 'Morning' as Category },
  { name: 'Sunlight', emoji: '☀️', category: 'Morning' as Category },
  { name: 'Meditation', emoji: '🧘', category: 'Anytime' as Category },
  { name: 'Movement', emoji: '💪', category: 'Anytime' as Category },
  { name: 'Journaling', emoji: '✍️', category: 'Morning' as Category },
  { name: 'Breathwork', emoji: '🌬️', category: 'Anytime' as Category },
  { name: 'Gratitude', emoji: '🙏', category: 'Morning' as Category },
  { name: 'Hydration', emoji: '💧', category: 'Anytime' as Category },
]

const CATEGORY_COLORS: Record<Category, string> = {
  Morning: 'text-amber-400',
  Midday: 'text-blue-400',
  Evening: 'text-violet-400',
  Anytime: 'text-green-400',
}

function todayStr() {
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
  const today = new Date()
  let streak = 0
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    if (completions.includes(ds)) streak++
    else break
  }
  return streak
}

export default function EnergyRituals() {
  const { toastSuccess } = useToast()
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('⚡')
  const [category, setCategory] = useState<Category>('Morning')
  const [targetFrequency, setTargetFrequency] = useState<TargetFreq>('Daily')

  useEffect(() => {
    try { setRituals(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  function save(updated: Ritual[]) {
    setRituals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  function addRitual() {
    if (!name.trim() || rituals.length >= 8) return
    const ritual: Ritual = {
      id: Date.now().toString(),
      name: name.trim(),
      emoji,
      category,
      targetFrequency,
      completions: [],
      createdAt: todayStr(),
    }
    save([...rituals, ritual])
    toastSuccess('Ritual Added', `${emoji} ${name.trim()} is now part of your energy stack!`)
    setName('')
    setEmoji('⚡')
    setCategory('Morning')
    setTargetFrequency('Daily')
    setShowForm(false)
  }

  function addFromIdea(idea: typeof RITUAL_IDEAS[number]) {
    if (rituals.length >= 8) return
    if (rituals.find(r => r.name === idea.name)) return
    const ritual: Ritual = {
      id: Date.now().toString(),
      name: idea.name,
      emoji: idea.emoji,
      category: idea.category,
      targetFrequency: 'Daily',
      completions: [],
      createdAt: todayStr(),
    }
    save([...rituals, ritual])
    toastSuccess('Ritual Added', `${idea.emoji} ${idea.name} added to your stack!`)
  }

  function removeRitual(id: string) {
    save(rituals.filter(r => r.id !== id))
  }

  function toggleToday(id: string) {
    const today = todayStr()
    const updated = rituals.map(r => {
      if (r.id !== id) return r
      const done = r.completions.includes(today)
      const completions = done
        ? r.completions.filter(d => d !== today)
        : [...r.completions, today]
      return { ...r, completions }
    })
    const ritual = updated.find(r => r.id === id)
    if (ritual && ritual.completions.includes(today)) {
      toastSuccess('Ritual Complete!', `${ritual.emoji} ${ritual.name} — keep the energy high!`)
    }
    save(updated)
  }

  const today = todayStr()
  const days7 = last7Days()
  const completedToday = rituals.filter(r => r.completions.includes(today)).length
  const energyScore = rituals.length > 0 ? Math.round((completedToday / rituals.length) * 100) : 0
  const totalCompletions = rituals.reduce((s, r) => s + r.completions.length, 0)

  const byCategory = (cat: Category) => rituals.filter(r => r.category === cat)

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Energy Rituals</h1>
              <p className="text-slate-400 text-sm">Daily practices that keep you high-vibe</p>
            </div>
          </div>
          {rituals.length < 8 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold transition-colors"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Add Ritual'}
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="game-card text-center">
            <div className="text-3xl font-bold text-amber-400">{energyScore}%</div>
            <div className="text-slate-400 text-xs mt-1">Energy Score Today</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-green-400">{completedToday}/{rituals.length}</div>
            <div className="text-slate-400 text-xs mt-1">Completed Today</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-violet-400">{rituals.length}/8</div>
            <div className="text-slate-400 text-xs mt-1">Active Rituals</div>
          </div>
          <div className="game-card text-center">
            <div className="text-2xl font-bold text-blue-400">{totalCompletions}</div>
            <div className="text-slate-400 text-xs mt-1">Total Completions</div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="game-card mb-6">
            <h2 className="font-bold text-lg mb-4">Create a New Ritual</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-1">Ritual Name</label>
                <input
                  className="game-input w-full"
                  placeholder="e.g. Cold shower, 10 min walk..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Emoji</label>
                <input
                  className="game-input w-full"
                  placeholder="⚡"
                  value={emoji}
                  onChange={e => setEmoji(e.target.value)}
                  maxLength={4}
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Category</label>
                <select className="game-input w-full" value={category} onChange={e => setCategory(e.target.value as Category)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-1">Target Frequency</label>
                <select className="game-input w-full" value={targetFrequency} onChange={e => setTargetFrequency(e.target.value as TargetFreq)}>
                  {TARGET_FREQS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={addRitual}
              disabled={!name.trim()}
              className="mt-4 px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-xl font-semibold transition-colors"
            >
              Add to Stack
            </button>
          </div>
        )}

        {/* Ritual Ideas */}
        {rituals.length < 8 && (
          <div className="game-card mb-6">
            <h3 className="font-bold mb-3 text-slate-300">Ritual Ideas — click to add</h3>
            <div className="flex flex-wrap gap-2">
              {RITUAL_IDEAS.map(idea => {
                const alreadyAdded = rituals.some(r => r.name === idea.name)
                return (
                  <button
                    key={idea.name}
                    onClick={() => addFromIdea(idea)}
                    disabled={alreadyAdded}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors border ${
                      alreadyAdded
                        ? 'border-slate-600 text-slate-600 cursor-not-allowed'
                        : 'border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                    }`}
                  >
                    {idea.emoji} {idea.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {rituals.length === 0 ? (
          <div className="game-card text-center py-12">
            <Zap className="w-12 h-12 text-amber-400/30 mx-auto mb-3" />
            <p className="text-slate-400">No rituals yet. Add your first energy ritual above.</p>
          </div>
        ) : (
          <>
            {/* 7-Day Grid */}
            <div className="game-card mb-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                7-Day Completion Grid
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-slate-400 font-normal pb-2 pr-4 min-w-[140px]">Ritual</th>
                      {days7.map(d => (
                        <th key={d} className="text-center text-slate-400 font-normal pb-2 px-1">
                          {new Date(d + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'narrow' })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rituals.map(ritual => (
                      <tr key={ritual.id}>
                        <td className="pr-4 py-1 text-slate-300 truncate max-w-[140px]">
                          <span className="mr-1">{ritual.emoji}</span>{ritual.name}
                        </td>
                        {days7.map(d => (
                          <td key={d} className="text-center px-1 py-1">
                            {ritual.completions.includes(d) ? (
                              <span className="inline-block w-5 h-5 rounded-full bg-amber-400 mx-auto" />
                            ) : (
                              <span className="inline-block w-5 h-5 rounded-full bg-slate-700 mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grouped by Category */}
            {CATEGORIES.filter(cat => byCategory(cat).length > 0).map(cat => (
              <div key={cat} className="game-card mb-4">
                <h3 className={`font-bold mb-3 ${CATEGORY_COLORS[cat]}`}>Your {cat} Stack</h3>
                <div className="space-y-2">
                  {byCategory(cat).map(ritual => {
                    const doneToday = ritual.completions.includes(today)
                    const streak = getStreak(ritual.completions)
                    return (
                      <div
                        key={ritual.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          doneToday ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-slate-700/50'
                        }`}
                      >
                        <button
                          onClick={() => toggleToday(ritual.id)}
                          className="flex-shrink-0"
                        >
                          {doneToday
                            ? <CheckCircle2 className="w-6 h-6 text-amber-400" />
                            : <Circle className="w-6 h-6 text-slate-500 hover:text-amber-400 transition-colors" />
                          }
                        </button>
                        <span className="text-xl">{ritual.emoji}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-200">{ritual.name}</div>
                          <div className="text-xs text-slate-500">{ritual.targetFrequency}</div>
                        </div>
                        {streak > 0 && (
                          <div className="flex items-center gap-1 text-orange-400">
                            <Flame className="w-4 h-4" />
                            <span className="text-sm font-bold">{streak}</span>
                          </div>
                        )}
                        {streak >= 7 && <Trophy className="w-4 h-4 text-amber-400" />}
                        <button
                          onClick={() => removeRitual(ritual.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
