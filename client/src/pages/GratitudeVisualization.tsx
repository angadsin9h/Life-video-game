import React, { useState, useEffect } from 'react'
import { Heart, Plus, X, RefreshCw, Flower2, Sparkles } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-gratitude-visualization'

type GratitudeCategory = 'people' | 'experiences' | 'things' | 'body' | 'growth' | 'serendipity' | 'beauty'

type GratitudeItem = {
  id: string
  date: string
  text: string
  category: GratitudeCategory
  intensity: number
  expandedOn: string
  revisited: number
}

const CATEGORY_CONFIG: Record<GratitudeCategory, { label: string; color: string; bg: string; hex: string }> = {
  people:      { label: 'People',      color: 'text-rose-400',   bg: 'bg-rose-500/20',   hex: '#fb7185' },
  experiences: { label: 'Experiences', color: 'text-amber-400',  bg: 'bg-amber-500/20',  hex: '#fbbf24' },
  things:      { label: 'Things',      color: 'text-sky-400',    bg: 'bg-sky-500/20',    hex: '#38bdf8' },
  body:        { label: 'Body',        color: 'text-emerald-400',bg: 'bg-emerald-500/20',hex: '#34d399' },
  growth:      { label: 'Growth',      color: 'text-violet-400', bg: 'bg-violet-500/20', hex: '#a78bfa' },
  serendipity: { label: 'Serendipity', color: 'text-pink-400',   bg: 'bg-pink-500/20',   hex: '#f472b6' },
  beauty:      { label: 'Beauty',      color: 'text-orange-400', bg: 'bg-orange-500/20', hex: '#fb923c' },
}

const CATEGORIES = Object.keys(CATEGORY_CONFIG) as GratitudeCategory[]

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function computeStreak(items: GratitudeItem[]): number {
  if (items.length === 0) return 0
  const days = [...new Set(items.map(i => i.date))].sort().reverse()
  let streak = 0
  const now = new Date()
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(now)
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]
    if (days[i] === expectedStr) streak++
    else break
  }
  return streak
}

type BubblePos = { x: number; y: number; r: number; item: GratitudeItem }

function layoutBubbles(items: GratitudeItem[], width: number, height: number): BubblePos[] {
  const cx = width / 2
  const cy = height / 2
  const positions: BubblePos[] = []
  const placed: BubblePos[] = []

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx]
    const r = 16 + item.intensity * 4
    let bestX = cx
    let bestY = cy
    let found = false

    for (let attempt = 0; attempt < 300; attempt++) {
      const angle = (idx * 137.508 + attempt * 23) * (Math.PI / 180)
      const dist = 10 + attempt * 2.2
      const tx = cx + Math.cos(angle) * dist
      const ty = cy + Math.sin(angle) * dist

      if (tx - r < 4 || tx + r > width - 4 || ty - r < 4 || ty + r > height - 4) continue

      let overlap = false
      for (const p of placed) {
        const dx = tx - p.x
        const dy = ty - p.y
        if (Math.sqrt(dx * dx + dy * dy) < r + p.r + 4) { overlap = true; break }
      }
      if (!overlap) { bestX = tx; bestY = ty; found = true; break }
    }

    const pos: BubblePos = { x: bestX, y: bestY, r, item }
    positions.push(pos)
    if (found) placed.push(pos)
  }

  return positions
}

export default function GratitudeVisualization() {
  const { toastSuccess } = useToast()

  const [items, setItems] = useState<GratitudeItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
  })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{
    text: string
    category: GratitudeCategory
    intensity: number
    expandedOn: string
  }>({ text: '', category: 'people', intensity: 7, expandedOn: '' })

  const [selectedBubble, setSelectedBubble] = useState<GratitudeItem | null>(null)
  const [revisitItems, setRevisitItems] = useState<GratitudeItem[]>([])
  const [showRevisit, setShowRevisit] = useState(false)

  const svgWidth = 520
  const svgHeight = 340
  const bubbles = layoutBubbles(items, svgWidth, svgHeight)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function saveItem() {
    if (!form.text.trim()) return
    const newItem: GratitudeItem = {
      id: Date.now().toString(),
      date: todayStr(),
      text: form.text.trim(),
      category: form.category,
      intensity: form.intensity,
      expandedOn: form.expandedOn.trim(),
      revisited: 0,
    }
    setItems(prev => [newItem, ...prev])
    setForm({ text: '', category: 'people', intensity: 7, expandedOn: '' })
    setShowForm(false)
    toastSuccess('Gratitude captured', 'Your garden grows')
  }

  function deleteItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function handleRevisit() {
    if (items.length === 0) return
    const shuffled = [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(3, items.length))
    const ids = new Set(shuffled.map(i => i.id))
    setItems(prev => prev.map(i => ids.has(i.id) ? { ...i, revisited: i.revisited + 1 } : i))
    setRevisitItems(shuffled)
    setShowRevisit(true)
    toastSuccess('Revisiting gratitude', 'Let it sink in again')
  }

  const streak = computeStreak(items)
  const avgIntensity = items.length
    ? Math.round((items.reduce((s, i) => s + i.intensity, 0) / items.length) * 10) / 10
    : 0

  const categoryCounts = CATEGORIES.map(c => ({
    cat: c,
    count: items.filter(i => i.category === c).length,
  }))
  const totalForSpectrum = Math.max(1, items.length)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Flower2 className="w-7 h-7 text-rose-400" />
            Gratitude Garden
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Cultivate a beautiful practice of thankfulness</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Gratitude
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{items.length}</div>
          <div className="text-xs text-slate-500">Total</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{streak}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-rose-400">{avgIntensity}</div>
          <div className="text-xs text-slate-500">Avg Depth</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">
            {items.filter(i => i.date === todayStr()).length}
          </div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-5 border border-rose-500/20 space-y-4 bg-gradient-to-br from-rose-950/20 to-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Gratitude</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          <textarea
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            placeholder="What are you grateful for? Be specific..."
            className="game-input w-full h-20 resize-none text-sm"
            autoFocus
          />

          <div>
            <p className="text-xs text-slate-400 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const cfg = CATEGORY_CONFIG[cat]
                return (
                  <button
                    key={cat}
                    onClick={() => setForm(f => ({ ...f, category: cat }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.category === cat
                        ? `${cfg.bg} ${cfg.color} border-current`
                        : 'border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-1">Depth of feeling: <span className="text-white font-semibold">{form.intensity}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.intensity}
              onChange={e => setForm(f => ({ ...f, intensity: Number(e.target.value) }))}
              className="w-full h-1 accent-rose-400"
            />
          </div>

          <textarea
            value={form.expandedOn}
            onChange={e => setForm(f => ({ ...f, expandedOn: e.target.value }))}
            placeholder="Go deeper — why does this matter? How did it make you feel?"
            className="game-input w-full h-16 resize-none text-sm"
          />

          <div className="flex gap-2">
            <button
              onClick={saveItem}
              disabled={!form.text.trim()}
              className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Plant in Garden
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bubble garden */}
      <div className="game-card p-4 bg-gradient-to-br from-slate-900 to-rose-950/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Your Gratitude Garden</h3>
          {items.length > 0 && (
            <button
              onClick={handleRevisit}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Revisit 3
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flower2 className="w-12 h-12 text-rose-800/40 mb-4" />
            <p className="text-slate-500 text-sm">Your garden awaits its first seed</p>
            <p className="text-slate-600 text-xs mt-1">Add something you're grateful for to begin</p>
          </div>
        ) : (
          <div className="relative">
            <svg
              width="100%"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="overflow-visible"
              style={{ maxHeight: '340px' }}
            >
              <defs>
                {CATEGORIES.map(cat => (
                  <radialGradient key={cat} id={`grad-${cat}`} cx="40%" cy="35%">
                    <stop offset="0%" stopColor={CATEGORY_CONFIG[cat].hex} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={CATEGORY_CONFIG[cat].hex} stopOpacity="0.3" />
                  </radialGradient>
                ))}
              </defs>
              {bubbles.map(({ x, y, r, item }) => (
                <g
                  key={item.id}
                  onClick={() => setSelectedBubble(selectedBubble?.id === item.id ? null : item)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={x} cy={y} r={r}
                    fill={`url(#grad-${item.category})`}
                    stroke={CATEGORY_CONFIG[item.category].hex}
                    strokeWidth={selectedBubble?.id === item.id ? 2.5 : 1}
                    strokeOpacity={0.6}
                    opacity={selectedBubble && selectedBubble.id !== item.id ? 0.45 : 1}
                    className="transition-opacity duration-200"
                  />
                  {r >= 28 && (
                    <text
                      x={x} y={y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.min(r * 0.45, 11)}
                      fill="white"
                      fillOpacity={0.8}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {item.intensity}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {selectedBubble && (
              <div className="mt-3 p-4 rounded-xl border border-slate-700/60 bg-slate-800/80 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full mr-2 ${CATEGORY_CONFIG[selectedBubble.category].bg} ${CATEGORY_CONFIG[selectedBubble.category].color}`}
                    >
                      {CATEGORY_CONFIG[selectedBubble.category].label}
                    </span>
                    <span className="text-xs text-slate-500">{selectedBubble.date} · depth {selectedBubble.intensity}/10</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteItem(selectedBubble.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedBubble(null)}
                      className="text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">"{selectedBubble.text}"</p>
                {selectedBubble.expandedOn && (
                  <p className="text-slate-400 text-xs leading-relaxed italic">{selectedBubble.expandedOn}</p>
                )}
                {selectedBubble.revisited > 0 && (
                  <p className="text-violet-400/60 text-xs">Revisited {selectedBubble.revisited}×</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gratitude spectrum */}
      {items.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Gratitude Spectrum</h3>
          <div className="relative h-6 rounded-full overflow-hidden flex">
            {categoryCounts
              .filter(c => c.count > 0)
              .map(({ cat, count }) => (
                <div
                  key={cat}
                  style={{
                    width: `${(count / totalForSpectrum) * 100}%`,
                    backgroundColor: CATEGORY_CONFIG[cat].hex,
                    opacity: 0.8,
                  }}
                  title={`${CATEGORY_CONFIG[cat].label}: ${count}`}
                  className="transition-all duration-500"
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {categoryCounts.filter(c => c.count > 0).map(({ cat, count }) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_CONFIG[cat].hex }}
                />
                <span className="text-xs text-slate-400">{CATEGORY_CONFIG[cat].label}</span>
                <span className="text-xs text-slate-600">({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Re-reading ritual modal */}
      {showRevisit && revisitItems.length > 0 && (
        <div className="game-card p-5 border border-violet-500/20 bg-gradient-to-br from-violet-950/20 to-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              Re-reading Ritual
            </h3>
            <button onClick={() => setShowRevisit(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500">Let these land again. Read slowly.</p>
          <div className="space-y-3">
            {revisitItems.map(item => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-700/40 bg-slate-800/40"
                style={{ borderLeft: `3px solid ${CATEGORY_CONFIG[item.category].hex}` }}
              >
                <p className="text-slate-200 text-sm leading-relaxed">"{item.text}"</p>
                {item.expandedOn && (
                  <p className="text-slate-500 text-xs mt-1 italic">{item.expandedOn}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs ${CATEGORY_CONFIG[item.category].color}`}>
                    {CATEGORY_CONFIG[item.category].label}
                  </span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-600">depth {item.intensity}/10</span>
                  <span className="text-xs text-slate-600">·</span>
                  <span className="text-xs text-slate-600">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowRevisit(false)}
            className="w-full py-2 bg-violet-800/40 hover:bg-violet-700/40 text-violet-300 rounded-xl text-sm font-medium transition-colors"
          >
            <Heart className="w-4 h-4 inline mr-1.5" />
            I appreciate these
          </button>
        </div>
      )}

      {/* Recent entries */}
      {items.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Entries</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.slice(0, 20).map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: CATEGORY_CONFIG[item.category].hex }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-sm leading-relaxed">{item.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${CATEGORY_CONFIG[item.category].color}`}>
                      {CATEGORY_CONFIG[item.category].label}
                    </span>
                    <span className="text-xs text-slate-600">· {item.intensity}/10 depth · {item.date}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
