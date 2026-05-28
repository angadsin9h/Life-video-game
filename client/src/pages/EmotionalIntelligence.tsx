import { useEffect, useState, useMemo } from 'react'
import {
  Brain, Plus, Trash2, Heart, BarChart3, TrendingUp, Star, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

type EmotionName =
  | 'Joy' | 'Sadness' | 'Anger' | 'Fear' | 'Disgust' | 'Surprise'
  | 'Anticipation' | 'Trust' | 'Anxiety' | 'Shame' | 'Pride'
  | 'Love' | 'Envy' | 'Guilt'

interface EQLog {
  id: string
  date: string
  trigger: string
  emotion: EmotionName
  intensity: number        // 1–10
  physicalSensations: string
  initialReaction: string
  chosenResponse: string
  reflection: string
}

interface EQAssessment {
  month: string            // YYYY-MM
  selfAwareness: number    // 1–10
  selfRegulation: number
  motivation: number
  empathy: number
  socialSkills: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'eq_journal'
const ASSESSMENT_KEY = 'eq_assessments'

const EMOTIONS: { name: EmotionName; color: string }[] = [
  { name: 'Joy', color: '#facc15' },
  { name: 'Love', color: '#f43f5e' },
  { name: 'Pride', color: '#fb923c' },
  { name: 'Anticipation', color: '#f97316' },
  { name: 'Trust', color: '#22c55e' },
  { name: 'Surprise', color: '#a78bfa' },
  { name: 'Sadness', color: '#60a5fa' },
  { name: 'Fear', color: '#818cf8' },
  { name: 'Anxiety', color: '#c084fc' },
  { name: 'Anger', color: '#ef4444' },
  { name: 'Disgust', color: '#84cc16' },
  { name: 'Shame', color: '#f472b6' },
  { name: 'Guilt', color: '#94a3b8' },
  { name: 'Envy', color: '#34d399' },
]

const EMOTION_COLOR: Record<EmotionName, string> = Object.fromEntries(
  EMOTIONS.map(e => [e.name, e.color])
) as Record<EmotionName, string>

const EQ_SKILLS = [
  { key: 'selfAwareness' as const, label: 'Self-Awareness', desc: 'Recognizing your own emotions and their impact' },
  { key: 'selfRegulation' as const, label: 'Self-Regulation', desc: 'Managing disruptive emotions and impulses' },
  { key: 'motivation' as const, label: 'Motivation', desc: 'Inner drive beyond money or status' },
  { key: 'empathy' as const, label: 'Empathy', desc: 'Understanding others\' emotional makeup' },
  { key: 'socialSkills' as const, label: 'Social Skills', desc: 'Managing relationships and building networks' },
]

const INTENSITY_COLORS = ['', '#22c55e', '#4ade80', '#84cc16', '#facc15', '#fbbf24', '#fb923c', '#f97316', '#ef4444', '#dc2626', '#b91c1c']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadLogs(): EQLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as EQLog[]) : []
  } catch { return [] }
}

function saveLogs(logs: EQLog[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

function loadAssessments(): EQAssessment[] {
  try {
    const raw = localStorage.getItem(ASSESSMENT_KEY)
    return raw ? (JSON.parse(raw) as EQAssessment[]) : []
  } catch { return [] }
}

function saveAssessments(list: EQAssessment[]): void {
  localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(list))
}

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function topWords(texts: string[], topN = 5): { word: string; count: number }[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'my', 'i', 'me', 'was', 'is', 'it', 'that', 'this', 'when', 'by', 'as',
    'so', 'if', 'be', 'are', 'had', 'have', 'not', 'about', 'from', 'his', 'her', 'their'])
  const freq: Record<string, number> = {}
  texts.forEach(t => {
    t.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => {
      if (w.length > 3 && !stopWords.has(w)) freq[w] = (freq[w] ?? 0) + 1
    })
  })
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IntensityBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(value / 10) * 100}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value}/10</span>
    </div>
  )
}

function EmotionBadge({ emotion, size = 'sm' }: { emotion: EmotionName; size?: 'sm' | 'xs' }) {
  const color = EMOTION_COLOR[emotion]
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border px-2 ${size === 'sm' ? 'py-0.5 text-xs' : 'py-0 text-[10px]'}`}
      style={{ color, borderColor: color, background: `${color}15` }}
    >
      {emotion}
    </span>
  )
}

function SkillSlider({
  label,
  desc,
  value,
  onChange,
}: {
  label: string
  desc: string
  value: number
  onChange: (v: number) => void
}) {
  const color = value >= 8 ? '#22c55e' : value >= 6 ? '#eab308' : value >= 4 ? '#f97316' : '#ef4444'
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <div>
          <span className="text-sm font-medium text-slate-300">{label}</span>
          <span className="text-xs text-slate-600 ml-2">{desc}</span>
        </div>
        <span className="text-sm font-bold font-mono" style={{ color }}>{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={e => onChange(+e.target.value)}
        className="w-full"
        style={{ accentColor: color }}
      />
    </div>
  )
}

// ─── Empty Form ───────────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<EQLog, 'id' | 'date'> = {
  trigger: '',
  emotion: 'Joy',
  intensity: 5,
  physicalSensations: '',
  initialReaction: '',
  chosenResponse: '',
  reflection: '',
}

const EMPTY_ASSESSMENT: Omit<EQAssessment, 'month'> = {
  selfAwareness: 5,
  selfRegulation: 5,
  motivation: 5,
  empathy: 5,
  socialSkills: 5,
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'journal' | 'assessment' | 'insights'

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EmotionalIntelligence() {
  const { toastSuccess } = useToast()

  const [tab, setTab] = useState<Tab>('journal')
  const [logs, setLogs] = useState<EQLog[]>([])
  const [assessments, setAssessments] = useState<EQAssessment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EQLog, 'id' | 'date'>>(EMPTY_FORM)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Assessment draft
  const [assessmentDraft, setAssessmentDraft] = useState<Omit<EQAssessment, 'month'>>(EMPTY_ASSESSMENT)

  useEffect(() => {
    setLogs(loadLogs())
    const all = loadAssessments()
    setAssessments(all)
    const current = all.find(a => a.month === thisMonth())
    if (current) {
      const { month: _m, ...rest } = current
      setAssessmentDraft(rest)
    }
  }, [])

  // ── Log actions ──────────────────────────────────────────────────────────────

  const saveLog = () => {
    if (!form.trigger.trim()) {
      return
    }
    const entry: EQLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      ...form,
    }
    const updated = [entry, ...logs]
    setLogs(updated)
    saveLogs(updated)
    setForm(EMPTY_FORM)
    setShowForm(false)
    toastSuccess('EQ entry logged.', `${form.emotion} at intensity ${form.intensity}`)
  }

  const deleteLog = (id: string) => {
    const updated = logs.filter(l => l.id !== id)
    setLogs(updated)
    saveLogs(updated)
  }

  // ── Assessment actions ────────────────────────────────────────────────────────

  const saveAssessment = () => {
    const month = thisMonth()
    const entry: EQAssessment = { month, ...assessmentDraft }
    const others = assessments.filter(a => a.month !== month)
    const updated = [entry, ...others].sort((a, b) => b.month.localeCompare(a.month))
    setAssessments(updated)
    saveAssessments(updated)
    toastSuccess('EQ assessment saved for ' + month)
  }

  const setSkill = (key: keyof typeof assessmentDraft, v: number) => {
    setAssessmentDraft(d => ({ ...d, [key]: v }))
  }

  // ── Computed insights ─────────────────────────────────────────────────────────

  const emotionFrequency = useMemo(() => {
    const freq: Partial<Record<EmotionName, number>> = {}
    logs.forEach(l => { freq[l.emotion] = (freq[l.emotion] ?? 0) + 1 })
    return EMOTIONS
      .map(e => ({ emotion: e.name, count: freq[e.name] ?? 0, color: e.color }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [logs])

  const maxFreq = useMemo(() => Math.max(...emotionFrequency.map(e => e.count), 1), [emotionFrequency])

  const avgIntensity = useMemo(() => {
    if (logs.length === 0) return null
    return (logs.reduce((s, l) => s + l.intensity, 0) / logs.length).toFixed(1)
  }, [logs])

  const topTriggerWords = useMemo(() => topWords(logs.map(l => l.trigger)), [logs])

  const mostCommonEmotion = emotionFrequency[0]?.emotion ?? null

  // Sort logs newest first
  const sortedLogs = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date)), [logs])

  const currentAssessment = assessments.find(a => a.month === thisMonth())
  const eqAvgScore = currentAssessment
    ? ((currentAssessment.selfAwareness + currentAssessment.selfRegulation +
        currentAssessment.motivation + currentAssessment.empathy +
        currentAssessment.socialSkills) / 5).toFixed(1)
    : null

  const setFormField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Brain className="w-7 h-7 text-violet-400" />
            Emotional Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track emotions, build self-awareness &amp; grow EQ skills</p>
        </div>
        {tab === 'journal' && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Emotion
          </button>
        )}
      </div>

      {/* EQ Score Banner */}
      {eqAvgScore && (
        <div className="game-card p-4 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full border-2 border-violet-500 flex items-center justify-center flex-shrink-0 font-bold text-lg text-violet-300"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {eqAvgScore}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-300">This Month's EQ Score</div>
            <div className="text-xs text-slate-500">Average across all 5 EQ skill areas</div>
          </div>
          <Sparkles className="w-5 h-5 text-violet-400 ml-auto flex-shrink-0" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 p-1 rounded-xl">
        {(
          [
            { key: 'journal', icon: <Heart className="w-4 h-4" />, label: 'EQ Journal' },
            { key: 'assessment', icon: <Star className="w-4 h-4" />, label: 'Skills' },
            { key: 'insights', icon: <BarChart3 className="w-4 h-4" />, label: 'Insights' },
          ] as { key: Tab; icon: React.ReactNode; label: string }[]
        ).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? '#7c3aed' : 'transparent',
              color: tab === t.key ? '#fff' : '#64748b',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── JOURNAL TAB ────────────────────────────────────────────────────────── */}
      {tab === 'journal' && (
        <>
          {/* Log form */}
          {showForm && (
            <div className="game-card p-5 space-y-4 border border-violet-500/25">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Brain className="w-4 h-4 text-violet-400" /> New EQ Entry
              </h3>

              {/* Date */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Date</label>
                <input
                  type="date"
                  className="game-input w-full"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">What happened? (trigger situation)</label>
                <textarea
                  value={form.trigger}
                  onChange={e => setFormField('trigger', e.target.value)}
                  placeholder="Describe the situation that brought this emotion..."
                  className="game-input w-full h-20 resize-none"
                  autoFocus
                />
              </div>

              {/* Emotion picker */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Emotion felt</label>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map(e => (
                    <button
                      key={e.name}
                      onClick={() => setFormField('emotion', e.name)}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                      style={
                        form.emotion === e.name
                          ? { background: `${e.color}25`, color: e.color, borderColor: e.color }
                          : { background: '#0f172a', color: '#64748b', borderColor: '#1e293b' }
                      }
                    >
                      {e.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-slate-400">Intensity</label>
                  <span
                    className="font-bold"
                    style={{ color: INTENSITY_COLORS[form.intensity] }}
                  >
                    {form.intensity}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={form.intensity}
                  onChange={e => setFormField('intensity', +e.target.value)}
                  className="w-full"
                  style={{ accentColor: INTENSITY_COLORS[form.intensity] }}
                />
              </div>

              {/* Physical sensations */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Physical sensations noticed</label>
                <input
                  type="text"
                  value={form.physicalSensations}
                  onChange={e => setFormField('physicalSensations', e.target.value)}
                  placeholder="e.g. tight chest, racing heart, warmth..."
                  className="game-input w-full"
                />
              </div>

              {/* Initial reaction */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Initial reaction (what you felt like doing)</label>
                <textarea
                  value={form.initialReaction}
                  onChange={e => setFormField('initialReaction', e.target.value)}
                  placeholder="First impulse or automatic reaction..."
                  className="game-input w-full h-16 resize-none"
                />
              </div>

              {/* Chosen response */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Chosen response (what you actually did)</label>
                <textarea
                  value={form.chosenResponse}
                  onChange={e => setFormField('chosenResponse', e.target.value)}
                  placeholder="What did you choose to do instead..."
                  className="game-input w-full h-16 resize-none"
                />
              </div>

              {/* Reflection */}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reflection — what did you learn?</label>
                <textarea
                  value={form.reflection}
                  onChange={e => setFormField('reflection', e.target.value)}
                  placeholder="Insights, patterns noticed, what you'd do differently..."
                  className="game-input w-full h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveLog}
                  disabled={!form.trigger.trim()}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Save EQ Entry
                </button>
                <button
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="px-4 py-2.5 bg-slate-700 text-slate-400 rounded-xl text-sm transition-colors hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Log list */}
          <div className="space-y-3">
            {sortedLogs.map(log => (
              <div
                key={log.id}
                className="game-card overflow-hidden"
                style={{ borderLeft: `3px solid ${EMOTION_COLOR[log.emotion]}` }}
              >
                {/* Summary row */}
                <div
                  className="p-4 cursor-pointer flex items-start justify-between gap-3"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <EmotionBadge emotion={log.emotion} />
                      <span className="text-xs text-slate-500">{log.date}</span>
                    </div>
                    <p className="text-sm text-slate-300 truncate">{log.trigger}</p>
                    <div className="mt-1.5">
                      <IntensityBar value={log.intensity} color={EMOTION_COLOR[log.emotion]} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {expandedId === log.id
                      ? <ChevronUp className="w-4 h-4 text-slate-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-500" />
                    }
                    <button
                      onClick={ev => { ev.stopPropagation(); deleteLog(log.id) }}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === log.id && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800 space-y-3 text-sm">
                    {log.physicalSensations && (
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 tracking-wider">Physical Sensations</span>
                        <p className="text-slate-300 mt-0.5">{log.physicalSensations}</p>
                      </div>
                    )}
                    {log.initialReaction && (
                      <div>
                        <span className="text-[10px] uppercase text-orange-500 tracking-wider">Initial Reaction</span>
                        <p className="text-slate-300 mt-0.5">{log.initialReaction}</p>
                      </div>
                    )}
                    {log.chosenResponse && (
                      <div>
                        <span className="text-[10px] uppercase text-green-500 tracking-wider">Chosen Response</span>
                        <p className="text-green-300 mt-0.5">{log.chosenResponse}</p>
                      </div>
                    )}
                    {log.reflection && (
                      <div>
                        <span className="text-[10px] uppercase text-violet-400 tracking-wider">Reflection</span>
                        <p className="text-violet-200 mt-0.5 italic">{log.reflection}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {logs.length === 0 && !showForm && (
            <div className="text-center py-16 text-slate-500">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="mb-2">No EQ entries yet.</p>
              <p className="text-sm mb-5 text-slate-600">
                Logging emotions builds self-awareness — the foundation of all EQ.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Log Your First Emotion
              </button>
            </div>
          )}
        </>
      )}

      {/* ── SKILLS ASSESSMENT TAB ──────────────────────────────────────────────── */}
      {tab === 'assessment' && (
        <div className="space-y-5">
          <div className="game-card p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Monthly EQ Self-Assessment
              </h3>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">{thisMonth()}</span>
            </div>

            <div className="space-y-5">
              {EQ_SKILLS.map(skill => (
                <SkillSlider
                  key={skill.key}
                  label={skill.label}
                  desc={skill.desc}
                  value={assessmentDraft[skill.key]}
                  onChange={v => setSkill(skill.key, v)}
                />
              ))}
            </div>

            {/* Overall preview */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Overall EQ Score</span>
                <span className="text-lg font-bold text-violet-300" style={{ fontFamily: 'Orbitron, monospace' }}>
                  {(
                    (assessmentDraft.selfAwareness + assessmentDraft.selfRegulation +
                      assessmentDraft.motivation + assessmentDraft.empathy +
                      assessmentDraft.socialSkills) / 5
                  ).toFixed(1)}/10
                </span>
              </div>
            </div>

            <button
              onClick={saveAssessment}
              className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Save Monthly Snapshot
            </button>
          </div>

          {/* Historical snapshots */}
          {assessments.length > 0 && (
            <div className="game-card p-5">
              <h3 className="font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Assessment History
              </h3>
              <div className="space-y-3">
                {assessments.slice(0, 6).map(a => {
                  const score = ((a.selfAwareness + a.selfRegulation + a.motivation + a.empathy + a.socialSkills) / 5).toFixed(1)
                  return (
                    <div key={a.month} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                      <span className="text-xs text-slate-500 w-16">{a.month}</span>
                      <div className="flex-1 flex gap-1">
                        {EQ_SKILLS.map(skill => (
                          <div
                            key={skill.key}
                            className="flex-1 flex flex-col items-center gap-0.5"
                            title={`${skill.label}: ${a[skill.key]}/10`}
                          >
                            <div className="w-full h-8 bg-slate-900 rounded-sm overflow-hidden flex items-end">
                              <div
                                className="w-full rounded-t-sm transition-all"
                                style={{
                                  height: `${(a[skill.key] / 10) * 100}%`,
                                  background: '#7c3aed88',
                                }}
                              />
                            </div>
                            <span className="text-[8px] text-slate-600">{a[skill.key]}</span>
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-violet-300 w-10 text-right" style={{ fontFamily: 'Orbitron, monospace' }}>
                        {score}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 mt-2 pl-20">
                {EQ_SKILLS.map(s => (
                  <span key={s.key} className="flex-1 text-center leading-tight">{s.label.split(' ')[0]}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── INSIGHTS TAB ───────────────────────────────────────────────────────── */}
      {tab === 'insights' && (
        <div className="space-y-5">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="game-card p-3 text-center">
              <div className="text-xl font-bold text-violet-300" style={{ fontFamily: 'Orbitron, monospace' }}>
                {logs.length}
              </div>
              <div className="text-xs text-slate-500">Entries</div>
            </div>
            <div className="game-card p-3 text-center">
              <div
                className="text-xl font-bold"
                style={{ color: avgIntensity ? INTENSITY_COLORS[Math.round(+avgIntensity)] : '#64748b', fontFamily: 'Orbitron, monospace' }}
              >
                {avgIntensity ?? '—'}
              </div>
              <div className="text-xs text-slate-500">Avg Intensity</div>
            </div>
            <div className="game-card p-3 text-center">
              <div className="text-sm font-bold" style={{ color: mostCommonEmotion ? EMOTION_COLOR[mostCommonEmotion] : '#64748b' }}>
                {mostCommonEmotion ?? '—'}
              </div>
              <div className="text-xs text-slate-500">Most Common</div>
            </div>
          </div>

          {/* Emotion frequency chart */}
          {emotionFrequency.length > 0 && (
            <div className="game-card p-5">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-violet-400" />
                Emotion Frequency
              </h3>
              <div className="space-y-2.5">
                {emotionFrequency.map(({ emotion, count, color }) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <span className="text-xs w-20 text-right flex-shrink-0" style={{ color }}>{emotion}</span>
                    <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center pl-2 transition-all"
                        style={{ width: `${(count / maxFreq) * 100}%`, background: `${color}55`, minWidth: '24px' }}
                      >
                        <span className="text-[10px] font-bold" style={{ color }}>{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern insights */}
          {logs.length >= 3 && (
            <div className="game-card p-5 space-y-4">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Pattern Insights
              </h3>

              {/* Most common emotions top 3 */}
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Top Emotions</div>
                <div className="flex gap-2 flex-wrap">
                  {emotionFrequency.slice(0, 3).map(({ emotion, count, color }) => (
                    <div
                      key={emotion}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold"
                      style={{ color, borderColor: color, background: `${color}15` }}
                    >
                      {emotion}
                      <span className="opacity-70">×{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avg intensity */}
              {avgIntensity && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Average Intensity</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(+avgIntensity / 10) * 100}%`,
                          background: INTENSITY_COLORS[Math.round(+avgIntensity)],
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-300">{avgIntensity}/10</span>
                  </div>
                </div>
              )}

              {/* Common trigger words */}
              {topTriggerWords.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Common Trigger Themes</div>
                  <div className="flex gap-2 flex-wrap">
                    {topTriggerWords.map(({ word, count }) => (
                      <span
                        key={word}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-xs border border-slate-700"
                      >
                        {word}
                        <span className="text-slate-500 ml-1">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* High intensity days */}
              {(() => {
                const high = logs.filter(l => l.intensity >= 8)
                if (high.length === 0) return null
                const topEmotions = high.reduce<Partial<Record<EmotionName, number>>>((acc, l) => {
                  acc[l.emotion] = (acc[l.emotion] ?? 0) + 1
                  return acc
                }, {})
                const top = Object.entries(topEmotions).sort((a, b) => b[1] - a[1])[0]
                return (
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-400">
                      You've had <span className="text-white font-semibold">{high.length}</span> high-intensity episodes (8+).
                      {top && (
                        <> The most common was <EmotionBadge emotion={top[0] as EmotionName} size="xs" />.</>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {logs.length === 0 && (
            <div className="text-center py-14 text-slate-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Log emotions to see pattern insights.</p>
            </div>
          )}

          {logs.length > 0 && logs.length < 3 && (
            <div className="text-center py-8 text-slate-600 text-sm">
              Log at least 3 emotions to unlock pattern insights.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
