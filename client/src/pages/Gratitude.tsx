import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Heart, Plus, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

interface Gratitude {
  id: number
  date: string
  text: string
  emoji: string
  created_at: string
}

interface HistoryEntry {
  date: string
  count: number
  texts: string
}

const EMOJI_OPTIONS = ['🙏', '❤️', '✨', '🌟', '💫', '🌸', '🦋', '🌈', '☀️', '🎯']
const PROMPTS = [
  'A person who made your day better...',
  'Something small you usually overlook...',
  'A challenge that helped you grow...',
  'Something about your body or health...',
  'A moment of beauty or wonder today...',
  'Something you get to do (not have to)...',
  'A skill or ability you are proud of...',
  'Something that made you smile...',
  'A comfort or convenience in your life...',
  'Progress you made, however small...',
]

function offsetDate(base: string, delta: number) {
  const d = new Date(base + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  return d.toISOString().split('T')[0]
}

function seedRandom(seed: number, max: number) {
  return Math.abs((seed * 1664525 + 1013904223) & 0x7fffffff) % max
}

export default function Gratitude() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [items, setItems] = useState<Gratitude[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState('🙏')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async (d = date) => {
    setLoading(true)
    const [dayRes, histRes] = await Promise.all([
      axios.get<Gratitude[]>(`/api/gratitude/${d}`),
      axios.get<HistoryEntry[]>('/api/gratitude/history/recent').catch(() => ({ data: [] as HistoryEntry[] })),
    ])
    setItems(dayRes.data)
    setHistory(histRes.data)
    setLoading(false)
  }

  useEffect(() => { load(date) }, [date])

  const add = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      await axios.post('/api/gratitude', { date, text, emoji })
      setText('')
      setEmoji('🙏')
      load(date)
    } finally { setSaving(false) }
  }

  const remove = async (id: number) => {
    await axios.delete(`/api/gratitude/${id}`)
    load(date)
  }

  const isToday = date === today
  const dateLabel = isToday ? 'Today' : date === offsetDate(today, -1) ? 'Yesterday' : date
  const dateSeed = parseInt(date.replace(/-/g, ''))
  const prompt = PROMPTS[seedRandom(dateSeed, PROMPTS.length)]

  // Streak calc
  const sortedHistory = [...history].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  let checkDate = today
  for (const entry of sortedHistory) {
    if (entry.date === checkDate && entry.count >= 1) {
      streak++
      checkDate = offsetDate(checkDate, -1)
    } else if (entry.date < checkDate) break
  }

  const historyDates = new Set(history.map(h => h.date))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-8 h-8 text-pink-400" />
            Gratitude
          </h1>
          <p className="text-slate-400 mt-1">What you appreciate, appreciates</p>
        </div>
        {streak > 0 && (
          <div className="text-right">
            <div className="text-2xl font-bold text-pink-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              🔥 {streak}
            </div>
            <div className="text-xs text-slate-500">day streak</div>
          </div>
        )}
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button onClick={() => setDate(d => offsetDate(d, -1))} className="game-btn-secondary p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-semibold text-slate-200">{dateLabel}</div>
          <div className="text-xs text-slate-500">{date}</div>
        </div>
        <button onClick={() => setDate(d => offsetDate(d, 1))} disabled={date >= today} className="game-btn-secondary p-2 disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
        {date !== today && <button onClick={() => setDate(today)} className="game-btn-secondary text-xs px-3 py-2">Today</button>}
      </div>

      {/* Gratitude cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-xl" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-3">🙏</div>
            <p className="text-sm">Nothing yet for {dateLabel.toLowerCase()}.</p>
            <p className="text-xs mt-1">Start with one small thing.</p>
          </div>
        ) : (
          items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-900/20 to-rose-900/10 border border-pink-500/20 rounded-xl group transition-all">
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <div className="flex-1">
                <div className="text-xs text-pink-400/60 mb-0.5">#{i + 1}</div>
                <p className="text-slate-200 text-sm">{item.text}</p>
              </div>
              {isToday && (
                <button
                  onClick={() => remove(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add entry */}
      {isToday && items.length < 5 && (
        <div className="game-card p-5 space-y-3 border-pink-500/20">
          {/* Prompt */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-pink-900/10 border border-pink-500/10">
            <Sparkles className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-pink-300/80 italic">{prompt}</p>
          </div>

          {/* Emoji picker */}
          <div className="flex gap-1.5 flex-wrap">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-xl w-9 h-9 rounded-lg transition-all hover:scale-110 ${emoji === e ? 'bg-pink-600/40 ring-2 ring-pink-500/60 scale-110' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                {e}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="game-input flex-1"
              placeholder={`Gratitude #${items.length + 1}...`}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              maxLength={200}
            />
            <button
              onClick={add}
              disabled={saving || !text.trim()}
              className="game-btn-primary px-4 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 text-center">{items.length}/5 for today · {5 - items.length} remaining</p>
        </div>
      )}

      {items.length >= 5 && isToday && (
        <div className="text-center p-4 bg-pink-900/10 border border-pink-500/20 rounded-xl">
          <div className="text-2xl mb-1">🌟</div>
          <p className="text-sm text-pink-300 font-semibold">Five gratitudes recorded!</p>
          <p className="text-xs text-slate-500 mt-1">Research shows this is the sweet spot for gratitude practice.</p>
        </div>
      )}

      {/* Calendar heatmap */}
      {history.length > 0 && (
        <div className="game-card p-5">
          <h3 className="font-semibold text-slate-200 mb-3 text-sm">Gratitude Calendar</h3>
          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} className="text-center text-[9px] text-slate-600">{d}</div>
            ))}
            {/* Pad to start of week */}
            {(() => {
              const days: string[] = []
              for (let i = 29; i >= 0; i--) {
                const d = new Date(); d.setDate(d.getDate() - i)
                days.push(d.toISOString().split('T')[0])
              }
              const firstDay = new Date(days[0] + 'T12:00:00').getDay()
              const pads = Array.from({ length: firstDay })
              return (
                <>
                  {pads.map((_, i) => <div key={`p${i}`} />)}
                  {days.map(d => {
                    const hasEntry = historyDates.has(d)
                    const entry = history.find(h => h.date === d)
                    const count = entry?.count ?? 0
                    return (
                      <button
                        key={d}
                        title={d + (hasEntry ? ` (${count})` : '')}
                        onClick={() => setDate(d)}
                        className={`aspect-square rounded-sm transition-all hover:ring-2 hover:ring-pink-500/50 ${
                          d === date ? 'ring-2 ring-pink-400' :
                          count >= 3 ? 'bg-pink-500 opacity-90' :
                          count >= 1 ? 'bg-pink-700 opacity-70' :
                          d === today ? 'bg-slate-600 border border-slate-500' : 'bg-slate-800'
                        }`}
                      />
                    )
                  })}
                </>
              )
            })()}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-pink-700" /> 1-2</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-pink-500" /> 3+</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-slate-800" /> none</div>
          </div>
        </div>
      )}
    </div>
  )
}
