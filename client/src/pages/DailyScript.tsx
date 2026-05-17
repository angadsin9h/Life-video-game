import { useState, useEffect } from 'react'
import { Pencil, Plus, BookOpen, Star, Sparkles, RotateCcw, Calendar, ChevronDown, ChevronUp, Flame } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScriptSection {
  key: string
  prompt: string
}

interface ScriptTemplate {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  sections: ScriptSection[]
}

interface SavedScript {
  id: string
  date: string
  templateId: string
  templateName: string
  fields: Record<string, string>
  createdAt: string
}

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: ScriptTemplate[] = [
  {
    id: 'morning',
    name: 'Morning Script',
    description: 'Start the day as your future self',
    emoji: '🌅',
    color: '#f97316',
    sections: [
      { key: 'iam', prompt: 'Today I am...' },
      { key: 'feel', prompt: 'I feel...' },
      { key: 'grateful', prompt: 'I am grateful for...' },
      { key: 'energy', prompt: 'My energy is...' },
      { key: 'accomplish', prompt: 'Today I will accomplish...' },
    ],
  },
  {
    id: 'evening',
    name: 'Evening Script',
    description: 'Close the day with intention',
    emoji: '🌙',
    color: '#8b5cf6',
    sections: [
      { key: 'achieved', prompt: 'Today I achieved...' },
      { key: 'proud', prompt: 'I am proud that I...' },
      { key: 'learned', prompt: 'Today I learned...' },
      { key: 'release', prompt: 'I release and let go of...' },
      { key: 'tomorrow', prompt: 'Tomorrow I am excited to...' },
    ],
  },
  {
    id: 'goal',
    name: 'Goal Achievement Script',
    description: 'Write as if your goal is already done',
    emoji: '🏆',
    color: '#eab308',
    sections: [
      { key: 'achieved_goal', prompt: 'I have achieved...' },
      { key: 'feels', prompt: 'It feels amazing because...' },
      { key: 'path', prompt: 'The steps I took to get here were...' },
      { key: 'identity', prompt: 'I am now the kind of person who...' },
      { key: 'impact', prompt: 'This has positively impacted my life by...' },
    ],
  },
  {
    id: 'gratitude',
    name: 'Gratitude Script',
    description: 'Deep gratitude in present tense',
    emoji: '💛',
    color: '#22c55e',
    sections: [
      { key: 'thankful_for', prompt: 'I am deeply thankful for...' },
      { key: 'body', prompt: 'My body allows me to...' },
      { key: 'people', prompt: 'The people I am grateful for are...' },
      { key: 'moment', prompt: 'A moment I cherish is...' },
      { key: 'abundance', prompt: 'I have an abundance of...' },
    ],
  },
  {
    id: 'relationship',
    name: 'Relationship Script',
    description: 'Envision your ideal relationships',
    emoji: '💞',
    color: '#ec4899',
    sections: [
      { key: 'love', prompt: 'I give and receive love by...' },
      { key: 'connections', prompt: 'My relationships are...' },
      { key: 'communicate', prompt: 'I communicate with ease and...' },
      { key: 'attract', prompt: 'I attract people who...' },
      { key: 'bond', prompt: 'The bonds I nurture feel...' },
    ],
  },
]

// ─── Power Phrases ─────────────────────────────────────────────────────────────

const POWER_PHRASES = [
  'I am magnetic — opportunities flow to me effortlessly.',
  'Everything I need is already within me.',
  'I am the author of my story, and I choose abundance.',
  'My thoughts are seeds; I plant greatness every moment.',
  'I am aligned with the version of myself I am becoming.',
  'The universe conspires in my favor every single day.',
  'I am open, receptive, and ready for all good things.',
  'My future self is proud of the choices I make today.',
  'I radiate confidence, clarity, and calm.',
  'I deserve everything I am scripting into reality.',
  'Miracles are my new normal.',
  'I live with purpose, passion, and full presence.',
  'Every word I write scripts a better reality for me.',
  'I am unstoppable when I align my mind with my vision.',
  'I am consistently becoming more than I was yesterday.',
]

// ─── Storage Helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'daily_scripts'

function loadScripts(): SavedScript[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveScripts(scripts: SavedScript[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts))
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function computeStreak(scripts: SavedScript[]): number {
  if (scripts.length === 0) return 0
  const dates = [...new Set(scripts.map(s => s.date))].sort().reverse()
  const today = todayStr()
  let streak = 0
  let cursor = new Date(today + 'T12:00:00')

  for (let i = 0; i < dates.length; i++) {
    const expected = cursor.toISOString().split('T')[0]
    if (dates[i] === expected) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function mostUsedTemplate(scripts: SavedScript[]): string {
  if (scripts.length === 0) return 'None yet'
  const counts: Record<string, number> = {}
  for (const s of scripts) {
    counts[s.templateName] = (counts[s.templateName] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function isComplete(fields: Record<string, string>, sections: ScriptSection[]): boolean {
  return sections.every(s => (fields[s.key] || '').trim().length > 0)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DailyScript() {
  const { toastSuccess } = useToast()
  const [scripts, setScripts] = useState<SavedScript[]>(() => loadScripts())
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate>(TEMPLATES[0])
  const [fields, setFields] = useState<Record<string, string>>({})
  const [powerPhrase, setPowerPhrase] = useState<string | null>(null)
  const [expandedPast, setExpandedPast] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)
  const [view, setView] = useState<'write' | 'history'>('write')

  // Reset fields when template changes
  useEffect(() => {
    setFields({})
    setPowerPhrase(null)
  }, [selectedTemplate.id])

  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const handleRandomPhrase = () => {
    const idx = Math.floor(Math.random() * POWER_PHRASES.length)
    setPowerPhrase(POWER_PHRASES[idx])
  }

  const handleSave = () => {
    const filled = selectedTemplate.sections.filter(s => (fields[s.key] || '').trim().length > 0)
    if (filled.length === 0) return

    const today = todayStr()
    const newScript: SavedScript = {
      id: Date.now().toString(),
      date: today,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      fields: { ...fields },
      createdAt: new Date().toISOString(),
    }

    const updated = [newScript, ...scripts]
    setScripts(updated)
    saveScripts(updated)
    setFields({})
    setPowerPhrase(null)
    toastSuccess('Script saved!', `${selectedTemplate.name} — ${today}`)
  }

  const handleDeleteScript = (id: string) => {
    const updated = scripts.filter(s => s.id !== id)
    setScripts(updated)
    saveScripts(updated)
    toastSuccess('Script deleted')
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const streak = computeStreak(scripts)
  const topTemplate = mostUsedTemplate(scripts)
  const todayScripts = scripts.filter(s => s.date === todayStr())
  const hasWrittenToday = todayScripts.length > 0

  // Group past scripts by date
  const groupedByDate: Record<string, SavedScript[]> = {}
  for (const s of scripts) {
    if (!groupedByDate[s.date]) groupedByDate[s.date] = []
    groupedByDate[s.date].push(s)
  }
  const sortedDates = Object.keys(groupedByDate).sort().reverse()

  const formatDate = (d: string) => {
    const today = todayStr()
    if (d === today) return 'Today'
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (d === yesterday.toISOString().split('T')[0]) return 'Yesterday'
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    })
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Pencil className="w-7 h-7 text-violet-400" />
            Daily Script
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Write your future into existence — present tense, as if it's already real</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('write')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'write' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            Write
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === 'history' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
          >
            History
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>{streak}</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Day Streak</p>
        </div>
        <div className="game-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <BookOpen className="w-4 h-4 text-violet-400" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Orbitron, monospace' }}>{scripts.length}</span>
          </div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Scripts</p>
        </div>
        <div className="game-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Star className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xs text-slate-300 font-semibold truncate">{topTemplate}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Top Template</p>
        </div>
      </div>

      {/* ── Written Today Badge ── */}
      {hasWrittenToday && view === 'write' && (
        <div className="game-card p-3 border border-green-500/30 bg-green-900/10 flex items-center gap-3">
          <span className="text-green-400 text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-green-400">You've scripted today!</p>
            <p className="text-xs text-slate-500">{todayScripts.length} script{todayScripts.length > 1 ? 's' : ''} written — you can write another or view history</p>
          </div>
        </div>
      )}

      {/* ─────────── WRITE VIEW ─────────── */}
      {view === 'write' && (
        <div className="space-y-5">
          {/* Template Picker */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Choose a Template</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`game-card p-3 text-left transition-all hover:scale-[1.01] ${selectedTemplate.id === tmpl.id ? 'ring-2' : ''}`}
                  style={selectedTemplate.id === tmpl.id
                    ? { borderColor: tmpl.color }
                    : undefined
                  }
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{tmpl.emoji}</span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: selectedTemplate.id === tmpl.id ? tmpl.color : undefined }}
                    >
                      {tmpl.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{tmpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Power Phrase */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRandomPhrase}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Random Inspiration
            </button>
            {powerPhrase && (
              <button onClick={handleRandomPhrase} className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors" title="New phrase">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {powerPhrase && (
            <div className="game-card p-4 border border-yellow-500/20 bg-yellow-900/5">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200 italic leading-relaxed">"{powerPhrase}"</p>
              </div>
              <p className="text-xs text-slate-600 mt-2 ml-6">Incorporate this into your script below</p>
            </div>
          )}

          {/* Script Sections */}
          <div
            className="game-card p-5 space-y-5 border-l-4"
            style={{ borderLeftColor: selectedTemplate.color }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedTemplate.emoji}</span>
              <div>
                <h2 className="font-bold text-white">{selectedTemplate.name}</h2>
                <p className="text-xs text-slate-500">{selectedTemplate.description}</p>
              </div>
            </div>

            {selectedTemplate.sections.map((section, idx) => (
              <div key={section.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {idx + 1}. {section.prompt}
                </label>
                <textarea
                  value={fields[section.key] || ''}
                  onChange={e => handleFieldChange(section.key, e.target.value)}
                  placeholder={`Write as if it's already true — present tense, vivid, emotional...`}
                  className="game-input w-full min-h-[80px] resize-y text-sm leading-relaxed"
                />
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-600">
                {selectedTemplate.sections.filter(s => (fields[s.key] || '').trim().length > 0).length} of {selectedTemplate.sections.length} sections filled
              </p>
              <button
                onClick={handleSave}
                disabled={selectedTemplate.sections.every(s => !(fields[s.key] || '').trim())}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: selectedTemplate.color, color: '#fff' }}
              >
                <Plus className="w-4 h-4" />
                Save Script
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── HISTORY VIEW ─────────── */}
      {view === 'history' && (
        <div className="space-y-4">
          {sortedDates.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">No scripts yet</p>
              <p className="text-sm mb-5">Switch to Write and create your first daily script</p>
              <button
                onClick={() => setView('write')}
                className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors"
              >
                Write Your First Script
              </button>
            </div>
          ) : (
            sortedDates.map(date => (
              <div key={date} className="space-y-2">
                {/* Date header */}
                <button
                  onClick={() => setExpandedPast(expandedPast === date ? null : date)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/60 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-300">{formatDate(date)}</span>
                    <span className="text-xs text-slate-600">{date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">{groupedByDate[date].length} script{groupedByDate[date].length > 1 ? 's' : ''}</span>
                    {expandedPast === date
                      ? <ChevronUp className="w-4 h-4 text-slate-500" />
                      : <ChevronDown className="w-4 h-4 text-slate-500" />
                    }
                  </div>
                </button>

                {/* Expanded scripts for that date */}
                {expandedPast === date && groupedByDate[date].map(script => {
                  const tmpl = TEMPLATES.find(t => t.id === script.templateId)
                  return (
                    <div
                      key={script.id}
                      className="game-card p-5 space-y-3 border-l-4 ml-2"
                      style={{ borderLeftColor: tmpl?.color || '#8b5cf6' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{tmpl?.emoji || '📝'}</span>
                          <span className="text-sm font-bold text-slate-200">{script.templateName}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteScript(script.id)}
                          className="text-xs text-slate-600 hover:text-red-400 transition-colors px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>

                      {(tmpl?.sections || []).map(section => {
                        const val = script.fields[section.key]
                        if (!val || !val.trim()) return null
                        return (
                          <div key={section.key}>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{section.prompt}</p>
                            <p className="text-sm text-slate-300 leading-relaxed">{val}</p>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
