import { useState, useEffect, KeyboardEvent } from 'react'
import { Sun, Cloud, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp, Star, BarChart3, Calendar, Activity } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'emotional_weather_log'

type WeatherType = 'sunny' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'windy' | 'snowy' | 'rainbow'

interface EmotionalWeatherEntry {
  id: string
  date: string
  morningWeather: WeatherType
  afternoonWeather: WeatherType
  eveningWeather: WeatherType
  dominantEmotion: string
  intensity: 1 | 2 | 3 | 4 | 5
  emotionTags: string[]
  weatherNote: string
  silverLining: string
  forecast: string
}

const WEATHER_EMOJI: Record<WeatherType, string> = {
  'sunny':         '☀️',
  'partly-cloudy': '⛅',
  'cloudy':        '☁️',
  'rainy':         '🌧',
  'stormy':        '⛈',
  'foggy':         '🌫',
  'windy':         '💨',
  'snowy':         '❄️',
  'rainbow':       '🌈',
}

const WEATHER_TYPES: WeatherType[] = ['sunny', 'partly-cloudy', 'cloudy', 'rainy', 'stormy', 'foggy', 'windy', 'snowy', 'rainbow']

const WEATHER_LABEL: Record<WeatherType, string> = {
  'sunny':         'Sunny',
  'partly-cloudy': 'Partly Cloudy',
  'cloudy':        'Cloudy',
  'rainy':         'Rainy',
  'stormy':        'Stormy',
  'foggy':         'Foggy',
  'windy':         'Windy',
  'snowy':         'Snowy',
  'rainbow':       'Rainbow',
}

const WEATHER_COLOR: Record<WeatherType, string> = {
  'sunny':         '#f59e0b',
  'partly-cloudy': '#60a5fa',
  'cloudy':        '#94a3b8',
  'rainy':         '#3b82f6',
  'stormy':        '#7c3aed',
  'foggy':         '#64748b',
  'windy':         '#06b6d4',
  'snowy':         '#e0f2fe',
  'rainbow':       '#ec4899',
}

const PRESET_EMOTIONS = [
  'anxious', 'hopeful', 'grateful', 'tired', 'excited', 'content',
  'frustrated', 'peaceful', 'overwhelmed', 'inspired', 'sad', 'energized',
]

const INTENSITY_LABELS: Record<number, string> = {
  1: 'Calm',
  2: 'Mild',
  3: 'Moderate',
  4: 'Strong',
  5: 'Intense',
}

type FormState = {
  date: string
  morningWeather: WeatherType
  afternoonWeather: WeatherType
  eveningWeather: WeatherType
  dominantEmotion: string
  intensity: 1 | 2 | 3 | 4 | 5
  emotionTags: string[]
  weatherNote: string
  silverLining: string
  forecast: string
}

const defaultForm = (): FormState => ({
  date: new Date().toISOString().split('T')[0],
  morningWeather: 'sunny',
  afternoonWeather: 'partly-cloudy',
  eveningWeather: 'cloudy',
  dominantEmotion: '',
  intensity: 3,
  emotionTags: [],
  weatherNote: '',
  silverLining: '',
  forecast: '',
})

function WeatherPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: WeatherType
  onChange: (v: WeatherType) => void
}) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2 font-medium">{label}</p>
      <div className="grid grid-cols-3 gap-1.5">
        {WEATHER_TYPES.map(wt => (
          <button
            key={wt}
            onClick={() => onChange(wt)}
            title={WEATHER_LABEL[wt]}
            className="flex flex-col items-center justify-center p-2 rounded-xl text-xl transition-all"
            style={value === wt
              ? { background: WEATHER_COLOR[wt] + '30', border: `1.5px solid ${WEATHER_COLOR[wt]}80`, transform: 'scale(1.08)' }
              : { background: '#1e293b', border: '1.5px solid transparent' }}
          >
            <span>{WEATHER_EMOJI[wt]}</span>
            <span className="text-[9px] mt-0.5" style={{ color: value === wt ? WEATHER_COLOR[wt] : '#475569' }}>
              {WEATHER_LABEL[wt].split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function EmotionalWeatherLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<EmotionalWeatherEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm())
  const [tagInput, setTagInput] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const persist = (updated: EmotionalWeatherEntry[]) => {
    setEntries(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const addTag = (tag: string) => {
    const t = tag.trim()
    if (t && !form.emotionTags.includes(t)) setForm(f => ({ ...f, emotionTags: [...f.emotionTags, t] }))
    setTagInput('')
  }

  const handleTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
  }

  const submit = () => {
    const entry: EmotionalWeatherEntry = { id: Date.now().toString(), ...form }
    persist([entry, ...entries])
    setForm(defaultForm())
    setTagInput('')
    setShowForm(false)
    toastSuccess('Weather report filed! 🌤')
  }

  // 7-day calendar
  const last7: Array<EmotionalWeatherEntry | null> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    last7.push(entries.find(e => e.date === dateStr) ?? null)
  }

  // Seasonal patterns — emotion tag frequency
  const tagFreq: Record<string, number> = {}
  entries.forEach(e => e.emotionTags.forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1 }))
  const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const maxTagCount = topTags.length > 0 ? topTags[0][1] : 1

  // Dominant weather — all weather slots
  const weatherCounts: Record<WeatherType, number> = {} as Record<WeatherType, number>
  WEATHER_TYPES.forEach(wt => { weatherCounts[wt] = 0 })
  entries.forEach(e => {
    weatherCounts[e.morningWeather]++
    weatherCounts[e.afternoonWeather]++
    weatherCounts[e.eveningWeather]++
  })
  const totalSlots = entries.length * 3 || 1
  const weatherSorted = WEATHER_TYPES.map(wt => ({ wt, count: weatherCounts[wt] })).filter(x => x.count > 0).sort((a, b) => b.count - a.count)

  // Stats
  const totalDays = entries.length
  const mostCommonWeather = weatherSorted[0]?.wt ?? null
  const mostCommonTag = topTags[0]?.[0] ?? null

  // Streak — consecutive days ending today
  let streakCount = 0
  {
    const today = new Date()
    for (let i = 0; i < entries.length; i++) {
      const expected = new Date()
      expected.setDate(today.getDate() - i)
      const expectedStr = expected.toISOString().split('T')[0]
      if (entries.find(e => e.date === expectedStr)) streakCount++
      else break
    }
  }

  const recentEntries = entries.slice(0, 14)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-amber-400" />
            Emotional Weather Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Track your emotional weather — moods pass like weather patterns.
          </p>
        </div>
        <button
          onClick={() => { setForm(defaultForm()); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> File Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{totalDays}</div>
          <div className="text-xs text-slate-500">Days Logged</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400">{streakCount}</div>
          <div className="text-xs text-slate-500">Day Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl">{mostCommonWeather ? WEATHER_EMOJI[mostCommonWeather] : '—'}</div>
          <div className="text-xs text-slate-500">Top Weather</div>
        </div>
        <div className="game-card p-3">
          <div className="text-sm font-bold text-blue-300 truncate">{mostCommonTag ?? '—'}</div>
          <div className="text-xs text-slate-500">Top Emotion</div>
        </div>
      </div>

      {/* Today's weather report form */}
      {showForm && (
        <div className="game-card p-4 border border-amber-500/20 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-amber-400" /> Today's Weather Report
          </h3>

          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="game-input text-sm w-full"
          />

          {/* 3 weather pickers */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <WeatherPicker label="Morning" value={form.morningWeather} onChange={v => setForm(f => ({ ...f, morningWeather: v }))} />
            <WeatherPicker label="Afternoon" value={form.afternoonWeather} onChange={v => setForm(f => ({ ...f, afternoonWeather: v }))} />
            <WeatherPicker label="Evening" value={form.eveningWeather} onChange={v => setForm(f => ({ ...f, eveningWeather: v }))} />
          </div>

          {/* Dominant emotion */}
          <input
            value={form.dominantEmotion}
            onChange={e => setForm(f => ({ ...f, dominantEmotion: e.target.value }))}
            placeholder="Dominant emotion today..."
            className="game-input text-sm w-full"
          />

          {/* Intensity */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Intensity</p>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setForm(f => ({ ...f, intensity: v }))}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={form.intensity === v
                    ? { background: '#f59e0b30', color: '#f59e0b', border: '1.5px solid #f59e0b60' }
                    : { background: '#1e293b', color: '#64748b' }}
                >
                  {v}<br />
                  <span className="text-[9px]">{INTENSITY_LABELS[v]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Emotion tags */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Emotion Tags</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_EMOTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    if (form.emotionTags.includes(tag)) {
                      setForm(f => ({ ...f, emotionTags: f.emotionTags.filter(x => x !== tag) }))
                    } else {
                      setForm(f => ({ ...f, emotionTags: [...f.emotionTags, tag] }))
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs transition-all"
                  style={form.emotionTags.includes(tag)
                    ? { background: '#3b82f630', color: '#60a5fa', border: '1px solid #3b82f660' }
                    : { background: '#1e293b', color: '#64748b' }}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap mb-1">
              {form.emotionTags.filter(t => !PRESET_EMOTIONS.includes(t)).map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-lg text-xs">
                  {t}
                  <button onClick={() => setForm(f => ({ ...f, emotionTags: f.emotionTags.filter(x => x !== t) }))} className="text-blue-500 hover:text-blue-200">×</button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKey}
              placeholder="Add custom tag, press Enter"
              className="game-input text-sm w-full"
            />
          </div>

          {/* Weather note */}
          <textarea
            value={form.weatherNote}
            onChange={e => setForm(f => ({ ...f, weatherNote: e.target.value }))}
            placeholder="Any notes about today's emotional weather..."
            className="game-input w-full h-14 resize-none text-sm"
          />

          {/* Silver lining */}
          <input
            value={form.silverLining}
            onChange={e => setForm(f => ({ ...f, silverLining: e.target.value }))}
            placeholder="Silver lining — even on stormy days, what's good?"
            className="game-input text-sm w-full"
          />

          {/* Forecast */}
          <input
            value={form.forecast}
            onChange={e => setForm(f => ({ ...f, forecast: e.target.value }))}
            placeholder="Forecast — how do you expect to feel tomorrow?"
            className="game-input text-sm w-full"
          />

          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
              File Report
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* 7-day weather calendar */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" /> 7-Day Weather
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {last7.map((entry, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (6 - i))
            const dayLabel = d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)
            const dateNum = d.getDate()
            return (
              <div
                key={i}
                className="flex flex-col items-center p-2 rounded-xl text-center"
                style={{ background: entry ? '#1e293b' : '#0f172a', border: entry ? '1px solid #334155' : '1px solid #1e293b' }}
              >
                <p className="text-[10px] text-slate-500">{dayLabel}</p>
                <p className="text-xs text-slate-400 font-medium">{dateNum}</p>
                {entry ? (
                  <>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-base">{WEATHER_EMOJI[entry.morningWeather]}</span>
                      <span className="text-base">{WEATHER_EMOJI[entry.afternoonWeather]}</span>
                      <span className="text-base">{WEATHER_EMOJI[entry.eveningWeather]}</span>
                    </div>
                    <div className="mt-1 flex gap-0.5">
                      {Array.from({ length: entry.intensity }).map((_, ii) => (
                        <span key={ii} className="w-1 h-1 rounded-full bg-amber-400 inline-block" />
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-slate-700 text-xl mt-1">·</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Dominant weather bars */}
      {weatherSorted.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" /> Weather Distribution
          </h3>
          <div className="space-y-2">
            {weatherSorted.map(({ wt, count }) => {
              const pct = Math.round((count / totalSlots) * 100)
              return (
                <div key={wt} className="flex items-center gap-2">
                  <span className="text-lg w-6 text-center">{WEATHER_EMOJI[wt]}</span>
                  <span className="text-xs text-slate-400 w-24 truncate">{WEATHER_LABEL[wt]}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: WEATHER_COLOR[wt] }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Seasonal patterns — emotion tag word cloud */}
      {topTags.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Emotional Patterns
          </h3>
          <div className="flex flex-wrap gap-2 items-end">
            {topTags.map(([tag, count]) => {
              const scale = 0.75 + (count / maxTagCount) * 0.75
              return (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-xl font-medium transition-all"
                  style={{
                    fontSize: `${scale * 0.875}rem`,
                    background: '#3b82f6' + Math.round((count / maxTagCount) * 40 + 15).toString(16).padStart(2, '0'),
                    color: `rgba(147,197,253,${0.5 + (count / maxTagCount) * 0.5})`,
                    border: `1px solid #3b82f6${Math.round((count / maxTagCount) * 40 + 15).toString(16).padStart(2, '0')}`,
                  }}
                >
                  {tag} <span className="text-[10px] opacity-60">{count}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> Recent Entries
          </h3>
          {recentEntries.map(e => {
            const isExp = expanded === e.id
            return (
              <div key={e.id} className="game-card overflow-hidden">
                <div
                  className="p-3 flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpanded(isExp ? null : e.id)}
                >
                  <div className="flex gap-0.5 shrink-0">
                    <span className="text-base">{WEATHER_EMOJI[e.morningWeather]}</span>
                    <span className="text-base">{WEATHER_EMOJI[e.afternoonWeather]}</span>
                    <span className="text-base">{WEATHER_EMOJI[e.eveningWeather]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{e.dominantEmotion || 'No dominant emotion'}</p>
                    <p className="text-xs text-slate-500">{e.date}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {Array.from({ length: e.intensity }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      ))}
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </div>
                </div>
                {isExp && (
                  <div className="border-t border-slate-800 p-3 space-y-2">
                    {e.emotionTags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {e.emotionTags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded-lg text-xs">{t}</span>
                        ))}
                      </div>
                    )}
                    {e.weatherNote && <p className="text-xs text-slate-300"><span className="text-slate-500 font-medium">Note: </span>{e.weatherNote}</p>}
                    {e.silverLining && <p className="text-xs text-yellow-300"><span className="text-yellow-500 font-medium">Silver lining: </span>{e.silverLining}</p>}
                    {e.forecast && <p className="text-xs text-blue-300"><span className="text-blue-500 font-medium">Forecast: </span>{e.forecast}</p>}
                    <button
                      onClick={() => persist(entries.filter(x => x.id !== e.id))}
                      className="ml-auto flex text-slate-600 hover:text-red-400 transition-colors mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm mb-4">Start filing daily emotional weather reports to spot patterns.</p>
          <button onClick={() => { setForm(defaultForm()); setShowForm(true) }} className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">
            File Your First Report
          </button>
        </div>
      )}
    </div>
  )
}
