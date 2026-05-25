import { useState, useEffect } from 'react'
import { Compass, Plus, X, CheckCircle2, Circle, Brain, BarChart3 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type TopicType = 'Big Decision' | 'Life Direction' | 'Problem Solving' | 'Values Check' | 'Relationship Clarity'

interface ClarityFields {
  [key: string]: string
}

interface ClarityEntry {
  id: string
  topicType: TopicType
  fields: ClarityFields
  clarityScore: number
  createdAt: string
}

const STORAGE_KEY = 'clarity_session_log'

const TOPIC_TYPES: TopicType[] = ['Big Decision', 'Life Direction', 'Problem Solving', 'Values Check', 'Relationship Clarity']

const TOPIC_COLORS: Record<TopicType, string> = {
  'Big Decision': '#6366f1',
  'Life Direction': '#f59e0b',
  'Problem Solving': '#22c55e',
  'Values Check': '#ec4899',
  'Relationship Clarity': '#3b82f6',
}

interface FieldDef {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'textarea'
}

const TOPIC_FIELDS: Record<TopicType, FieldDef[]> = {
  'Big Decision': [
    { key: 'decision', label: "What's the decision?", placeholder: 'Describe the decision you need to make', type: 'textarea' },
    { key: 'option1', label: 'Option 1', placeholder: 'First option', type: 'text' },
    { key: 'option2', label: 'Option 2', placeholder: 'Second option', type: 'text' },
    { key: 'option3', label: 'Option 3', placeholder: 'Third option (optional)', type: 'text' },
    { key: 'criteria1', label: 'Criteria 1', placeholder: 'What matters most?', type: 'text' },
    { key: 'criteria2', label: 'Criteria 2', placeholder: 'Second criteria', type: 'text' },
    { key: 'criteria3', label: 'Criteria 3', placeholder: 'Third criteria', type: 'text' },
    { key: 'gutFeeling', label: 'Gut Feeling', placeholder: 'What does your gut say?', type: 'text' },
    { key: 'logicalChoice', label: 'Logical Choice', placeholder: 'What does logic say?', type: 'text' },
    { key: 'finalDecision', label: 'Final Decision', placeholder: 'Your final decision', type: 'text' },
  ],
  'Life Direction': [
    { key: 'whereGoing', label: 'Where are you going?', placeholder: 'Describe your current direction', type: 'textarea' },
    { key: 'pulling', label: "What's pulling you?", placeholder: 'What draws you forward?', type: 'text' },
    { key: 'pushing', label: "What's pushing you?", placeholder: "What are you running from or trying to escape?", type: 'text' },
    { key: 'leaveBehind', label: 'What must you leave behind?', placeholder: 'What do you need to release?', type: 'text' },
    { key: 'moveToward', label: 'What must you move toward?', placeholder: 'Your true north', type: 'text' },
  ],
  'Problem Solving': [
    { key: 'problem', label: 'The problem', placeholder: 'Describe the problem clearly', type: 'textarea' },
    { key: 'cause', label: 'What caused it?', placeholder: 'Root causes', type: 'text' },
    { key: 'affected', label: "Who's affected?", placeholder: 'People impacted', type: 'text' },
    { key: 'solution1', label: 'Solution 1', placeholder: 'First possible solution', type: 'text' },
    { key: 'solution2', label: 'Solution 2', placeholder: 'Second possible solution', type: 'text' },
    { key: 'solution3', label: 'Solution 3', placeholder: 'Third possible solution', type: 'text' },
    { key: 'bestSolution', label: 'Best solution', placeholder: 'The solution you will pursue', type: 'text' },
    { key: 'firstStep', label: 'First step', placeholder: 'Immediate next action', type: 'text' },
  ],
  'Values Check': [
    { key: 'situation', label: 'Situation name', placeholder: 'Name this situation', type: 'text' },
    { key: 'conflictingValues', label: 'What values are in conflict?', placeholder: 'Describe the value tension', type: 'textarea' },
    { key: 'mattersMost', label: 'What matters most?', placeholder: 'Your core priority', type: 'text' },
    { key: 'wouldRegret', label: 'What would you regret?', placeholder: 'Looking back in 10 years...', type: 'text' },
    { key: 'honorsWhoYouAre', label: 'What honors who you are?', placeholder: 'The choice aligned with your truest self', type: 'text' },
  ],
  'Relationship Clarity': [
    { key: 'who', label: 'Who is this about?', placeholder: 'Person or relationship', type: 'text' },
    { key: 'happening', label: "What's happening?", placeholder: 'Describe the situation', type: 'textarea' },
    { key: 'yourFeelings', label: 'Your feelings', placeholder: 'How do you feel?', type: 'text' },
    { key: 'theirFeelings', label: 'Their likely feelings', placeholder: 'How might they feel?', type: 'text' },
    { key: 'whatYouWant', label: 'What do you want?', placeholder: 'Your desired outcome', type: 'text' },
    { key: 'whatTheyNeed', label: 'What do they need?', placeholder: 'Their core need', type: 'text' },
    { key: 'nextStep', label: 'Next step', placeholder: 'First action to take', type: 'text' },
  ],
}

function calcClarity(fields: ClarityFields, topicType: TopicType): number {
  const defs = TOPIC_FIELDS[topicType]
  const filled = defs.filter(d => (fields[d.key] || '').trim().length > 0).length
  return Math.round((filled / defs.length) * 100)
}

export default function ClaritySession() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<ClarityEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [topicType, setTopicType] = useState<TopicType>('Big Decision')
  const [fields, setFields] = useState<ClarityFields>({})

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: ClarityEntry[]) => {
    setEntries(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  }

  const handleTopicChange = (t: TopicType) => {
    setTopicType(t)
    setFields({})
  }

  const submit = () => {
    const score = calcClarity(fields, topicType)
    const entry: ClarityEntry = {
      id: Date.now().toString(),
      topicType,
      fields: { ...fields },
      clarityScore: score,
      createdAt: new Date().toISOString(),
    }
    save([entry, ...entries])
    setFields({})
    setShowForm(false)
    toastSuccess(`Clarity session saved — ${score}% clarity achieved!`)
  }

  const last5 = entries.slice(0, 5)
  const typeCounts: Partial<Record<TopicType, number>> = {}
  entries.forEach(e => { typeCounts[e.topicType] = (typeCounts[e.topicType] || 0) + 1 })
  const mostUsedType = (Object.entries(typeCounts) as [TopicType, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const defs = TOPIC_FIELDS[topicType]
  const previewScore = calcClarity(fields, topicType)

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Compass className="w-7 h-7 text-violet-400" />
            Clarity Session
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">A structured thinking session to gain clarity on any situation.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{entries.length}</div>
          <div className="text-xs text-slate-500">Total Sessions</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-violet-400">
            {entries.length ? Math.round(entries.reduce((s, e) => s + e.clarityScore, 0) / entries.length) : 0}%
          </div>
          <div className="text-xs text-slate-500">Avg Clarity</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xs font-bold text-amber-400 leading-tight mt-1">
            {mostUsedType ?? '—'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Most Used Type</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="game-card p-4 border border-violet-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">New Clarity Session</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>

          {/* Topic type selector */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Choose clarity topic:</p>
            <div className="flex flex-wrap gap-2">
              {TOPIC_TYPES.map(t => (
                <button key={t} onClick={() => handleTopicChange(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: topicType === t ? TOPIC_COLORS[t] + '40' : 'transparent',
                    color: topicType === t ? TOPIC_COLORS[t] : '#94a3b8',
                    border: `1px solid ${topicType === t ? TOPIC_COLORS[t] + '60' : '#334155'}`,
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic fields */}
          <div className="space-y-3">
            {defs.map(def => (
              <div key={def.key}>
                <label className="text-xs text-slate-400 mb-0.5 block">{def.label}</label>
                {def.type === 'textarea' ? (
                  <textarea
                    value={fields[def.key] || ''}
                    onChange={e => setFields(f => ({ ...f, [def.key]: e.target.value }))}
                    placeholder={def.placeholder}
                    rows={2}
                    className="game-input w-full text-sm resize-none"
                  />
                ) : (
                  <input
                    value={fields[def.key] || ''}
                    onChange={e => setFields(f => ({ ...f, [def.key]: e.target.value }))}
                    placeholder={def.placeholder}
                    className="game-input w-full text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Clarity: <span className="text-violet-400 font-semibold">{previewScore}%</span>
            </span>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              <button onClick={submit} className="px-6 py-2 bg-violet-700 hover:bg-violet-600 text-white rounded-xl text-sm font-semibold">
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last 5 sessions */}
      {last5.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" /> Recent Sessions
          </h3>
          {last5.map(entry => {
            const color = TOPIC_COLORS[entry.topicType]
            const entryDefs = TOPIC_FIELDS[entry.topicType]
            const firstField = entryDefs[0]
            const preview = entry.fields[firstField?.key] || ''
            return (
              <div key={entry.id} className="game-card p-3" style={{ borderLeft: `3px solid ${color}` }}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs px-2 py-0.5 rounded font-medium"
                    style={{ background: color + '25', color }}>
                    {entry.topicType}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  <span className="ml-auto text-xs font-semibold" style={{ color }}>
                    {entry.clarityScore}% clarity
                  </span>
                </div>
                {preview && <p className="text-xs text-slate-400 line-clamp-2 italic">"{preview}"</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {entryDefs.map(d => (
                    entry.fields[d.key]
                      ? <CheckCircle2 key={d.key} className="w-3 h-3 text-green-400" />
                      : <Circle key={d.key} className="w-3 h-3 text-slate-600" />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Type breakdown */}
      {entries.length > 0 && (
        <div className="game-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> Sessions by Type
          </h3>
          {TOPIC_TYPES.filter(t => typeCounts[t]).map(t => (
            <div key={t} className="flex items-center gap-2">
              <span className="text-xs text-slate-400 w-32 truncate">{t}</span>
              <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                <div className="h-1.5 rounded-full" style={{
                  width: `${((typeCounts[t] ?? 0) / entries.length) * 100}%`,
                  background: TOPIC_COLORS[t],
                }} />
              </div>
              <span className="text-xs text-slate-500 w-5 text-right">{typeCounts[t]}</span>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Compass className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Clarity is the prerequisite to progress. Start your first session.</p>
        </div>
      )}
    </div>
  )
}
