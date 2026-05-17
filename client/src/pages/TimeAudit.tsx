import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, PieChart, ChevronLeft, ChevronRight } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface TimeBlock {
  id: string
  category: string
  activity: string
  startTime: string
  endTime: string
  date: string
  minutes: number
}

const CATEGORIES = [
  { name: 'Deep Work', color: '#6366f1', emoji: '🧠' },
  { name: 'Meetings', color: '#f59e0b', emoji: '👥' },
  { name: 'Admin', color: '#64748b', emoji: '📋' },
  { name: 'Learning', color: '#3b82f6', emoji: '📚' },
  { name: 'Exercise', color: '#22c55e', emoji: '💪' },
  { name: 'Social', color: '#ec4899', emoji: '❤️' },
  { name: 'Rest', color: '#8b5cf6', emoji: '🌙' },
  { name: 'Eating', color: '#f97316', emoji: '🍎' },
  { name: 'Commute', color: '#6b7280', emoji: '🚗' },
  { name: 'Entertainment', color: '#ef4444', emoji: '🎮' },
  { name: 'Chores', color: '#92400e', emoji: '🧹' },
  { name: 'Other', color: '#334155', emoji: '📌' },
]

const STORAGE_KEY = 'time_audit'

function getDateKey(date: string) { return `${STORAGE_KEY}_${date}` }
function getAllDates(): string[] {
  try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY}_dates`) || '[]') } catch { return [] }
}
function saveDate(date: string) {
  const dates = getAllDates()
  if (!dates.includes(date)) {
    dates.unshift(date)
    localStorage.setItem(`${STORAGE_KEY}_dates`, JSON.stringify(dates.slice(0, 30)))
  }
}

function getBlocks(date: string): TimeBlock[] {
  try { return JSON.parse(localStorage.getItem(getDateKey(date)) || '[]') } catch { return [] }
}
function saveBlocks(date: string, blocks: TimeBlock[]) {
  localStorage.setItem(getDateKey(date), JSON.stringify(blocks))
  saveDate(date)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToHours(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return h > 0 ? `${h}h ${min > 0 ? min + 'm' : ''}` : `${min}m`
}

export default function TimeAudit() {
  const { toastSuccess } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: 'Deep Work', activity: '', startTime: '09:00', endTime: '10:00' })

  useEffect(() => {
    setBlocks(getBlocks(date).sort((a, b) => a.startTime.localeCompare(b.startTime)))
  }, [date])

  const save = () => {
    if (!form.activity.trim()) return
    const start = timeToMinutes(form.startTime)
    const end = timeToMinutes(form.endTime)
    if (end <= start) return
    const block: TimeBlock = {
      id: Date.now().toString(),
      category: form.category,
      activity: form.activity.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      date,
      minutes: end - start,
    }
    const updated = [...blocks, block].sort((a, b) => a.startTime.localeCompare(b.startTime))
    saveBlocks(date, updated)
    setBlocks(updated)
    setForm(f => ({ ...f, activity: '', startTime: form.endTime, endTime: form.endTime.replace(/(\d+):/, (_, h) => `${Math.min(23, parseInt(h) + 1)}:`) }))
    setShowForm(false)
    toastSuccess('Time block logged!')
  }

  const del = (id: string) => {
    const updated = blocks.filter(b => b.id !== id)
    saveBlocks(date, updated)
    setBlocks(updated)
  }

  const shiftDate = (d: number) => {
    const dt = new Date(date + 'T12:00:00')
    dt.setDate(dt.getDate() + d)
    setDate(dt.toISOString().split('T')[0])
  }

  // Category totals
  const catTotals = CATEGORIES.map(cat => ({
    ...cat,
    minutes: blocks.filter(b => b.category === cat.name).reduce((s, b) => s + b.minutes, 0),
  })).filter(c => c.minutes > 0).sort((a, b) => b.minutes - a.minutes)

  const totalMinutes = blocks.reduce((s, b) => s + b.minutes, 0)
  const deepWorkMinutes = blocks.filter(b => b.category === 'Deep Work').reduce((s, b) => s + b.minutes, 0)

  const isToday = date === today

  // Weekly summary from stored dates
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000)
    return d.toISOString().split('T')[0]
  })

  const weeklyDeepWork = weekDates.map(d => ({
    date: d,
    day: new Date(d + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
    minutes: getBlocks(d).filter(b => b.category === 'Deep Work').reduce((s, b) => s + b.minutes, 0),
  }))

  const maxWeekMinutes = Math.max(...weeklyDeepWork.map(d => d.minutes), 60)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Clock className="w-7 h-7 text-blue-400" />
            Time Audit
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track how you actually spend your time</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Log Block
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-blue-400">{minutesToHours(totalMinutes)}</div>
          <div className="text-xs text-slate-500">Tracked Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-indigo-400">{minutesToHours(deepWorkMinutes)}</div>
          <div className="text-xs text-slate-500">Deep Work</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-slate-400">{blocks.length}</div>
          <div className="text-xs text-slate-500">Blocks Logged</div>
        </div>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => shiftDate(-1)} className="p-2 text-slate-500 hover:text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-white">{isToday ? 'Today' : date}</span>
        <button onClick={() => shiftDate(1)} disabled={isToday} className="p-2 text-slate-500 hover:text-slate-300 disabled:opacity-30">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-blue-500/20">
          <h3 className="font-semibold text-slate-300">Log Time Block</h3>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.name} onClick={() => setForm(f => ({ ...f, category: c.name }))}
                  className="px-2 py-1 rounded-lg text-xs transition-all"
                  style={form.category === c.name ? { background: c.color + '30', color: c.color, border: `1px solid ${c.color}` } : { background: '#1e293b', color: '#64748b' }}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
          <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
            placeholder="What did you do? (e.g. Wrote project proposal)" className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Start</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">End</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="game-input w-full" />
            </div>
          </div>
          {form.startTime && form.endTime && timeToMinutes(form.endTime) > timeToMinutes(form.startTime) && (
            <div className="text-xs text-slate-500">
              Duration: {minutesToHours(timeToMinutes(form.endTime) - timeToMinutes(form.startTime))}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={save} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Save Block
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <PieChart className="w-4 h-4" /> Time Distribution
          </h3>
          <div className="space-y-2">
            {catTotals.map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-sm w-4">{cat.emoji}</span>
                <div className="text-xs text-slate-400 w-24 flex-shrink-0">{cat.name}</div>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(cat.minutes / totalMinutes) * 100}%`, background: cat.color }} />
                </div>
                <div className="text-xs text-slate-300 w-16 text-right flex-shrink-0">
                  {minutesToHours(cat.minutes)} <span className="text-slate-600">({Math.round((cat.minutes / totalMinutes) * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline of blocks */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Timeline</h3>
          {blocks.map(block => {
            const cat = CATEGORIES.find(c => c.name === block.category) || CATEGORIES[CATEGORIES.length - 1]
            return (
              <div key={block.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: cat.color + '10', borderLeft: `3px solid ${cat.color}` }}>
                <div className="text-sm">{cat.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">{block.activity}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {block.startTime} – {block.endTime} · {minutesToHours(block.minutes)}
                  </div>
                </div>
                <button onClick={() => del(block.id)} className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Weekly deep work chart */}
      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Deep Work — Last 7 Days</h3>
        <div className="flex items-end gap-2 h-20">
          {weeklyDeepWork.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-sm transition-all duration-500"
                style={{ height: `${(d.minutes / maxWeekMinutes) * 100}%`, background: d.date === date ? '#6366f1' : '#6366f150', minHeight: '3px' }} />
              <div className="text-[9px] text-slate-600">{d.day.slice(0, 1)}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-600 text-center mt-1">
          Week total: {minutesToHours(weeklyDeepWork.reduce((s, d) => s + d.minutes, 0))} deep work
        </div>
      </div>

      {blocks.length === 0 && !showForm && (
        <div className="text-center py-16 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No time blocks logged for this day.</p>
          <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Log First Block
          </button>
        </div>
      )}
    </div>
  )
}
