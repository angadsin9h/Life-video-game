import { useState, useEffect } from 'react'
import { Mail, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle, Calendar, Clock, Star, MessageSquare } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'future_self_letters'

type Timeframe = '1year' | '5years' | '10years' | 'custom'
type Mood = 'hopeful' | 'excited' | 'grateful' | 'reflective' | 'determined'

interface FutureLetter {
  id: string
  writtenDate: string
  targetDate: string
  timeframe: Timeframe
  subject: string
  body: string
  sealed: boolean
  opened: boolean
  mood: Mood
}

const MOOD_CONFIG: Record<Mood, { label: string; emoji: string; color: string }> = {
  hopeful:     { label: 'Hopeful',     emoji: '🌟', color: '#f59e0b' },
  excited:     { label: 'Excited',     emoji: '🚀', color: '#6366f1' },
  grateful:    { label: 'Grateful',    emoji: '🙏', color: '#22c55e' },
  reflective:  { label: 'Reflective',  emoji: '🌊', color: '#3b82f6' },
  determined:  { label: 'Determined',  emoji: '🔥', color: '#ef4444' },
}

const TIMEFRAME_CONFIG: Record<Timeframe, { label: string; years: number | null }> = {
  '1year':   { label: '1 Year',   years: 1 },
  '5years':  { label: '5 Years',  years: 5 },
  '10years': { label: '10 Years', years: 10 },
  custom:    { label: 'Custom',   years: null },
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().split('T')[0]
}

function daysUntil(targetDate: string): number {
  const now = new Date(today())
  const target = new Date(targetDate)
  return Math.ceil((target.getTime() - now.getTime()) / 86400000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

type FormState = {
  timeframe: Timeframe
  customDate: string
  subject: string
  body: string
  mood: Mood
  sealed: boolean
}

const DEFAULT_FORM: FormState = {
  timeframe: '1year',
  customDate: '',
  subject: '',
  body: '',
  mood: 'hopeful',
  sealed: true,
}

// ── SVG Timeline ──────────────────────────────────────────────────────────────
function LetterTimeline({ letters }: { letters: FutureLetter[] }) {
  if (letters.length === 0) return null

  const todayStr = today()
  const todayMs = new Date(todayStr).getTime()

  // Collect all dates: today + all target dates
  const allDates = [todayStr, ...letters.map(l => l.targetDate)].sort()
  const minMs = new Date(allDates[0]).getTime()
  const maxMs = new Date(allDates[allDates.length - 1]).getTime()
  const rangeMs = Math.max(maxMs - minMs, 1)

  const W = 600
  const H = 80
  const PAD = 40

  function xForDate(dateStr: string): number {
    const ms = new Date(dateStr).getTime()
    return PAD + ((ms - minMs) / rangeMs) * (W - PAD * 2)
  }

  const uniqueTargets = [...new Set(letters.map(l => l.targetDate))].sort()

  return (
    <div className="game-card p-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" /> Timeline
      </h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: '300px', height: `${H}px` }}>
          {/* Base line */}
          <line x1={PAD} y1={40} x2={W - PAD} y2={40} stroke="#334155" strokeWidth={2} strokeLinecap="round" />

          {/* Today point */}
          <circle cx={xForDate(todayStr)} cy={40} r={6} fill="#6366f1" />
          <text x={xForDate(todayStr)} y={28} textAnchor="middle" fill="#94a3b8" fontSize={10}>Today</text>

          {/* Letter target points */}
          {uniqueTargets.map((dateStr, i) => {
            const x = xForDate(dateStr)
            const isPast = new Date(dateStr) <= new Date(todayStr)
            const color = isPast ? '#22c55e' : '#a855f7'
            const offset = i % 2 === 0 ? 60 : 16
            return (
              <g key={dateStr}>
                <circle cx={x} cy={40} r={5} fill={color} />
                <line x1={x} y1={40} x2={x} y2={offset + 4} stroke={color} strokeWidth={1} strokeDasharray="3,2" />
                <text x={x} y={offset} textAnchor="middle" fill={color} fontSize={9}>
                  {formatDate(dateStr)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function FutureSelfLetter() {
  const { toastSuccess } = useToast()
  const [letters, setLetters] = useState<FutureLetter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setLetters(JSON.parse(raw) as FutureLetter[])
    } catch { /**/ }
  }, [])

  const persist = (updated: FutureLetter[]) => {
    setLetters(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const getTargetDate = (): string => {
    if (form.timeframe === 'custom') return form.customDate || today()
    const years = TIMEFRAME_CONFIG[form.timeframe].years as number
    return addYears(today(), years)
  }

  const handleSubmit = () => {
    if (!form.subject.trim() || !form.body.trim()) return
    const letter: FutureLetter = {
      id: Date.now().toString(),
      writtenDate: today(),
      targetDate: getTargetDate(),
      timeframe: form.timeframe,
      subject: form.subject.trim(),
      body: form.body.trim(),
      sealed: form.sealed,
      opened: false,
      mood: form.mood,
    }
    persist([letter, ...letters])
    setForm(DEFAULT_FORM)
    setShowForm(false)
    toastSuccess('Letter sealed & saved to vault ✉️')
  }

  const openLetter = (id: string) => {
    persist(letters.map(l => l.id === id ? { ...l, opened: true, sealed: false } : l))
    toastSuccess('Letter unsealed! Read your past self\'s words.')
  }

  const deleteLetter = (id: string) => {
    persist(letters.filter(l => l.id !== id))
    toastSuccess('Letter removed from vault.')
  }

  const todayStr = today()
  const sealed = letters.filter(l => l.sealed && new Date(l.targetDate) > new Date(todayStr)).length
  const available = letters.filter(l => new Date(l.targetDate) <= new Date(todayStr) && !l.opened).length
  const oldest = letters.length > 0
    ? letters.reduce((a, b) => a.writtenDate < b.writtenDate ? a : b).writtenDate
    : null

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Mail className="w-7 h-7 text-violet-400" />
            Future Self Letters
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Seal messages to your future self — opened only when the time comes.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Write
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{letters.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total Letters</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-violet-400">{sealed}</div>
          <div className="text-xs text-slate-500 mt-0.5">Sealed</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{available}</div>
          <div className="text-xs text-slate-500 mt-0.5">Ready to Open</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-sm font-bold text-slate-300 mt-1">{oldest ? formatDate(oldest) : '—'}</div>
          <div className="text-xs text-slate-500 mt-0.5">Oldest Letter</div>
        </div>
      </div>

      {/* Write Form */}
      {showForm && (
        <div className="game-card p-5 border border-violet-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" /> Write a New Letter
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Timeframe</label>
            <div className="flex gap-2 flex-wrap">
              {(['1year', '5years', '10years', 'custom'] as Timeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setForm(f => ({ ...f, timeframe: tf }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    form.timeframe === tf
                      ? 'bg-violet-700 border-violet-500 text-white'
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {TIMEFRAME_CONFIG[tf].label}
                </button>
              ))}
            </div>
            {form.timeframe !== 'custom' && (
              <p className="text-xs text-slate-500 mt-1.5">
                Opens on: <span className="text-violet-300">{formatDate(getTargetDate())}</span>
              </p>
            )}
          </div>

          {/* Custom date */}
          {form.timeframe === 'custom' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Target Date</label>
              <input
                type="date"
                value={form.customDate}
                min={today()}
                onChange={e => setForm(f => ({ ...f, customDate: e.target.value }))}
                className="game-input w-full"
              />
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Subject Line</label>
            <input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. 'A reminder about what matters most'"
              className="game-input w-full"
              autoFocus
            />
          </div>

          {/* Mood selector */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Mood when writing</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(MOOD_CONFIG) as [Mood, typeof MOOD_CONFIG.hopeful][]).map(([k, m]) => (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, mood: k }))}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    form.mood === k
                      ? 'text-white border-opacity-80'
                      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                  style={form.mood === k ? { background: m.color + '30', borderColor: m.color, color: m.color } : {}}
                >
                  <span>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">Letter Body</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Dear future me,&#10;&#10;I'm writing this because..."
              className="game-input w-full resize-none text-sm leading-relaxed"
              rows={8}
            />
          </div>

          {/* Seal toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setForm(f => ({ ...f, sealed: !f.sealed }))}
              className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${form.sealed ? 'bg-violet-600' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.sealed ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-slate-300">Seal letter (hide body until target date)</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={!form.subject.trim() || !form.body.trim()}
              className="flex-1 py-2.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {form.sealed ? '🔒 Seal & Save' : '💾 Save Letter'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }}
              className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {letters.length > 0 && <LetterTimeline letters={letters} />}

      {/* Letters Vault */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Star className="w-4 h-4" /> Letters Vault
        </h2>

        {letters.length === 0 && !showForm && (
          <div className="game-card py-16 text-center">
            <Mail className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-40" />
            <p className="text-slate-500 text-sm">No letters yet. Write your first one to your future self.</p>
          </div>
        )}

        {letters.map(letter => {
          const mood = MOOD_CONFIG[letter.mood]
          const days = daysUntil(letter.targetDate)
          const isSealed = letter.sealed && days > 0
          const canOpen = !letter.opened && days <= 0
          const isExpanded = expanded === letter.id

          return (
            <div
              key={letter.id}
              className="game-card overflow-hidden"
              style={{ borderLeft: `3px solid ${mood.color}` }}
            >
              {/* Card header — always visible */}
              <div
                className="p-4 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : letter.id)}
              >
                <span className="text-2xl mt-0.5 flex-shrink-0">{isSealed ? '🔒' : '📬'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white text-sm">{letter.subject || 'Untitled Letter'}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: mood.color + '20', color: mood.color }}
                    >
                      {mood.emoji} {mood.label}
                    </span>
                    {letter.opened && (
                      <span className="flex items-center gap-0.5 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" /> Opened
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Written {formatDate(letter.writtenDate)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {isSealed
                        ? <span className="text-violet-400">Opens in {days} day{days !== 1 ? 's' : ''} · {formatDate(letter.targetDate)}</span>
                        : canOpen
                          ? <span className="text-green-400 font-semibold">Ready to open!</span>
                          : <span>Opens {formatDate(letter.targetDate)}</span>
                      }
                    </span>
                  </div>
                </div>
                <span className="text-slate-600 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-slate-700 p-4 space-y-3">
                  {isSealed ? (
                    <div className="text-center py-6 space-y-2">
                      <div className="text-4xl">🔒</div>
                      <p className="text-slate-400 text-sm">This letter is sealed.</p>
                      <p className="text-violet-300 text-sm font-medium">Opens on {formatDate(letter.targetDate)}</p>
                      <div className="inline-flex items-center gap-1.5 bg-violet-900/30 border border-violet-500/30 rounded-lg px-3 py-1.5 text-violet-300 text-xs">
                        <Clock className="w-3.5 h-3.5" /> {days} day{days !== 1 ? 's' : ''} remaining
                      </div>
                    </div>
                  ) : (
                    <>
                      {canOpen && !letter.opened && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 flex items-center justify-between gap-3">
                          <span className="text-green-400 text-sm font-medium">The time has come — your past self wrote this for you.</span>
                          <button
                            onClick={() => openLetter(letter.id)}
                            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                          >
                            Open Seal
                          </button>
                        </div>
                      )}
                      <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{letter.body}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {TIMEFRAME_CONFIG[letter.timeframe].label} · {formatDate(letter.writtenDate)}
                        </span>
                        <button
                          onClick={() => deleteLetter(letter.id)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                          title="Delete letter"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                  {isSealed && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => deleteLetter(letter.id)}
                        className="text-slate-700 hover:text-red-400 transition-colors"
                        title="Delete letter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
