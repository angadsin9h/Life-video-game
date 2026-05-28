import { useState, useEffect, useRef, useCallback } from 'react'
import { Shield, Star, Heart, Zap, Target, Plus, X, Play, ChevronRight, Layers, Award } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'identity_architect'

interface IdentityRole {
  id: string
  name: string
  excellence: string
}

interface IdentityData {
  iAm: string
  iBelieve: string
  iValue: string
  iCommitTo: string
  myStandards: string
  roles: IdentityRole[]
  affirmations: [string, string, string, string, string]
  lastUpdated: string
}

const DEFAULT_DATA: IdentityData = {
  iAm: '',
  iBelieve: '',
  iValue: '',
  iCommitTo: '',
  myStandards: '',
  roles: [],
  affirmations: ['', '', '', '', ''],
  lastUpdated: '',
}

type TextSection = 'iAm' | 'iBelieve' | 'iValue' | 'iCommitTo' | 'myStandards'

function loadData(): IdentityData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<IdentityData>
      return {
        ...DEFAULT_DATA,
        ...parsed,
        affirmations: (parsed.affirmations && parsed.affirmations.length === 5)
          ? parsed.affirmations
          : DEFAULT_DATA.affirmations,
        roles: parsed.roles ?? [],
      }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_DATA }
}

function saveData(data: IdentityData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }))
  } catch { /* ignore */ }
}

function computeCompleteness(data: IdentityData): number {
  let total = 0
  let filled = 0
  // 5 text sections
  const textKeys: TextSection[] = ['iAm', 'iBelieve', 'iValue', 'iCommitTo', 'myStandards']
  textKeys.forEach(k => {
    total++
    if (data[k].trim().length > 0) filled++
  })
  // roles (at least 1)
  total++
  if (data.roles.length > 0) filled++
  // affirmations (at least 3 filled)
  total++
  if (data.affirmations.filter(a => a.trim().length > 0).length >= 3) filled++
  return Math.round((filled / total) * 100)
}

const SECTIONS: Array<{ key: TextSection; title: string; icon: React.ReactNode; placeholder: string; accent: string }> = [
  {
    key: 'iAm',
    title: 'I Am',
    icon: <Shield className="w-5 h-5 text-violet-400" />,
    placeholder: 'I am a disciplined creator...\nI am someone who keeps their word...\nI am relentless in my pursuit of growth...',
    accent: 'border-violet-500/30',
  },
  {
    key: 'iBelieve',
    title: 'I Believe',
    icon: <Star className="w-5 h-5 text-amber-400" />,
    placeholder: 'I believe that effort compounds over time...\nI believe in the abundance of the universe...\nI believe challenges make me stronger...',
    accent: 'border-amber-500/30',
  },
  {
    key: 'iValue',
    title: 'I Value',
    icon: <Heart className="w-5 h-5 text-pink-400" />,
    placeholder: 'Freedom — because it allows authentic expression...\nGrowth — because stagnation is death...\nIntegrity — because I must be able to look at myself...',
    accent: 'border-pink-500/30',
  },
  {
    key: 'iCommitTo',
    title: 'I Commit To',
    icon: <Zap className="w-5 h-5 text-blue-400" />,
    placeholder: 'Daily movement regardless of motivation...\nDeep work every morning before checking messages...\nBeing present with people who matter to me...',
    accent: 'border-blue-500/30',
  },
  {
    key: 'myStandards',
    title: 'My Standards',
    icon: <Target className="w-5 h-5 text-green-400" />,
    placeholder: 'I never miss two days in a row on my non-negotiables...\nI respond to messages within 24 hours...\nI always finish what I start...',
    accent: 'border-green-500/30',
  },
]

export default function IdentityArchitect() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<IdentityData>(loadData)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleExcellence, setNewRoleExcellence] = useState('')
  const [affirmMode, setAffirmMode] = useState(false)
  const [affirmIndex, setAffirmIndex] = useState(0)
  const [affirmTimer, setAffirmTimer] = useState(5)
  const debounceTimers = useRef<Partial<Record<string, ReturnType<typeof setTimeout>>>>({})
  const affirmInterval = useRef<ReturnType<typeof setInterval> | null>(null)

  const completeness = computeCompleteness(data)

  const autoSave = useCallback((updated: IdentityData) => {
    saveData(updated)
    toastSuccess('Identity auto-saved')
  }, [toastSuccess])

  function handleTextChange(key: TextSection, value: string) {
    const updated = { ...data, [key]: value }
    setData(updated)
    const timerKey = key
    if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey])
    debounceTimers.current[timerKey] = setTimeout(() => autoSave(updated), 800)
  }

  function handleAffirmationChange(index: number, value: string) {
    const newAffirmations = [...data.affirmations] as IdentityData['affirmations']
    newAffirmations[index] = value
    const updated = { ...data, affirmations: newAffirmations }
    setData(updated)
    const timerKey = `affirm-${index}`
    if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey])
    debounceTimers.current[timerKey] = setTimeout(() => autoSave(updated), 800)
  }

  function handleAddRole() {
    if (!newRoleName.trim()) return
    const role: IdentityRole = {
      id: Date.now().toString(),
      name: newRoleName.trim(),
      excellence: newRoleExcellence.trim(),
    }
    const updated = { ...data, roles: [...data.roles, role] }
    setData(updated)
    saveData(updated)
    toastSuccess('Role added', role.name)
    setNewRoleName('')
    setNewRoleExcellence('')
  }

  function handleRemoveRole(id: string) {
    const updated = { ...data, roles: data.roles.filter(r => r.id !== id) }
    setData(updated)
    saveData(updated)
  }

  function handleUpdateRoleExcellence(id: string, value: string) {
    const updated = {
      ...data,
      roles: data.roles.map(r => r.id === id ? { ...r, excellence: value } : r),
    }
    setData(updated)
    const timerKey = `role-${id}`
    if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey])
    debounceTimers.current[timerKey] = setTimeout(() => autoSave(updated), 800)
  }

  function startAffirmations() {
    const filled = data.affirmations.filter(a => a.trim().length > 0)
    if (filled.length === 0) return
    setAffirmIndex(0)
    setAffirmTimer(5)
    setAffirmMode(true)
  }

  useEffect(() => {
    if (!affirmMode) {
      if (affirmInterval.current) clearInterval(affirmInterval.current)
      return
    }
    affirmInterval.current = setInterval(() => {
      setAffirmTimer(t => {
        if (t <= 1) {
          const filledAffirms = data.affirmations.filter(a => a.trim().length > 0)
          setAffirmIndex(prev => {
            if (prev + 1 >= filledAffirms.length) {
              setAffirmMode(false)
              return 0
            }
            return prev + 1
          })
          return 5
        }
        return t - 1
      })
    }, 1000)
    return () => { if (affirmInterval.current) clearInterval(affirmInterval.current) }
  }, [affirmMode, data.affirmations])

  useEffect(() => {
    const timers = debounceTimers.current
    return () => {
      Object.values(timers).forEach(t => { if (t) clearTimeout(t) })
    }
  }, [])

  const filledAffirmations = data.affirmations.filter(a => a.trim().length > 0)

  const completenessColor =
    completeness >= 75 ? 'bg-emerald-500' :
    completeness >= 50 ? 'bg-violet-500' :
    completeness >= 25 ? 'bg-amber-500' : 'bg-slate-600'

  // Fullscreen affirmation mode
  if (affirmMode) {
    const currentAffirm = filledAffirmations[affirmIndex] ?? ''
    return (
      <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 p-8">
        <div className="text-center max-w-2xl">
          <div className="text-xs text-slate-500 mb-6 tracking-widest uppercase">
            Affirmation {affirmIndex + 1} of {filledAffirmations.length}
          </div>
          <p className="text-2xl md:text-4xl font-bold text-violet-300 leading-relaxed mb-8" style={{ fontFamily: 'Orbitron, monospace' }}>
            {currentAffirm}
          </p>
          <div className="flex items-center gap-3 justify-center mb-8">
            {filledAffirmations.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${i === affirmIndex ? 'bg-violet-400 scale-125' : i < affirmIndex ? 'bg-violet-700' : 'bg-slate-700'}`}
              />
            ))}
          </div>
          <div className="text-5xl font-black text-violet-400 mb-6" style={{ fontFamily: 'Orbitron, monospace' }}>
            {affirmTimer}
          </div>
          <button
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm"
            onClick={() => setAffirmMode(false)}>
            Exit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Shield className="w-6 h-6 text-violet-400" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, monospace' }}>
          Identity Architect
        </h1>
      </div>
      <p className="text-slate-400 text-sm mb-6">Design who you are and who you are becoming.</p>

      {/* Completeness */}
      <div className="game-card mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold">Identity Completeness</span>
          </div>
          <span className="text-2xl font-black text-violet-400" style={{ fontFamily: 'Orbitron, monospace' }}>
            {completeness}%
          </span>
        </div>
        <div className="bg-slate-700/50 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${completenessColor}`}
            style={{ width: `${completeness}%` }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-2">
          {SECTIONS.filter(s => data[s.key].trim().length > 0).length}/5 sections · {data.roles.length} roles · {data.affirmations.filter(a => a.trim().length > 0).length}/5 affirmations
        </div>
      </div>

      {/* Identity Sections */}
      <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
        <Shield className="w-4 h-4 text-violet-400" /> Core Identity Statements
      </h2>
      <div className="space-y-4 mb-6">
        {SECTIONS.map(s => {
          const isFilled = data[s.key].trim().length > 0
          return (
            <div key={s.key} className={`game-card border ${s.accent}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {s.icon}
                  <span className="font-bold text-slate-100">{s.title}</span>
                </div>
                {isFilled && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Filled
                  </span>
                )}
              </div>
              <textarea
                className="game-input w-full resize-none"
                rows={4}
                placeholder={s.placeholder}
                value={data[s.key]}
                onChange={e => handleTextChange(s.key, e.target.value)}
              />
            </div>
          )
        })}
      </div>

      {/* Identity Roles */}
      <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
        <Award className="w-4 h-4 text-amber-400" /> Identity Roles
      </h2>
      <div className="game-card mb-4 border border-amber-500/20">
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-xs text-slate-400">Role Name</label>
            <input className="game-input w-full mt-1" placeholder="e.g. Father, Entrepreneur, Athlete..."
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddRole()} />
          </div>
          <div>
            <label className="text-xs text-slate-400">What does excellence look like in this role?</label>
            <input className="game-input w-full mt-1" placeholder="Excellence means..."
              value={newRoleExcellence}
              onChange={e => setNewRoleExcellence(e.target.value)} />
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 text-sm py-2 rounded-lg border border-amber-500/30 transition-all"
          onClick={handleAddRole}>
          <Plus className="w-4 h-4" /> Add Role
        </button>
      </div>

      {data.roles.length > 0 && (
        <div className="space-y-3 mb-6">
          {data.roles.map(role => (
            <div key={role.id} className="game-card border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-300">{role.name}</span>
                </div>
                <button onClick={() => handleRemoveRole(role.id)}
                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-400">What does excellence look like?</label>
                <textarea
                  className="game-input w-full resize-none mt-1"
                  rows={2}
                  placeholder="Excellence in this role means..."
                  value={role.excellence}
                  onChange={e => handleUpdateRoleExcellence(role.id, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Affirmations */}
      <h2 className="text-base font-bold text-slate-200 mb-3 flex items-center gap-2">
        <Star className="w-4 h-4 text-blue-400" /> Daily Affirmations
      </h2>
      <div className="game-card mb-4 border border-blue-500/20">
        <div className="space-y-2 mb-4">
          {data.affirmations.map((affirm, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-4 flex-shrink-0">{i + 1}.</span>
              <input
                className="game-input flex-1"
                placeholder={`Affirmation ${i + 1}...`}
                value={affirm}
                onChange={e => handleAffirmationChange(i, e.target.value)}
              />
            </div>
          ))}
        </div>
        <button
          className={`w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg font-semibold transition-all ${filledAffirmations.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
          disabled={filledAffirmations.length === 0}
          onClick={startAffirmations}>
          <Play className="w-4 h-4" /> Run Affirmations ({filledAffirmations.length} filled)
        </button>
      </div>

      <div className="text-center text-xs text-slate-500 mt-4">
        <Target className="w-3 h-3 inline mr-1" />
        Auto-saves as you type · Data stored in <span className="font-mono text-slate-400">{STORAGE_KEY}</span>
      </div>
    </div>
  )
}
