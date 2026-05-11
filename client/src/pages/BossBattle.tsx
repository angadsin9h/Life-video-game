import { useEffect, useState } from 'react'
import axios from 'axios'
import { Sword, Shield, Skull, Trophy, Zap } from 'lucide-react'

interface DailyDamage {
  date: string
  damage: number
}

interface Boss {
  id: number
  week_start: string
  boss_name: string
  boss_title: string
  boss_hp: number
  current_hp: number
  defeated: number
  defeated_at: string | null
  emoji: string
  weekStart: string
  dailyDamage: DailyDamage[]
  totalDefeated: number
  hpPercent: number
}

interface BossHistory {
  id: number
  week_start: string
  boss_name: string
  boss_title: string
  boss_hp: number
  current_hp: number
  defeated: number
  defeated_at: string | null
  emoji: string
}

function getHpColor(pct: number) {
  if (pct > 60) return 'from-red-600 to-red-400'
  if (pct > 30) return 'from-orange-600 to-yellow-400'
  return 'from-yellow-500 to-green-400'
}

function getDamageColor(dmg: number) {
  if (dmg >= 80) return 'text-green-400'
  if (dmg >= 60) return 'text-yellow-400'
  if (dmg >= 40) return 'text-orange-400'
  return 'text-red-400'
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function BossBattle() {
  const [boss, setBoss] = useState<Boss | null>(null)
  const [history, setHistory] = useState<BossHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get<Boss>('/api/boss/current'),
      axios.get<BossHistory[]>('/api/boss/history'),
    ]).then(([bossRes, histRes]) => {
      setBoss(bossRes.data)
      setHistory(histRes.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-800 rounded-xl" />
        <div className="h-40 bg-slate-800 rounded-xl" />
      </div>
    )
  }

  if (!boss) {
    return <div className="text-slate-400 text-center py-12">Failed to load boss data.</div>
  }

  const weekDays = boss.dailyDamage.reduce<Record<string, number>>((acc, d) => {
    acc[d.date] = d.damage
    return acc
  }, {})

  const weekStart = new Date(boss.weekStart)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    return { dateStr, dayName: DAY_NAMES[i], damage: weekDays[dateStr] || 0 }
  })

  const totalDamageDealt = boss.boss_hp - boss.current_hp
  const daysLeft = days.filter(d => !weekDays[d.dateStr]).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>Boss Battle</h1>
        <p className="text-slate-400 mt-1">Defeat the weekly boss by logging your activities</p>
      </div>

      {/* Boss card */}
      <div className={`game-card p-6 border-2 ${boss.defeated ? 'border-green-500/60' : 'border-red-500/40'} relative overflow-hidden`}
           style={{ background: boss.defeated ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
        {/* Atmospheric background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ background: boss.defeated ? 'radial-gradient(circle at 50% 50%, #10b981, transparent)' : 'radial-gradient(circle at 50% 50%, #ef4444, transparent)' }} />

        <div className="relative text-center">
          {/* Boss emoji / sprite */}
          <div className={`text-8xl mb-3 transition-all duration-500 ${boss.defeated ? 'opacity-30 grayscale' : 'animate-float'}`}>
            {boss.emoji}
          </div>

          {boss.defeated ? (
            <div className="mb-4">
              <div className="text-green-400 text-lg font-bold">⚔️ DEFEATED ⚔️</div>
              <h2 className="text-2xl font-bold text-slate-400 line-through mt-1" style={{ fontFamily: 'Orbitron, monospace' }}>
                {boss.boss_name}
              </h2>
              <p className="text-slate-500">{boss.boss_title}</p>
              <p className="text-green-400 text-sm mt-2">
                ✓ Slain on {boss.defeated_at ? new Date(boss.defeated_at).toLocaleDateString() : 'this week'}
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-red-400 neon-text" style={{ fontFamily: 'Orbitron, monospace' }}>
                {boss.boss_name}
              </h2>
              <p className="text-slate-400 text-sm">{boss.boss_title}</p>
            </div>
          )}

          {/* HP Bar */}
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-1">
              <Shield className="w-4 h-4" /> Boss HP
            </span>
            <span className={boss.defeated ? 'text-green-400' : 'text-red-400'} style={{ fontFamily: 'Orbitron, monospace' }}>
              {boss.current_hp} / {boss.boss_hp}
            </span>
          </div>
          <div className="stat-bar h-6 mb-4">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getHpColor(boss.hpPercent)} transition-all duration-1000`}
              style={{ width: `${boss.hpPercent}%` }}
            />
          </div>

          {!boss.defeated && (
            <p className="text-slate-300 text-sm">
              {daysLeft > 0
                ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left — deal ${boss.current_hp} more damage to defeat it!`
                : "Week's over — this boss escaped!"}
            </p>
          )}
        </div>
      </div>

      {/* Weekly damage tracker */}
      <div className="game-card p-5">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Sword className="w-5 h-5 text-red-400" />
          This Week's Attacks
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const hasLog = day.damage > 0
            const today = new Date().toISOString().split('T')[0]
            const isToday = day.dateStr === today
            return (
              <div
                key={day.dateStr}
                className={`rounded-xl p-3 text-center transition-all ${
                  hasLog
                    ? 'bg-slate-700 border border-green-500/30'
                    : isToday
                    ? 'bg-slate-700 border border-violet-500/50 animate-pulse-glow'
                    : 'bg-slate-800 border border-slate-700 opacity-50'
                }`}
              >
                <div className="text-xs text-slate-400 mb-1">{day.dayName}</div>
                {hasLog ? (
                  <>
                    <Zap className="w-4 h-4 mx-auto mb-1 text-yellow-400" />
                    <div className={`text-sm font-bold ${getDamageColor(day.damage)}`}>
                      -{day.damage}
                    </div>
                  </>
                ) : (
                  <div className="text-slate-600 text-xs mt-2">{isToday ? '⚔️' : '—'}</div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-400">Total damage this week:</span>
          <span className="font-bold text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            -{totalDamageDealt} HP
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {boss.totalDefeated}
          </div>
          <div className="text-xs text-slate-500">Bosses Slain</div>
        </div>
        <div className="game-card p-4 text-center">
          <Sword className="w-6 h-6 text-red-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {totalDamageDealt}
          </div>
          <div className="text-xs text-slate-500">Dmg This Week</div>
        </div>
        <div className="game-card p-4 text-center">
          <Skull className="w-6 h-6 text-slate-400 mx-auto mb-1" />
          <div className="text-2xl font-bold text-slate-300" style={{ fontFamily: 'Orbitron, monospace' }}>
            {boss.hpPercent}%
          </div>
          <div className="text-xs text-slate-500">HP Remaining</div>
        </div>
      </div>

      {/* Boss how-to */}
      <div className="game-card p-4 border border-violet-500/20">
        <h3 className="text-sm font-semibold text-violet-400 mb-2">⚔️ How Boss Battles Work</h3>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>• A new boss spawns every Monday with <strong className="text-slate-300">350 HP</strong></li>
          <li>• Every time you log tasks, your daily score deals that much damage</li>
          <li>• Deal <strong className="text-slate-300">350 total damage</strong> before Sunday to slay the boss</li>
          <li>• Defeating bosses unlocks the <strong className="text-yellow-400">Boss Slayer</strong> and <strong className="text-yellow-400">Dragon Slayer</strong> achievements</li>
          <li>• A perfect 50 pts/day × 7 days = 350 damage — exactly enough to win!</li>
        </ul>
      </div>

      {/* Boss history */}
      {history.length > 1 && (
        <div className="game-card p-5">
          <h3 className="text-lg font-semibold text-slate-200 mb-4">Past Bosses</h3>
          <div className="space-y-2">
            {history.slice(1).map(b => (
              <div
                key={b.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${b.defeated ? 'bg-green-900/20 border border-green-700/30' : 'bg-slate-800 border border-slate-700'}`}
              >
                <span className="text-2xl">{b.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-200 text-sm">{b.boss_name}</div>
                  <div className="text-xs text-slate-500">Week of {b.week_start}</div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${b.defeated ? 'bg-green-800 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {b.defeated ? '⚔️ Slain' : '💀 Escaped'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
