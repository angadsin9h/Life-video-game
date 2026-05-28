import { useEffect, useState, useCallback } from 'react'
import {
  ClipboardList,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Smile,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StandupEntry {
  date: string
  yesterday: string[]
  today: string[]
  blockers: string[]
  mood: number    // 1-5
  energy: number  // 1-5
  wins: string
  savedAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'standup_history'
const entryKey = (date: string) => `standup_${date}`

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '😊', '😄']
const MOOD_LABELS = ['', 'Rough', 'Meh', 'Okay', 'Good', 'Great']
const MOOD_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']

const emptyEntry = (date: string): StandupEntry => ({
  date,
  yesterday: [],
  today: [],
  blockers: [],
  mood: 3,
  energy: 3,
  wins: '',
  savedAt: '',
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function shiftDateStr(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function dayLabel(date: string): string {
  const today = todayStr()
  if (date === today) return 'Today'
  const diff = Math.round(
    (new Date(date + 'T12:00:00').getTime() - new Date(today + 'T12:00:00').getTime()) / 86400000,
  )
  if (diff === -1) return 'Yesterday'
  if (diff === 1) return 'Tomorrow'
  return new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function loadEntry(date: string): StandupEntry | null {
  const raw = localStorage.getItem(entryKey(date))
  return raw ? (JSON.parse(raw) as StandupEntry) : null
}

function saveEntry(entry: StandupEntry): void {
  localStorage.setItem(entryKey(entry.date), JSON.stringify(entry))
  const historyRaw = localStorage.getItem(HISTORY_KEY)
  const history: string[] = historyRaw ? JSON.parse(historyRaw) : []
  if (!history.includes(entry.date)) {
    history.unshift(entry.date)
    history.sort((a, b) => b.localeCompare(a))
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }
}

function loadHistory(): string[] {
  const raw = localStorage.getItem(HISTORY_KEY)
  return raw ? JSON.parse(raw) : []
}

function formatAsText(entry: StandupEntry): string {
  const lines: string[] = [
    `Daily Standup — ${entry.date}`,
    '',
    '✅ Yesterday\'s Wins',
    ...(entry.yesterday.length ? entry.yesterday.map(l => `  • ${l}`) : ['  (none)']),
    '',
    '📋 Today\'s Plan',
    ...(entry.today.length ? entry.today.map(l => `  • ${l}`) : ['  (none)']),
    '',
    '🚧 Blockers & Obstacles',
    ...(entry.blockers.length ? entry.blockers.map(l => `  • ${l}`) : ['  (none)']),
    '',
    `⭐ Biggest Win: ${entry.wins || '(none)'}`,
    `😊 Mood: ${MOOD_LABELS[entry.mood]} (${entry.mood}/5)`,
    `⚡ Energy: ${entry.energy}/5`,
  ]
  return lines.join('\n')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface BulletSectionProps {
  title: string
  subtitle: string
  color: string
  items: string[]
  placeholder: string
  onAdd: (text: string) => void
  onRemove: (index: number) => void
}

function BulletSection({ title, subtitle, color, items, placeholder, onAdd, onRemove }: BulletSectionProps) {
  const [input, setInput] = useState('')

  const handleAdd = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInput('')
  }

  return (
    <div className="game-card p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-white text-sm" style={{ color }}>{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Existing items */}
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 group">
              <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="flex-1 text-sm text-slate-200">{item}</span>
              <button
                onClick={() => onRemove(idx)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                aria-label="Remove item"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="game-input flex-1 text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-2 rounded-xl text-white text-sm font-semibold transition-colors flex-shrink-0"
          style={{ background: color + '33', color, border: `1px solid ${color}66` }}
          aria-label="Add item"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

interface RatingPickerProps {
  value: number
  onChange: (v: number) => void
  icon: 'mood' | 'energy'
  label: string
}

function RatingPicker({ value, onChange, icon, label }: RatingPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 rounded-xl text-lg transition-all ${
              n <= value ? 'opacity-100 scale-105' : 'opacity-30 hover:opacity-60'
            }`}
            aria-label={`${label} ${n}`}
          >
            {icon === 'mood' ? MOOD_EMOJIS[n] : '⚡'}
          </button>
        ))}
      </div>
      <div className="text-center text-xs" style={{ color: icon === 'mood' ? MOOD_COLORS[value] : '#facc15' }}>
        {icon === 'mood' ? MOOD_LABELS[value] : `${value}/5 Energy`}
      </div>
    </div>
  )
}

interface HistoryCardProps {
  entry: StandupEntry
}

function HistoryCard({ entry }: HistoryCardProps) {
  const label = dayLabel(entry.date)
  const totalItems = entry.yesterday.length + entry.today.length
  const hasBlockers = entry.blockers.length > 0

  return (
    <div className="game-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          <span className="text-xs text-slate-500 ml-2">{entry.date}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span style={{ color: MOOD_COLORS[entry.mood] }}>{MOOD_EMOJIS[entry.mood]}</span>
          <span className="text-yellow-400">⚡{entry.energy}</span>
        </div>
      </div>

      {entry.wins && (
        <p className="text-xs text-slate-400 italic truncate">⭐ {entry.wins}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="text-emerald-400">{entry.yesterday.length} wins</span>
        <span className="text-blue-400">{entry.today.length} tasks</span>
        {hasBlockers && (
          <span className="text-orange-400">{entry.blockers.length} blocker{entry.blockers.length > 1 ? 's' : ''}</span>
        )}
        {!hasBlockers && <span className="text-slate-600">no blockers</span>}
        <span className="ml-auto">{totalItems} items</span>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function DailyStandup() {
  const { toastSuccess, toastError } = useToast()

  const [date, setDate] = useState(todayStr)
  const [entry, setEntry] = useState<StandupEntry>(() => loadEntry(todayStr()) ?? emptyEntry(todayStr()))
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  const isToday = date === todayStr()

  // Load entry whenever date changes
  useEffect(() => {
    setEntry(loadEntry(date) ?? emptyEntry(date))
    setSaved(!!loadEntry(date))
  }, [date])

  // Load history
  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  // ── Mutators ──────────────────────────────────────────────────────────────

  const updateEntry = useCallback((patch: Partial<StandupEntry>) => {
    setEntry(prev => ({ ...prev, ...patch }))
    setSaved(false)
  }, [])

  const addItem = useCallback((field: 'yesterday' | 'today' | 'blockers', text: string) => {
    setEntry(prev => ({ ...prev, [field]: [...prev[field], text] }))
    setSaved(false)
  }, [])

  const removeItem = useCallback((field: 'yesterday' | 'today' | 'blockers', index: number) => {
    setEntry(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
    setSaved(false)
  }, [])

  // ── Persistence ───────────────────────────────────────────────────────────

  const handleSave = () => {
    const toSave: StandupEntry = { ...entry, savedAt: new Date().toISOString() }
    saveEntry(toSave)
    setEntry(toSave)
    setSaved(true)
    setHistory(loadHistory())
    toastSuccess('Standup saved!', `${date} logged`)
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatAsText(entry))
      setCopied(true)
      toastSuccess('Copied!', 'Standup copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toastError('Copy failed', 'Could not access clipboard')
    }
  }

  // ── Date navigation ───────────────────────────────────────────────────────

  const goTo = (d: string) => setDate(d)
  const prev = () => goTo(shiftDateStr(date, -1))
  const next = () => { if (!isToday) goTo(shiftDateStr(date, 1)) }

  // ── Stats (rolling 7-day) ─────────────────────────────────────────────────

  const historyEntries: StandupEntry[] = history
    .slice(0, 7)
    .map(d => loadEntry(d))
    .filter((e): e is StandupEntry => e !== null)

  const avgMood =
    historyEntries.length > 0
      ? (historyEntries.reduce((sum, e) => sum + e.mood, 0) / historyEntries.length).toFixed(1)
      : '—'

  const blockerDays = historyEntries.filter(e => e.blockers.length > 0).length
  const blockerPct =
    historyEntries.length > 0
      ? Math.round((blockerDays / historyEntries.length) * 100)
      : 0

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <ClipboardList className="w-7 h-7 text-cyan-400" />
            Daily Standup
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Yesterday · Today · Blockers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            title="Copy standup as text"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-600/20 text-green-400 border border-green-500/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {saved ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {/* ── Date navigation ── */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div className="font-bold text-white">{dayLabel(date)}</div>
          <div className="text-xs text-slate-500">{date}</div>
          {!isToday && (
            <button
              onClick={() => goTo(todayStr())}
              className="mt-1 text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              Jump to today
            </button>
          )}
        </div>
        <button
          onClick={next}
          disabled={isToday}
          className="p-2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* ── Yesterday's Wins ── */}
      <BulletSection
        title="✅ Yesterday's Wins"
        subtitle="What did you accomplish?"
        color="#22c55e"
        items={entry.yesterday}
        placeholder="I shipped the auth flow..."
        onAdd={text => addItem('yesterday', text)}
        onRemove={idx => removeItem('yesterday', idx)}
      />

      {/* ── Today's Plan ── */}
      <BulletSection
        title="📋 Today's Plan"
        subtitle="What will you work on?"
        color="#3b82f6"
        items={entry.today}
        placeholder="Review PRs, write tests..."
        onAdd={text => addItem('today', text)}
        onRemove={idx => removeItem('today', idx)}
      />

      {/* ── Blockers ── */}
      <BulletSection
        title="🚧 Blockers & Obstacles"
        subtitle="What's slowing you down or blocking progress?"
        color="#f97316"
        items={entry.blockers}
        placeholder="Waiting on design review..."
        onAdd={text => addItem('blockers', text)}
        onRemove={idx => removeItem('blockers', idx)}
      />

      {/* ── Mood + Energy ── */}
      <div className="game-card p-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-1 mb-3">
              <Smile className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">Mood</span>
            </div>
            <RatingPicker
              value={entry.mood}
              onChange={v => updateEntry({ mood: v })}
              icon="mood"
              label="Mood"
            />
          </div>
          <div>
            <div className="flex items-center gap-1 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">Energy</span>
            </div>
            <RatingPicker
              value={entry.energy}
              onChange={v => updateEntry({ energy: v })}
              icon="energy"
              label="Energy"
            />
          </div>
        </div>
      </div>

      {/* ── Daily Win ── */}
      <div className="game-card p-4 space-y-2">
        <label className="text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          ⭐ <span>Daily Win</span>
          <span className="normal-case text-slate-600 ml-1">— the single biggest win of the day</span>
        </label>
        <input
          value={entry.wins}
          onChange={e => updateEntry({ wins: e.target.value })}
          placeholder="My biggest win today was..."
          className="game-input w-full"
        />
      </div>

      {/* ── Stats (7-day rolling) ── */}
      {historyEntries.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-xs text-slate-400 uppercase tracking-wider mb-3">7-Day Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace', color: '#facc15' }}>
                {avgMood}
              </div>
              <div className="text-xs text-slate-500 mt-1">Avg Mood</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold text-cyan-400"
                style={{ fontFamily: 'Orbitron, monospace' }}
              >
                {historyEntries.length}
              </div>
              <div className="text-xs text-slate-500 mt-1">Entries</div>
            </div>
            <div className="text-center">
              <div
                className="text-2xl font-bold"
                style={{
                  fontFamily: 'Orbitron, monospace',
                  color: blockerPct > 50 ? '#f97316' : blockerPct > 0 ? '#eab308' : '#22c55e',
                }}
              >
                {blockerPct}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Days w/ Blockers</div>
            </div>
          </div>

          {/* Mood sparkline dots */}
          <div className="mt-4">
            <div className="text-xs text-slate-600 mb-1.5">Mood trend (oldest → newest)</div>
            <div className="flex items-end gap-1 h-8">
              {[...historyEntries].reverse().map((e, i) => (
                <div
                  key={i}
                  title={`${e.date}: ${MOOD_LABELS[e.mood]}`}
                  className="flex-1 rounded-sm transition-all"
                  style={{
                    height: `${(e.mood / 5) * 100}%`,
                    minHeight: '4px',
                    background: MOOD_COLORS[e.mood],
                    opacity: 0.8,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs text-slate-400 uppercase tracking-wider">Recent Standups</h3>
          {history.slice(0, 7).map(d => {
            const e = loadEntry(d)
            return e ? <HistoryCard key={d} entry={e} /> : null
          })}
        </div>
      )}

      {/* ── Empty state ── */}
      {history.length === 0 && entry.yesterday.length === 0 && entry.today.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No standups yet.</p>
          <p className="text-sm mt-1">Start by logging what you did yesterday and what's planned for today.</p>
        </div>
      )}
    </div>
  )
}
