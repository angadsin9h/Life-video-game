import { useState, useEffect } from 'react'
import { Sun, CheckCircle2, Circle, ChevronRight, ChevronLeft, Star, Target, Heart, Zap, Clock, Flame } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

const STORAGE_KEY = 'daily_intention_setter_log'

const QUALITIES = ['Disciplined', 'Creative', 'Courageous', 'Loving', 'Focused', 'Joyful', 'Resilient', 'Grateful', 'Generous', 'Peaceful']

interface IntentionEntry {
  date: string
  todayIAm: string
  mainQuality: string
  singleMostImportant: string
  byWhenDone: string
  secondaryTask: string
  whatToDelegate: string
  energyPlan: string
  rechargeActivity: string
  whoToConnect: string
  howToShowUp: string
  bestCaseScenario: string
  eveningCheckIn: string
  intentionScore: number
}

function loadLog(): IntentionEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveLog(entries: IntentionEntry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)) } catch { /* silent */ }
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function calcScore(f: Omit<IntentionEntry, 'date' | 'intentionScore'>): number {
  const fields = [
    f.todayIAm, f.mainQuality, f.singleMostImportant, f.byWhenDone,
    f.secondaryTask, f.whatToDelegate, f.energyPlan, f.rechargeActivity,
    f.whoToConnect, f.howToShowUp, f.bestCaseScenario, f.eveningCheckIn,
  ]
  const filled = fields.filter(v => v.trim().length > 0).length
  return Math.round((filled / 11) * 100)
}

const SECTION_LABELS = ['Identity', 'Focus', 'Energy', 'Relationships', 'Evening']
const SECTION_ICONS = [Star, Target, Zap, Heart, Clock]
const SECTION_COLORS = ['text-violet-400', 'text-blue-400', 'text-amber-400', 'text-pink-400', 'text-green-400']

export default function DailyIntentionSetter() {
  const { toastSuccess } = useToast()
  const [log, setLog] = useState<IntentionEntry[]>([])
  const [openSection, setOpenSection] = useState<number>(0)
  const [saved, setSaved] = useState(false)
  const [view, setView] = useState<'set' | 'history'>('set')

  const [todayIAm, setTodayIAm] = useState('')
  const [mainQuality, setMainQuality] = useState('')
  const [singleMostImportant, setSingleMostImportant] = useState('')
  const [byWhenDone, setByWhenDone] = useState('')
  const [secondaryTask, setSecondaryTask] = useState('')
  const [whatToDelegate, setWhatToDelegate] = useState('')
  const [energyPlan, setEnergyPlan] = useState('')
  const [rechargeActivity, setRechargeActivity] = useState('')
  const [whoToConnect, setWhoToConnect] = useState('')
  const [howToShowUp, setHowToShowUp] = useState('')
  const [bestCaseScenario, setBestCaseScenario] = useState('')
  const [eveningCheckIn, setEveningCheckIn] = useState('')

  useEffect(() => {
    const entries = loadLog()
    setLog(entries)
    const todays = entries.find(e => e.date === todayStr())
    if (todays) {
      setTodayIAm(todays.todayIAm)
      setMainQuality(todays.mainQuality)
      setSingleMostImportant(todays.singleMostImportant)
      setByWhenDone(todays.byWhenDone)
      setSecondaryTask(todays.secondaryTask)
      setWhatToDelegate(todays.whatToDelegate)
      setEnergyPlan(todays.energyPlan)
      setRechargeActivity(todays.rechargeActivity)
      setWhoToConnect(todays.whoToConnect)
      setHowToShowUp(todays.howToShowUp)
      setBestCaseScenario(todays.bestCaseScenario)
      setEveningCheckIn(todays.eveningCheckIn)
      setSaved(true)
    }
  }, [])

  const formData = {
    todayIAm, mainQuality, singleMostImportant, byWhenDone,
    secondaryTask, whatToDelegate, energyPlan, rechargeActivity,
    whoToConnect, howToShowUp, bestCaseScenario, eveningCheckIn,
  }

  const score = calcScore(formData)

  const handleSave = () => {
    const entry: IntentionEntry = { date: todayStr(), ...formData, intentionScore: score }
    const entries = loadLog().filter(e => e.date !== todayStr())
    entries.unshift(entry)
    saveLog(entries)
    setLog(entries)
    setSaved(true)
    toastSuccess('Intention set!', `Score: ${score}%`)
  }

  // Last 7 days completeness
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const date = d.toISOString().split('T')[0]
    const entry = log.find(e => e.date === date)
    return { date, score: entry?.intentionScore ?? null }
  })

  // Streak
  let streak = 0
  for (let i = 0; i < log.length; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    if (log.find(e => e.date === d.toISOString().split('T')[0])) streak++
    else break
  }

  const todayEntry = log.find(e => e.date === todayStr())

  const toggleSection = (idx: number) => setOpenSection(prev => (prev === idx ? -1 : idx))

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Sun className="w-7 h-7 text-amber-400" />
            Daily Intention Setter
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Who are you being today?</p>
        </div>
        <div className="flex gap-1">
          {(['set', 'history'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${view === v ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'set' && (
        <div className="space-y-4">
          {/* Score + streak */}
          <div className="grid grid-cols-3 gap-3">
            <div className="game-card p-4 text-center col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Intention Score</span>
                <span className="text-xl font-bold text-amber-400">{score}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${score}%` }} />
              </div>
            </div>
            <div className="game-card p-4 text-center">
              <Flame className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-white">{streak}</div>
              <div className="text-xs text-slate-500">Day streak</div>
            </div>
          </div>

          {/* 7-day dots */}
          <div className="game-card p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Last 7 Days</div>
            <div className="flex gap-2">
              {last7.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{
                      background: d.score === null ? '#1e293b' : d.score >= 70 ? '#22c55e33' : d.score >= 40 ? '#f59e0b33' : '#ef444433',
                      border: `2px solid ${d.score === null ? '#334155' : d.score >= 70 ? '#22c55e' : d.score >= 40 ? '#f59e0b' : '#ef4444'}`,
                    }}>
                    {d.score !== null ? d.score : ''}
                  </div>
                  <span className="text-[9px] text-slate-600">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }).slice(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Saved summary */}
          {saved && todayEntry && (
            <div className="game-card p-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">Today's Intention Set</span>
              </div>
              <div className="space-y-1.5 text-sm">
                {todayEntry.todayIAm && <p className="text-slate-300">I am a <span className="text-amber-400 font-semibold">{todayEntry.todayIAm}</span></p>}
                {todayEntry.mainQuality && <p className="text-slate-400">Quality: <span className="text-violet-400">{todayEntry.mainQuality}</span></p>}
                {todayEntry.singleMostImportant && <p className="text-slate-400">Top priority: <span className="text-blue-400">{todayEntry.singleMostImportant}</span></p>}
                {todayEntry.bestCaseScenario && <p className="text-slate-400 italic">"{todayEntry.bestCaseScenario}"</p>}
              </div>
              <button onClick={() => setSaved(false)} className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors">Edit intention</button>
            </div>
          )}

          {!saved && (
            <>
              {/* Section 1 — Identity */}
              <AccordionSection
                idx={0} open={openSection === 0} toggle={toggleSection}
                label="Identity" color={SECTION_COLORS[0]} Icon={SECTION_ICONS[0]}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Today I am a...</label>
                    <input value={todayIAm} onChange={e => setTodayIAm(e.target.value)}
                      placeholder="visionary, warrior, creator..." className="game-input w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Main quality I embody today</label>
                    <select value={mainQuality} onChange={e => setMainQuality(e.target.value)} className="game-input w-full">
                      <option value="">Select quality...</option>
                      {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                </div>
              </AccordionSection>

              {/* Section 2 — Focus */}
              <AccordionSection
                idx={1} open={openSection === 1} toggle={toggleSection}
                label="Focus" color={SECTION_COLORS[1]} Icon={SECTION_ICONS[1]}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">The ONE thing that matters most today</label>
                    <input value={singleMostImportant} onChange={e => setSingleMostImportant(e.target.value)}
                      placeholder="Single most important task..." className="game-input w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Done by when</label>
                    <input type="time" value={byWhenDone} onChange={e => setByWhenDone(e.target.value)} className="game-input w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Secondary task</label>
                    <input value={secondaryTask} onChange={e => setSecondaryTask(e.target.value)}
                      placeholder="Second priority..." className="game-input w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">What to delegate (optional)</label>
                    <input value={whatToDelegate} onChange={e => setWhatToDelegate(e.target.value)}
                      placeholder="Hand off to someone else..." className="game-input w-full" />
                  </div>
                </div>
              </AccordionSection>

              {/* Section 3 — Energy */}
              <AccordionSection
                idx={2} open={openSection === 2} toggle={toggleSection}
                label="Energy" color={SECTION_COLORS[2]} Icon={SECTION_ICONS[2]}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">How will you protect your energy today?</label>
                    <input value={energyPlan} onChange={e => setEnergyPlan(e.target.value)}
                      placeholder="No meetings before 10am, no social media..." className="game-input w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">One planned recovery activity</label>
                    <input value={rechargeActivity} onChange={e => setRechargeActivity(e.target.value)}
                      placeholder="Walk, nap, music, meditation..." className="game-input w-full" />
                  </div>
                </div>
              </AccordionSection>

              {/* Section 4 — Relationships */}
              <AccordionSection
                idx={3} open={openSection === 3} toggle={toggleSection}
                label="Relationships" color={SECTION_COLORS[3]} Icon={SECTION_ICONS[3]}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">One person to reach out to today</label>
                    <input value={whoToConnect} onChange={e => setWhoToConnect(e.target.value)}
                      placeholder="Name or relationship..." className="game-input w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">How will you show up for others?</label>
                    <input value={howToShowUp} onChange={e => setHowToShowUp(e.target.value)}
                      placeholder="Patient, present, encouraging..." className="game-input w-full" />
                  </div>
                </div>
              </AccordionSection>

              {/* Section 5 — Evening */}
              <AccordionSection
                idx={4} open={openSection === 4} toggle={toggleSection}
                label="Evening Review" color={SECTION_COLORS[4]} Icon={SECTION_ICONS[4]}>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">If today goes perfectly, what happens?</label>
                    <textarea value={bestCaseScenario} onChange={e => setBestCaseScenario(e.target.value)}
                      placeholder="Best case scenario..." className="game-input w-full h-20 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">When to review the day</label>
                    <input type="time" value={eveningCheckIn} onChange={e => setEveningCheckIn(e.target.value)} className="game-input w-full" />
                  </div>
                </div>
              </AccordionSection>

              <button onClick={handleSave}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Set Today's Intention ({score}%)
              </button>
            </>
          )}
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-3">
          {log.length === 0 ? (
            <div className="game-card p-8 text-center text-slate-500">No intentions set yet.</div>
          ) : log.slice(0, 14).map((entry, i) => (
            <div key={i} className="game-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-300">{entry.date}</span>
                <span className={`text-sm font-bold ${entry.intentionScore >= 70 ? 'text-green-400' : entry.intentionScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {entry.intentionScore}%
                </span>
              </div>
              {entry.todayIAm && <p className="text-xs text-slate-400">I am a <span className="text-amber-400">{entry.todayIAm}</span></p>}
              {entry.singleMostImportant && <p className="text-xs text-slate-500 mt-0.5">Top: {entry.singleMostImportant}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface AccordionProps {
  idx: number
  open: boolean
  toggle: (idx: number) => void
  label: string
  color: string
  Icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function AccordionSection({ idx, open, toggle, label, color, Icon, children }: AccordionProps) {
  return (
    <div className="game-card overflow-hidden">
      <button
        onClick={() => toggle(idx)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="font-semibold text-slate-200 text-sm">{label}</span>
        </div>
        {open ? <ChevronLeft className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="p-4 pt-0 border-t border-slate-700/50">{children}</div>}
    </div>
  )
}
