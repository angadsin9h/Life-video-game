import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, Globe } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type DonationType = 'money' | 'goods' | 'time' | 'skills' | 'blood' | 'other'

interface Donation {
  id: string
  date: string
  organization: string
  cause: string
  type: DonationType
  amount: number
  currency: string
  hours: number
  description: string
  taxDeductible: boolean
  recurring: boolean
  notes: string
  createdAt: string
}

interface CharityGoal {
  yearlyTarget: number
  currency: string
}

const DONATION_TYPES: Record<DonationType, { label: string; emoji: string; color: string }> = {
  money:  { label: 'Money',       emoji: '💵', color: '#22c55e' },
  goods:  { label: 'Goods',       emoji: '📦', color: '#3b82f6' },
  time:   { label: 'Time',        emoji: '⏰', color: '#f59e0b' },
  skills: { label: 'Pro Bono',    emoji: '🛠️', color: '#a855f7' },
  blood:  { label: 'Blood',       emoji: '🩸', color: '#ef4444' },
  other:  { label: 'Other',       emoji: '🎁', color: '#94a3b8' },
}

const CAUSES = ['Education', 'Health', 'Environment', 'Poverty', 'Animals', 'Arts', 'Disaster Relief', 'Children', 'Human Rights', 'Community', 'Religious', 'Other']

const STORAGE_KEY = 'charity_tracker'
const GOAL_KEY = 'charity_goal'

export default function CharityTracker() {
  const { toastSuccess } = useToast()
  const [donations, setDonations] = useState<Donation[]>([])
  const [goal, setGoal] = useState<CharityGoal>({ yearlyTarget: 1000, currency: 'USD' })
  const [showForm, setShowForm] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const [form, setForm] = useState<Omit<Donation, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0], organization: '', cause: 'Community',
    type: 'money', amount: 0, currency: 'USD', hours: 0, description: '',
    taxDeductible: true, recurring: false, notes: '',
  })
  const [goalForm, setGoalForm] = useState({ yearlyTarget: 1000, currency: 'USD' })

  useEffect(() => {
    try {
      setDonations(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      const g = JSON.parse(localStorage.getItem(GOAL_KEY) || 'null')
      if (g) { setGoal(g); setGoalForm(g) }
    } catch { /**/ }
  }, [])

  const save = (u: Donation[]) => { setDonations(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.organization.trim()) return
    const d: Donation = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([d, ...donations])
    setForm({ date: new Date().toISOString().split('T')[0], organization: '', cause: 'Community', type: 'money', amount: 0, currency: 'USD', hours: 0, description: '', taxDeductible: true, recurring: false, notes: '' })
    setShowForm(false)
    toastSuccess(`Donation to ${form.organization} recorded 💙`)
  }

  const saveGoal = () => {
    setGoal(goalForm)
    localStorage.setItem(GOAL_KEY, JSON.stringify(goalForm))
    setShowGoal(false)
    toastSuccess('Goal updated')
  }

  const thisYear = new Date().getFullYear().toString()
  const yearDonations = donations.filter(d => d.date.startsWith(thisYear))
  const yearMoney = yearDonations.filter(d => d.type === 'money').reduce((s, d) => s + d.amount, 0)
  const totalMoney = donations.filter(d => d.type === 'money').reduce((s, d) => s + d.amount, 0)
  const totalHours = donations.filter(d => d.type === 'time').reduce((s, d) => s + d.hours, 0)
  const causeBreakdown = donations.reduce((acc, d) => ({ ...acc, [d.cause]: (acc[d.cause] || 0) + d.amount }), {} as Record<string, number>)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Heart className="w-7 h-7 text-red-400" />
            Charity Tracker
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your giving and philanthropic impact.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGoal(true)} className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">Goal</button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">
            <Plus className="w-4 h-4" /> Record
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">${totalMoney.toLocaleString()}</div>
          <div className="text-xs text-slate-500">Total Given</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{totalHours}h</div>
          <div className="text-xs text-slate-500">Time Given</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{donations.length}</div>
          <div className="text-xs text-slate-500">Donations</div>
        </div>
      </div>

      {/* Yearly goal */}
      <div className="game-card p-4 border border-red-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{thisYear} giving goal</span>
          <span className="text-sm font-bold text-green-400">${yearMoney.toLocaleString()} / ${goal.yearlyTarget.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full">
          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (yearMoney / goal.yearlyTarget) * 100)}%` }} />
        </div>
        {goal.yearlyTarget > 0 && <p className="text-xs text-slate-600 mt-1">{((yearMoney / goal.yearlyTarget) * 100).toFixed(0)}% of yearly goal</p>}
      </div>

      {showGoal && (
        <div className="game-card p-4 border border-red-500/20 space-y-2">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-400">Yearly target: $</span>
            <input type="number" value={goalForm.yearlyTarget} min={0}
              onChange={e => setGoalForm(f => ({ ...f, yearlyTarget: Number(e.target.value) }))}
              className="game-input flex-1 text-sm text-center" />
          </div>
          <div className="flex gap-2">
            <button onClick={saveGoal} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowGoal(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="game-card p-4 border border-red-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Record Donation</h3>
          <div className="flex gap-2">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
              placeholder="Organization *" className="game-input flex-1" autoFocus />
            <select value={form.cause} onChange={e => setForm(f => ({ ...f, cause: e.target.value }))} className="game-input text-sm w-32">
              {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(DONATION_TYPES) as [DonationType, typeof DONATION_TYPES.money][]).map(([k, t]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, type: k }))}
                className={`px-2.5 py-1 rounded-full text-xs ${form.type === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.type === k ? { background: t.color + '30', color: t.color } : {}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          {form.type === 'money' && (
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-xs text-slate-500">Amount $</span>
                <input type="number" value={form.amount} min={0}
                  onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="game-input flex-1 text-sm text-center" />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                <input type="checkbox" checked={form.taxDeductible} onChange={e => setForm(f => ({ ...f, taxDeductible: e.target.checked }))} />
                Tax deductible
              </label>
            </div>
          )}
          {form.type === 'time' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Hours:</span>
              <input type="number" value={form.hours} min={0} step={0.5}
                onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))}
                className="game-input w-20 text-sm text-center" />
            </div>
          )}
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description" className="game-input w-full text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))} />
            Recurring donation
          </label>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Record</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {donations.map(d => {
          const t = DONATION_TYPES[d.type]
          return (
            <div key={d.id} className="game-card p-3 flex gap-3">
              <span className="text-xl">{t.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{d.organization}</span>
                  <span className="text-xs text-slate-500">{d.cause}</span>
                  {d.recurring && <span className="text-xs text-blue-400">🔁</span>}
                  {d.taxDeductible && d.type === 'money' && <span className="text-xs text-green-400">📋</span>}
                </div>
                <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                  <span>{d.date}</span>
                  {d.type === 'money' && d.amount > 0 && <span className="text-green-400">${d.amount.toLocaleString()}</span>}
                  {d.type === 'time' && d.hours > 0 && <span className="text-yellow-400">{d.hours}h</span>}
                </div>
                {d.description && <p className="text-xs text-slate-600 mt-0.5">{d.description}</p>}
              </div>
              <button onClick={() => save(donations.filter(x => x.id !== d.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {donations.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start recording your charitable giving.</p>
          </div>
        )}
      </div>
    </div>
  )
}
