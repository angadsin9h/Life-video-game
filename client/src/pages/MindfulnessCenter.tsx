import { useState, useEffect } from 'react'
import { Brain, Wind, Heart, Eye, Sparkles, Plus, Clock, CheckCircle2, Circle, Calendar, Flame, Activity } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'mindfulness_center_log'

type PracticeType = 'breath-awareness' | 'body-scan' | 'open-awareness' | 'loving-kindness'

interface BreathAwarenessFields {
  technique: 'box-breathing' | '4-7-8' | 'deep-belly' | 'alternate-nostril' | 'natural-observation'
  depth: number
  keyInsight: string
}

interface BodyScanFields {
  bodyArea: 'head-to-toe' | 'torso' | 'limbs' | 'full-body'
  tensionReleased: number
  sensationDescribed: string
}

interface OpenAwarenessFields {
  whatYouNoticed: string
  distractions: number
  clarityAfter: number
}

interface LovingKindnessFields {
  focus: 'self' | 'loved-one' | 'neutral-person' | 'difficult-person' | 'all-beings'
  heartOpening: number
  feelingAfter: string
}

interface MindfulnessCenterEntry {
  id: string
  practiceType: PracticeType
  duration: number
  breathAwareness?: BreathAwarenessFields
  bodyScan?: BodyScanFields
  openAwareness?: OpenAwarenessFields
  lovingKindness?: LovingKindnessFields
  mindfulnessScore: number
  date: string
  createdAt: string
}

function loadEntries(): MindfulnessCenterEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MindfulnessCenterEntry[]
  } catch { /* ignore */ }
  return []
}

function saveEntries(entries: MindfulnessCenterEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* ignore */ }
}

function getScore(entry: {
  practiceType: PracticeType
  breathAwareness?: BreathAwarenessFields
  bodyScan?: BodyScanFields
  openAwareness?: OpenAwarenessFields
  lovingKindness?: LovingKindnessFields
}): number {
  if (entry.practiceType === 'breath-awareness' && entry.breathAwareness) {
    return Math.round(entry.breathAwareness.depth * 10)
  }
  if (entry.practiceType === 'body-scan' && entry.bodyScan) {
    return Math.round(entry.bodyScan.tensionReleased * 10)
  }
  if (entry.practiceType === 'open-awareness' && entry.openAwareness) {
    const invertedDistractions = 10 - entry.openAwareness.distractions
    return Math.round(((invertedDistractions + entry.openAwareness.clarityAfter) / 2) * 10)
  }
  if (entry.practiceType === 'loving-kindness' && entry.lovingKindness) {
    return Math.round(entry.lovingKindness.heartOpening * 10)
  }
  return 50
}

function loadExternalScore(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const entries = JSON.parse(raw) as Array<Record<string, unknown>>
    if (!entries.length) return 0
    const last = entries[entries.length - 1]
    const scoreKey = key === 'inner_peace_log' ? 'peaceScore'
      : key === 'mindful_sleep_log' ? 'sleepScore'
      : 'bodyWisdomScore'
    return typeof last[scoreKey] === 'number' ? (last[scoreKey] as number) : 0
  } catch { return 0 }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function computeStreak(entries: MindfulnessCenterEntry[]): number {
  if (!entries.length) return 0
  const days = new Set(entries.map(e => e.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    if (days.has(ds)) streak++
    else if (i > 0) break
  }
  return streak
}

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const PRACTICE_META: Record<PracticeType, { label: string; color: string; icon: React.ReactNode }> = {
  'breath-awareness': { label: 'Breath Awareness', color: 'text-blue-400', icon: <Wind className="w-5 h-5 text-blue-400" /> },
  'body-scan': { label: 'Body Scan', color: 'text-green-400', icon: <Activity className="w-5 h-5 text-green-400" /> },
  'open-awareness': { label: 'Open Awareness', color: 'text-violet-400', icon: <Eye className="w-5 h-5 text-violet-400" /> },
  'loving-kindness': { label: 'Loving Kindness', color: 'text-pink-400', icon: <Heart className="w-5 h-5 text-pink-400" /> },
}

export default function MindfulnessCenter() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<MindfulnessCenterEntry[]>(loadEntries)
  const [activeForm, setActiveForm] = useState<PracticeType | null>(null)

  // Form state
  const [duration, setDuration] = useState(10)
  const [breathFields, setBreathFields] = useState<BreathAwarenessFields>({
    technique: 'box-breathing', depth: 5, keyInsight: ''
  })
  const [bodyScanFields, setBodyScanFields] = useState<BodyScanFields>({
    bodyArea: 'full-body', tensionReleased: 5, sensationDescribed: ''
  })
  const [openFields, setOpenFields] = useState<OpenAwarenessFields>({
    whatYouNoticed: '', distractions: 3, clarityAfter: 7
  })
  const [lovingFields, setLovingFields] = useState<LovingKindnessFields>({
    focus: 'self', heartOpening: 5, feelingAfter: ''
  })

  const peaceScore = loadExternalScore('inner_peace_log')
  const sleepScore = loadExternalScore('mindful_sleep_log')
  const bodyWisdomScore = loadExternalScore('body_wisdom_log')
  const mindfulnessLevel = Math.round(((peaceScore + sleepScore + bodyWisdomScore) / 3) * 10 / 10)

  const streak = computeStreak(entries)
  const last7 = getLast7Days()
  const daysWithSessions = new Set(entries.map(e => e.date))
  const todaySessions = entries.filter(e => e.date === todayStr())

  function resetForms() {
    setDuration(10)
    setBreathFields({ technique: 'box-breathing', depth: 5, keyInsight: '' })
    setBodyScanFields({ bodyArea: 'full-body', tensionReleased: 5, sensationDescribed: '' })
    setOpenFields({ whatYouNoticed: '', distractions: 3, clarityAfter: 7 })
    setLovingFields({ focus: 'self', heartOpening: 5, feelingAfter: '' })
  }

  function handleLog(practiceType: PracticeType) {
    const partial: Pick<MindfulnessCenterEntry, 'practiceType' | 'breathAwareness' | 'bodyScan' | 'openAwareness' | 'lovingKindness'> = {
      practiceType,
      breathAwareness: practiceType === 'breath-awareness' ? { ...breathFields } : undefined,
      bodyScan: practiceType === 'body-scan' ? { ...bodyScanFields } : undefined,
      openAwareness: practiceType === 'open-awareness' ? { ...openFields } : undefined,
      lovingKindness: practiceType === 'loving-kindness' ? { ...lovingFields } : undefined,
    }
    const score = getScore(partial)
    const entry: MindfulnessCenterEntry = {
      id: Date.now().toString(),
      duration,
      ...partial,
      mindfulnessScore: score,
      date: todayStr(),
      createdAt: new Date().toISOString(),
    }
    const updated = [...entries, entry]
    setEntries(updated)
    saveEntries(updated)
    toastSuccess('Practice logged', `${PRACTICE_META[practiceType].label} — ${duration} min`)
    setActiveForm(null)
    resetForms()
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Brain className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
          Mindfulness Center
        </h1>
      </div>
      <p className="text-slate-400 text-sm mb-6">Your hub for all mindfulness practices.</p>

      {/* Level + Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="game-card text-center">
          <Sparkles className="w-5 h-5 text-violet-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>{mindfulnessLevel}</div>
          <div className="text-xs text-slate-400">Mindfulness Lvl</div>
        </div>
        <div className="game-card text-center">
          <Flame className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</div>
          <div className="text-xs text-slate-400">Day Streak</div>
        </div>
        <div className="game-card text-center">
          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-blue-400" style={{ fontFamily: 'Orbitron, monospace' }}>{todaySessions.length}</div>
          <div className="text-xs text-slate-400">Today's Sessions</div>
        </div>
        <div className="game-card text-center">
          <Calendar className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <div className="text-2xl font-black text-green-400" style={{ fontFamily: 'Orbitron, monospace' }}>{entries.length}</div>
          <div className="text-xs text-slate-400">Total Sessions</div>
        </div>
      </div>

      {/* 7-day consistency */}
      <div className="game-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">7-Day Consistency</span>
        </div>
        <div className="flex gap-2">
          {last7.map(day => {
            const hasSesh = daysWithSessions.has(day)
            const label = new Date(day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' })
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${hasSesh ? 'bg-violet-600' : 'bg-slate-700'}`}>
                  {hasSesh
                    ? <CheckCircle2 className="w-4 h-4 text-white" />
                    : <Circle className="w-4 h-4 text-slate-500" />}
                </div>
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Practice Cards */}
      <h2 className="text-lg font-bold text-slate-200 mb-3">Practice Sessions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* Breath Awareness */}
        <div className="game-card border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-blue-300">Breath Awareness</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Cultivate presence through conscious breathing.</p>
          {activeForm === 'breath-awareness' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Duration: {duration} min</label>
                <input type="range" min={1} max={60} value={duration} onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Technique</label>
                <select className="game-input w-full mt-1" value={breathFields.technique}
                  onChange={e => setBreathFields(f => ({ ...f, technique: e.target.value as BreathAwarenessFields['technique'] }))}>
                  <option value="box-breathing">Box Breathing</option>
                  <option value="4-7-8">4-7-8</option>
                  <option value="deep-belly">Deep Belly</option>
                  <option value="alternate-nostril">Alternate Nostril</option>
                  <option value="natural-observation">Natural Observation</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Depth: {breathFields.depth}/10</label>
                <input type="range" min={1} max={10} value={breathFields.depth}
                  onChange={e => setBreathFields(f => ({ ...f, depth: Number(e.target.value) }))}
                  className="w-full accent-blue-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Key Insight</label>
                <input className="game-input w-full mt-1" placeholder="What did you notice?"
                  value={breathFields.keyInsight}
                  onChange={e => setBreathFields(f => ({ ...f, keyInsight: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg font-semibold"
                  onClick={() => handleLog('breath-awareness')}>Log Session</button>
                <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg"
                  onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-sm py-2 rounded-lg border border-blue-500/30"
              onClick={() => setActiveForm('breath-awareness')}>
              <Plus className="w-4 h-4" /> Start Session
            </button>
          )}
        </div>

        {/* Body Scan */}
        <div className="game-card border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-green-400" />
            <span className="font-bold text-green-300">Body Scan</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Release tension through systematic body awareness.</p>
          {activeForm === 'body-scan' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Duration: {duration} min</label>
                <input type="range" min={1} max={60} value={duration} onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-green-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Body Area Focus</label>
                <select className="game-input w-full mt-1" value={bodyScanFields.bodyArea}
                  onChange={e => setBodyScanFields(f => ({ ...f, bodyArea: e.target.value as BodyScanFields['bodyArea'] }))}>
                  <option value="head-to-toe">Head to Toe</option>
                  <option value="torso">Torso</option>
                  <option value="limbs">Limbs</option>
                  <option value="full-body">Full Body</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Tension Released: {bodyScanFields.tensionReleased}/10</label>
                <input type="range" min={1} max={10} value={bodyScanFields.tensionReleased}
                  onChange={e => setBodyScanFields(f => ({ ...f, tensionReleased: Number(e.target.value) }))}
                  className="w-full accent-green-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Sensation Described</label>
                <input className="game-input w-full mt-1" placeholder="Describe what you felt..."
                  value={bodyScanFields.sensationDescribed}
                  onChange={e => setBodyScanFields(f => ({ ...f, sensationDescribed: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 rounded-lg font-semibold"
                  onClick={() => handleLog('body-scan')}>Log Session</button>
                <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg"
                  onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 text-sm py-2 rounded-lg border border-green-500/30"
              onClick={() => setActiveForm('body-scan')}>
              <Plus className="w-4 h-4" /> Start Session
            </button>
          )}
        </div>

        {/* Open Awareness */}
        <div className="game-card border border-violet-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-violet-400" />
            <span className="font-bold text-violet-300">Open Awareness</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Rest in wide-open, non-judgmental presence.</p>
          {activeForm === 'open-awareness' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Duration: {duration} min</label>
                <input type="range" min={1} max={60} value={duration} onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-violet-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">What You Noticed</label>
                <input className="game-input w-full mt-1" placeholder="Sounds, sensations, thoughts..."
                  value={openFields.whatYouNoticed}
                  onChange={e => setOpenFields(f => ({ ...f, whatYouNoticed: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Distractions: {openFields.distractions}/10</label>
                <input type="range" min={1} max={10} value={openFields.distractions}
                  onChange={e => setOpenFields(f => ({ ...f, distractions: Number(e.target.value) }))}
                  className="w-full accent-violet-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Clarity After: {openFields.clarityAfter}/10</label>
                <input type="range" min={1} max={10} value={openFields.clarityAfter}
                  onChange={e => setOpenFields(f => ({ ...f, clarityAfter: Number(e.target.value) }))}
                  className="w-full accent-violet-500" />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm py-2 rounded-lg font-semibold"
                  onClick={() => handleLog('open-awareness')}>Log Session</button>
                <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg"
                  onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 text-sm py-2 rounded-lg border border-violet-500/30"
              onClick={() => setActiveForm('open-awareness')}>
              <Plus className="w-4 h-4" /> Start Session
            </button>
          )}
        </div>

        {/* Loving Kindness */}
        <div className="game-card border border-pink-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <span className="font-bold text-pink-300">Loving Kindness</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">Cultivate compassion and unconditional warmth.</p>
          {activeForm === 'loving-kindness' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Duration: {duration} min</label>
                <input type="range" min={1} max={60} value={duration} onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-pink-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Focus</label>
                <select className="game-input w-full mt-1" value={lovingFields.focus}
                  onChange={e => setLovingFields(f => ({ ...f, focus: e.target.value as LovingKindnessFields['focus'] }))}>
                  <option value="self">Self</option>
                  <option value="loved-one">Loved One</option>
                  <option value="neutral-person">Neutral Person</option>
                  <option value="difficult-person">Difficult Person</option>
                  <option value="all-beings">All Beings</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Heart Opening: {lovingFields.heartOpening}/10</label>
                <input type="range" min={1} max={10} value={lovingFields.heartOpening}
                  onChange={e => setLovingFields(f => ({ ...f, heartOpening: Number(e.target.value) }))}
                  className="w-full accent-pink-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Feeling After</label>
                <input className="game-input w-full mt-1" placeholder="How do you feel now?"
                  value={lovingFields.feelingAfter}
                  onChange={e => setLovingFields(f => ({ ...f, feelingAfter: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-pink-600 hover:bg-pink-700 text-white text-sm py-2 rounded-lg font-semibold"
                  onClick={() => handleLog('loving-kindness')}>Log Session</button>
                <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-sm rounded-lg"
                  onClick={() => setActiveForm(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 bg-pink-600/20 hover:bg-pink-600/40 text-pink-300 text-sm py-2 rounded-lg border border-pink-500/30"
              onClick={() => setActiveForm('loving-kindness')}>
              <Plus className="w-4 h-4" /> Start Session
            </button>
          )}
        </div>
      </div>

      {/* Today's Summary */}
      {todaySessions.length > 0 && (
        <div className="game-card">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="font-semibold text-sm text-slate-200">Today's Practice Summary</span>
          </div>
          <div className="space-y-2">
            {todaySessions.map(s => (
              <div key={s.id} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  {PRACTICE_META[s.practiceType].icon}
                  <span className="text-sm text-slate-200">{PRACTICE_META[s.practiceType].label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{s.duration} min</span>
                  <span className="text-xs font-bold text-violet-400">{s.mindfulnessScore}/100</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500 text-right">
            Total: {todaySessions.reduce((a, s) => a + s.duration, 0)} min today
          </div>
        </div>
      )}
    </div>
  )
}
