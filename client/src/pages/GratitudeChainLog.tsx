import { useState, useCallback } from 'react'
import { Heart, Plus, Trash2, Save, Star, TrendingUp, Zap, Calendar } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'gratitude_chain_log'

interface GratitudeLink {
  id: string
  date: string
  items: string[]       // 3-5 gratitude items
  theme: string         // optional theme (e.g. "people", "nature", "opportunities")
  depth: 1|2|3          // 1=surface, 2=meaningful, 3=profound
  mood: 1|2|3|4|5
}

function load(): GratitudeLink[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] } }
function today() { return new Date().toISOString().slice(0, 10) }

const THEMES = ['people', 'health', 'opportunities', 'nature', 'growth', 'joy', 'lessons', 'abundance', 'creativity', 'love']

export default function GratitudeChainLog() {
  const { toastSuccess } = useToast()
  const [links, setLinks] = useState<GratitudeLink[]>(load)
  const [items, setItems] = useState<string[]>(['', '', ''])
  const [theme, setTheme] = useState('')
  const [depth, setDepth] = useState<1|2|3>(1)
  const [mood, setMood] = useState<1|2|3|4|5>(3)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const persist = useCallback((l: GratitudeLink[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(l))
    setLinks(l)
  }, [])

  function addItem() { setItems(i => [...i, '']) }
  function removeItem(idx: number) { setItems(i => i.filter((_, j) => j !== idx)) }
  function updateItem(idx: number, val: string) { setItems(i => i.map((x, j) => j === idx ? val : x)) }

  function save() {
    const filled = items.filter(i => i.trim())
    if (!filled.length) return
    const existing = links.findIndex(l => l.date === today())
    const entry: GratitudeLink = { id: Date.now().toString(), date: today(), items: filled, theme, depth, mood }
    const updated = existing >= 0 ? links.map((l, i) => i === existing ? entry : l) : [...links, entry]
    persist(updated)
    toastSuccess('Gratitude chain extended! 🔗')
    setItems(['', '', ''])
    setTheme('')
    setDepth(1)
    setMood(3)
  }

  const streak = (() => {
    let s = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().slice(0, 10)
      if (links.find(l => l.date === ds)) { s++; d.setDate(d.getDate() - 1) } else break
    }
    return s
  })()

  // Word frequency from all items
  const wordFreq: Record<string, number> = {}
  links.flatMap(l => l.items).forEach(item => {
    item.toLowerCase().split(/\s+/).filter(w => w.length > 3).forEach(w => {
      wordFreq[w] = (wordFreq[w] ?? 0) + 1
    })
  })
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 12)

  const MOOD_EMOJIS = ['', '😔', '😐', '🙂', '😊', '🤩']
  const DEPTH_LABELS: Record<number, { label: string; color: string }> = {
    1: { label: 'Surface', color: 'text-slate-400' },
    2: { label: 'Meaningful', color: 'text-blue-400' },
    3: { label: 'Profound', color: 'text-violet-400' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Gratitude Chain</h1>
          <p className="text-slate-400 text-sm mt-1">Build an unbroken chain of gratitude — one link per day</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">🔗 {streak}d</div>
          <div className="text-xs text-slate-500">chain length</div>
        </div>
      </div>

      {/* Chain visual — last 21 days */}
      <div className="game-card p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Last 21 days</h3>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 21 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (20 - i))
            const ds = d.toISOString().slice(0, 10)
            const link = links.find(l => l.date === ds)
            return (
              <div key={ds} title={ds}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                  link
                    ? link.depth === 3 ? 'bg-violet-500 text-white' : link.depth === 2 ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                    : 'bg-slate-700 text-slate-600'
                }`}>
                {link ? '🔗' : '○'}
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500 inline-block" /> Surface</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Meaningful</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-violet-500 inline-block" /> Profound</span>
        </div>
      </div>

      {/* Today's entry */}
      <div className="game-card p-5 space-y-4">
        <h3 className="font-semibold text-white">Today's Gratitude</h3>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input className="game-input flex-1" placeholder={`I'm grateful for... ${idx + 1}`}
                value={item} onChange={e => updateItem(idx, e.target.value)} />
              {items.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-slate-500 hover:text-red-400 transition-colors px-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {items.length < 7 && (
            <button onClick={addItem} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add another
            </button>
          )}
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Theme (optional)</label>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map(t => (
              <button key={t} onClick={() => setTheme(theme === t ? '' : t)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors capitalize ${theme === t ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Depth + Mood */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Depth</label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map(d => (
                <button key={d} onClick={() => setDepth(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${depth === d ? `${DEPTH_LABELS[d].color} bg-slate-700 ring-1 ring-current` : 'text-slate-500 bg-slate-800'}`}>
                  {DEPTH_LABELS[d].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Mood</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setMood(n as 1|2|3|4|5)}
                  className={`flex-1 py-1.5 rounded-xl text-lg transition-all ${mood >= n ? 'bg-slate-700' : 'opacity-30'}`}>
                  {MOOD_EMOJIS[n]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={save}
          className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2.5 rounded-xl transition-colors">
          <Heart className="w-4 h-4" /> Extend the Chain
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-yellow-400">{links.length}</div>
          <div className="text-xs text-slate-500">total days</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{links.filter(l => l.depth === 3).length}</div>
          <div className="text-xs text-slate-500">profound days</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">
            {links.length ? (links.reduce((s, l) => s + l.mood, 0) / links.length).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-slate-500">avg mood</div>
        </div>
      </div>

      {/* Word cloud */}
      {topWords.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-medium text-slate-400 mb-3">What you're grateful for most</h3>
          <div className="flex flex-wrap gap-2">
            {topWords.map(([word, count]) => (
              <span key={word} className="px-2.5 py-1 bg-yellow-900/30 text-yellow-300 rounded-full border border-yellow-700/30"
                style={{ fontSize: `${Math.max(11, Math.min(18, 11 + count * 2))}px` }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div className="game-card p-4">
        <h3 className="font-semibold text-white mb-3">Recent Days</h3>
        <div className="space-y-2">
          {[...links].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map(l => (
            <div key={l.id}>
              <button className="w-full flex items-center justify-between p-2.5 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors text-left"
                onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-20">{l.date}</span>
                  <span className={`text-xs ${DEPTH_LABELS[l.depth].color}`}>{DEPTH_LABELS[l.depth].label}</span>
                  {l.theme && <span className="text-xs text-slate-500 capitalize">{l.theme}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{MOOD_EMOJIS[l.mood]}</span>
                  <span className="text-xs text-slate-500">{l.items.length} items</span>
                </div>
              </button>
              {expandedId === l.id && (
                <div className="px-3 pb-3 space-y-1">
                  {l.items.map((item, i) => (
                    <div key={i} className="text-sm text-slate-300 flex items-start gap-2">
                      <Heart className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {links.length === 0 && <p className="text-slate-500 text-sm text-center py-4">Start your chain today.</p>}
        </div>
      </div>
    </div>
  )
}
