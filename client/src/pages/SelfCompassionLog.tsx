import { useState, useEffect } from 'react'
import { Heart, Plus, X, Flame, Sparkles, ArrowRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type EmotionBefore =
  | 'Shame'
  | 'Guilt'
  | 'Self-Criticism'
  | 'Disappointment'
  | 'Frustration'
  | 'Sadness'
  | 'Anxiety'
  | 'Anger at self'
  | 'Numbness'

type EmotionAfter =
  | 'Warmth'
  | 'Acceptance'
  | 'Relief'
  | 'Compassion'
  | 'Peace'
  | 'Softness'
  | 'Forgiveness'
  | 'Neutrality'
  | 'Hope'

interface SelfCompassionEntry {
  id: string
  situationTrigger: string
  harshSelfTalk: string
  compassionateResponse: string
  commonHumanity: string
  mindfulAcknowledgment: string
  selfCareAction: string
  emotionBefore: EmotionBefore
  emotionAfter: EmotionAfter
  compassionScore: number
  date: string
  createdAt: string
}

const EMOTIONS_BEFORE: EmotionBefore[] = [
  'Shame', 'Guilt', 'Self-Criticism', 'Disappointment', 'Frustration',
  'Sadness', 'Anxiety', 'Anger at self', 'Numbness',
]

const EMOTIONS_AFTER: EmotionAfter[] = [
  'Warmth', 'Acceptance', 'Relief', 'Compassion', 'Peace',
  'Softness', 'Forgiveness', 'Neutrality', 'Hope',
]

const STORAGE_KEY = 'self_compassion_log'

const defaultForm = (): Omit<SelfCompassionEntry, 'id' | 'createdAt'> => ({
  situationTrigger: '',
  harshSelfTalk: '',
  compassionateResponse: '',
  commonHumanity: '',
  mindfulAcknowledgment: '',
  selfCareAction: '',
  emotionBefore: 'Self-Criticism',
  emotionAfter: 'Acceptance',
  compassionScore: 6,
  date: new Date().toISOString().split('T')[0],
})

function getMostCommon<T extends string>(arr: T[]): T | null {
  if (!arr.length) return null
  const counts: Partial<Record<T, number>> = {}
  for (const v of arr) counts[v] = (counts[v] ?? 0) + 1
  return arr.reduce((a, b) => (counts[a] ?? 0) >= (counts[b] ?? 0) ? a : b)
}

function getStreak(entries: SelfCompassionEntry[]): number {
  if (!entries.length) return 0
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().split('T')[0]
  let current = today
  for (const d of dates) {
    if (d === current) {
      streak++
      const prev = new Date(current)
      prev.setDate(prev.getDate() - 1)
      current = prev.toISOString().split('T')[0]
    } else {
      break
    }
  }
  return streak
}

const EMOTION_BEFORE_COLORS: Record<EmotionBefore, string> = {
  'Shame': 'text-red-400',
  'Guilt': 'text-orange-400',
  'Self-Criticism': 'text-red-300',
  'Disappointment': 'text-amber-400',
  'Frustration': 'text-orange-300',
  'Sadness': 'text-blue-400',
  'Anxiety': 'text-yellow-400',
  'Anger at self': 'text-red-500',
  'Numbness': 'text-slate-400',
}

const EMOTION_AFTER_COLORS: Record<EmotionAfter, string> = {
  'Warmth': 'text-amber-400',
  'Acceptance': 'text-green-400',
  'Relief': 'text-cyan-400',
  'Compassion': 'text-pink-400',
  'Peace': 'text-blue-300',
  'Softness': 'text-rose-300',
  'Forgiveness': 'text-violet-400',
  'Neutrality': 'text-slate-300',
  'Hope': 'text-emerald-400',
}

export default function SelfCompassionLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SelfCompassionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm())

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (updated: SelfCompassionEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const submit = () => {
    if (!form.situationTrigger.trim()) return
    const entry: SelfCompassionEntry = {
      id: Date.now().toString(),
      ...form,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setForm(defaultForm())
    setShowForm(false)
    toastSuccess('Self-compassion practiced — you are enough.')
  }

  const streak = getStreak(entries)
  const avgScore = entries.length
    ? Math.round((entries.reduce((s, e) => s + e.compassionScore, 0) / entries.length) * 10) / 10
    : 0
  const topBefore = getMostCommon(entries.map(e => e.emotionBefore))
  const topAfter = getMostCommon(entries.map(e => e.emotionAfter))
  const last5 = entries.slice(0, 5)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-rose-400" />
            Self-Compassion Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Treat yourself as you would a dear friend.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="game-card p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xl font-bold text-white">{streak}</span>
          </div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-rose-400">{avgScore}/10</div>
          <div className="text-xs text-slate-500">Avg Compassion</div>
        </div>
      </div>

      {(topBefore || topAfter) && (
        <div className="game-card p-3">
          <div className="text-xs text-slate-500 mb-2">Most Common Transformation</div>
          <div className="flex items-center gap-2 flex-wrap">
            {topBefore && (
              <span className={`text-sm font-semibold ${EMOTION_BEFORE_COLORS[topBefore]}`}>{topBefore}</span>
            )}
            <ArrowRight className="w-4 h-4 text-slate-600" />
            {topAfter && (
              <span className={`text-sm font-semibold ${EMOTION_AFTER_COLORS[topAfter]}`}>{topAfter}</span>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-rose-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Practice Self-Compassion</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            value={form.situationTrigger}
            onChange={e => setForm(f => ({ ...f, situationTrigger: e.target.value }))}
            placeholder="What happened that needs self-compassion? *"
            className="game-input w-full text-sm"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.emotionBefore}
              onChange={e => setForm(f => ({ ...f, emotionBefore: e.target.value as EmotionBefore }))}
              className="game-input text-sm"
            >
              <option value="" disabled>Emotion Before</option>
              {EMOTIONS_BEFORE.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
            <select
              value={form.emotionAfter}
              onChange={e => setForm(f => ({ ...f, emotionAfter: e.target.value as EmotionAfter }))}
              className="game-input text-sm"
            >
              <option value="" disabled>Emotion After</option>
              {EMOTIONS_AFTER.map(em => <option key={em} value={em}>{em}</option>)}
            </select>
          </div>

          <textarea
            value={form.harshSelfTalk}
            onChange={e => setForm(f => ({ ...f, harshSelfTalk: e.target.value }))}
            placeholder="What are you saying to yourself? (harsh self-talk)"
            rows={2}
            className="game-input w-full text-sm resize-none"
          />

          <textarea
            value={form.compassionateResponse}
            onChange={e => setForm(f => ({ ...f, compassionateResponse: e.target.value }))}
            placeholder="What would you say to a dear friend in this situation?"
            rows={2}
            className="game-input w-full text-sm resize-none"
          />

          <input
            value={form.commonHumanity}
            onChange={e => setForm(f => ({ ...f, commonHumanity: e.target.value }))}
            placeholder="How is this a shared human experience?"
            className="game-input w-full text-sm"
          />

          <input
            value={form.mindfulAcknowledgment}
            onChange={e => setForm(f => ({ ...f, mindfulAcknowledgment: e.target.value }))}
            placeholder="Acknowledge the pain without exaggerating"
            className="game-input w-full text-sm"
          />

          <input
            value={form.selfCareAction}
            onChange={e => setForm(f => ({ ...f, selfCareAction: e.target.value }))}
            placeholder="One kind thing you'll do for yourself"
            className="game-input w-full text-sm"
          />

          <div>
            <p className="text-xs text-slate-400 mb-1">Compassion Score: <span className="text-rose-300">{form.compassionScore}/10</span></p>
            <input
              type="range" min={1} max={10} value={form.compassionScore}
              onChange={e => setForm(f => ({ ...f, compassionScore: Number(e.target.value) }))}
              className="w-full h-1 accent-rose-400"
            />
          </div>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input w-full text-sm"
          />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold">
              Log Entry
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Last 5 entries */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Entries</h2>
        {last5.map(e => (
          <div key={e.id} className="game-card p-3 border-l-2 border-rose-500/40">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium truncate">{e.situationTrigger}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs font-semibold ${EMOTION_BEFORE_COLORS[e.emotionBefore]}`}>{e.emotionBefore}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                  <span className={`text-xs font-semibold ${EMOTION_AFTER_COLORS[e.emotionAfter]}`}>{e.emotionAfter}</span>
                  <span className="text-xs text-rose-300 font-semibold ml-auto">Score: {e.compassionScore}/10</span>
                </div>
                {e.selfCareAction && (
                  <p className="text-xs text-amber-300/80 mt-1 truncate">
                    <Sparkles className="w-3 h-3 inline mr-0.5" />
                    {e.selfCareAction}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">{e.date}</div>
                <button
                  onClick={() => save(entries.filter(x => x.id !== e.id))}
                  className="text-slate-700 hover:text-red-400 mt-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You deserve the same compassion you give to others.</p>
          </div>
        )}
      </div>

      {entries.length > 5 && (
        <div className="text-xs text-slate-600 text-center">{entries.length - 5} more entries in history</div>
      )}
    </div>
  )
}
