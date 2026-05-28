import { useState, useEffect } from 'react'
import { Moon, ChevronLeft, ChevronRight, Save, Star, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface NightlyData {
  date: string
  accomplishments: string[]
  gratitudes: string[]
  tomorrowFocus: string
  energyLevel: number
  productivity: number
  selfCare: boolean[]
  highlight: string
  improvement: string
  mood: number
  savedAt: string
}

const SELF_CARE_ITEMS = [
  'Drank enough water', 'Ate well', 'Exercised', 'Meditated', 'Got fresh air',
  'Avoided screens before bed', 'Journaled', 'Connected with someone',
]

const ACCOMPLISHMENT_PROMPTS = [
  'What\'s one thing I finished today?',
  'What progress did I make on my goals?',
  'What challenge did I overcome?',
]

const MOOD_EMOJIS = ['😫', '😔', '😐', '😊', '😄']

const STORAGE_KEY = 'nightly_review'

function getKey(date: string) { return `${STORAGE_KEY}_${date}` }

const empty = (date: string): NightlyData => ({
  date, accomplishments: ['', '', ''], gratitudes: ['', '', ''],
  tomorrowFocus: '', energyLevel: 5, productivity: 5,
  selfCare: Array(SELF_CARE_ITEMS.length).fill(false),
  highlight: '', improvement: '', mood: 3, savedAt: '',
})

export default function NightlyReview() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [data, setData] = useState<NightlyData>(empty(today))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getKey(date))
      if (saved) {
        setData(JSON.parse(saved))
        setSaved(true)
      } else {
        setData(empty(date))
        setSaved(false)
      }
    } catch { /**/ }
  }, [date])

  const save = () => {
    const toSave = { ...data, savedAt: new Date().toISOString() }
    localStorage.setItem(getKey(date), JSON.stringify(toSave))
    setData(toSave)
    setSaved(true)
    toastSuccess('Nightly review saved! Rest well 🌙')
  }

  const shiftDate = (d: number) => {
    const dt = new Date(date + 'T12:00:00')
    dt.setDate(dt.getDate() + d)
    setDate(dt.toISOString().split('T')[0])
  }

  const isToday = date === today
  const selfCareScore = data.selfCare.filter(Boolean).length
  const completionScore = Math.round(
    (data.accomplishments.filter(a => a.trim()).length / 3 * 30) +
    (data.gratitudes.filter(g => g.trim()).length / 3 * 20) +
    (data.highlight.trim() ? 15 : 0) +
    (data.tomorrowFocus.trim() ? 15 : 0) +
    (selfCareScore / SELF_CARE_ITEMS.length * 20)
  )

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Moon className="w-7 h-7 text-indigo-400" />
            Nightly Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Close the day with intention and gratitude</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-400">{completionScore}%</div>
          <div className="text-xs text-slate-500">Complete</div>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 text-slate-500 hover:text-slate-300"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <div className="font-bold text-white">{isToday ? 'Tonight' : date}</div>
          {saved && <div className="text-xs text-green-400">✓ Saved</div>}
        </div>
        <button onClick={() => shiftDate(1)} disabled={isToday} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
      </div>

      {/* Mood & Energy */}
      <div className="game-card p-5 space-y-4">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">How was today?</h3>
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Mood</label>
          <div className="flex gap-3 justify-center">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button key={i} onClick={() => setData(d => ({ ...d, mood: i + 1 }))}
                className={`text-2xl transition-transform hover:scale-125 ${data.mood === i + 1 ? 'scale-125' : 'opacity-40'}`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Energy</span>
              <span className="text-indigo-400 font-bold">{data.energyLevel}/10</span>
            </div>
            <input type="range" min="1" max="10" value={data.energyLevel}
              onChange={e => setData(d => ({ ...d, energyLevel: +e.target.value }))}
              className="w-full accent-indigo-400" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Productivity</span>
              <span className="text-violet-400 font-bold">{data.productivity}/10</span>
            </div>
            <input type="range" min="1" max="10" value={data.productivity}
              onChange={e => setData(d => ({ ...d, productivity: +e.target.value }))}
              className="w-full accent-violet-400" />
          </div>
        </div>
      </div>

      {/* Accomplishments */}
      <div className="game-card p-5 space-y-3">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">3 Accomplishments</h3>
        <p className="text-xs text-slate-500 italic">{ACCOMPLISHMENT_PROMPTS[0]}</p>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-2">
              <span className="text-xs text-green-400 font-bold">{i + 1}</span>
            </div>
            <input value={data.accomplishments[i] || ''}
              onChange={e => setData(d => ({ ...d, accomplishments: d.accomplishments.map((a, idx) => idx === i ? e.target.value : a) }))}
              placeholder="I accomplished..." className="game-input flex-1" />
          </div>
        ))}
      </div>

      {/* Gratitude */}
      <div className="game-card p-5 space-y-3">
        <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">3 Gratitudes</h3>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 mt-2">
              <span className="text-xs text-yellow-400">✦</span>
            </div>
            <input value={data.gratitudes[i] || ''}
              onChange={e => setData(d => ({ ...d, gratitudes: d.gratitudes.map((g, idx) => idx === i ? e.target.value : g) }))}
              placeholder="I'm grateful for..." className="game-input flex-1" />
          </div>
        ))}
      </div>

      {/* Highlight & Improvement */}
      <div className="game-card p-5 space-y-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Day's Highlight</label>
          <input value={data.highlight} onChange={e => setData(d => ({ ...d, highlight: e.target.value }))}
            placeholder="The best moment or achievement today..." className="game-input w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">One Thing to Improve</label>
          <input value={data.improvement} onChange={e => setData(d => ({ ...d, improvement: e.target.value }))}
            placeholder="Tomorrow I will..." className="game-input w-full" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Tomorrow's #1 Focus</label>
          <input value={data.tomorrowFocus} onChange={e => setData(d => ({ ...d, tomorrowFocus: e.target.value }))}
            placeholder="The most important thing tomorrow is..." className="game-input w-full" />
        </div>
      </div>

      {/* Self-care checklist */}
      <div className="game-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-wider">Self-Care Checklist</h3>
          <span className="text-xs text-slate-500">{selfCareScore}/{SELF_CARE_ITEMS.length}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SELF_CARE_ITEMS.map((item, i) => (
            <button key={i} onClick={() => setData(d => ({ ...d, selfCare: d.selfCare.map((v, idx) => idx === i ? !v : v) }))}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs text-left transition-all ${data.selfCare[i] ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${data.selfCare[i] ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                {data.selfCare[i] && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <button onClick={save} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors">
        <Moon className="w-4 h-4 inline mr-2" />
        {saved ? 'Update Review' : 'Save Nightly Review'}
      </button>
    </div>
  )
}
