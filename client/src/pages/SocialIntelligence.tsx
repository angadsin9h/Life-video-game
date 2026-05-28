import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type SocialSituation = 'networking' | 'small-talk' | 'group-dynamics' | 'leadership' | 'conflict' | 'persuasion' | 'empathy' | 'reading-room' | 'charisma' | 'influence'
type SocialSkillLevel = 'awkward' | 'learning' | 'competent' | 'fluent' | 'masterful'

interface SocialIntelligenceEntry {
  id: string
  situation: SocialSituation
  skillLevel: SocialSkillLevel
  whatHappened: string
  socialCuesMissed: string
  socialCuesCaught: string
  adjustmentMade: string
  outcomeOfExchange: string
  keyTechnique: string
  practiceFor: string
  socialScore: number
  date: string
  createdAt: string
}

const SITUATION_CONFIG: Record<SocialSituation, { label: string; emoji: string; color: string }> = {
  networking:      { label: 'Networking',     emoji: '🌐', color: '#3b82f6' },
  'small-talk':    { label: 'Small Talk',     emoji: '☕', color: '#f59e0b' },
  'group-dynamics': { label: 'Group Dynamics', emoji: '👥', color: '#22c55e' },
  leadership:      { label: 'Leadership',     emoji: '👑', color: '#a855f7' },
  conflict:        { label: 'Conflict',       emoji: '⚡', color: '#ef4444' },
  persuasion:      { label: 'Persuasion',     emoji: '🎯', color: '#f97316' },
  empathy:         { label: 'Empathy',        emoji: '❤️', color: '#ec4899' },
  'reading-room':  { label: 'Reading Room',   emoji: '🔍', color: '#6366f1' },
  charisma:        { label: 'Charisma',       emoji: '✨', color: '#eab308' },
  influence:       { label: 'Influence',      emoji: '📢', color: '#10b981' },
}

const SKILL_CONFIG: Record<SocialSkillLevel, { label: string; color: string }> = {
  awkward:   { label: 'Awkward',    color: '#ef4444' },
  learning:  { label: 'Learning',   color: '#f97316' },
  competent: { label: 'Competent',  color: '#f59e0b' },
  fluent:    { label: 'Fluent',     color: '#3b82f6' },
  masterful: { label: 'Masterful',  color: '#22c55e' },
}

const STORAGE_KEY = 'social_intelligence_log'

export default function SocialIntelligence() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<SocialIntelligenceEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<SocialIntelligenceEntry, 'id' | 'createdAt'>>({
    situation: 'networking', skillLevel: 'competent', whatHappened: '',
    socialCuesMissed: '', socialCuesCaught: '', adjustmentMade: '',
    outcomeOfExchange: '', keyTechnique: '', practiceFor: '', socialScore: 7,
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: SocialIntelligenceEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.whatHappened.trim()) return
    const e: SocialIntelligenceEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    save([e, ...entries])
    setForm(f => ({ ...f, whatHappened: '', socialCuesMissed: '', socialCuesCaught: '', adjustmentMade: '', outcomeOfExchange: '', keyTechnique: '', practiceFor: '' }))
    setShowForm(false)
    toastSuccess('Social intelligence logged — people skills are the ultimate force multiplier 👥')
  }

  const masterful = entries.filter(e => e.skillLevel === 'masterful' || e.skillLevel === 'fluent').length
  const avgSocial = entries.length ? Math.round(entries.reduce((s, e) => s + e.socialScore, 0) / entries.length) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Users className="w-7 h-7 text-green-400" />
            Social Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build your social awareness, charisma, and people skills.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Interactions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-green-400">{masterful}</div>
          <div className="text-xs text-slate-500">Fluent+</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-emerald-400">{avgSocial}/10</div>
          <div className="text-xs text-slate-500">Avg Social IQ</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-green-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Log Social Situation</h3>
          <div className="flex gap-2">
            <select value={form.situation} onChange={e => setForm(f => ({ ...f, situation: e.target.value as SocialSituation }))} className="game-input text-sm flex-1">
              {(Object.entries(SITUATION_CONFIG) as [SocialSituation, typeof SITUATION_CONFIG.networking][]).map(([k, s]) => (
                <option key={k} value={k}>{s.emoji} {s.label}</option>
              ))}
            </select>
            <select value={form.skillLevel} onChange={e => setForm(f => ({ ...f, skillLevel: e.target.value as SocialSkillLevel }))} className="game-input text-sm flex-1">
              {(Object.entries(SKILL_CONFIG) as [SocialSkillLevel, typeof SKILL_CONFIG.competent][]).map(([k, s]) => (
                <option key={k} value={k}>{s.label}</option>
              ))}
            </select>
          </div>
          <textarea value={form.whatHappened} onChange={e => setForm(f => ({ ...f, whatHappened: e.target.value }))}
            placeholder="What happened in this social situation? *" className="game-input w-full h-12 resize-none text-sm" autoFocus />
          <input value={form.socialCuesCaught} onChange={e => setForm(f => ({ ...f, socialCuesCaught: e.target.value }))}
            placeholder="Social cues you caught and read well" className="game-input w-full text-sm" />
          <input value={form.socialCuesMissed} onChange={e => setForm(f => ({ ...f, socialCuesMissed: e.target.value }))}
            placeholder="Social cues you missed" className="game-input w-full text-sm" />
          <input value={form.adjustmentMade} onChange={e => setForm(f => ({ ...f, adjustmentMade: e.target.value }))}
            placeholder="How you adjusted in the moment" className="game-input w-full text-sm" />
          <input value={form.outcomeOfExchange} onChange={e => setForm(f => ({ ...f, outcomeOfExchange: e.target.value }))}
            placeholder="Outcome of this exchange" className="game-input w-full text-sm" />
          <input value={form.keyTechnique} onChange={e => setForm(f => ({ ...f, keyTechnique: e.target.value }))}
            placeholder="Key social technique that worked" className="game-input w-full text-sm" />
          <input value={form.practiceFor} onChange={e => setForm(f => ({ ...f, practiceFor: e.target.value }))}
            placeholder="Skill to practice next time" className="game-input w-full text-sm" />
          <div>
            <p className="text-xs text-slate-500 mb-1">Social intelligence shown: {form.socialScore}/10</p>
            <input type="range" min={1} max={10} value={form.socialScore}
              onChange={e => setForm(f => ({ ...f, socialScore: Number(e.target.value) }))}
              className="w-full h-1 accent-green-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {entries.map(e => {
          const s = SITUATION_CONFIG[e.situation]
          const sk = SKILL_CONFIG[e.skillLevel]
          return (
            <div key={e.id} className="game-card p-3 flex items-start gap-3" style={{ borderLeft: `3px solid ${s.color}` }}>
              <span className="text-2xl">{s.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white">{s.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: sk.color + '20', color: sk.color }}>{sk.label}</span>
                  <span className="text-xs text-green-400">👥 {e.socialScore}/10</span>
                </div>
                {e.keyTechnique && <p className="text-xs text-yellow-300/70 mt-1">💡 {e.keyTechnique}</p>}
                {e.practiceFor && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">Practice: {e.practiceFor}</p>}
              </div>
              <button onClick={() => save(entries.filter(x => x.id !== e.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
        {entries.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Social intelligence is learned, practiced, and continuously refined.</p>
          </div>
        )}
      </div>
    </div>
  )
}
