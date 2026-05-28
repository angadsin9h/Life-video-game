import { useEffect, useState } from 'react'
import axios from 'axios'
import { Trophy, Lock, Star } from 'lucide-react'

interface Achievement {
  key: string
  title: string
  desc: string
  icon: string
  xp: number
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  unlocked_at: string | null
}

interface AchievementsData {
  achievements: Achievement[]
  totalXp: number
  unlockedCount: number
}

const RARITY_STYLES: Record<string, { border: string; badge: string; glow: string; label: string }> = {
  common:    { border: 'border-slate-600',    badge: 'bg-slate-600 text-slate-200',    glow: '',                                           label: 'Common'    },
  uncommon:  { border: 'border-green-600',    badge: 'bg-green-900 text-green-300',    glow: '',                                           label: 'Uncommon'  },
  rare:      { border: 'border-blue-500',     badge: 'bg-blue-900 text-blue-300',      glow: 'shadow-[0_0_12px_rgba(59,130,246,0.4)]',     label: 'Rare'      },
  epic:      { border: 'border-violet-500',   badge: 'bg-violet-900 text-violet-300',  glow: 'shadow-[0_0_15px_rgba(139,92,246,0.5)]',     label: 'Epic'      },
  legendary: { border: 'border-yellow-400',   badge: 'bg-yellow-900 text-yellow-300',  glow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]',     label: 'Legendary' },
}

const RARITY_ORDER = ['legendary', 'epic', 'rare', 'uncommon', 'common']

export default function Achievements() {
  const [data, setData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [rarityFilter, setRarityFilter] = useState('all')

  useEffect(() => {
    axios.get<AchievementsData>('/api/achievements')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="h-40 bg-slate-800 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const achievements = data?.achievements ?? []
  const filtered = achievements
    .filter(a => {
      if (filter === 'unlocked' && !a.unlocked) return false
      if (filter === 'locked' && a.unlocked) return false
      if (rarityFilter !== 'all' && a.rarity !== rarityFilter) return false
      return true
    })
    .sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
    })

  const progress = Math.round(((data?.unlockedCount ?? 0) / achievements.length) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Achievements</h1>
        <p className="text-slate-400 mt-1">Unlock badges by leveling up your life</p>
      </div>

      {/* Summary */}
      <div className="game-card p-5 glowing-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-yellow-400" />
            <div>
              <div className="text-xl font-bold text-slate-200" style={{ fontFamily: 'Orbitron, monospace' }}>
                {data?.unlockedCount ?? 0} / {achievements.length}
              </div>
              <div className="text-xs text-slate-400">achievements unlocked</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
              +{(data?.totalXp ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400">achievement XP</div>
          </div>
        </div>
        <div className="stat-bar h-3">
          <div className="stat-bar-fill bar-social transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-slate-500 mt-1 text-right">{progress}% complete</div>
      </div>

      {/* Rarity breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {RARITY_ORDER.map(r => {
          const count = achievements.filter(a => a.rarity === r && a.unlocked).length
          const total = achievements.filter(a => a.rarity === r).length
          const style = RARITY_STYLES[r]
          return (
            <div key={r} className={`game-card p-3 text-center border ${style.border} ${count > 0 ? style.glow : 'opacity-50'}`}>
              <div className="text-lg font-bold text-slate-200">{count}/{total}</div>
              <div className={`text-xs mt-1 px-1 py-0.5 rounded ${style.badge}`}>{style.label}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'unlocked', 'locked'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="w-px bg-slate-700 mx-1" />
        {['all', ...RARITY_ORDER].map(r => {
          const style = RARITY_STYLES[r]
          return (
            <button
              key={r}
              onClick={() => setRarityFilter(r)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${rarityFilter === r ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
            >
              {r === 'all' ? 'All' : style.label}
            </button>
          )
        })}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a => {
          const style = RARITY_STYLES[a.rarity]
          return (
            <div
              key={a.key}
              className={`game-card p-4 border ${style.border} transition-all duration-300 ${
                a.unlocked
                  ? `${style.glow} hover:scale-105`
                  : 'opacity-40 grayscale'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`text-3xl w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 ${
                  a.unlocked ? 'bg-slate-700' : 'bg-slate-800'
                }`}>
                  {a.unlocked ? a.icon : <Lock className="w-5 h-5 text-slate-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-200 text-sm">{a.title}</h3>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${style.badge}`}>{style.label}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{a.desc}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-semibold">+{a.xp} XP</span>
                    {a.unlocked && a.unlocked_at && (
                      <span className="text-xs text-green-400 ml-auto">
                        ✓ {new Date(a.unlocked_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No achievements match your filter.</p>
        </div>
      )}
    </div>
  )
}
