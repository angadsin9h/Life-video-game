import { useState, useEffect } from 'react'
import { Zap, TrendingUp, TrendingDown, BarChart3, ArrowUp, ArrowDown, Minus, Layers, AlertCircle } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'life_force_log'

const CATEGORIES = [
  'Activity', 'Person', 'Place', 'Food', 'Thought',
  'Environment', 'Conversation', 'Content', 'Practice', 'Work', 'Relationship',
]

const DIRECTIONS = ['Energizes', 'Drains', 'Neutral'] as const
type Direction = typeof DIRECTIONS[number]

const FREQUENCIES = ['Daily', 'Weekly', 'Occasionally', 'Rarely']

const ACTIONS = ['Do More', 'Maintain', 'Reduce', 'Eliminate', 'Experiment']

interface LifeForceEntry {
  id: string
  date: string
  category: string
  name: string
  direction: Direction
  magnitude: number
  frequency: string
  notes: string
  action: string
  lifeForceScore: number
}

function calcScore(direction: Direction, magnitude: number): number {
  if (direction === 'Energizes') return magnitude * 10
  if (direction === 'Drains') return (10 - magnitude) * 10
  return 50
}

function loadLog(): LifeForceEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LifeForceEntry[]
  } catch {
    return []
  }
}

function saveLog(entries: LifeForceEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export default function LifeForceLog() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<LifeForceEntry[]>([])

  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [direction, setDirection] = useState<Direction>('Energizes')
  const [magnitude, setMagnitude] = useState(7)
  const [frequency, setFrequency] = useState('')
  const [notes, setNotes] = useState('')
  const [action, setAction] = useState('')

  useEffect(() => {
    setLog(loadLog())
  }, [])

  const score = calcScore(direction, magnitude)

  function handleSave() {
    if (!category || !name.trim()) return
    const entry: LifeForceEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      category, name, direction, magnitude,
      frequency, notes, action,
      lifeForceScore: score,
    }
    const updated = [entry, ...log]
    saveLog(updated)
    setLog(updated)
    toastSuccess('Life Force Entry Added', `${name} — ${direction}`)
    setCategory('')
    setName('')
    setDirection('Energizes')
    setMagnitude(7)
    setFrequency('')
    setNotes('')
    setAction('')
  }

  // Portfolio calculations
  const energizers = log
    .filter(e => e.direction === 'Energizes')
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 5)
  const drains = log
    .filter(e => e.direction === 'Drains')
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, 5)

  const totalEnergizer = log
    .filter(e => e.direction === 'Energizes')
    .reduce((s, e) => s + e.magnitude, 0)
  const totalDrain = log
    .filter(e => e.direction === 'Drains')
    .reduce((s, e) => s + e.magnitude, 0)
  const netForce = totalEnergizer - totalDrain

  // Category breakdown
  const catBreakdown = CATEGORIES.map(cat => {
    const items = log.filter(e => e.category === cat)
    return { cat, count: items.length }
  }).filter(c => c.count > 0).sort((a, b) => b.count - a.count)

  // Action items
  const actionItems = log.filter(e => e.action === 'Eliminate' || e.action === 'Reduce')

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-xl bg-blue-500/20">
            <Zap className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Life Force Log</h1>
            <p className="text-slate-400 text-sm">What gives you life vs what drains it</p>
          </div>
        </div>

        {/* Net Life Force */}
        <div className="game-card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" /> Net Life Force
            </h3>
            <div className={`text-2xl font-bold ${netForce > 0 ? 'text-green-400' : netForce < 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {netForce > 0 ? '+' : ''}{netForce}
            </div>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-4 h-4 text-green-400" />
              <span className="text-slate-400">Energizers:</span>
              <span className="text-green-300 font-medium">{totalEnergizer}</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowDown className="w-4 h-4 text-red-400" />
              <span className="text-slate-400">Drains:</span>
              <span className="text-red-300 font-medium">{totalDrain}</span>
            </div>
            <div className="flex items-center gap-1">
              <Minus className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400">Total entries:</span>
              <span className="text-white font-medium">{log.length}</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="game-card mb-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" /> Add Life Force Entry
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Category *</label>
                <select
                  className="game-input w-full"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Frequency</label>
                <select
                  className="game-input w-full"
                  value={frequency}
                  onChange={e => setFrequency(e.target.value)}
                >
                  <option value="">Select...</option>
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Name (activity/person/place/etc.) *</label>
              <input
                className="game-input w-full"
                placeholder="Specific name..."
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* Direction selector */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Direction *</label>
              <div className="flex gap-2">
                {DIRECTIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      direction === d
                        ? d === 'Energizes'
                          ? 'bg-green-600 text-white'
                          : d === 'Drains'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-500 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    {d === 'Energizes' ? <ArrowUp className="w-3.5 h-3.5 inline mr-1" /> : d === 'Drains' ? <ArrowDown className="w-3.5 h-3.5 inline mr-1" /> : <Minus className="w-3.5 h-3.5 inline mr-1" />}
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Magnitude: {magnitude}/10</label>
              <input
                type="range" min={1} max={10}
                className={`w-full ${direction === 'Energizes' ? 'accent-green-500' : direction === 'Drains' ? 'accent-red-500' : 'accent-slate-500'}`}
                value={magnitude}
                onChange={e => setMagnitude(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Slight</span><span>Massive</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Notes</label>
              <input
                className="game-input w-full"
                placeholder="Any observations..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Action</label>
              <select
                className="game-input w-full"
                value={action}
                onChange={e => setAction(e.target.value)}
              >
                <option value="">Select action...</option>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
              <span className="text-sm text-slate-400">Life Force Score</span>
              <div className={`text-xl font-bold ${direction === 'Energizes' ? 'text-green-300' : direction === 'Drains' ? 'text-red-300' : 'text-slate-300'}`}>
                {score}/100
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!category || !name.trim()}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Log Life Force
            </button>
          </div>
        </div>

        {/* Portfolio */}
        {(energizers.length > 0 || drains.length > 0) && (
          <div className="game-card mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" /> Life Force Portfolio
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Top Energizers</span>
                </div>
                <div className="space-y-1">
                  {energizers.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-1 border-b border-slate-700/50">
                      <div>
                        <span className="text-sm text-white">{e.name}</span>
                        <span className="text-xs text-slate-500 ml-1">({e.category})</span>
                      </div>
                      <span className="text-sm font-bold text-green-400">+{e.magnitude}</span>
                    </div>
                  ))}
                  {energizers.length === 0 && <p className="text-xs text-slate-500">None yet</p>}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-300">Top Drains</span>
                </div>
                <div className="space-y-1">
                  {drains.map(e => (
                    <div key={e.id} className="flex items-center justify-between py-1 border-b border-slate-700/50">
                      <div>
                        <span className="text-sm text-white">{e.name}</span>
                        <span className="text-xs text-slate-500 ml-1">({e.category})</span>
                      </div>
                      <span className="text-sm font-bold text-red-400">-{e.magnitude}</span>
                    </div>
                  ))}
                  {drains.length === 0 && <p className="text-xs text-slate-500">None yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <div className="game-card mb-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Category Breakdown
            </h3>
            <div className="flex flex-wrap gap-2">
              {catBreakdown.map(({ cat, count }) => (
                <span key={cat} className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 text-sm">
                  {cat} <span className="text-blue-500">({count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action items */}
        {actionItems.length > 0 && (
          <div className="game-card border border-orange-500/30 bg-orange-500/5">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" /> Action Items
            </h3>
            <div className="space-y-2">
              {actionItems.map(e => (
                <div key={e.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white">{e.name}</span>
                    <span className="text-xs text-slate-400 ml-2">({e.category})</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.action === 'Eliminate'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-orange-500/20 text-orange-300'
                  }`}>
                    {e.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
