import React, { useState, useEffect } from 'react'
import {
  Plus, Trash2, Activity, Clock, Zap, Target, TrendingUp,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'lq-skill-practice-log'

type SkillCategory = 'cognitive' | 'physical' | 'creative' | 'social' | 'technical' | 'leadership'

type SkillLevel = 'novice' | 'apprentice' | 'practitioner' | 'expert' | 'master'

type Skill = {
  id: string
  name: string
  category: SkillCategory
  targetHours: number
  currentHours: number
  level: SkillLevel
  startDate: string
  notes: string
  active: boolean
}

type PracticeSession = {
  id: string
  skillId: string
  date: string
  duration: number
  focusRating: number
  progressRating: number
  whatPracticed: string
  breakthrough: string
  nextFocus: string
}

interface StoreData {
  skills: Skill[]
  sessions: PracticeSession[]
}

const CATEGORY_CONFIG: Record<SkillCategory, { label: string; color: string; icon: string }> = {
  cognitive:  { label: 'Cognitive',   color: '#6366f1', icon: '🧠' },
  physical:   { label: 'Physical',    color: '#ef4444', icon: '💪' },
  creative:   { label: 'Creative',    color: '#f97316', icon: '🎨' },
  social:     { label: 'Social',      color: '#22c55e', icon: '🤝' },
  technical:  { label: 'Technical',   color: '#3b82f6', icon: '⚙️' },
  leadership: { label: 'Leadership',  color: '#a855f7', icon: '🚀' },
}

const LEVEL_CONFIG: Record<SkillLevel, { label: string; color: string; bg: string }> = {
  novice:       { label: 'Novice',       color: '#94a3b8', bg: '#94a3b822' },
  apprentice:   { label: 'Apprentice',   color: '#22c55e', bg: '#22c55e22' },
  practitioner: { label: 'Practitioner', color: '#f59e0b', bg: '#f59e0b22' },
  expert:       { label: 'Expert',       color: '#3b82f6', bg: '#3b82f622' },
  master:       { label: 'Master',       color: '#a855f7', bg: '#a855f722' },
}

function calcLevel(hours: number): SkillLevel {
  if (hours >= 5000) return 'master'
  if (hours >= 2000) return 'expert'
  if (hours >= 500)  return 'practitioner'
  if (hours >= 100)  return 'apprentice'
  return 'novice'
}

function loadStore(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as StoreData
  } catch { /* ignore */ }
  return { skills: [], sessions: [] }
}

function saveStore(data: StoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

type Tab = 'skills' | 'log' | 'heatmap' | 'timeline'

export default function SkillPracticeLog() {
  const { toastSuccess } = useToast()

  const [skills, setSkills] = useState<Skill[]>([])
  const [sessions, setSessions] = useState<PracticeSession[]>([])
  const [tab, setTab] = useState<Tab>('skills')

  const [showSkillForm, setShowSkillForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)

  const [skillForm, setSkillForm] = useState<Omit<Skill, 'id' | 'level'>>({
    name: '',
    category: 'technical',
    targetHours: 1000,
    currentHours: 0,
    startDate: today(),
    notes: '',
    active: true,
  })

  const [sessionForm, setSessionForm] = useState<Omit<PracticeSession, 'id' | 'date'>>({
    skillId: '',
    duration: 30,
    focusRating: 7,
    progressRating: 7,
    whatPracticed: '',
    breakthrough: '',
    nextFocus: '',
  })

  useEffect(() => {
    const data = loadStore()
    setSkills(data.skills)
    setSessions(data.sessions)
  }, [])

  function persist(nextSkills: Skill[], nextSessions: PracticeSession[]) {
    setSkills(nextSkills)
    setSessions(nextSessions)
    saveStore({ skills: nextSkills, sessions: nextSessions })
  }

  function addSkill() {
    if (!skillForm.name.trim()) return
    const level = calcLevel(skillForm.currentHours)
    const s: Skill = { id: Date.now().toString(), ...skillForm, level }
    persist([...skills, s], sessions)
    setSkillForm({
      name: '', category: 'technical', targetHours: 1000, currentHours: 0,
      startDate: today(), notes: '', active: true,
    })
    setShowSkillForm(false)
    toastSuccess(`Skill "${s.name}" added — start your deliberate practice journey!`)
  }

  function deleteSkill(id: string) {
    persist(
      skills.filter(s => s.id !== id),
      sessions.filter(s => s.skillId !== id),
    )
  }

  function logSession() {
    if (!sessionForm.skillId || !sessionForm.whatPracticed.trim()) return
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      date: today(),
      ...sessionForm,
    }
    const addedHours = sessionForm.duration / 60
    const nextSkills = skills.map(s => {
      if (s.id !== sessionForm.skillId) return s
      const newHours = s.currentHours + addedHours
      return { ...s, currentHours: newHours, level: calcLevel(newHours) }
    })
    persist(nextSkills, [newSession, ...sessions])
    setSessionForm(f => ({
      ...f, whatPracticed: '', breakthrough: '', nextFocus: '',
      duration: 30, focusRating: 7, progressRating: 7,
    }))
    setShowSessionForm(false)
    toastSuccess(`Session logged! +${fmtDuration(sessionForm.duration)} of deliberate practice.`)
  }

  const todayStr = today()
  const totalHours = skills.reduce((s, k) => s + k.currentHours, 0)
  const todaySessions = sessions.filter(s => s.date === todayStr).length
  const masterCount = skills.filter(s => s.level === 'master').length

  const heatmapDays = 60
  const heatmapDates = Array.from({ length: heatmapDays }, (_, i) => daysAgo(heatmapDays - 1 - i))
  const sessionsByDate: Record<string, number> = {}
  for (const s of sessions) {
    sessionsByDate[s.date] = (sessionsByDate[s.date] ?? 0) + s.duration
  }
  const maxDayMins = Math.max(...Object.values(sessionsByDate), 1)

  const CELL = 11
  const GAP = 2
  const COLS = Math.ceil(heatmapDays / 7)
  const svgW = COLS * (CELL + GAP)
  const svgH = 7 * (CELL + GAP)

  function heatColor(mins: number): string {
    if (mins === 0) return '#1e293b'
    const pct = mins / maxDayMins
    if (pct < 0.25) return '#134e4a'
    if (pct < 0.5)  return '#0f766e'
    if (pct < 0.75) return '#0d9488'
    return '#f59e0b'
  }

  const streakCount = (() => {
    let count = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (!sessionsByDate[ds]) break
      count++
      d.setDate(d.getDate() - 1)
    }
    return count
  })()

  const tabs: { id: Tab; label: string }[] = [
    { id: 'skills',   label: 'Roster' },
    { id: 'log',      label: 'Log' },
    { id: 'heatmap',  label: 'Heatmap' },
    { id: 'timeline', label: 'Timeline' },
  ]

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Activity className="w-7 h-7 text-teal-400" />
            Skill Practice Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your 10,000-hour journey of deliberate practice.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSessionForm(v => !v); setShowSkillForm(false) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold"
          >
            <Clock className="w-4 h-4" /> Log
          </button>
          <button
            onClick={() => { setShowSkillForm(v => !v); setShowSessionForm(false) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Skill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>{skills.length}</div>
          <div className="text-xs text-slate-500">Skills</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-teal-400" style={{ fontFamily: 'Orbitron, monospace' }}>{Math.round(totalHours)}h</div>
          <div className="text-xs text-slate-500">Total Hours</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-amber-400" style={{ fontFamily: 'Orbitron, monospace' }}>{streakCount}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-purple-400" style={{ fontFamily: 'Orbitron, monospace' }}>{masterCount}</div>
          <div className="text-xs text-slate-500">Mastered</div>
        </div>
      </div>

      {showSkillForm && (
        <div className="game-card p-4 border border-amber-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-amber-400">New Skill</h3>
          <input
            value={skillForm.name}
            onChange={e => setSkillForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Skill name *"
            className="game-input w-full text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={skillForm.category}
              onChange={e => setSkillForm(f => ({ ...f, category: e.target.value as SkillCategory }))}
              className="game-input text-sm flex-1"
            >
              {(Object.entries(CATEGORY_CONFIG) as [SkillCategory, { label: string; color: string; icon: string }][]).map(([k, c]) => (
                <option key={k} value={k}>{c.icon} {c.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={skillForm.startDate}
              onChange={e => setSkillForm(f => ({ ...f, startDate: e.target.value }))}
              className="game-input text-sm flex-1"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Target hours: {skillForm.targetHours}h</p>
              <input
                type="range" min={100} max={10000} step={100}
                value={skillForm.targetHours}
                onChange={e => setSkillForm(f => ({ ...f, targetHours: Number(e.target.value) }))}
                className="w-full h-1 accent-amber-400"
              />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-1">Current hours: {skillForm.currentHours}h</p>
              <input
                type="range" min={0} max={10000} step={10}
                value={skillForm.currentHours}
                onChange={e => setSkillForm(f => ({ ...f, currentHours: Number(e.target.value) }))}
                className="w-full h-1 accent-teal-400"
              />
            </div>
          </div>
          <textarea
            value={skillForm.notes}
            onChange={e => setSkillForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Why are you mastering this skill? (optional)"
            className="game-input w-full h-16 resize-none text-sm"
          />
          <div className="flex gap-2">
            <button onClick={addSkill} className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold">Add Skill</button>
            <button onClick={() => setShowSkillForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {showSessionForm && (
        <div className="game-card p-4 border border-teal-500/30 space-y-3">
          <h3 className="text-sm font-semibold text-teal-400">Log Practice Session</h3>
          {skills.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Add a skill first before logging sessions.</p>
          ) : (
            <>
              <select
                value={sessionForm.skillId}
                onChange={e => setSessionForm(f => ({ ...f, skillId: e.target.value }))}
                className="game-input w-full text-sm"
              >
                <option value="">Select skill…</option>
                {skills.filter(s => s.active).map(s => (
                  <option key={s.id} value={s.id}>
                    {CATEGORY_CONFIG[s.category].icon} {s.name}
                  </option>
                ))}
              </select>
              <div>
                <p className="text-xs text-slate-500 mb-1">Duration: {fmtDuration(sessionForm.duration)}</p>
                <input
                  type="range" min={5} max={240} step={5}
                  value={sessionForm.duration}
                  onChange={e => setSessionForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="w-full h-1 accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                  <span>5m</span><span>1h</span><span>2h</span><span>4h</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Focus (deliberateness): {sessionForm.focusRating}/10</p>
                  <input
                    type="range" min={1} max={10}
                    value={sessionForm.focusRating}
                    onChange={e => setSessionForm(f => ({ ...f, focusRating: Number(e.target.value) }))}
                    className="w-full h-1 accent-amber-400"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Progress felt: {sessionForm.progressRating}/10</p>
                  <input
                    type="range" min={1} max={10}
                    value={sessionForm.progressRating}
                    onChange={e => setSessionForm(f => ({ ...f, progressRating: Number(e.target.value) }))}
                    className="w-full h-1 accent-teal-400"
                  />
                </div>
              </div>
              <textarea
                value={sessionForm.whatPracticed}
                onChange={e => setSessionForm(f => ({ ...f, whatPracticed: e.target.value }))}
                placeholder="What did you practice? *"
                className="game-input w-full h-16 resize-none text-sm"
              />
              <input
                value={sessionForm.breakthrough}
                onChange={e => setSessionForm(f => ({ ...f, breakthrough: e.target.value }))}
                placeholder="Any breakthrough insight? (optional)"
                className="game-input w-full text-sm"
              />
              <input
                value={sessionForm.nextFocus}
                onChange={e => setSessionForm(f => ({ ...f, nextFocus: e.target.value }))}
                placeholder="What to work on next? (optional)"
                className="game-input w-full text-sm"
              />
              <div className="flex gap-2">
                <button onClick={logSession} className="flex-1 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold">Log Session</button>
                <button onClick={() => setShowSessionForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              tab === t.id ? 'bg-teal-700 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'skills' && (
        <div className="space-y-3">
          {skills.length === 0 && !showSkillForm && (
            <div className="text-center py-14 text-slate-500">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Add your first skill to begin your mastery journey.</p>
            </div>
          )}
          {skills.map(skill => {
            const cat = CATEGORY_CONFIG[skill.category]
            const lv = LEVEL_CONFIG[skill.level]
            const pct = Math.min(100, (skill.currentHours / skill.targetHours) * 100)
            const skillSessions = sessions.filter(s => s.skillId === skill.id)
            const remainingHours = skill.targetHours - skill.currentHours
            const avgHoursPerSession = skillSessions.length > 0
              ? skillSessions.reduce((acc, s) => acc + s.duration, 0) / skillSessions.length / 60
              : 0.5

            const avgFreqDays = skillSessions.length > 1
              ? (() => {
                  const dates = skillSessions.map(s => new Date(s.date).getTime()).sort((a, b) => a - b)
                  return (dates[dates.length - 1] - dates[0]) / (skillSessions.length - 1) / 86400000
                })()
              : 7

            const sessionsNeeded = avgHoursPerSession > 0 ? remainingHours / avgHoursPerSession : remainingHours * 2
            const etaDays = Math.round(sessionsNeeded * avgFreqDays)
            const etaYears = etaDays / 365

            return (
              <div key={skill.id} className="game-card p-4" style={{ borderLeft: `3px solid ${cat.color}` }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-bold text-white">{skill.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: lv.bg, color: lv.color, border: `1px solid ${lv.color}55` }}
                    >
                      {lv.label}
                    </span>
                    <span className="text-xs text-slate-500">{cat.label}</span>
                  </div>
                  <button onClick={() => deleteSkill(skill.id)} className="text-slate-700 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="text-slate-400">{skill.currentHours.toFixed(1)}h / {skill.targetHours}h</span>
                  <span className="text-teal-400 font-semibold">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cat.color}, #f59e0b)` }}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {remainingHours.toFixed(0)}h remaining
                  </span>
                  {skillSessions.length > 0 && remainingHours > 0 && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      ETA ~{etaYears >= 1 ? `${etaYears.toFixed(1)}yr` : `${etaDays}d`}
                    </span>
                  )}
                  <span>{skillSessions.length} sessions</span>
                  <span>Since {skill.startDate}</span>
                </div>
                {skill.notes && <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">{skill.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'log' && (
        <div className="space-y-3">
          {skills.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Add a skill first, then log sessions here.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500">Today: {todaySessions} session{todaySessions !== 1 ? 's' : ''} logged</p>
              {sessions.slice(0, 20).map(sess => {
                const skill = skills.find(s => s.id === sess.skillId)
                const cat = skill ? CATEGORY_CONFIG[skill.category] : null
                return (
                  <div key={sess.id} className="game-card p-3" style={{ borderLeft: cat ? `3px solid ${cat.color}` : undefined }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {cat && <span className="text-base">{cat.icon}</span>}
                      <span className="text-sm font-semibold text-white">{skill?.name ?? 'Unknown'}</span>
                      <span className="text-xs text-slate-500">{sess.date}</span>
                      <span className="text-xs text-teal-400 font-semibold">{fmtDuration(sess.duration)}</span>
                    </div>
                    <p className="text-xs text-slate-300 mb-1">{sess.whatPracticed}</p>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>Focus: <span className="text-amber-400">{sess.focusRating}/10</span></span>
                      <span>Progress: <span className="text-teal-400">{sess.progressRating}/10</span></span>
                    </div>
                    {sess.breakthrough && (
                      <div className="mt-1 px-2 py-1 bg-amber-900/20 border border-amber-500/20 rounded text-xs text-amber-300">
                        Breakthrough: {sess.breakthrough}
                      </div>
                    )}
                    {sess.nextFocus && (
                      <p className="text-xs text-slate-500 mt-1">Next: {sess.nextFocus}</p>
                    )}
                  </div>
                )
              })}
              {sessions.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  <Zap className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No sessions yet — log your first practice.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Last 60 Days — Practice Density
          </h3>
          <svg
            width="100%"
            viewBox={`0 0 ${svgW + 18} ${svgH + 24}`}
            className="overflow-visible"
          >
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <text key={i} x={0} y={i * (CELL + GAP) + CELL - 1} fontSize={8} fill="#475569">{i % 2 === 1 ? d : ''}</text>
            ))}
            {heatmapDates.map((date, idx) => {
              const col = Math.floor(idx / 7)
              const row = idx % 7
              const x = 14 + col * (CELL + GAP)
              const y = row * (CELL + GAP)
              const mins = sessionsByDate[date] ?? 0
              return (
                <rect
                  key={date}
                  x={x} y={y}
                  width={CELL} height={CELL}
                  rx={2}
                  fill={heatColor(mins)}
                  opacity={0.9}
                >
                  <title>{date}: {mins > 0 ? fmtDuration(mins) : 'No practice'}</title>
                </rect>
              )
            })}
            <g>
              <text x={14} y={svgH + 18} fontSize={8} fill="#334155">Less</text>
              {['#1e293b', '#134e4a', '#0f766e', '#0d9488', '#f59e0b'].map((c, i) => (
                <rect key={c} x={38 + i * 13} y={svgH + 8} width={10} height={10} rx={2} fill={c} />
              ))}
              <text x={107} y={svgH + 18} fontSize={8} fill="#334155">More</text>
            </g>
          </svg>
          <div className="mt-2 text-xs text-slate-500">
            Current streak: <span className="text-amber-400 font-semibold">{streakCount} day{streakCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">{sessions.length} total sessions logged</p>
          {sessions.slice(0, 30).map((sess, idx) => {
            const skill = skills.find(s => s.id === sess.skillId)
            const cat = skill ? CATEGORY_CONFIG[skill.category] : null
            const prevSess = sessions[idx - 1]
            const isFirst = idx === 0 || prevSess.date !== sess.date
            return (
              <React.Fragment key={sess.id}>
                {isFirst && (
                  <div className="text-xs text-slate-500 font-semibold pt-1">{sess.date}</div>
                )}
                <div className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: cat?.color ?? '#475569' }} />
                  <div className="flex-1 game-card p-3">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-white">{skill?.name ?? 'Unknown'}</span>
                      <span className="text-xs text-teal-400">{fmtDuration(sess.duration)}</span>
                      <span className="text-xs text-slate-500">
                        F:{sess.focusRating} P:{sess.progressRating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{sess.whatPracticed}</p>
                    {sess.breakthrough && (
                      <p className="text-xs text-amber-400 mt-1">✦ {sess.breakthrough}</p>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )
          })}
          {sessions.length === 0 && (
            <div className="text-center py-14 text-slate-500">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No sessions logged yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
