import { useEffect, useState } from 'react'
import axios from 'axios'
import { Sparkles, ChevronLeft, ChevronRight, Save, Flame } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface GratitudeEntry {
  date: string
  entries: string[]
  theme: string
  streak: number
}

const GRATITUDE_PROMPTS = [
  'A person who helped me recently',
  'Something beautiful I noticed today',
  'A challenge that made me stronger',
  'A simple pleasure I often overlook',
  'Something about my health to be grateful for',
  'An opportunity I have that others don\'t',
  'A skill or talent I\'m thankful for',
  'Something from my past that shaped me positively',
  'A relationship that brings me joy',
  'Something about my home or environment',
  'A lesson I learned recently',
  'Something in nature that amazed me',
  'A memory that makes me smile',
  'A convenience in my life I take for granted',
]

export default function GratitudeChain() {
  const { toastSuccess } = useToast()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState<GratitudeEntry>({ date, entries: ['', '', ''], theme: '', streak: 0 })
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<GratitudeEntry[]>([])
  const [prompt] = useState(GRATITUDE_PROMPTS[Math.floor(Math.random() * GRATITUDE_PROMPTS.length)])

  useEffect(() => { loadDate(date) }, [date])
  useEffect(() => { loadHistory() }, [])

  const loadDate = async (d: string) => {
    setLoading(true)
    try {
      const r = await axios.get(`/api/gratitude-chain/${d}`)
      const entry = r.data as GratitudeEntry
      setData({ ...entry, entries: entry.entries.length > 0 ? [...entry.entries, ...Array(Math.max(0, 3 - entry.entries.length)).fill('')] : ['', '', ''] })
      setSaved(entry.entries.length > 0)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    const r = await axios.get('/api/gratitude-chain?limit=30')
    setHistory(r.data as GratitudeEntry[])
  }

  const save = async () => {
    const filtered = data.entries.filter(e => e.trim())
    if (filtered.length === 0) return
    const r = await axios.post('/api/gratitude-chain', { date, entries: filtered, theme: data.theme })
    const result = r.data as { streak: number }
    toastSuccess(`Gratitude saved! 🔥 ${result.streak} day streak!`)
    setSaved(true)
    loadHistory()
    setData(d => ({ ...d, streak: result.streak }))
  }

  const shiftDate = (d: number) => {
    const dt = new Date(date + 'T12:00:00')
    dt.setDate(dt.getDate() + d)
    setDate(dt.toISOString().split('T')[0])
  }

  const isToday = date === new Date().toISOString().split('T')[0]
  const maxStreak = history.length > 0 ? Math.max(...history.map(h => h.streak)) : 0

  const updateEntry = (i: number, val: string) => {
    setData(d => ({ ...d, entries: d.entries.map((e, idx) => idx === i ? val : e) }))
    setSaved(false)
  }

  // 30-day heatmap
  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0]
    const entry = history.find(h => h.date === d)
    return { date: d, hasEntry: !!entry, streak: entry?.streak || 0 }
  })

  if (loading) return <div className="h-60 bg-slate-800 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sparkles className="w-7 h-7 text-yellow-400" />
            Gratitude Chain
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">3 gratitudes a day. Build an unbroken chain.</p>
        </div>
        {data.streak > 0 && (
          <div className="flex items-center gap-1 text-orange-400 font-bold">
            <Flame className="w-5 h-5" /> {data.streak}d
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-orange-400">{data.streak}</div>
          <div className="text-xs text-slate-500">Current Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <Sparkles className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
          <div className="text-xl font-bold text-yellow-400">{maxStreak}</div>
          <div className="text-xs text-slate-500">Best Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400">{history.length}</div>
          <div className="text-xs text-slate-500">Days Logged</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="game-card p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Last 30 Days</h3>
        <div className="flex gap-1">
          {heatmapDays.map((d, i) => (
            <div key={i} className="flex-1 h-4 rounded-sm" title={d.date}
              style={{ background: d.hasEntry ? '#eab308' : '#1e293b', opacity: d.hasEntry ? 0.5 + d.streak / 30 : 0.2 }} />
          ))}
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 text-slate-500 hover:text-slate-300"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <div className="font-bold text-white">{isToday ? 'Today' : date}</div>
          {saved && <div className="text-xs text-green-400">✓ Logged</div>}
        </div>
        <button onClick={() => shiftDate(1)} disabled={isToday} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Entry form */}
      <div className="game-card p-5 space-y-4">
        <div className="text-xs text-yellow-400 italic mb-1">Today's prompt: {prompt}</div>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 mt-2">
              <span className="text-xs text-yellow-400 font-bold">{i + 1}</span>
            </div>
            <input
              value={data.entries[i] || ''}
              onChange={e => updateEntry(i, e.target.value)}
              placeholder={`I'm grateful for...`}
              className="game-input flex-1"
              disabled={saved}
            />
          </div>
        ))}

        <div>
          <label className="text-xs text-slate-400 mb-1 block">Optional: Today's theme</label>
          <input value={data.theme} onChange={e => setData(d => ({ ...d, theme: e.target.value }))}
            placeholder="A word that captures today's mood or theme..." className="game-input w-full" disabled={saved} />
        </div>

        {!saved && (
          <button onClick={save} className="w-full py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-semibold transition-colors">
            <Sparkles className="w-4 h-4 inline mr-1.5" />Save Gratitude
          </button>
        )}
        {saved && (
          <button onClick={() => setSaved(false)} className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
            Edit entry
          </button>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Entries</h3>
          {history.slice(0, 7).map(h => (
            <div key={h.date} className="game-card p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{h.date}</span>
                {h.streak > 0 && <span className="text-xs text-orange-400">🔥 {h.streak}d</span>}
              </div>
              <div className="space-y-1">
                {h.entries.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-400 text-xs">✦</span>
                    <span className="text-slate-300">{e}</span>
                  </div>
                ))}
              </div>
              {h.theme && <div className="text-xs text-slate-500 mt-1 italic">Theme: {h.theme}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
