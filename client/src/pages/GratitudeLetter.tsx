import { useEffect, useState, useRef } from 'react'
import { Heart, Plus, Trash2, Edit2, Copy, Star, Sparkles, BookOpen, ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type Mood = 'Loving' | 'Grateful' | 'Nostalgic' | 'Inspired' | 'Healing'
type Status = 'Draft' | 'Sent' | 'Kept Private'

interface GratitudeLetter {
  id: string
  createdAt: string
  recipient: string
  relationship: string
  body: string
  mood: Mood
  status: Status
}

const MOODS: Mood[] = ['Loving', 'Grateful', 'Nostalgic', 'Inspired', 'Healing']
const STATUSES: Status[] = ['Draft', 'Sent', 'Kept Private']

const MOOD_COLORS: Record<Mood, string> = {
  Loving: 'text-pink-400 bg-pink-900/20 border-pink-500/30',
  Grateful: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  Nostalgic: 'text-violet-400 bg-violet-900/20 border-violet-500/30',
  Inspired: 'text-cyan-400 bg-cyan-900/20 border-cyan-500/30',
  Healing: 'text-green-400 bg-green-900/20 border-green-500/30',
}

const STATUS_COLORS: Record<Status, string> = {
  Draft: 'text-slate-400 bg-slate-800 border-slate-600',
  Sent: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  'Kept Private': 'text-violet-400 bg-violet-900/20 border-violet-500/30',
}

const WRITING_PROMPTS = [
  'Thank them for a specific moment that changed you.',
  'What have you never told them but always wanted to say?',
  'How have they made you a better person?',
  'Describe a small thing they do that means everything.',
  'What would your life look like without them in it?',
  'What lesson did they teach you — maybe without even realizing it?',
  'Tell them what you admire most about who they are.',
  'Share a memory of them that you revisit often.',
  'What do you hope they know about how you feel?',
  'How would you describe them to someone who has never met them?',
]

const STORAGE_KEY = 'gratitude_letters'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export default function GratitudeLetter() {
  const { toastSuccess } = useToast()
  const [letters, setLetters] = useState<GratitudeLetter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [promptIndex, setPromptIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const blankForm = (): Omit<GratitudeLetter, 'id' | 'createdAt'> => ({
    recipient: '',
    relationship: '',
    body: '',
    mood: 'Grateful',
    status: 'Draft',
  })

  const [form, setForm] = useState(blankForm())

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setLetters(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  const persist = (updated: GratitudeLetter[]) => {
    setLetters(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const openNew = () => {
    setForm(blankForm())
    setEditingId(null)
    setShowForm(true)
    setPromptIndex(Math.floor(Math.random() * WRITING_PROMPTS.length))
  }

  const openEdit = (letter: GratitudeLetter) => {
    setForm({
      recipient: letter.recipient,
      relationship: letter.relationship,
      body: letter.body,
      mood: letter.mood,
      status: letter.status,
    })
    setEditingId(letter.id)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(blankForm())
  }

  const saveLetter = () => {
    if (!form.recipient.trim() || !form.body.trim()) {
      return
    }
    if (editingId) {
      const updated = letters.map(l =>
        l.id === editingId ? { ...l, ...form } : l
      )
      persist(updated)
      toastSuccess('Letter updated.', `Your letter to ${form.recipient} has been saved.`)
    } else {
      const letter: GratitudeLetter = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...form,
      }
      persist([letter, ...letters])
      toastSuccess('Letter saved.', `Your gratitude letter to ${form.recipient} has been written.`)
    }
    cancelForm()
  }

  const deleteLetter = (id: string) => {
    persist(letters.filter(l => l.id !== id))
    toastSuccess('Letter deleted.')
  }

  const copyLetter = (letter: GratitudeLetter) => {
    navigator.clipboard.writeText(
      `To: ${letter.recipient} (${letter.relationship})\n\n${letter.body}`
    )
    toastSuccess('Copied to clipboard.')
  }

  const insertPrompt = (prompt: string) => {
    const insertion = form.body ? `${form.body}\n\n${prompt} ` : `${prompt} `
    setForm(f => ({ ...f, body: insertion }))
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(insertion.length, insertion.length)
      }
    }, 0)
  }

  const nextPrompt = () => setPromptIndex(i => (i + 1) % WRITING_PROMPTS.length)

  const sorted = [...letters].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const totalLetters = letters.length
  const sentCount = letters.filter(l => l.status === 'Sent').length
  const uniqueRecipients = new Set(letters.map(l => l.recipient.trim().toLowerCase())).size
  const thisMonthCount = letters.filter(l => l.createdAt.startsWith(thisMonth())).length

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Heart className="w-7 h-7 text-pink-400" />
            Gratitude Letters
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Write letters of gratitude to the people in your life</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Write Letter
        </button>
      </div>

      {/* Stats */}
      {letters.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-pink-400">{totalLetters}</div>
            <div className="text-xs text-slate-500">Total Letters</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-blue-400">{sentCount}</div>
            <div className="text-xs text-slate-500">Sent</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-yellow-400">{uniqueRecipients}</div>
            <div className="text-xs text-slate-500">People</div>
          </div>
          <div className="game-card p-3 text-center">
            <div className="text-xl font-bold text-green-400">{thisMonthCount}</div>
            <div className="text-xs text-slate-500">This Month</div>
          </div>
        </div>
      )}

      {/* Write / Edit Form */}
      {showForm && (
        <div className="game-card p-5 space-y-4 border border-pink-500/20">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-400" />
              {editingId ? 'Edit Letter' : 'Write a Gratitude Letter'}
            </h3>
            <button onClick={cancelForm} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Recipient + Relationship */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Recipient</label>
              <input
                className="game-input w-full"
                placeholder="Name"
                value={form.recipient}
                onChange={e => setForm(f => ({ ...f, recipient: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Relationship</label>
              <input
                className="game-input w-full"
                placeholder="e.g. Friend, Parent, Mentor"
                value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
              />
            </div>
          </div>

          {/* Mood + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Mood While Writing</label>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map(mood => (
                  <button
                    key={mood}
                    onClick={() => setForm(f => ({ ...f, mood }))}
                    className={`px-2 py-1 rounded-lg text-xs border transition-all ${
                      form.mood === mood
                        ? MOOD_COLORS[mood]
                        : 'text-slate-500 bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => setForm(f => ({ ...f, status }))}
                    className={`px-2 py-1 rounded-lg text-xs border transition-all ${
                      form.status === status
                        ? STATUS_COLORS[status]
                        : 'text-slate-500 bg-slate-800 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Writing Prompt */}
          <div className="p-3 bg-pink-900/10 border border-pink-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-pink-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Writing Prompt
              </span>
              <button
                onClick={nextPrompt}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                next →
              </button>
            </div>
            <p className="text-xs text-slate-400 italic mb-2">{WRITING_PROMPTS[promptIndex]}</p>
            <button
              onClick={() => insertPrompt(WRITING_PROMPTS[promptIndex])}
              className="text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              + Insert into letter
            </button>
          </div>

          {/* Body */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Letter Body</label>
            <textarea
              ref={textareaRef}
              className="game-input w-full resize-none"
              rows={10}
              placeholder={`Dear ${form.recipient || 'them'},\n\n`}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={cancelForm}
              className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm transition-colors hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={saveLetter}
              disabled={!form.recipient.trim() || !form.body.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Check className="w-4 h-4" />
              {editingId ? 'Save Changes' : 'Save Letter'}
            </button>
          </div>
        </div>
      )}

      {/* Letters List */}
      <div className="space-y-3">
        {sorted.map(letter => (
          <div key={letter.id} className="game-card overflow-hidden border border-slate-700/50">
            {/* Summary Row */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpanded(expanded === letter.id ? null : letter.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-200">{letter.recipient}</span>
                    {letter.relationship && (
                      <span className="text-xs text-slate-500">· {letter.relationship}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${MOOD_COLORS[letter.mood]}`}>
                      {letter.mood}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[letter.status]}`}>
                      {letter.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {letter.body.slice(0, 100)}{letter.body.length > 100 ? '…' : ''}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">{formatDate(letter.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {expanded === letter.id
                    ? <ChevronUp className="w-4 h-4 text-slate-500" />
                    : <ChevronDown className="w-4 h-4 text-slate-500" />
                  }
                </div>
              </div>
            </div>

            {/* Expanded Full Letter */}
            {expanded === letter.id && (
              <div className="border-t border-slate-800 px-4 pb-4 pt-3">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {letter.body}
                </pre>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => openEdit(letter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => copyLetter(letter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={() => deleteLetter(letter.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-xs transition-colors ml-auto"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* All Writing Prompts Panel */}
      {!showForm && (
        <div className="game-card p-5 border border-pink-500/10">
          <h3 className="font-semibold text-slate-300 text-sm flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-400" />
            Writing Prompts
          </h3>
          <div className="space-y-2">
            {WRITING_PROMPTS.map((prompt, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/50 hover:bg-pink-900/10 group cursor-pointer transition-colors"
                onClick={() => {
                  openNew()
                  setPromptIndex(i)
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400 flex-shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {letters.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-500">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-1">No letters yet.</p>
          <p className="text-sm mb-5 text-slate-600">
            Write your first gratitude letter — it doesn't have to be sent to matter.
          </p>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Write Your First Letter
          </button>
        </div>
      )}
    </div>
  )
}
