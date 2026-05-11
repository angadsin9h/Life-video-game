import { useEffect, useState } from 'react'
import { Star, X } from 'lucide-react'

interface Props {
  newLevel: number
  onClose: () => void
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Initiate', 2: 'Novice', 3: 'Apprentice', 4: 'Adept', 5: 'Adept II',
  6: 'Journeyman', 7: 'Journeyman II', 8: 'Journeyman III', 9: 'Experienced', 10: 'Veteran',
  11: 'Veteran II', 12: 'Veteran III', 13: 'Expert', 14: 'Expert II', 15: 'Expert III',
  20: 'Elite', 25: 'Master', 30: 'Legend', 40: 'Grandmaster', 50: 'Transcendent',
}

function getLevelTitle(level: number): string {
  const titles = Object.entries(LEVEL_TITLES)
    .map(([k, v]) => ({ level: parseInt(k), title: v }))
    .sort((a, b) => b.level - a.level)
  return titles.find(t => level >= t.level)?.title ?? 'Initiate'
}

export default function LevelUpModal({ newLevel, onClose }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const title = getLevelTitle(newLevel)

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center p-4 transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={close} />
      <div
        className={`relative bg-slate-900 border-2 border-yellow-500/60 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl transition-all duration-500 ${visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-8'}`}
        style={{ boxShadow: '0 0 60px rgba(234,179,8,0.3), 0 0 120px rgba(139,92,246,0.2)' }}
      >
        <button onClick={close} className="absolute top-4 right-4 text-slate-600 hover:text-slate-400">
          <X className="w-4 h-4" />
        </button>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          {[0, 1, 2].map(i => (
            <Star
              key={i}
              className="w-6 h-6 text-yellow-400 fill-yellow-400"
              style={{ animationDelay: `${i * 200}ms`, animation: 'bounce 1s infinite' }}
            />
          ))}
        </div>

        <div className="text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-2">Level Up!</div>

        <div
          className="text-7xl font-bold text-yellow-400 mb-2"
          style={{ fontFamily: 'Orbitron, monospace', textShadow: '0 0 30px rgba(234,179,8,0.8)' }}
        >
          {newLevel}
        </div>

        <div className="text-xl font-bold text-slate-200 mb-1">{title}</div>
        <div className="text-sm text-slate-400 mb-6">You've reached a new level of mastery!</div>

        {/* Radiant ring */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 rounded-3xl opacity-20"
            style={{ background: 'radial-gradient(circle at 50% 30%, #eab308, transparent 60%)' }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Level', value: newLevel, color: 'text-yellow-400' },
            { label: 'Title', value: title, color: 'text-violet-400' },
            { label: 'XP Cap', value: `${newLevel * 500}`, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-2">
              <div className={`text-sm font-bold ${s.color}`} style={{ fontFamily: 'Orbitron, monospace' }}>{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        <button
          onClick={close}
          className="w-full py-3 bg-gradient-to-r from-yellow-600 to-violet-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          ⚔️ Onwards!
        </button>
      </div>
    </div>
  )
}
