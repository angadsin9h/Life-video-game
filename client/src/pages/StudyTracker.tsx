import { useEffect, useState, useMemo } from 'react'
import {
  BookOpen, Plus, Trash2, Clock, Star, Brain,
  BarChart3, ChevronDown, Check, AlertCircle,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface StudySession {
  id: string
  subject: string
  topic: string
  duration: number  // minutes
  date: string
  comprehension: number  // 1-5
  method: string  // 'active recall' | 'notes' | 'practice problems' | 'reading' | 'video' | 'flashcards'
  notes: string
}

interface Subject {
  id: string
  name: string
  color: string
  totalMinutes: number
  lastStudied: string
  nextReview: string  // date string, spaced repetition
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'study_tracker'

const SUBJECT_COLORS = [
  { label: 'Violet',  value: '#8b5cf6' },
  { label: 'Blue',    value: '#3b82f6' },
  { label: 'Cyan',    value: '#06b6d4' },
  { label: 'Green',   value: '#22c55e' },
  { label: 'Yellow',  value: '#eab308' },
  { label: 'Orange',  value: '#f97316' },
  { label: 'Rose',    value: '#f43f5e' },
  { label: 'Pink',    value: '#ec4899' },
]

const METHODS = [
  'active recall',
  'notes',
  'practice problems',
  'reading',
  'video',
  'flashcards',
] as const

type Method = typeof METHODS[number]

// days until next review based on comprehension (1-5)
const REVIEW_DAYS: Record<number, number> = {
  5: 7,
  4: 3,
  3: 1,
  2: 1,   // tomorrow
  1: 0,   // same day
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function calcNextReview(dateStr: string, comprehension: number): string {
  const days = REVIEW_DAYS[comprehension] ?? 1
  return addDays(dateStr, days)
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function startOfWeek(): string {
  const d = new Date()
  const day = d.getDay()          // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day  // Mon as start
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

// ─── Persistence ─────────────────────────────────────────────────────────────

interface StoreData {
  subjects: Subject[]
  sessions: StudySession[]
}

function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoreData
  } catch { /* ignore */ }
  return { subjects: [], sessions: [] }
}

function saveStore(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`transition-transform ${readonly ? '' : 'hover:scale-125'}`}
        >
          <Star
            className="w-5 h-5"
            fill={n <= value ? '#eab308' : 'none'}
            stroke={n <= value ? '#eab308' : '#475569'}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StudyTracker() {
  const { toastSuccess, toastError } = useToast()
  const todayStr = today()

  // ── State ──────────────────────────────────────────────────────────────────

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])

  // Section open/closed
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showLogSession, setShowLogSession] = useState(false)
  const [showChart, setShowChart] = useState(true)

  // Add-subject form
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0].value)

  // Log-session form
  const [sessionForm, setSessionForm] = useState<{
    subjectId: string
    topic: string
    duration: number
    comprehension: number
    method: Method
    notes: string
  }>({
    subjectId: '',
    topic: '',
    duration: 30,
    comprehension: 3,
    method: 'active recall',
    notes: '',
  })

  // ── Load / Persist ─────────────────────────────────────────────────────────

  useEffect(() => {
    const data = loadStore()
    setSubjects(data.subjects)
    setSessions(data.sessions)
  }, [])

  function persist(nextSubjects: Subject[], nextSessions: StudySession[]) {
    setSubjects(nextSubjects)
    setSessions(nextSessions)
    saveStore({ subjects: nextSubjects, sessions: nextSessions })
  }

  // ── Subject management ─────────────────────────────────────────────────────

  function addSubject() {
    const name = newSubjectName.trim()
    if (!name) { toastError('Enter a subject name'); return }
    if (subjects.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      toastError('Subject already exists')
      return
    }
    const s: Subject = {
      id: Date.now().toString(),
      name,
      color: newSubjectColor,
      totalMinutes: 0,
      lastStudied: '',
      nextReview: '',
    }
    persist([...subjects, s], sessions)
    setNewSubjectName('')
    setNewSubjectColor(SUBJECT_COLORS[0].value)
    setShowAddSubject(false)
    toastSuccess(`Subject "${name}" added!`)
  }

  function deleteSubject(id: string) {
    const nextSubjects = subjects.filter(s => s.id !== id)
    const nextSessions = sessions.filter(s => s.subject !== id)
    persist(nextSubjects, nextSessions)
    toastSuccess('Subject removed')
  }

  // ── Session logging ────────────────────────────────────────────────────────

  function logSession() {
    if (!sessionForm.subjectId) { toastError('Pick a subject'); return }
    if (!sessionForm.topic.trim()) { toastError('Enter a topic'); return }

    const newSession: StudySession = {
      id: Date.now().toString(),
      subject: sessionForm.subjectId,
      topic: sessionForm.topic.trim(),
      duration: sessionForm.duration,
      date: todayStr,
      comprehension: sessionForm.comprehension,
      method: sessionForm.method,
      notes: sessionForm.notes.trim(),
    }

    const nextReview = calcNextReview(todayStr, sessionForm.comprehension)

    const nextSubjects = subjects.map(s => {
      if (s.id !== sessionForm.subjectId) return s
      return {
        ...s,
        totalMinutes: s.totalMinutes + sessionForm.duration,
        lastStudied: todayStr,
        nextReview,
      }
    })

    const nextSessions = [newSession, ...sessions]
    persist(nextSubjects, nextSessions)

    // Reset form (keep subject selected for convenience)
    setSessionForm(f => ({
      ...f,
      topic: '',
      duration: 30,
      comprehension: 3,
      method: 'active recall',
      notes: '',
    }))
    setShowLogSession(false)

    const subjectName = subjects.find(s => s.id === sessionForm.subjectId)?.name ?? ''
    toastSuccess(
      `Session logged! (${formatDuration(sessionForm.duration)})`,
      `${subjectName} — next review ${nextReview === todayStr ? 'today' : nextReview}`,
    )
  }

  // ── Derived stats ──────────────────────────────────────────────────────────

  const weekStart = startOfWeek()

  const stats = useMemo(() => {
    const weekSessions = sessions.filter(s => s.date >= weekStart)
    const weekMinutes = weekSessions.reduce((acc, s) => acc + s.duration, 0)

    const minutesBySubject: Record<string, number> = {}
    sessions.forEach(s => {
      minutesBySubject[s.subject] = (minutesBySubject[s.subject] ?? 0) + s.duration
    })
    const mostStudiedId = Object.entries(minutesBySubject).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
    const mostStudied = subjects.find(s => s.id === mostStudiedId)?.name ?? '—'

    const avgComp = sessions.length > 0
      ? sessions.reduce((acc, s) => acc + s.comprehension, 0) / sessions.length
      : 0

    return { weekMinutes, mostStudied, avgComp, totalSessions: sessions.length }
  }, [sessions, subjects, weekStart])

  const dueSubjects = useMemo(
    () => subjects.filter(s => s.nextReview && s.nextReview <= todayStr),
    [subjects, todayStr],
  )

  // Bar chart data — time per subject
  const chartData = useMemo(() => {
    const rows = subjects
      .filter(s => s.totalMinutes > 0)
      .map(s => ({ subject: s, minutes: s.totalMinutes }))
      .sort((a, b) => b.minutes - a.minutes)
    const max = rows[0]?.minutes ?? 1
    return rows.map(r => ({ ...r, pct: r.minutes / max }))
  }, [subjects])

  // Method breakdown
  const methodBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    sessions.forEach(s => { counts[s.method] = (counts[s.method] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [sessions])

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedSubject = subjects.find(s => s.id === sessionForm.subjectId)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <BookOpen className="w-7 h-7 text-violet-400" />
            Study Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Spaced repetition for peak retention
          </p>
        </div>
        <button
          onClick={() => { setShowLogSession(v => !v); setShowAddSubject(false) }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {formatDuration(stats.weekMinutes)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">This week</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-blue-400 truncate" title={stats.mostStudied}>
            {stats.mostStudied}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Top subject</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="flex justify-center mt-0.5">
            {stats.avgComp > 0 ? (
              <StarRating value={Math.round(stats.avgComp)} readonly />
            ) : (
              <span className="text-lg font-bold text-slate-500">—</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">Avg comprehension</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {stats.totalSessions}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Sessions</div>
        </div>
      </div>

      {/* ── Due for Review ─────────────────────────────────────────────────── */}
      {dueSubjects.length > 0 && (
        <div className="game-card p-4 border border-amber-500/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">
              Due for Review ({dueSubjects.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dueSubjects.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSessionForm(f => ({ ...f, subjectId: s.id }))
                  setShowLogSession(true)
                  setShowAddSubject(false)
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: s.color + '22', color: s.color, border: `1px solid ${s.color}66` }}
              >
                <Brain className="w-3 h-3" />
                {s.name}
                {s.nextReview === todayStr && (
                  <span className="ml-1 text-[9px] text-amber-400">(today)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Log Session form ───────────────────────────────────────────────── */}
      {showLogSession && (
        <div className="game-card p-5 space-y-4 border border-violet-500/30">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            Log Study Session
          </h3>

          {/* Subject picker */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Subject *</label>
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                No subjects yet — add one below first.
              </p>
            ) : (
              <div className="relative">
                <select
                  value={sessionForm.subjectId}
                  onChange={e => setSessionForm(f => ({ ...f, subjectId: e.target.value }))}
                  className="game-input w-full text-sm appearance-none pr-8"
                >
                  <option value="">Pick a subject…</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            )}
            {selectedSubject && (
              <div
                className="mt-1.5 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: selectedSubject.color + '22',
                  color: selectedSubject.color,
                  border: `1px solid ${selectedSubject.color}55`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: selectedSubject.color }}
                />
                {selectedSubject.name}
              </div>
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Topic *</label>
            <input
              className="game-input w-full text-sm"
              placeholder="e.g. Recursion, French verbs, Photosynthesis…"
              value={sessionForm.topic}
              onChange={e => setSessionForm(f => ({ ...f, topic: e.target.value }))}
            />
          </div>

          {/* Duration slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-400">Duration</label>
              <span className="text-xs font-bold text-violet-400">
                {formatDuration(sessionForm.duration)}
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={sessionForm.duration}
              onChange={e => setSessionForm(f => ({ ...f, duration: +e.target.value }))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
              <span>5m</span>
              <span>1h</span>
              <span>3h</span>
            </div>
          </div>

          {/* Comprehension stars */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Comprehension</label>
            <div className="flex items-center gap-3">
              <StarRating
                value={sessionForm.comprehension}
                onChange={v => setSessionForm(f => ({ ...f, comprehension: v }))}
              />
              <span className="text-xs text-slate-500">
                {['', 'Very low', 'Low', 'Okay', 'Good', 'Mastered'][sessionForm.comprehension]}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Next review in{' '}
              {REVIEW_DAYS[sessionForm.comprehension] === 0
                ? 'a few hours (today)'
                : REVIEW_DAYS[sessionForm.comprehension] === 1
                ? '1 day'
                : `${REVIEW_DAYS[sessionForm.comprehension]} days`}
            </p>
          </div>

          {/* Method chips */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Study Method</label>
            <div className="flex flex-wrap gap-1.5">
              {METHODS.map(m => {
                const active = sessionForm.method === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSessionForm(f => ({ ...f, method: m }))}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={
                      active
                        ? { background: '#8b5cf633', color: '#a78bfa', border: '1px solid #8b5cf6' }
                        : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                    }
                  >
                    {active && <Check className="w-3 h-3" />}
                    {m}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Notes (optional)</label>
            <textarea
              className="game-input w-full h-16 resize-none text-sm"
              placeholder="Key takeaways, questions, things to revisit…"
              value={sessionForm.notes}
              onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={logSession}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Log Session
            </button>
            <button
              onClick={() => setShowLogSession(false)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Subjects ───────────────────────────────────────────────────────── */}
      <div className="game-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Subjects ({subjects.length})
          </span>
          <button
            onClick={() => { setShowAddSubject(v => !v); setShowLogSession(false) }}
            className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add subject
          </button>
        </div>

        {/* Add subject inline form */}
        {showAddSubject && (
          <div className="mb-4 p-3 bg-slate-900/60 rounded-xl space-y-3 border border-slate-700">
            <input
              className="game-input w-full text-sm"
              placeholder="Subject name…"
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()}
            />
            <div>
              <div className="text-xs text-slate-500 mb-1.5">Color</div>
              <div className="flex gap-2 flex-wrap">
                {SUBJECT_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewSubjectColor(c.value)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c.value,
                      outline: newSubjectColor === c.value ? `2px solid ${c.value}` : 'none',
                      outlineOffset: '2px',
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addSubject}
                className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddSubject(false)}
                className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {subjects.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-4">
            No subjects yet. Add your first one!
          </p>
        ) : (
          <div className="space-y-2">
            {subjects.map(s => {
              const isDue = s.nextReview && s.nextReview <= todayStr
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-slate-700/30"
                >
                  {/* Color badge */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: s.color }}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-200">{s.name}</span>
                      {isDue && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          review due
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.totalMinutes > 0 ? formatDuration(s.totalMinutes) : '—'}
                      </span>
                      {s.lastStudied && (
                        <span>last: {s.lastStudied}</span>
                      )}
                      {s.nextReview && (
                        <span style={{ color: isDue ? '#f59e0b' : '#64748b' }}>
                          next: {s.nextReview}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteSubject(s.id)}
                    className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Bar chart: time per subject ─────────────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="game-card p-4">
          <button
            className="w-full flex items-center justify-between mb-4"
            onClick={() => setShowChart(v => !v)}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Time per Subject
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 transition-transform ${showChart ? '' : '-rotate-90'}`}
            />
          </button>
          {showChart && (
            <svg
              width="100%"
              viewBox={`0 0 400 ${Math.max(60, chartData.length * 36)}`}
              className="overflow-visible"
              aria-label="Study time per subject"
            >
              {chartData.map((row, i) => {
                const y = i * 36
                const barW = Math.round(row.pct * 280)
                return (
                  <g key={row.subject.id}>
                    {/* Label */}
                    <text
                      x={0}
                      y={y + 16}
                      fill="#94a3b8"
                      fontSize={11}
                      fontFamily="Exo 2, sans-serif"
                    >
                      {row.subject.name.length > 14
                        ? row.subject.name.slice(0, 13) + '…'
                        : row.subject.name}
                    </text>
                    {/* Background track */}
                    <rect
                      x={0}
                      y={y + 22}
                      width={280}
                      height={10}
                      rx={5}
                      fill="#1e293b"
                    />
                    {/* Filled bar */}
                    <rect
                      x={0}
                      y={y + 22}
                      width={barW}
                      height={10}
                      rx={5}
                      fill={row.subject.color}
                      opacity={0.85}
                    />
                    {/* Duration label */}
                    <text
                      x={barW + 6}
                      y={y + 32}
                      fill={row.subject.color}
                      fontSize={10}
                      fontFamily="Orbitron, monospace"
                    >
                      {formatDuration(row.minutes)}
                    </text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>
      )}

      {/* ── Method Breakdown ─────────────────────────────────────────────────── */}
      {methodBreakdown.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Method Breakdown
            </span>
          </div>
          <div className="space-y-2">
            {methodBreakdown.map(([method, count]) => {
              const pct = count / (methodBreakdown[0]?.[1] ?? 1)
              return (
                <div key={method} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-28 capitalize">{method}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-6 text-right">{count}×</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent Sessions ───────────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <div className="game-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Recent Sessions
            </span>
          </div>
          <div className="space-y-0">
            {sessions.slice(0, 10).map((sess, idx) => {
              const sub = subjects.find(s => s.id === sess.subject)
              return (
                <div
                  key={sess.id}
                  className={`flex items-start gap-3 py-3 ${
                    idx < Math.min(9, sessions.length - 1) ? 'border-b border-slate-800' : ''
                  }`}
                >
                  {/* Color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: sub?.color ?? '#64748b' }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                      <span className="text-sm font-semibold text-slate-200 truncate">
                        {sess.topic}
                      </span>
                      {sub && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: sub.color + '22',
                            color: sub.color,
                            border: `1px solid ${sub.color}44`,
                          }}
                        >
                          {sub.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatDuration(sess.duration)}
                      </span>
                      <span className="text-xs text-slate-600 capitalize">{sess.method}</span>
                      <span className="text-xs text-slate-600">{sess.date}</span>
                    </div>
                    {sess.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic truncate">{sess.notes}</p>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex-shrink-0">
                    <StarRating value={sess.comprehension} readonly />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {subjects.length === 0 && sessions.length === 0 && !showAddSubject && !showLogSession && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-base mb-1">No study data yet.</p>
          <p className="text-sm mb-5">Add a subject and start logging sessions to track your progress.</p>
          <button
            onClick={() => setShowAddSubject(true)}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Add First Subject
          </button>
        </div>
      )}
    </div>
  )
}
