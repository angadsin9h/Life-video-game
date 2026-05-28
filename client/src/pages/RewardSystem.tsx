import { useState, useEffect } from 'react'
import { Gift, Plus, Trash2, Star, Check } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Reward {
  id: string
  name: string
  description: string
  cost: number
  category: string
  redeemed: boolean
  redeemedAt: string
  createdAt: string
}

interface PointLog {
  id: string
  description: string
  points: number
  date: string
  type: 'earn' | 'spend'
}

const CATEGORIES = [
  { name: 'Food & Drink', emoji: '🍕', color: '#f97316' },
  { name: 'Entertainment', emoji: '🎮', color: '#6366f1' },
  { name: 'Shopping', emoji: '🛍️', color: '#ec4899' },
  { name: 'Experiences', emoji: '🎭', color: '#3b82f6' },
  { name: 'Rest & Relax', emoji: '🛁', color: '#a855f7' },
  { name: 'Social', emoji: '👥', color: '#22c55e' },
  { name: 'Learning', emoji: '📚', color: '#f59e0b' },
  { name: 'Health', emoji: '💪', color: '#10b981' },
]

const PRESET_REWARDS = [
  { name: 'Favorite meal out', cost: 100, category: 'Food & Drink' },
  { name: '2-hour gaming session', cost: 50, category: 'Entertainment' },
  { name: 'Movie night', cost: 75, category: 'Entertainment' },
  { name: 'New book or game', cost: 150, category: 'Shopping' },
  { name: 'Full rest day', cost: 200, category: 'Rest & Relax' },
  { name: 'Weekend trip', cost: 500, category: 'Experiences' },
  { name: 'Spa/massage day', cost: 300, category: 'Rest & Relax' },
  { name: 'Social hangout', cost: 100, category: 'Social' },
]

const EARN_PRESETS = [
  { description: 'Completed all habits', points: 30 },
  { description: 'Workout done', points: 20 },
  { description: 'Deep work session (1h+)', points: 25 },
  { description: 'Journaled', points: 10 },
  { description: 'Meditation', points: 15 },
  { description: 'Read 30 min', points: 15 },
  { description: 'Goal milestone hit', points: 50 },
  { description: 'Perfect day', points: 100 },
]

const STORAGE_KEY = 'reward_system'
const LOG_KEY = 'reward_logs'

export default function RewardSystem() {
  const { toastSuccess } = useToast()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [logs, setLogs] = useState<PointLog[]>([])
  const [showAddReward, setShowAddReward] = useState(false)
  const [showEarn, setShowEarn] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', cost: 100, category: 'Entertainment' })
  const [earnAmount, setEarnAmount] = useState(25)
  const [earnDesc, setEarnDesc] = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      setRewards(saved ? JSON.parse(saved) : [])
      const savedLogs = localStorage.getItem(LOG_KEY)
      setLogs(savedLogs ? JSON.parse(savedLogs) : [])
    } catch { /**/ }
  }, [])

  const saveRewards = (updated: Reward[]) => {
    setRewards(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveLogs = (updated: PointLog[]) => {
    setLogs(updated)
    localStorage.setItem(LOG_KEY, JSON.stringify(updated))
  }

  const totalPoints = logs.reduce((s, l) => l.type === 'earn' ? s + l.points : s - l.points, 0)

  const earnPoints = (desc: string, pts: number) => {
    if (!desc.trim() || pts <= 0) return
    const log: PointLog = { id: Date.now().toString(), description: desc, points: pts, date: new Date().toISOString().split('T')[0], type: 'earn' }
    saveLogs([log, ...logs].slice(0, 100))
    setShowEarn(false)
    setEarnDesc('')
    setEarnAmount(25)
    toastSuccess(`+${pts} points earned! Total: ${totalPoints + pts} 🌟`)
  }

  const redeemReward = (reward: Reward) => {
    if (totalPoints < reward.cost) return
    const log: PointLog = { id: Date.now().toString(), description: `Redeemed: ${reward.name}`, points: reward.cost, date: new Date().toISOString().split('T')[0], type: 'spend' }
    saveLogs([log, ...logs].slice(0, 100))
    saveRewards(rewards.map(r => r.id === reward.id ? { ...r, redeemed: true, redeemedAt: new Date().toISOString().split('T')[0] } : r))
    toastSuccess(`Reward redeemed: ${reward.name}! Enjoy it! 🎉`)
  }

  const addReward = () => {
    if (!form.name.trim()) return
    const reward: Reward = {
      id: Date.now().toString(),
      name: form.name.trim(),
      description: form.description.trim(),
      cost: form.cost,
      category: form.category,
      redeemed: false,
      redeemedAt: '',
      createdAt: new Date().toISOString(),
    }
    saveRewards([reward, ...rewards])
    setForm({ name: '', description: '', cost: 100, category: 'Entertainment' })
    setShowAddReward(false)
    toastSuccess('Reward added!')
  }

  const addPresetReward = (p: typeof PRESET_REWARDS[0]) => {
    const reward: Reward = {
      id: Date.now().toString(),
      name: p.name,
      description: '',
      cost: p.cost,
      category: p.category,
      redeemed: false,
      redeemedAt: '',
      createdAt: new Date().toISOString(),
    }
    saveRewards([reward, ...rewards])
    toastSuccess(`"${p.name}" added as a reward!`)
  }

  const unredeemed = rewards.filter(r => !r.redeemed)
  const redeemed = rewards.filter(r => r.redeemed)
  const affordable = unredeemed.filter(r => totalPoints >= r.cost)

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Gift className="w-7 h-7 text-pink-400" />
            Reward System
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Earn points for good habits. Spend on real rewards.</p>
        </div>
      </div>

      {/* Points display */}
      <div className="game-card p-5 border border-yellow-500/30 text-center">
        <div className="text-xs text-yellow-400 uppercase tracking-wider mb-1">Available Points</div>
        <div className="text-5xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
          {totalPoints.toLocaleString()}
        </div>
        <div className="flex gap-3 justify-center mt-3">
          <button onClick={() => setShowEarn(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            <Star className="w-4 h-4" /> Earn Points
          </button>
          <button onClick={() => setShowAddReward(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Add Reward
          </button>
        </div>
      </div>

      {/* Earn points */}
      {showEarn && (
        <div className="game-card p-5 space-y-4 border border-yellow-500/20">
          <h3 className="font-semibold text-slate-300">Log Achievement</h3>
          <div className="flex flex-wrap gap-2">
            {EARN_PRESETS.map(p => (
              <button key={p.description} onClick={() => earnPoints(p.description, p.points)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs hover:bg-yellow-500/20 transition-colors">
                +{p.points} {p.description}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={earnDesc} onChange={e => setEarnDesc(e.target.value)}
              placeholder="Custom achievement..." className="game-input flex-1" />
            <input type="number" min="1" max="500" value={earnAmount}
              onChange={e => setEarnAmount(+e.target.value)}
              className="game-input w-20" />
            <button onClick={() => earnPoints(earnDesc, earnAmount)} className="px-3 py-2 bg-yellow-600 text-white rounded-xl text-sm">+Add</button>
          </div>
          <button onClick={() => setShowEarn(false)} className="text-xs text-slate-500 hover:text-slate-400">Cancel</button>
        </div>
      )}

      {/* Add reward */}
      {showAddReward && (
        <div className="game-card p-5 space-y-4 border border-pink-500/20">
          <h3 className="font-semibold text-slate-300">New Reward</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESET_REWARDS.filter(p => !rewards.some(r => r.name === p.name)).slice(0, 6).map(p => (
              <button key={p.name} onClick={() => { addPresetReward(p); setShowAddReward(false) }}
                className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-pink-400 transition-colors">
                {p.name} ({p.cost}pts)
              </button>
            ))}
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Reward name..." className="game-input w-full" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Cost (points)</label>
              <input type="number" min="10" max="10000" value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: +e.target.value }))}
                className="game-input w-full" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="game-input w-full">
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addReward} className="flex-1 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold">Add Reward</button>
            <button onClick={() => setShowAddReward(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Available rewards */}
      {unredeemed.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Available Rewards</h3>
          {unredeemed.map(r => {
            const cat = CATEGORIES.find(c => c.name === r.category) || CATEGORIES[0]
            const canAfford = totalPoints >= r.cost
            return (
              <div key={r.id} className={`game-card p-4 flex items-center gap-3 transition-opacity ${canAfford ? '' : 'opacity-60'}`}>
                <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm">{r.name}</div>
                  {r.description && <p className="text-xs text-slate-500">{r.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-yellow-400">{r.cost} pts</span>
                    {!canAfford && <span className="text-xs text-slate-600">Need {r.cost - totalPoints} more</span>}
                    {canAfford && affordable.length > 0 && <span className="text-xs text-green-400">✓ Affordable!</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => redeemReward(r)} disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${canAfford ? 'bg-pink-600 hover:bg-pink-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                    Redeem
                  </button>
                  <button onClick={() => saveRewards(rewards.filter(x => x.id !== r.id))} className="p-1 text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent point logs */}
      {logs.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Point History</h3>
          <div className="space-y-1.5">
            {logs.slice(0, 8).map(log => (
              <div key={log.id} className="flex items-center gap-2 text-sm">
                <span className={`font-bold w-16 flex-shrink-0 text-right ${log.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                  {log.type === 'earn' ? '+' : '-'}{log.points}
                </span>
                <span className="text-slate-400 flex-1 truncate">{log.description}</span>
                <span className="text-slate-600 text-xs flex-shrink-0">{log.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {redeemed.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Redeemed</h3>
          {redeemed.slice(0, 3).map(r => (
            <div key={r.id} className="flex items-center gap-2 py-1.5 border-b border-slate-800 last:border-0">
              <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="text-sm text-slate-500 line-through flex-1">{r.name}</span>
              <span className="text-xs text-slate-600">{r.redeemedAt}</span>
            </div>
          ))}
        </div>
      )}

      {rewards.length === 0 && !showAddReward && !showEarn && (
        <div className="text-center py-16 text-slate-500">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No rewards set up yet.</p>
          <p className="text-sm">Set up rewards you can earn through consistent habits and hard work.</p>
        </div>
      )}
    </div>
  )
}
