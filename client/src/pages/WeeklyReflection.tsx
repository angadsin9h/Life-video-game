import { useState, useEffect } from 'react'
import { Calendar, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface WeeklyReflectionEntry {
  id: string
  weekStart: string
  weekEnd: string
  weekNumber: number
  year: number
  highlights: string[]
  challenges: string[]
  lessons: string
  gratitude: string
  energyLevel: number
  productivityLevel: number
  moodLevel: number
  topWin: string
  biggestStruggle: string
  nextWeekFocus: string
  oneWordSummary: string
  wouldChangeAnything: string
  createdAt: string
}

const STORAGE_KEY = 'weekly_reflection_v2'

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getWeekDates() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
    week: getWeekNumber(monday),
    year: monday.getFullYear(),
  }
}

export default function WeeklyReflection() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<WeeklyReflectionEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [newHighlight, setNewHighlight] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const week = getWeekDates()
  const [form, setForm] = useState<Omit<WeeklyReflectionEntry, 'id' | 'createdAt'>>({
    weekStart: week.start, weekEnd: week.end, weekNumber: week.week, year: week.year,
    highlights: [], challenges: [], lessons: '', gratitude: '',
    energyLevel: 7, productivityLevel: 7, moodLevel: 7,
    topWin: '', biggestStruggle: '', nextWeekFocus: '', oneWordSummary: '', wouldChangeAnything: '',
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: WeeklyReflectionEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.oneWordSummary.trim()) return
    const e: WeeklyReflectionEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, highlights: [], challenges: [], lessons: '', gratitude: '', topWin: '', biggestStruggle: '', nextWeekFocus: '', oneWordSummary: '', wouldChangeAnything: '' }))
    setNewHighlight('')
    setNewChallenge('')
    setShowForm(false)
    toastSuccess('Week reflected on 📅')
  }

  const avgEnergy = entries.length > 0 ? Math.round(entries.slice(0, 8).reduce((s, e) => s + e.energyLevel, 0) / Math.min(8, entries.length) * 10) / 10 : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Calendar className="w-7 h-7 text-indigo-400" />
            Weekly Reflection
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Deep weekly review to learn and grow every week.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Reflect
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Weeks</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-indigo-400">W{week.week}</div>
          <div className="text-xs text-slate-500">Current Week</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{avgEnergy}/10</div>
          <div className="text-xs text-slate-500">Avg Energy</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-indigo-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Week {form.weekNumber} Reflection — {form.weekStart} to {form.weekEnd}</h3>
          <input value={form.oneWordSummary} onChange={e => setForm(f => ({ ...f, oneWordSummary: e.target.value }))}
            placeholder="One word that describes this week *" className="game-input w-full" autoFocus />
          <input value={form.topWin} onChange={e => setForm(f => ({ ...f, topWin: e.target.value }))}
            placeholder="Top win of the week" className="game-input w-full text-sm" />
          <input value={form.biggestStruggle} onChange={e => setForm(f => ({ ...f, biggestStruggle: e.target.value }))}
            placeholder="Biggest struggle this week" className="game-input w-full text-sm" />
          <div className="flex gap-2">
            <input value={newHighlight} onChange={e => setNewHighlight(e.target.value)}
              placeholder="Add highlight..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newHighlight.trim()) { setForm(f => ({ ...f, highlights: [...f.highlights, newHighlight.trim()] })); setNewHighlight('') } }} />
            <button onClick={() => { if (newHighlight.trim()) { setForm(f => ({ ...f, highlights: [...f.highlights, newHighlight.trim()] })); setNewHighlight('') } }}
              className="px-3 py-1.5 bg-green-700/30 text-green-400 rounded-xl text-xs">+</button>
          </div>
          {form.highlights.length > 0 && (
            <div className="space-y-1">
              {form.highlights.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-green-400">✓</span>
                  <span className="text-xs text-slate-300 flex-1">{h}</span>
                  <button onClick={() => setForm(f => ({ ...f, highlights: f.highlights.filter((_, j) => j !== i) }))} className="text-slate-600 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={newChallenge} onChange={e => setNewChallenge(e.target.value)}
              placeholder="Add challenge..." className="game-input flex-1 text-sm"
              onKeyDown={e => { if (e.key === 'Enter' && newChallenge.trim()) { setForm(f => ({ ...f, challenges: [...f.challenges, newChallenge.trim()] })); setNewChallenge('') } }} />
            <button onClick={() => { if (newChallenge.trim()) { setForm(f => ({ ...f, challenges: [...f.challenges, newChallenge.trim()] })); setNewChallenge('') } }}
              className="px-3 py-1.5 bg-red-700/30 text-red-400 rounded-xl text-xs">+</button>
          </div>
          {form.challenges.length > 0 && (
            <div className="space-y-1">
              {form.challenges.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-red-400">!</span>
                  <span className="text-xs text-slate-300 flex-1">{c}</span>
                  <button onClick={() => setForm(f => ({ ...f, challenges: f.challenges.filter((_, j) => j !== i) }))} className="text-slate-600 hover:text-red-400 text-xs">×</button>
                </div>
              ))}
            </div>
          )}
          <textarea value={form.lessons} onChange={e => setForm(f => ({ ...f, lessons: e.target.value }))}
            placeholder="Key lessons learned this week..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.gratitude} onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
            placeholder="What are you grateful for this week?" className="game-input w-full h-12 resize-none text-sm" />
          <input value={form.nextWeekFocus} onChange={e => setForm(f => ({ ...f, nextWeekFocus: e.target.value }))}
            placeholder="Main focus for next week" className="game-input w-full text-sm" />
          <input value={form.wouldChangeAnything} onChange={e => setForm(f => ({ ...f, wouldChangeAnything: e.target.value }))}
            placeholder="What would you do differently?" className="game-input w-full text-sm" />
          <div className="space-y-2">
            {(['energyLevel', 'productivityLevel', 'moodLevel'] as const).map(field => (
              <div key={field}>
                <p className="text-xs text-slate-500 mb-1">{field === 'energyLevel' ? 'Energy' : field === 'productivityLevel' ? 'Productivity' : 'Mood'}: {form[field]}/10</p>
                <input type="range" min={1} max={10} value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: Number(e.target.value) }))}
                  className="w-full h-1 accent-indigo-400" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold">Save Reflection</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const isExp = expanded === e.id
          const avg = Math.round((e.energyLevel + e.productivityLevel + e.moodLevel) / 3)
          return (
            <div key={e.id} className="game-card overflow-hidden border-l-4 border-indigo-500/50">
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <span className="text-2xl">📅</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">W{e.weekNumber} {e.year}</span>
                    <span className="text-xs bg-indigo-900/30 text-indigo-400 px-1.5 rounded">{e.oneWordSummary}</span>
                  </div>
                  <p className="text-xs text-slate-500">{e.weekStart} · avg score {avg}/10</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {e.topWin && <p className="text-xs text-green-300">🏆 {e.topWin}</p>}
                  {e.biggestStruggle && <p className="text-xs text-red-300">⚠️ {e.biggestStruggle}</p>}
                  {e.highlights.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Highlights:</p>
                      {e.highlights.map((h, i) => <p key={i} className="text-xs text-slate-300">✓ {h}</p>)}
                    </div>
                  )}
                  {e.lessons && <p className="text-xs text-yellow-300">📖 {e.lessons}</p>}
                  {e.gratitude && <p className="text-xs text-pink-300">🙏 {e.gratitude}</p>}
                  {e.nextWeekFocus && <p className="text-xs text-blue-300">→ Next: {e.nextWeekFocus}</p>}
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span>⚡ {e.energyLevel}</span>
                    <span>🎯 {e.productivityLevel}</span>
                    <span>😊 {e.moodLevel}</span>
                  </div>
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">A week without reflection is a week without learning. Start now.</p>
          </div>
        )}
      </div>
    </div>
  )
}
