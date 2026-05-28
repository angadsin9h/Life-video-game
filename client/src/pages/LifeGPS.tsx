import { useState } from 'react'
import { Compass, Target, TrendingUp, TrendingDown, ArrowRight, CheckCircle2, Zap } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'life_gps_log'

interface Dimension {
  name: string
  current: number
  target: number
  level10: string
}

interface LifeGPSEntry {
  dimensions: Dimension[]
  overallGap: number
  actionFocus: string
  savedAt: string
}

const DIMENSION_NAMES = [
  'Mind',
  'Body',
  'Energy',
  'Social',
  'Purpose',
  'Growth',
  'Wealth',
  'Spirit',
]

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  Mind: <span className="text-violet-400">🧠</span>,
  Body: <span className="text-red-400">💪</span>,
  Energy: <span className="text-amber-400">⚡</span>,
  Social: <span className="text-sky-400">👥</span>,
  Purpose: <span className="text-emerald-400">🎯</span>,
  Growth: <span className="text-green-400">🌱</span>,
  Wealth: <span className="text-yellow-400">💰</span>,
  Spirit: <span className="text-indigo-400">✨</span>,
}

function createDefaultDimensions(): Dimension[] {
  return DIMENSION_NAMES.map(name => ({ name, current: 5, target: 8, level10: '' }))
}

function loadDimensions(): Dimension[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const log: LifeGPSEntry[] = JSON.parse(raw)
      if (log.length > 0) {
        const last = log[log.length - 1]
        return last.dimensions
      }
    }
  } catch { /* ignore */ }
  return createDefaultDimensions()
}

function loadLog(): LifeGPSEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function getGapColor(gap: number): string {
  if (gap < 2) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  if (gap < 4) return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
  return 'bg-red-500/20 text-red-400 border-red-500/40'
}

function getGapLabel(gap: number): string {
  if (gap < 2) return 'On Track'
  if (gap < 4) return 'Closing'
  return 'Priority'
}

export default function LifeGPS() {
  const { toastSuccess } = useToast()
  const [dimensions, setDimensions] = useState<Dimension[]>(loadDimensions)
  const [actionFocus, setActionFocus] = useState('')
  const [log] = useState<LifeGPSEntry[]>(loadLog)

  const gaps = dimensions.map(d => Math.max(0, d.target - d.current))
  const overallGap = gaps.length > 0
    ? Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10
    : 0

  const sorted = [...dimensions]
    .map((d, i) => ({ ...d, gap: gaps[i], originalIdx: i }))
    .sort((a, b) => b.gap - a.gap)

  const topPriority = sorted[0]

  function updateDimension(idx: number, field: keyof Dimension, value: string | number) {
    setDimensions(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  function handleSave() {
    const entry: LifeGPSEntry = {
      dimensions,
      overallGap,
      actionFocus,
      savedAt: new Date().toISOString(),
    }
    const updated = [...log, entry]
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
    toastSuccess('Life GPS saved!', `Overall gap: ${overallGap}`)
  }

  const overallColor = overallGap < 2 ? 'text-emerald-400' : overallGap < 4 ? 'text-amber-400' : 'text-red-400'
  const overallBorder = overallGap < 2 ? 'border-emerald-500/30' : overallGap < 4 ? 'border-amber-400/30' : 'border-red-500/30'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Compass className="w-6 h-6 text-violet-400" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
            Life GPS
          </h1>
        </div>
        <p className="text-slate-400 text-sm">Where you are vs. where you want to be — your 8-dimension life map.</p>
      </div>

      {/* Overall Gap Score */}
      <div className={`game-card mb-6 border ${overallBorder} flex items-center justify-between`}>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Overall Gap Score</p>
          <p className={`text-5xl font-black ${overallColor}`} style={{ fontFamily: 'Orbitron, monospace' }}>
            {overallGap}
          </p>
          <p className="text-slate-500 text-xs mt-1">Lower = closer to your targets</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-400">Gap &lt; 2 — On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-slate-400">Gap &lt; 4 — Closing</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-slate-400">Gap ≥ 4 — Priority</span>
          </div>
        </div>
      </div>

      {/* Priority #1 GPS Focus */}
      {topPriority && (
        <div className="game-card mb-6 border border-red-500/30 bg-red-950/20">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-red-400" />
            <span className="font-semibold text-sm text-red-400">My #1 GPS Focus</span>
            <span className="ml-auto text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
              {topPriority.name} — Gap: {topPriority.gap}
            </span>
          </div>
          <p className="text-slate-300 text-sm mb-3">
            Your biggest gap is in <span className="text-red-300 font-semibold">{topPriority.name}</span> (currently {topPriority.current}/10, target {topPriority.target}/10).
          </p>
          <input
            type="text"
            className="game-input w-full"
            placeholder="What's one action you can take this week to close this gap?"
            value={actionFocus}
            onChange={e => setActionFocus(e.target.value)}
          />
        </div>
      )}

      {/* Priority Ranking */}
      <div className="game-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">Priority Ranking (Largest Gap First)</span>
        </div>
        <div className="space-y-2">
          {sorted.map((d, rank) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-4 text-right">{rank + 1}</span>
              <span className="text-sm w-16 text-slate-300 font-medium">{d.name}</span>
              <div className="flex-1 bg-slate-700/50 rounded-full h-2 relative">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-violet-500/60"
                  style={{ width: `${(d.current / 10) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-violet-300/30 border-r-2 border-violet-300"
                  style={{ width: `${(d.target / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 w-12 text-right">{d.current}→{d.target}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getGapColor(d.gap)} min-w-[68px] text-center`}>
                {getGapLabel(d.gap)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-violet-500/60 inline-block" /> Current</span>
          <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-violet-300/30 border border-violet-300 inline-block" /> Target</span>
        </div>
      </div>

      {/* 8 Dimension Editors */}
      <div className="space-y-4 mb-6">
        {dimensions.map((dim, idx) => {
          const gap = Math.max(0, dim.target - dim.current)
          return (
            <div key={dim.name} className="game-card">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">{DIMENSION_ICONS[dim.name]}</span>
                <span className="font-bold text-base">{dim.name}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${getGapColor(gap)}`}>
                  Gap: {gap}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Current Level */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-slate-400">Current Level</label>
                    <span className="text-xs text-violet-400 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
                      {dim.current}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={dim.current}
                    onChange={e => updateDimension(idx, 'current', Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                    <span>1</span><span>10</span>
                  </div>
                </div>

                {/* Target Level */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs text-slate-400">Target Level</label>
                    <span className="text-xs text-emerald-400 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
                      {dim.target}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={dim.target}
                    onChange={e => updateDimension(idx, 'target', Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-600 mt-0.5">
                    <span>1</span><span>10</span>
                  </div>
                </div>
              </div>

              {/* Progress bar visualization */}
              <div className="bg-slate-700/50 rounded-full h-3 mb-4 relative overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all"
                  style={{ width: `${(dim.current / 10) * 100}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-400"
                  style={{ left: `${(dim.target / 10) * 100}%` }}
                />
              </div>

              {/* Level 10 Vision */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What would level 10 look like?</label>
                <input
                  type="text"
                  className="game-input w-full text-sm"
                  placeholder={`My ${dim.name} at a perfect 10 means...`}
                  value={dim.level10}
                  onChange={e => updateDimension(idx, 'level10', e.target.value)}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Table */}
      <div className="game-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <span className="font-semibold text-sm">8-Dimension Overview</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700">
                <th className="text-left py-2 pr-3">Dimension</th>
                <th className="text-center py-2 px-2">Now</th>
                <th className="text-center py-2 px-2">Goal</th>
                <th className="text-center py-2 px-2">Gap</th>
                <th className="text-left py-2 pl-2 hidden sm:table-cell">Progress</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim, idx) => {
                const gap = Math.max(0, dim.target - dim.current)
                return (
                  <tr key={dim.name} className="border-b border-slate-800/60">
                    <td className="py-2 pr-3 font-medium text-slate-300">{dim.name}</td>
                    <td className="py-2 px-2 text-center text-violet-400 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>{dim.current}</td>
                    <td className="py-2 px-2 text-center text-emerald-400 font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>{dim.target}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${getGapColor(gap)}`}>{gap}</span>
                    </td>
                    <td className="py-2 pl-2 hidden sm:table-cell">
                      <div className="bg-slate-700/50 rounded-full h-1.5 w-24 relative">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${(dim.current / 10) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        Save Life GPS Snapshot
      </button>

      {log.length > 0 && (
        <p className="text-center text-xs text-slate-500 mt-3">
          Last snapshot: {new Date(log[log.length - 1].savedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
