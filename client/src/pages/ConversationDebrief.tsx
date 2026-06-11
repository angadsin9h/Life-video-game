import React, { useState, useEffect } from 'react'
import { MessageSquare, Plus, Trash2, Briefcase, Home, Users, Heart, UserX, Flame, CheckCircle2, Circle, TrendingUp, Lightbulb, ListChecks } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type ConversationContext = 'work' | 'family' | 'friend' | 'partner' | 'stranger' | 'difficult'

type Debrief = {
  id: string
  date: string
  withWhom: string
  context: ConversationContext
  goal: string
  achieved: boolean
  listeningQuality: number
  clarityOfExpression: number
  emotionalRegulation: number
  whatWentWell: string
  whatToImprove: string
  keyMoment: string
  followUpNeeded: boolean
  followUpAction: string
}

type IconComponent = React.FC<{ className?: string; style?: React.CSSProperties }>

const STORAGE_KEY = 'lq-conversation-debrief'

const CONTEXT_CONFIG: Record<ConversationContext, { label: string; color: string; icon: IconComponent }> = {
  work: { label: 'Work', color: '#94a3b8', icon: Briefcase },
  family: { label: 'Family', color: '#fb923c', icon: Home },
  friend: { label: 'Friend', color: '#34d399', icon: Users },
  partner: { label: 'Partner', color: '#fb7185', icon: Heart },
  stranger: { label: 'Stranger', color: '#a78bfa', icon: UserX },
  difficult: { label: 'Difficult', color: '#f87171', icon: Flame },
}

const SKILL_CONFIG: { key: 'listeningQuality' | 'clarityOfExpression' | 'emotionalRegulation'; label: string; color: string }[] = [
  { key: 'listeningQuality', label: 'Listening', color: '#fb7185' },
  { key: 'clarityOfExpression', label: 'Clarity', color: '#fbbf24' },
  { key: 'emotionalRegulation', label: 'Regulation', color: '#38bdf8' },
]

const STOP_WORDS = new Set(['the', 'a', 'an', 'to', 'and', 'of', 'in', 'i', 'my', 'be', 'more', 'less', 'was', 'it', 'on', 'for', 'with', 'that', 'at', 'not', 'but', 'me', 'too', 'so', 'when', 'what', 'how', 'should', 'could', 'have', 'had', 'is', 'am', 'her', 'his', 'them', 'they', 'this', 'about', 'did', 'do', 'or', 'as', 'were'])

const emptyForm = (): Omit<Debrief, 'id'> => ({
  date: new Date().toISOString().split('T')[0],
  withWhom: '',
  context: 'work',
  goal: '',
  achieved: false,
  listeningQuality: 6,
  clarityOfExpression: 6,
  emotionalRegulation: 6,
  whatWentWell: '',
  whatToImprove: '',
  keyMoment: '',
  followUpNeeded: false,
  followUpAction: '',
})

export default function ConversationDebrief(): React.ReactElement {
  const { toastSuccess } = useToast()
  const [debriefs, setDebriefs] = useState<Debrief[]>([])
  const [showForm, setShowForm] = useState<boolean>(false)
  const [form, setForm] = useState<Omit<Debrief, 'id'>>(emptyForm())

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setDebriefs(JSON.parse(raw) as Debrief[])
    } catch {
      setDebriefs([])
    }
  }, [])

  const persist = (next: Debrief[]): void => {
    setDebriefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const submit = (): void => {
    if (!form.withWhom.trim() || !form.goal.trim()) return
    const entry: Debrief = { id: Date.now().toString(), ...form }
    persist([entry, ...debriefs])
    setForm(emptyForm())
    setShowForm(false)
    toastSuccess('Conversation debriefed — every exchange is practice')
  }

  const remove = (id: string): void => {
    persist(debriefs.filter(d => d.id !== id))
  }

  const completeFollowUp = (id: string): void => {
    persist(debriefs.map(d => (d.id === id ? { ...d, followUpNeeded: false } : d)))
    toastSuccess('Follow-up completed')
  }

  const sorted: Debrief[] = [...debriefs].sort((a, b) => a.date.localeCompare(b.date))
  const chartData: Debrief[] = sorted.slice(-20)
  const pendingFollowUps: Debrief[] = debriefs.filter(d => d.followUpNeeded)
  const achievedRate: number = debriefs.length ? Math.round((debriefs.filter(d => d.achieved).length / debriefs.length) * 100) : 0
  const avgSkill = (key: 'listeningQuality' | 'clarityOfExpression' | 'emotionalRegulation'): number =>
    debriefs.length ? Math.round((debriefs.reduce((s, d) => s + d[key], 0) / debriefs.length) * 10) / 10 : 0

  const contextStats: { context: ConversationContext; count: number; avg: number }[] = (
    Object.keys(CONTEXT_CONFIG) as ConversationContext[]
  )
    .map(ctx => {
      const items = debriefs.filter(d => d.context === ctx)
      const avg = items.length
        ? items.reduce((s, d) => s + (d.listeningQuality + d.clarityOfExpression + d.emotionalRegulation) / 3, 0) / items.length
        : 0
      return { context: ctx, count: items.length, avg: Math.round(avg * 10) / 10 }
    })
    .filter(s => s.count > 0)
    .sort((a, b) => a.avg - b.avg)

  const themeCounts: Record<string, number> = {}
  debriefs.forEach(d => {
    d.whatToImprove
      .toLowerCase()
      .split(/[^a-z']+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
      .forEach(w => {
        themeCounts[w] = (themeCounts[w] || 0) + 1
      })
  })
  const topThemes: [string, number][] = Object.entries(themeCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const chartW = 620
  const chartH = 230
  const padX = 36
  const padY = 22
  const xFor = (i: number): number =>
    chartData.length > 1 ? padX + (i * (chartW - padX * 2)) / (chartData.length - 1) : chartW / 2
  const yFor = (v: number): number => chartH - padY - ((v - 1) / 9) * (chartH - padY * 2)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <MessageSquare className="w-7 h-7" style={{ color: '#fb7185' }} />
            Conversation Debrief
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Review the conversations that matter and sharpen how you connect.</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-semibold"
          style={{ backgroundColor: '#e11d48' }}
        >
          <Plus className="w-4 h-4" /> Debrief
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{debriefs.length}</div>
          <div className="text-xs text-slate-500">Debriefs</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: '#fb7185' }}>{achievedRate}%</div>
          <div className="text-xs text-slate-500">Goals Met</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: '#fbbf24' }}>{avgSkill('clarityOfExpression')}</div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold" style={{ color: '#38bdf8' }}>{pendingFollowUps.length}</div>
          <div className="text-xs text-slate-500">Follow-Ups</div>
        </div>
      </div>

      {showForm && (
        <div className="game-card p-4 space-y-3" style={{ borderColor: 'rgba(251,113,133,0.25)' }}>
          <h3 className="text-sm font-semibold text-white">Debrief a Conversation</h3>
          <div className="flex gap-2">
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="game-input text-sm"
            />
            <input
              value={form.withWhom}
              onChange={e => setForm(f => ({ ...f, withWhom: e.target.value }))}
              placeholder="With whom?"
              className="game-input text-sm flex-1"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(CONTEXT_CONFIG) as [ConversationContext, typeof CONTEXT_CONFIG.work][]).map(([key, cfg]) => {
              const Icon = cfg.icon
              const active = form.context === key
              return (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, context: key }))}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border ${active ? 'text-white' : 'text-slate-400 border-slate-700'}`}
                  style={active ? { borderColor: cfg.color, backgroundColor: `${cfg.color}22` } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
          <input
            value={form.goal}
            onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
            placeholder="What did you want from this conversation?"
            className="game-input text-sm w-full"
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.achieved} onChange={e => setForm(f => ({ ...f, achieved: e.target.checked }))} />
            I achieved my goal
          </label>
          {SKILL_CONFIG.map(skill => (
            <div key={skill.key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{skill.label}</span>
                <span className="font-semibold" style={{ color: skill.color }}>{form[skill.key]}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={form[skill.key]}
                onChange={e => setForm(f => ({ ...f, [skill.key]: Number(e.target.value) }))}
                className="w-full"
                style={{ accentColor: skill.color }}
              />
            </div>
          ))}
          <textarea
            value={form.whatWentWell}
            onChange={e => setForm(f => ({ ...f, whatWentWell: e.target.value }))}
            placeholder="What went well?"
            rows={2}
            className="game-input text-sm w-full"
          />
          <textarea
            value={form.whatToImprove}
            onChange={e => setForm(f => ({ ...f, whatToImprove: e.target.value }))}
            placeholder="What would you improve next time?"
            rows={2}
            className="game-input text-sm w-full"
          />
          <input
            value={form.keyMoment}
            onChange={e => setForm(f => ({ ...f, keyMoment: e.target.value }))}
            placeholder="The pivotal moment of the conversation"
            className="game-input text-sm w-full"
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.followUpNeeded} onChange={e => setForm(f => ({ ...f, followUpNeeded: e.target.checked }))} />
            Follow-up needed
          </label>
          {form.followUpNeeded && (
            <input
              value={form.followUpAction}
              onChange={e => setForm(f => ({ ...f, followUpAction: e.target.value }))}
              placeholder="What follow-up action will you take?"
              className="game-input text-sm w-full"
            />
          )}
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: '#e11d48' }}>
              Save Debrief
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 bg-slate-800">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: '#fb7185' }} />
          Skill Trends
        </h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Debrief your first conversation to see your skill lines grow.</p>
        ) : (
          <>
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
              {[1, 4, 7, 10].map(v => (
                <g key={v}>
                  <line x1={padX} y1={yFor(v)} x2={chartW - padX} y2={yFor(v)} stroke="#334155" strokeWidth={1} strokeDasharray="4 4" />
                  <text x={padX - 8} y={yFor(v) + 4} fontSize={11} fill="#64748b" textAnchor="end">{v}</text>
                </g>
              ))}
              {SKILL_CONFIG.map(skill => (
                <g key={skill.key}>
                  {chartData.length > 1 && (
                    <polyline
                      points={chartData.map((d, i) => `${xFor(i)},${yFor(d[skill.key])}`).join(' ')}
                      fill="none"
                      stroke={skill.color}
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {chartData.map((d, i) => (
                    <circle key={d.id} cx={xFor(i)} cy={yFor(d[skill.key])} r={3.5} fill={skill.color} />
                  ))}
                </g>
              ))}
            </svg>
            <div className="flex justify-center gap-5 mt-2">
              {SKILL_CONFIG.map(skill => (
                <div key={skill.key} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: skill.color }} />
                  {skill.label}
                  <span className="text-slate-500">avg {avgSkill(skill.key)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Context Analysis</h3>
        {contextStats.length === 0 ? (
          <p className="text-sm text-slate-500">No data yet.</p>
        ) : (
          <div className="space-y-2.5">
            {contextStats.map((stat, idx) => {
              const cfg = CONTEXT_CONFIG[stat.context]
              const Icon = cfg.icon
              return (
                <div key={stat.context} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                  <span className="text-xs text-slate-300 w-20">{cfg.label}</span>
                  <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(stat.avg / 10) * 100}%`, backgroundColor: cfg.color }} />
                  </div>
                  <span className="text-xs text-slate-400 w-14 text-right">{stat.avg}/10 ({stat.count})</span>
                  {idx === 0 && contextStats.length > 1 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
                      hardest
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <ListChecks className="w-4 h-4" style={{ color: '#38bdf8' }} />
          Pending Follow-Ups
        </h3>
        {pendingFollowUps.length === 0 ? (
          <p className="text-sm text-slate-500">No pending follow-ups. Inbox zero for relationships.</p>
        ) : (
          <div className="space-y-2">
            {pendingFollowUps.map(d => (
              <div key={d.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/60">
                <button onClick={() => completeFollowUp(d.id)} className="mt-0.5 text-slate-500 hover:text-emerald-400">
                  <Circle className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{d.followUpAction || 'Follow up'}</div>
                  <div className="text-xs text-slate-500">{d.withWhom} · {d.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="game-card p-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4" style={{ color: '#fbbf24' }} />
          Communication Insights
        </h3>
        {topThemes.length === 0 ? (
          <p className="text-sm text-slate-500">Log a few debriefs and your recurring improvement themes will surface here.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topThemes.map(([word, count]) => (
              <span
                key={word}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'rgba(251,113,133,0.12)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.3)' }}
              >
                {word} ×{count}
              </span>
            ))}
          </div>
        )}
      </div>

      {debriefs.length > 0 && (
        <div className="game-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Recent Debriefs</h3>
          <div className="space-y-2">
            {debriefs.slice(0, 8).map(d => {
              const cfg = CONTEXT_CONFIG[d.context]
              const Icon = cfg.icon
              return (
                <div key={d.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60">
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: cfg.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{d.withWhom}</span>
                      <span className="text-xs text-slate-500">{d.date}</span>
                      {d.achieved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{d.goal}</div>
                    {d.keyMoment && <div className="text-xs text-slate-500 italic truncate">"{d.keyMoment}"</div>}
                  </div>
                  <button onClick={() => remove(d.id)} className="text-slate-600 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
