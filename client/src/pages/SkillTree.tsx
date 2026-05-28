import { useEffect, useState } from 'react'
import axios from 'axios'
import { Lock, Zap } from 'lucide-react'

interface Stats {
  categoryTotalMinutes: Record<string, number>
  currentStreak: number
  totalHours: number
}

interface Skill {
  id: string
  name: string
  emoji: string
  description: string
  requiredMinutes: number
  tier: number
}

interface CategoryTree {
  key: string
  label: string
  color: string
  glowClass: string
  barClass: string
  skills: Skill[]
}

const TREES: CategoryTree[] = [
  {
    key: 'health', label: 'Health', color: 'text-green-400', glowClass: 'shadow-green-500/40', barClass: 'bar-health',
    skills: [
      { id: 'h1', tier: 1, name: 'Morning Mover',   emoji: '🌅', description: 'Showed up for yourself.',          requiredMinutes: 30   },
      { id: 'h2', tier: 2, name: 'Iron Habit',       emoji: '💪', description: 'Building something real.',         requiredMinutes: 150  },
      { id: 'h3', tier: 3, name: 'Warrior Rising',   emoji: '⚔️', description: 'Consistency unlocked.',            requiredMinutes: 450  },
      { id: 'h4', tier: 4, name: 'Peak Athlete',     emoji: '🏋️', description: 'You are what you repeatedly do.',  requiredMinutes: 1200 },
      { id: 'h5', tier: 5, name: 'Iron Legend',      emoji: '🦁', description: 'Few have come this far.',          requiredMinutes: 3000 },
    ],
  },
  {
    key: 'mind', label: 'Mind', color: 'text-cyan-400', glowClass: 'shadow-cyan-500/40', barClass: 'bar-mind',
    skills: [
      { id: 'm1', tier: 1, name: 'Curious Spark',    emoji: '🔍', description: 'Every expert was once a beginner.', requiredMinutes: 30   },
      { id: 'm2', tier: 2, name: 'Deep Thinker',     emoji: '💭', description: 'Patterns start to emerge.',         requiredMinutes: 150  },
      { id: 'm3', tier: 3, name: 'Scholar Rising',   emoji: '📚', description: 'Knowledge compounds daily.',        requiredMinutes: 450  },
      { id: 'm4', tier: 4, name: 'Sage Mind',        emoji: '🧠', description: 'Wisdom is earned, not given.',      requiredMinutes: 1200 },
      { id: 'm5', tier: 5, name: 'Mind Ascendant',   emoji: '🌌', description: 'Thinking at a higher frequency.',   requiredMinutes: 3000 },
    ],
  },
  {
    key: 'work', label: 'Work', color: 'text-violet-400', glowClass: 'shadow-violet-500/40', barClass: 'bar-work',
    skills: [
      { id: 'w1', tier: 1, name: 'First Brick',      emoji: '🧱', description: 'Every empire starts here.',         requiredMinutes: 30   },
      { id: 'w2', tier: 2, name: 'Craftsman',        emoji: '⚙️', description: 'Work ethic is forming.',            requiredMinutes: 150  },
      { id: 'w3', tier: 3, name: 'Master Builder',   emoji: '🏗️', description: 'Output compounds each session.',    requiredMinutes: 450  },
      { id: 'w4', tier: 4, name: 'Productivity God', emoji: '🚀', description: 'Others wonder how you do it.',       requiredMinutes: 1200 },
      { id: 'w5', tier: 5, name: 'Legend Builder',   emoji: '👑', description: 'Your output defies logic.',          requiredMinutes: 3000 },
    ],
  },
  {
    key: 'social', label: 'Social', color: 'text-yellow-400', glowClass: 'shadow-yellow-500/40', barClass: 'bar-social',
    skills: [
      { id: 's1', tier: 1, name: 'First Step',       emoji: '👋', description: 'Connection begins with a word.',     requiredMinutes: 30   },
      { id: 's2', tier: 2, name: 'Trusted Ally',     emoji: '🤝', description: 'Trust is slowly building.',          requiredMinutes: 150  },
      { id: 's3', tier: 3, name: 'Loyal Guardian',   emoji: '🛡️', description: 'Deep bonds take deep effort.',       requiredMinutes: 450  },
      { id: 's4', tier: 4, name: 'Pillar',           emoji: '🌟', description: 'Others look to you.',                requiredMinutes: 1200 },
      { id: 's5', tier: 5, name: 'Social Legend',    emoji: '💫', description: 'Inspiring those around you.',        requiredMinutes: 3000 },
    ],
  },
  {
    key: 'growth', label: 'Growth', color: 'text-red-400', glowClass: 'shadow-red-500/40', barClass: 'bar-growth',
    skills: [
      { id: 'g1', tier: 1, name: 'Explorer',         emoji: '🗺️', description: 'Curiosity sparked.',                 requiredMinutes: 30   },
      { id: 'g2', tier: 2, name: 'Pathfinder',       emoji: '🔥', description: 'Your own trail, your own rules.',    requiredMinutes: 150  },
      { id: 'g3', tier: 3, name: 'Evolver',          emoji: '🦋', description: 'Compound growth kicks in.',          requiredMinutes: 450  },
      { id: 'g4', tier: 4, name: 'Transformer',      emoji: '⚡', description: "You're not who you were.",           requiredMinutes: 1200 },
      { id: 'g5', tier: 5, name: 'Ascendant',        emoji: '🌠', description: 'Transcended all limits.',            requiredMinutes: 3000 },
    ],
  },
]

function formatMinutes(mins: number) {
  if (mins >= 60) return `${Math.round(mins / 60)}h`
  return `${mins}m`
}

export default function SkillTree() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)

  useEffect(() => {
    axios.get<Stats>('/api/stats').then(r => setStats(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 bg-slate-800 rounded-xl" />)}
      </div>
    )
  }

  const catMins = stats?.categoryTotalMinutes ?? {}

  const totalUnlocked = TREES.reduce((acc, tree) => {
    const mins = catMins[tree.key] ?? 0
    return acc + tree.skills.filter(s => mins >= s.requiredMinutes).length
  }, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Zap className="w-8 h-8 text-yellow-400" />
          Skill Tree
        </h1>
        <p className="text-slate-400 mt-1">Skills unlock as you invest time in each life category</p>
      </div>

      {/* Progress summary */}
      <div className="game-card p-4 flex items-center gap-4">
        <div className="text-4xl font-bold text-yellow-400 neon-text" style={{ fontFamily: 'Orbitron, monospace' }}>
          {totalUnlocked}
        </div>
        <div>
          <div className="text-sm text-slate-300 font-semibold">Skills Unlocked</div>
          <div className="text-xs text-slate-500">out of {TREES.length * 5} total skills across all categories</div>
          <div className="mt-1 stat-bar h-2 w-48">
            <div
              className="stat-bar-fill bar-work transition-all duration-1000"
              style={{ width: `${(totalUnlocked / (TREES.length * 5)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Skill trees */}
      {TREES.map(tree => {
        const mins = catMins[tree.key] ?? 0
        const unlockedCount = tree.skills.filter(s => mins >= s.requiredMinutes).length
        const nextSkill = tree.skills.find(s => mins < s.requiredMinutes)
        const progressToNext = nextSkill
          ? Math.min(100, Math.round((mins / nextSkill.requiredMinutes) * 100))
          : 100

        return (
          <div key={tree.key} className="game-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <div className={`font-bold text-lg ${tree.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>
                    {tree.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {unlockedCount}/{tree.skills.length} skills · {formatMinutes(mins)} logged
                  </div>
                </div>
              </div>
              {nextSkill && (
                <div className="text-right text-xs text-slate-500">
                  <div>Next: <span className="text-slate-300">{nextSkill.name}</span></div>
                  <div>{formatMinutes(mins)}/{formatMinutes(nextSkill.requiredMinutes)}</div>
                </div>
              )}
              {!nextSkill && (
                <div className="text-xs text-yellow-400 font-bold">✨ Mastered!</div>
              )}
            </div>

            {/* Progress to next skill */}
            <div className="stat-bar h-1.5 mb-5">
              <div className={`stat-bar-fill ${tree.barClass} transition-all duration-1000`} style={{ width: `${progressToNext}%` }} />
            </div>

            {/* Skill nodes */}
            <div className="relative">
              {/* Connector line */}
              <div className="absolute top-10 left-10 right-10 h-0.5 bg-slate-700" style={{ zIndex: 0 }} />

              <div className="flex items-start justify-between relative" style={{ zIndex: 1 }}>
                {tree.skills.map((skill, idx) => {
                  const unlocked = mins >= skill.requiredMinutes
                  const isHovered = hoveredSkill === skill.id
                  const prevUnlocked = idx === 0 || (mins >= tree.skills[idx - 1].requiredMinutes)

                  return (
                    <div
                      key={skill.id}
                      className="flex flex-col items-center gap-2 cursor-pointer"
                      style={{ width: '18%' }}
                      onMouseEnter={() => setHoveredSkill(skill.id)}
                      onMouseLeave={() => setHoveredSkill(null)}
                    >
                      {/* Node */}
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 border-2 ${
                          unlocked
                            ? `bg-slate-700 border-current ${tree.color} shadow-lg ${tree.glowClass} ${isHovered ? 'scale-110' : ''}`
                            : prevUnlocked
                              ? 'bg-slate-800 border-slate-600 opacity-60'
                              : 'bg-slate-800/50 border-slate-700 opacity-30'
                        }`}
                      >
                        {unlocked ? skill.emoji : <Lock className="w-5 h-5 text-slate-600" />}
                      </div>

                      {/* Label */}
                      <div className="text-center">
                        <div className={`text-xs font-semibold leading-tight ${unlocked ? tree.color : 'text-slate-600'}`}>
                          {skill.name}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {formatMinutes(skill.requiredMinutes)}
                        </div>
                      </div>

                      {/* Hover tooltip */}
                      {isHovered && (
                        <div className="absolute bottom-full mb-2 bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-xs w-36 shadow-xl text-center z-10 pointer-events-none">
                          <div className="text-2xl mb-1">{unlocked ? skill.emoji : '🔒'}</div>
                          <div className={`font-bold mb-1 ${unlocked ? tree.color : 'text-slate-400'}`}>{skill.name}</div>
                          <div className="text-slate-400">{skill.description}</div>
                          <div className="mt-1.5 text-slate-500">
                            {unlocked ? '✓ Unlocked' : `${formatMinutes(skill.requiredMinutes)} needed`}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      <div className="text-center text-xs text-slate-600 pb-4">
        Skills unlock based on total time logged in each category across all time.
      </div>
    </div>
  )
}
