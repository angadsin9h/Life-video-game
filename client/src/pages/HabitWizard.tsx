import { useState } from 'react'
import axios from 'axios'
import { Zap, Check, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface HabitFormData {
  name: string
  category: string
  why: string
  frequency: string
  time_of_day: string
  cue: string
  reward: string
  implementation: string
  target_days: string
  difficulty: string
}

const CATEGORIES = [
  { value: 'health', label: 'Health', emoji: '💪', desc: 'Exercise, diet, sleep' },
  { value: 'mind', label: 'Mind', emoji: '🧠', desc: 'Meditation, learning, journaling' },
  { value: 'work', label: 'Work', emoji: '💼', desc: 'Deep work, skills, projects' },
  { value: 'social', label: 'Social', emoji: '👥', desc: 'Relationships, connection' },
  { value: 'creative', label: 'Creative', emoji: '🎨', desc: 'Art, music, writing' },
  { value: 'spiritual', label: 'Spiritual', emoji: '🌟', desc: 'Faith, reflection, purpose' },
]

const FREQUENCIES = [
  { value: 'daily', label: 'Every day', emoji: '📅' },
  { value: 'weekdays', label: 'Weekdays only', emoji: '💼' },
  { value: 'weekends', label: 'Weekends only', emoji: '🌴' },
  { value: 'custom', label: '3-4 times/week', emoji: '🗓️' },
]

const TIMES = [
  { value: 'morning', label: 'Morning', emoji: '🌅', time: '6-9am' },
  { value: 'midday', label: 'Midday', emoji: '☀️', time: '11am-1pm' },
  { value: 'afternoon', label: 'Afternoon', emoji: '🌤️', time: '2-5pm' },
  { value: 'evening', label: 'Evening', emoji: '🌆', time: '6-8pm' },
  { value: 'night', label: 'Night', emoji: '🌙', time: '8-10pm' },
]

const DIFFICULTIES = [
  { value: 'tiny', label: 'Tiny (2 min)', desc: 'Start absurdly small' },
  { value: 'easy', label: 'Easy (5-10 min)', desc: 'Light effort' },
  { value: 'medium', label: 'Medium (20-30 min)', desc: 'Requires discipline' },
  { value: 'hard', label: 'Hard (45+ min)', desc: 'Significant challenge' },
]

const STEPS = ['category', 'name', 'why', 'timing', 'habit-loop', 'difficulty', 'review']

export default function HabitWizard() {
  const { toastSuccess } = useToast()
  const [stepIdx, setStepIdx] = useState(0)
  const [form, setForm] = useState<HabitFormData>({
    name: '', category: '', why: '', frequency: 'daily',
    time_of_day: 'morning', cue: '', reward: '', implementation: '',
    target_days: 'daily', difficulty: 'easy',
  })
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)

  const step = STEPS[stepIdx]
  const canNext = () => {
    if (step === 'category') return !!form.category
    if (step === 'name') return form.name.trim().length > 2
    if (step === 'why') return form.why.trim().length > 5
    return true
  }

  const next = () => { if (canNext()) setStepIdx(i => Math.min(i + 1, STEPS.length - 1)) }
  const back = () => setStepIdx(i => Math.max(i - 1, 0))

  const save = async () => {
    setSaving(true)
    try {
      const targetDays = form.frequency === 'daily' ? 'mon,tue,wed,thu,fri,sat,sun'
        : form.frequency === 'weekdays' ? 'mon,tue,wed,thu,fri'
        : form.frequency === 'weekends' ? 'sat,sun'
        : 'mon,wed,fri'
      await axios.post('/api/habits', {
        name: form.name,
        category: form.category,
        description: `Why: ${form.why}. Cue: ${form.cue}. Reward: ${form.reward}. When: ${form.time_of_day}.`,
        target_days: targetDays,
        color: CATEGORIES.find(c => c.value === form.category)?.emoji,
      })
      setDone(true)
      toastSuccess(`Habit "${form.name}" created!`)
    } finally { setSaving(false) }
  }

  const reset = () => {
    setStepIdx(0)
    setForm({ name: '', category: '', why: '', frequency: 'daily', time_of_day: 'morning', cue: '', reward: '', implementation: '', target_days: 'daily', difficulty: 'easy' })
    setDone(false)
  }

  const progress = ((stepIdx + 1) / STEPS.length) * 100

  if (done) return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="game-card p-10 text-center space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-white">Habit Created!</h2>
        <p className="text-slate-400">
          <strong className="text-white">"{form.name}"</strong> is now in your habit tracker.
          Remember: start with just 2 minutes if you need to. Consistency beats perfection.
        </p>
        <div className="p-4 bg-slate-800 rounded-xl text-left space-y-2 text-sm">
          <div className="text-slate-400"><span className="text-slate-300">Cue:</span> {form.cue || 'Not set'}</div>
          <div className="text-slate-400"><span className="text-slate-300">When:</span> {form.time_of_day}</div>
          <div className="text-slate-400"><span className="text-slate-300">Reward:</span> {form.reward || 'Your progress'}</div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-semibold transition-colors">
            Build Another
          </button>
          <a href="/habits" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
            View Habits
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <RefreshCw className="w-7 h-7 text-green-400" />
          Habit Builder
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Design your habit using science-backed principles</p>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Step {stepIdx + 1} of {STEPS.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="game-card p-6">
        {/* Step: category */}
        {step === 'category' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">What area of life is this habit for?</h2>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value }))}
                  className={`p-3 rounded-xl text-left transition-all ${form.category === c.value ? 'border border-green-500/40 bg-green-900/20' : 'bg-slate-800 hover:bg-slate-700'}`}>
                  <div className="text-xl mb-1">{c.emoji}</div>
                  <div className="text-sm font-semibold text-white">{c.label}</div>
                  <div className="text-xs text-slate-500">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: name */}
        {step === 'name' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Name your habit</h2>
            <p className="text-slate-400 text-sm">Use action words. "Run 5 minutes" beats "Exercise more".</p>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Do 10 push-ups, Read for 15 minutes, Meditate..."
              className="game-input w-full text-base" autoFocus />
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Quick picks:</p>
              <div className="flex flex-wrap gap-2">
                {['Do 10 push-ups', 'Meditate 5 min', 'Read 20 pages', 'Write 200 words', 'Drink a glass of water'].map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, name: s }))}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-lg text-xs transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: why */}
        {step === 'why' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Why does this habit matter to you?</h2>
            <p className="text-slate-400 text-sm">A strong "why" keeps you going when motivation fades.</p>
            <textarea value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))}
              placeholder="e.g. I want to have more energy to play with my kids and live a long healthy life..."
              className="game-input w-full h-32 resize-none" autoFocus />
          </div>
        )}

        {/* Step: timing */}
        {step === 'timing' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">When will you do this?</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-2">Frequency</p>
                <div className="grid grid-cols-2 gap-2">
                  {FREQUENCIES.map(f => (
                    <button key={f.value} onClick={() => setForm(form => ({ ...form, frequency: f.value }))}
                      className={`p-2.5 rounded-xl text-left transition-all flex items-center gap-2 ${form.frequency === f.value ? 'border border-green-500/40 bg-green-900/20' : 'bg-slate-800 hover:bg-slate-700'}`}>
                      <span>{f.emoji}</span>
                      <span className="text-sm text-slate-300">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-2">Time of Day</p>
                <div className="grid grid-cols-3 gap-2">
                  {TIMES.map(t => (
                    <button key={t.value} onClick={() => setForm(form => ({ ...form, time_of_day: t.value }))}
                      className={`p-2 rounded-xl text-center transition-all ${form.time_of_day === t.value ? 'border border-green-500/40 bg-green-900/20' : 'bg-slate-800 hover:bg-slate-700'}`}>
                      <div className="text-lg">{t.emoji}</div>
                      <div className="text-xs text-slate-300">{t.label}</div>
                      <div className="text-[10px] text-slate-600">{t.time}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: habit loop */}
        {step === 'habit-loop' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Design your Habit Loop</h2>
            <p className="text-slate-400 text-sm">Habits form through: Cue → Routine → Reward</p>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">🎯 Cue — What will trigger this habit?</label>
              <input value={form.cue} onChange={e => setForm(f => ({ ...f, cue: e.target.value }))}
                placeholder='e.g. "After my morning coffee", "When I sit at my desk"'
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">📝 Implementation — I will [HABIT] at [TIME] in [LOCATION]</label>
              <input value={form.implementation} onChange={e => setForm(f => ({ ...f, implementation: e.target.value }))}
                placeholder={`I will ${form.name || 'do this'} at ${form.time_of_day} in my...`}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">🎁 Reward — How will you celebrate after?</label>
              <input value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))}
                placeholder='e.g. "Check it off my list", "5 min of social media", "A cup of tea"'
                className="game-input w-full" />
            </div>
          </div>
        )}

        {/* Step: difficulty */}
        {step === 'difficulty' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">How hard is this habit starting out?</h2>
            <p className="text-slate-400 text-sm">Start smaller than you think. You can always scale up.</p>
            <div className="space-y-2">
              {DIFFICULTIES.map(d => (
                <button key={d.value} onClick={() => setForm(f => ({ ...f, difficulty: d.value }))}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center justify-between ${form.difficulty === d.value ? 'border border-green-500/40 bg-green-900/20' : 'bg-slate-800 hover:bg-slate-700'}`}>
                  <div>
                    <div className="text-sm font-semibold text-white">{d.label}</div>
                    <div className="text-xs text-slate-500">{d.desc}</div>
                  </div>
                  {form.difficulty === d.value && <Check className="w-4 h-4 text-green-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: review */}
        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Review your habit</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Habit', value: form.name },
                { label: 'Category', value: form.category },
                { label: 'Why', value: form.why },
                { label: 'Frequency', value: FREQUENCIES.find(f => f.value === form.frequency)?.label },
                { label: 'Time', value: TIMES.find(t => t.value === form.time_of_day)?.label },
                { label: 'Cue', value: form.cue || '—' },
                { label: 'Reward', value: form.reward || '—' },
                { label: 'Difficulty', value: DIFFICULTIES.find(d => d.value === form.difficulty)?.label },
              ].map(r => (
                <div key={r.label} className="flex gap-3 py-2 border-b border-slate-800 last:border-0">
                  <span className="text-slate-500 w-24 flex-shrink-0">{r.label}</span>
                  <span className="text-slate-200">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-3">
        {stepIdx > 0 && (
          <button onClick={back} className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-semibold transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step !== 'review' ? (
          <button onClick={next} disabled={!canNext()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={save} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
            <Zap className="w-4 h-4" /> {saving ? 'Creating…' : 'Create Habit!'}
          </button>
        )}
      </div>
    </div>
  )
}
