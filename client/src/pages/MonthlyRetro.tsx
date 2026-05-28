import { useState, useEffect } from 'react'
import { BarChart3, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MonthlyEntry {
  id: string
  month: string
  year: number
  overallScore: number
  highlights: string
  challenges: string
  lessons: string
  gratitude: string
  nextMonthGoals: string
  healthScore: number
  workScore: number
  relationshipScore: number
  financeScore: number
  growthScore: number
  createdAt: string
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const SCORE_AREAS = [
  { key: 'healthScore',       label: 'Health',        color: '#22c55e' },
  { key: 'workScore',         label: 'Work',          color: '#3b82f6' },
  { key: 'relationshipScore', label: 'Relationships', color: '#ec4899' },
  { key: 'financeScore',      label: 'Finance',       color: '#f59e0b' },
  { key: 'growthScore',       label: 'Growth',        color: '#a855f7' },
] as const

const STORAGE_KEY = 'monthly_retro'

function getScoreColor(score: number) {
  if (score >= 8) return '#22c55e'
  if (score >= 6) return '#f59e0b'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

export default function MonthlyRetro() {
  const { toastSuccess } = useToast()
  const now = new Date()
  const [entries, setEntries] = useState<MonthlyEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<MonthlyEntry, 'id' | 'createdAt'>>({
    month: MONTHS[now.getMonth()], year: now.getFullYear(),
    overallScore: 7, highlights: '', challenges: '', lessons: '', gratitude: '', nextMonthGoals: '',
    healthScore: 7, workScore: 7, relationshipScore: 7, financeScore: 7, growthScore: 7,
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: MonthlyEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.highlights.trim()) return
    const e: MonthlyEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm({ month: MONTHS[now.getMonth()], year: now.getFullYear(), overallScore: 7, highlights: '', challenges: '', lessons: '', gratitude: '', nextMonthGoals: '', healthScore: 7, workScore: 7, relationshipScore: 7, financeScore: 7, growthScore: 7 })
    setShowForm(false)
    toastSuccess('Monthly retro saved 📅')
  }

  const avgScore = entries.length
    ? (entries.reduce((s, e) => s + e.overallScore, 0) / entries.length).toFixed(1)
    : '—'

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <BarChart3 className="w-7 h-7 text-cyan-400" />
            Monthly Retro
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Monthly reflections to learn and grow.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Months</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-cyan-400">{avgScore}</div>
          <div className="text-xs text-slate-500">Avg Score</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length > 0 ? entries[0].overallScore : '—'}</div>
          <div className="text-xs text-slate-500">Last Month</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-cyan-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Monthly Retrospective</h3>
          <div className="flex gap-2">
            <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} className="game-input text-sm flex-1">
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input type="number" value={form.year} min={2020} max={2030}
              onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
              className="game-input w-24 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-36">Overall score: {form.overallScore}/10</span>
            <input type="range" min={1} max={10} value={form.overallScore}
              onChange={e => setForm(f => ({ ...f, overallScore: Number(e.target.value) }))}
              className="flex-1 h-1 accent-cyan-400" />
          </div>
          <div className="space-y-1.5">
            {SCORE_AREAS.map(area => (
              <div key={area.key} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-28">{area.label}: {form[area.key]}/10</span>
                <input type="range" min={1} max={10} value={form[area.key]}
                  onChange={e => setForm(f => ({ ...f, [area.key]: Number(e.target.value) }))}
                  className="flex-1 h-1" style={{ accentColor: area.color }} />
              </div>
            ))}
          </div>
          <textarea value={form.highlights} onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))}
            placeholder="✨ Highlights & wins this month... *" className="game-input w-full h-16 resize-none text-sm" />
          <textarea value={form.challenges} onChange={e => setForm(f => ({ ...f, challenges: e.target.value }))}
            placeholder="⚡ Challenges & obstacles..." className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.lessons} onChange={e => setForm(f => ({ ...f, lessons: e.target.value }))}
            placeholder="💡 Key lessons learned..." className="game-input w-full h-14 resize-none text-sm" />
          <textarea value={form.gratitude} onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
            placeholder="🙏 What I'm grateful for..." className="game-input w-full h-12 resize-none text-sm" />
          <textarea value={form.nextMonthGoals} onChange={e => setForm(f => ({ ...f, nextMonthGoals: e.target.value }))}
            placeholder="🎯 Goals for next month..." className="game-input w-full h-14 resize-none text-sm" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-sm font-semibold">Save Retro</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const isExp = expanded === e.id
          const scoreColor = getScoreColor(e.overallScore)
          return (
            <div key={e.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${scoreColor}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0" style={{ background: scoreColor + '20' }}>
                  <span className="text-lg font-bold" style={{ color: scoreColor }}>{e.overallScore}</span>
                  <span className="text-[9px] text-slate-500">/10</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">{e.month} {e.year}</div>
                  <p className="text-xs text-slate-500 truncate">{e.highlights}</p>
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-3">
                  <div className="space-y-1.5">
                    {SCORE_AREAS.map(area => (
                      <div key={area.key} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-24">{area.label}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full">
                          <div className="h-full rounded-full" style={{ width: `${e[area.key] * 10}%`, background: area.color }} />
                        </div>
                        <span className="text-xs text-slate-500 w-4">{e[area.key]}</span>
                      </div>
                    ))}
                  </div>
                  {e.highlights && <p className="text-xs text-slate-300"><span className="text-slate-500">✨ </span>{e.highlights}</p>}
                  {e.challenges && <p className="text-xs text-slate-400"><span className="text-slate-500">⚡ </span>{e.challenges}</p>}
                  {e.lessons && <p className="text-xs text-teal-400 italic">💡 {e.lessons}</p>}
                  {e.nextMonthGoals && <p className="text-xs text-blue-400">🎯 {e.nextMonthGoals}</p>}
                  <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-xs text-slate-700 hover:text-red-400">Delete</button>
                </div>
              )}
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Review each month to compound your growth.</p>
          </div>
        )}
      </div>
    </div>
  )
}
