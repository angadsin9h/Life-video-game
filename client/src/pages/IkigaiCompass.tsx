import { useState, useEffect } from 'react'
import { Compass, Plus, X, Sparkles } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface IkigaiData {
  love: string[]         // What you love
  goodAt: string[]       // What you're good at
  worldNeeds: string[]   // What the world needs
  paidFor: string[]      // What you can be paid for
  statement: string      // Generated ikigai statement
  savedAt: string
}

const STORAGE_KEY = 'ikigai_compass'
const EMPTY: IkigaiData = { love: [], goodAt: [], worldNeeds: [], paidFor: [], statement: '', savedAt: '' }

const CIRCLES = [
  {
    key: 'love' as const,
    label: 'What You Love',
    emoji: '❤️',
    color: '#ec4899',
    prompt: 'Activities, topics, and experiences that make you lose track of time',
    cx: 110, cy: 110,
  },
  {
    key: 'goodAt' as const,
    label: 'What You\'re Good At',
    emoji: '⚡',
    color: '#f59e0b',
    prompt: 'Skills, talents, and abilities others often compliment',
    cx: 190, cy: 110,
  },
  {
    key: 'paidFor' as const,
    label: 'What You Can Be Paid For',
    emoji: '💰',
    color: '#22c55e',
    prompt: 'Services, products, or expertise people would pay for',
    cx: 190, cy: 190,
  },
  {
    key: 'worldNeeds' as const,
    label: 'What the World Needs',
    emoji: '🌍',
    color: '#3b82f6',
    prompt: 'Problems, gaps, or needs you see in the world around you',
    cx: 110, cy: 190,
  },
]

const OVERLAPS = [
  { label: 'PASSION',    desc: 'Love + Good At',        color: '#f97316', cx: 150, cy: 86  },
  { label: 'MISSION',    desc: 'Love + World Needs',     color: '#6366f1', cx: 86,  cy: 150 },
  { label: 'VOCATION',   desc: 'Good At + Paid For',     color: '#eab308', cx: 214, cy: 150 },
  { label: 'PROFESSION', desc: 'Good At + Paid For',     color: '#10b981', cx: 150, cy: 214 },
]

function IkigaiSVG({ data }: { data: IkigaiData }) {
  const r = 72
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto select-none">
      <defs>
        {CIRCLES.map(c => (
          <radialGradient key={c.key} id={`g-${c.key}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c.color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={c.color} stopOpacity="0.08" />
          </radialGradient>
        ))}
      </defs>

      {/* Four circles */}
      {CIRCLES.map(c => (
        <circle key={c.key} cx={c.cx} cy={c.cy} r={r}
          fill={`url(#g-${c.key})`} stroke={c.color} strokeWidth="1.5" strokeOpacity="0.6" />
      ))}

      {/* Circle emoji labels */}
      {CIRCLES.map(c => {
        const ox = c.cx < 150 ? c.cx - r + 8 : c.cx + r - 8
        const oy = c.cy < 150 ? c.cy - r + 12 : c.cy + r - 12
        const anchor = c.cx < 150 ? 'start' : 'end'
        return (
          <g key={c.key}>
            <text x={ox} y={oy} textAnchor={anchor} fontSize="13">{c.emoji}</text>
            <text x={c.cx < 150 ? c.cx - r + 10 : c.cx + r - 10}
              y={oy + 14} textAnchor={anchor} fontSize="7" fill="#94a3b8">
              {c.label.split(' ').slice(-2).join(' ')}
            </text>
          </g>
        )
      })}

      {/* Overlap labels */}
      {OVERLAPS.map(o => (
        <text key={o.label} x={o.cx} y={o.cy} textAnchor="middle"
          fontSize="7" fill={o.color} fontWeight="bold" letterSpacing="0.5">
          {o.label}
        </text>
      ))}

      {/* Center IKIGAI */}
      <circle cx={150} cy={150} r={24} fill="rgba(255,255,255,0.04)"
        stroke="white" strokeWidth="1" strokeOpacity="0.3" />
      <text x={150} y={147} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold" letterSpacing="1">
        IKIGAI
      </text>
      <text x={150} y={158} textAnchor="middle" fontSize="6" fill="#94a3b8">
        {[data.love, data.goodAt, data.worldNeeds, data.paidFor].filter(a => a.length > 0).length}/4
      </text>
    </svg>
  )
}

function TagInput({ value, onChange, placeholder, color }: {
  value: string[]; onChange: (v: string[]) => void; placeholder: string; color: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed])
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="game-input flex-1 text-sm" />
        <button onClick={add}
          className="px-3 py-2 rounded-xl text-white text-sm font-semibold flex-shrink-0"
          style={{ background: color }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: color + '20', color }}>
            {v}
            <button onClick={() => onChange(value.filter(x => x !== v))} className="opacity-60 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function generateStatement(data: IkigaiData): string {
  const { love, goodAt, worldNeeds, paidFor } = data
  if (!love.length && !goodAt.length && !worldNeeds.length && !paidFor.length) return ''

  const parts: string[] = []
  if (love.length) parts.push(`I love ${love.slice(0, 2).join(' and ')}`)
  if (goodAt.length) parts.push(`I excel at ${goodAt.slice(0, 2).join(' and ')}`)
  if (worldNeeds.length) parts.push(`the world needs ${worldNeeds.slice(0, 1).join(' and ')}`)
  if (paidFor.length) parts.push(`I can create value through ${paidFor.slice(0, 1).join(' and ')}`)

  const intersections = [
    love.length && goodAt.length ? `${love[0]} × ${goodAt[0]}` : null,
    worldNeeds.length && paidFor.length ? `${worldNeeds[0]} + ${paidFor[0]}` : null,
  ].filter(Boolean)

  if (intersections.length) {
    return `My ikigai lives at the intersection of ${intersections.join(' and ')} — ${parts.join(', ')}.`
  }
  return parts.join('. ') + '.'
}

export default function IkigaiCompass() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<IkigaiData>(EMPTY)
  const [activeCircle, setActiveCircle] = useState<typeof CIRCLES[0] | null>(CIRCLES[0])
  const [showStatement, setShowStatement] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
      if (saved) setData(saved)
    } catch { /**/ }
  }, [])

  const update = (key: keyof IkigaiData, val: unknown) => {
    setData(d => {
      const next = { ...d, [key]: val }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, savedAt: new Date().toISOString() }))
      return next
    })
  }

  const generate = () => {
    const stmt = generateStatement(data)
    update('statement', stmt)
    setShowStatement(true)
    toastSuccess('Ikigai statement generated — this is your reason for being 🧭')
  }

  const filledCircles = CIRCLES.filter(c => data[c.key].length > 0).length
  const totalItems = CIRCLES.reduce((s, c) => s + data[c.key].length, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"
          style={{ fontFamily: 'Orbitron, monospace' }}>
          <Compass className="w-7 h-7 text-violet-400" />
          Ikigai Compass
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Find your reason for being at the intersection of passion, mission, vocation, and profession.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{filledCircles}/4</div>
          <div className="text-xs text-slate-500">Circles Filled</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">{totalItems}</div>
          <div className="text-xs text-slate-500">Total Items</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">{data.statement ? '✓' : '—'}</div>
          <div className="text-xs text-slate-500">Statement</div>
        </div>
      </div>

      {/* SVG Venn */}
      <div className="game-card p-4 border border-violet-500/20">
        <div className="text-xs text-slate-500 uppercase tracking-widest text-center mb-3">Your Ikigai Map</div>
        <IkigaiSVG data={data} />
        {/* Legend */}
        <div className="grid grid-cols-2 gap-1.5 mt-3">
          {CIRCLES.map(c => (
            <button key={c.key} onClick={() => setActiveCircle(c === activeCircle ? null : c)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all ${activeCircle?.key === c.key ? 'ring-1' : 'opacity-70'}`}
              style={{
                background: c.color + '15',
                color: c.color,
              }}>
              <span>{c.emoji}</span>
              <span className="font-medium truncate">{c.label}</span>
              <span className="ml-auto font-bold">{data[c.key].length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active circle input */}
      {activeCircle && (
        <div className="game-card p-4" style={{ borderLeft: `3px solid ${activeCircle.color}` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{activeCircle.emoji}</span>
            <h3 className="text-sm font-semibold text-white">{activeCircle.label}</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">{activeCircle.prompt}</p>
          <TagInput
            value={data[activeCircle.key]}
            onChange={val => update(activeCircle.key, val)}
            placeholder={`Add to "${activeCircle.label}"…`}
            color={activeCircle.color}
          />
        </div>
      )}

      {/* All circles summary */}
      <div className="space-y-3">
        {CIRCLES.filter(c => c !== activeCircle && data[c.key].length > 0).map(c => (
          <div key={c.key} className="game-card p-3" style={{ borderLeft: `3px solid ${c.color}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{c.emoji}</span>
                <span className="text-xs font-semibold text-white">{c.label}</span>
              </div>
              <button onClick={() => setActiveCircle(c)}
                className="text-xs px-2 py-0.5 rounded" style={{ color: c.color, background: c.color + '20' }}>
                Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data[c.key].map(v => (
                <span key={v} className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: c.color + '20', color: c.color }}>
                  {v}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Generate button */}
      {filledCircles >= 2 && (
        <button onClick={generate}
          className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
          <Sparkles className="w-5 h-5" />
          Generate My Ikigai Statement
        </button>
      )}

      {/* Ikigai statement */}
      {showStatement && data.statement && (
        <div className="game-card p-5 border border-violet-500/30 text-center">
          <div className="text-2xl mb-3">🧭</div>
          <p className="text-slate-300 text-sm leading-relaxed italic">"{data.statement}"</p>
          <button onClick={() => setShowStatement(false)} className="mt-3 text-xs text-slate-600 hover:text-slate-400">
            Dismiss
          </button>
        </div>
      )}

      {/* Saved statement (persistent) */}
      {!showStatement && data.statement && (
        <div className="game-card p-4 border border-violet-500/20">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Your Ikigai Statement</div>
          <p className="text-sm text-slate-300 italic">"{data.statement}"</p>
          <p className="text-xs text-slate-700 mt-2">Saved · tap Generate to refresh</p>
        </div>
      )}

      {filledCircles === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Tap a circle above to begin filling in your ikigai map.</p>
          <p className="text-xs mt-1 text-slate-700">Most people never take the time to do this. You are different.</p>
        </div>
      )}
    </div>
  )
}
