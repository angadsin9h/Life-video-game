import { useState, useEffect, useMemo } from 'react'
import { Mic, Plus, Trash2, Save, ChevronDown, ChevronUp, Clock, BookOpen } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface VoiceEntry {
  id: string
  date: string
  time: string
  text: string
  mood: 1 | 2 | 3 | 4 | 5
  energy: 1 | 2 | 3 | 4 | 5
  topic: 'reflection' | 'venting' | 'gratitude' | 'planning' | 'idea' | 'fear' | 'dream' | 'random'
  private: boolean
  wordCount: number
  tags: string[]
}

const STORAGE_KEY = 'voice_journal_log'

const TOPIC_CONFIG: Record<VoiceEntry['topic'], { label: string; emoji: string; color: string }> = {
  reflection: { label: 'Reflection', emoji: '🪞', color: '#818cf8' },
  venting:    { label: 'Venting',    emoji: '😤', color: '#f87171' },
  gratitude:  { label: 'Gratitude',  emoji: '🙏', color: '#34d399' },
  planning:   { label: 'Planning',   emoji: '📋', color: '#60a5fa' },
  idea:       { label: 'Idea',       emoji: '💡', color: '#fbbf24' },
  fear:       { label: 'Fear',       emoji: '😰', color: '#c084fc' },
  dream:      { label: 'Dream',      emoji: '💭', color: '#67e8f9' },
  random:     { label: 'Random',     emoji: '🎲', color: '#94a3b8' },
}

const MOOD_EMOJI: Record<number, string> = { 1: '😞', 2: '😕', 3: '😐', 4: '🙂', 5: '😄' }
const ENERGY_EMOJI: Record<number, string> = { 1: '🪫', 2: '😴', 3: '⚡', 4: '🔥', 5: '💥' }

const MOOD_COLOR: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e',
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function formatTime(): string {
  const n = new Date()
  return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
}

const STOP_WORDS = new Set(['the', 'and', 'that', 'have', 'with', 'this', 'from', 'they', 'will', 'been', 'more', 'when', 'what', 'your', 'just', 'also', 'then', 'than', 'into', 'over', 'very', 'some', 'time', 'like', 'only', 'was', 'are', 'for', 'not', 'but', 'all', 'can', 'its', 'had', 'about', 'there', 'their', 'which'])

export default function VoiceJournal() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<VoiceEntry[]>([])
  const [text, setText] = useState('')
  const [topic, setTopic] = useState<VoiceEntry['topic']>('random')
  const [mood, setMood] = useState<VoiceEntry['mood']>(3)
  const [energy, setEnergy] = useState<VoiceEntry['energy']>(3)
  const [isPrivate, setIsPrivate] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: VoiceEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!text.trim()) return
    const entry: VoiceEntry = {
      id: Date.now().toString(),
      date: todayStr(),
      time: formatTime(),
      text: text.trim(),
      mood,
      energy,
      topic,
      private: isPrivate,
      wordCount: countWords(text),
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
    }
    persist([entry, ...entries])
    setText('')
    setTagsInput('')
    setMood(3)
    setEnergy(3)
    setTopic('random')
    setIsPrivate(false)
    toastSuccess('Voice captured! 🎙️')
  }

  // Streak
  const streak = useMemo(() => {
    const days = Array.from(new Set(entries.map(e => e.date))).sort().reverse()
    if (!days.length) return 0
    let count = 0
    const today = todayStr()
    let current = new Date(today)
    for (const day of days) {
      const cStr = current.toISOString().split('T')[0]
      if (day === cStr) {
        count++
        current.setDate(current.getDate() - 1)
      } else {
        break
      }
    }
    return count
  }, [entries])

  // 7-day activity
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const ds = d.toISOString().split('T')[0]
      const dayEntries = entries.filter(e => e.date === ds)
      return { date: ds, entries: dayEntries, label: d.toLocaleDateString('en', { weekday: 'short' }) }
    })
  }, [entries])

  // Today's entries
  const todayEntries = useMemo(() => entries.filter(e => e.date === todayStr()).sort((a, b) => a.time.localeCompare(b.time)), [entries])

  // Topic breakdown last 30d
  const topicBreakdown = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    const recent = entries.filter(e => e.date >= cutoffStr)
    return (Object.keys(TOPIC_CONFIG) as VoiceEntry['topic'][]).map(t => ({
      topic: t,
      count: recent.filter(e => e.topic === t).length,
    })).sort((a, b) => b.count - a.count)
  }, [entries])

  const maxTopicCount = Math.max(...topicBreakdown.map(t => t.count), 1)

  // Word cloud
  const wordCloud = useMemo(() => {
    const freq: Record<string, number> = {}
    entries.forEach(e => {
      e.text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => {
        if (w.length > 3 && !STOP_WORDS.has(w)) freq[w] = (freq[w] || 0) + 1
      })
    })
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30)
  }, [entries])

  const maxWordFreq = wordCloud.length > 0 ? wordCloud[0][1] : 1

  // Filtered all entries
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter(e => !q || e.text.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q)))
  }, [entries, search])

  const toggleReveal = (id: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const livewc = countWords(text)

  const max7 = Math.max(...last7.map(d => d.entries.length), 1)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Mic className="w-7 h-7 text-violet-400" />
            Voice Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Stream of consciousness — unfiltered, fast, real.</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-500">day streak 🔥</div>
        </div>
      </div>

      {/* Quick Capture */}
      <div className="game-card p-5 space-y-4 border border-violet-500/20">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-violet-300 flex items-center gap-1.5">
            <Mic className="w-4 h-4" /> Quick Capture
          </h2>
          <span className="text-xs text-slate-500">{livewc} words</span>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Just speak your mind... (no structure needed)"
          className="game-input w-full resize-none text-sm leading-relaxed"
          rows={5}
          style={{ minHeight: '120px' }}
        />

        {/* Topic chips */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(TOPIC_CONFIG) as [VoiceEntry['topic'], typeof TOPIC_CONFIG.random][]).map(([k, t]) => (
            <button
              key={k}
              onClick={() => setTopic(k)}
              className="px-2.5 py-1 rounded-lg text-xs transition-all"
              style={topic === k
                ? { background: t.color + '25', color: t.color, border: `1px solid ${t.color}60` }
                : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Mood + Energy */}
        <div className="flex gap-4">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1.5">Mood</p>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as VoiceEntry['mood'][]).map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className="flex-1 py-1 rounded-lg text-base transition-all"
                  style={{ background: mood === m ? MOOD_COLOR[m] + '30' : '#1e293b', border: mood === m ? `1px solid ${MOOD_COLOR[m]}60` : '1px solid transparent' }}
                >
                  {MOOD_EMOJI[m]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-1.5">Energy</p>
            <div className="flex gap-1">
              {([1, 2, 3, 4, 5] as VoiceEntry['energy'][]).map(e => (
                <button
                  key={e}
                  onClick={() => setEnergy(e)}
                  className="flex-1 py-1 rounded-lg text-base transition-all"
                  style={{ background: energy === e ? '#8b5cf630' : '#1e293b', border: energy === e ? '1px solid #8b5cf660' : '1px solid transparent' }}
                >
                  {ENERGY_EMOJI[e]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tags + private */}
        <div className="flex gap-2 items-center">
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="Tags (comma separated)"
            className="game-input flex-1 text-sm"
          />
          <button
            onClick={() => setIsPrivate(p => !p)}
            className="px-3 py-2 rounded-lg text-sm transition-all"
            style={isPrivate ? { background: '#8b5cf630', color: '#a78bfa', border: '1px solid #8b5cf660' } : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }}
            title="Private entry"
          >
            🔒
          </button>
        </div>

        <button
          onClick={submit}
          disabled={!text.trim()}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Capture Voice
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total Entries</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400">{todayEntries.length}</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">
            {entries.length > 0 ? Math.round(entries.reduce((s, e) => s + e.wordCount, 0) / entries.length) : 0}
          </div>
          <div className="text-xs text-slate-500">Avg Words</div>
        </div>
      </div>

      {/* Today's entries */}
      {todayEntries.length > 0 && (
        <div className="game-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-violet-400" /> Today's Entries
          </h2>
          <div className="space-y-2">
            {todayEntries.map(e => {
              const isRevealed = revealed.has(e.id)
              const tc = TOPIC_CONFIG[e.topic]
              return (
                <div key={e.id} className="p-3 bg-slate-900/50 rounded-xl" style={{ borderLeft: `3px solid ${tc.color}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500">{e.time}</span>
                    <span>{tc.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: tc.color }}>{tc.label}</span>
                    <span className="ml-auto text-xs text-slate-600">{e.wordCount}w</span>
                    {e.private && <span className="text-xs">🔒</span>}
                  </div>
                  <p
                    className="text-sm text-slate-300 transition-all cursor-pointer select-none"
                    style={e.private && !isRevealed ? { filter: 'blur(6px)', userSelect: 'none' } : {}}
                    onClick={() => e.private && toggleReveal(e.id)}
                    title={e.private && !isRevealed ? 'Click to reveal' : undefined}
                  >
                    {e.text}
                  </p>
                  {e.private && !isRevealed && (
                    <p className="text-xs text-slate-600 mt-1 italic">click to reveal</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 7-day activity SVG */}
      <div className="game-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">7-Day Activity</h2>
        <svg width="100%" height="80" viewBox="0 0 280 80" className="overflow-visible">
          {last7.map((day, i) => {
            const x = i * 40 + 20
            return (
              <g key={day.date}>
                <text x={x} y={75} textAnchor="middle" fontSize="9" fill="#64748b">{day.label}</text>
                {day.entries.map((entry, j) => {
                  const cy = 60 - j * 12
                  if (cy < 5) return null
                  return (
                    <circle
                      key={entry.id}
                      cx={x}
                      cy={cy}
                      r="4"
                      fill={MOOD_COLOR[entry.mood]}
                      opacity={0.85}
                    />
                  )
                })}
                {day.entries.length === 0 && (
                  <circle cx={x} cy={55} r="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                )}
              </g>
            )
          })}
        </svg>
        <p className="text-xs text-slate-600 mt-1">Dots = entries, colored by mood</p>
      </div>

      {/* Topic breakdown */}
      <div className="game-card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Topic Breakdown (last 30d)</h2>
        <div className="space-y-2">
          {topicBreakdown.filter(t => t.count > 0).map(t => {
            const tc = TOPIC_CONFIG[t.topic]
            const pct = Math.round((t.count / maxTopicCount) * 100)
            return (
              <div key={t.topic} className="flex items-center gap-2">
                <span className="w-5 text-center">{tc.emoji}</span>
                <span className="text-xs text-slate-400 w-20">{tc.label}</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: tc.color }} />
                </div>
                <span className="text-xs text-slate-500 w-4 text-right">{t.count}</span>
              </div>
            )
          })}
          {topicBreakdown.every(t => t.count === 0) && (
            <p className="text-xs text-slate-600 text-center py-2">No entries in the last 30 days</p>
          )}
        </div>
      </div>

      {/* Word cloud */}
      {wordCloud.length > 0 && (
        <div className="game-card p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-400" /> Word Cloud
          </h2>
          <div className="flex flex-wrap gap-2 items-end">
            {wordCloud.map(([word, freq]) => {
              const relSize = (freq / maxWordFreq)
              const size = Math.round(10 + relSize * 14)
              const opacity = 0.5 + relSize * 0.5
              return (
                <span
                  key={word}
                  style={{ fontSize: `${size}px`, color: '#818cf8', opacity }}
                  className="font-medium"
                >
                  {word}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* All entries */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-300 flex-1">All Entries</h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="game-input text-sm"
            style={{ width: '180px' }}
          />
        </div>

        {filtered.map(e => {
          const tc = TOPIC_CONFIG[e.topic]
          const isExp = expanded === e.id
          const isRevealed = revealed.has(e.id)
          const preview = e.text.slice(0, 80) + (e.text.length > 80 ? '…' : '')
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${tc.color}` }}>
              <div
                className="p-3 cursor-pointer flex items-start gap-3"
                onClick={() => setExpanded(isExp ? null : e.id)}
              >
                <span className="text-lg mt-0.5">{tc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-slate-500">{e.date} {e.time}</span>
                    <span className="text-xs font-medium" style={{ color: tc.color }}>{tc.label}</span>
                    {e.private && <span className="text-xs">🔒</span>}
                    <span className="ml-auto text-xs text-slate-600 flex items-center gap-1">
                      {MOOD_EMOJI[e.mood]}{ENERGY_EMOJI[e.energy]}
                      <span className="text-slate-600">{e.wordCount}w</span>
                    </span>
                  </div>
                  <p
                    className="text-sm text-slate-300 transition-all"
                    style={e.private && !isRevealed ? { filter: 'blur(5px)', userSelect: 'none' } : {}}
                  >
                    {preview}
                  </p>
                  {e.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {e.tags.map(t => (
                        <span key={t} className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  <button
                    onClick={ev => { ev.stopPropagation(); persist(entries.filter(x => x.id !== e.id)) }}
                    className="p-1 text-slate-700 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {isExp && (
                <div className="border-t border-slate-700 px-4 pb-4 pt-3">
                  {e.private && !isRevealed ? (
                    <div className="text-center py-2">
                      <button
                        onClick={() => toggleReveal(e.id)}
                        className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs transition-colors"
                      >
                        🔒 Click to reveal private entry
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{e.text}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Mic className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="mb-2">No entries yet.</p>
            <p className="text-sm">Speak your mind — no structure, no judgment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
