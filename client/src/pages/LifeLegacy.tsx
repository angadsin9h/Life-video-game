import { useState, useEffect } from 'react'
import { Star, Plus, Trash2, Edit2, Check, X, BookOpen } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface LegacyStatement {
  id: string
  category: string
  statement: string
  updatedAt: string
}

interface LegacyLetter {
  id: string
  recipient: string
  message: string
  date: string
}

interface LifeValue {
  id: string
  value: string
  why: string
}

const CATEGORIES = [
  { name: 'Character', color: '#a855f7', prompt: 'What kind of person do you want to be known as?' },
  { name: 'Family', color: '#ec4899', prompt: 'How do you want to be remembered by family?' },
  { name: 'Work', color: '#3b82f6', prompt: 'What impact do you want to have through your work?' },
  { name: 'Community', color: '#22c55e', prompt: 'How will your community be different because of you?' },
  { name: 'Knowledge', color: '#f59e0b', prompt: 'What wisdom do you want to leave behind?' },
  { name: 'Love', color: '#f97316', prompt: 'How do you express love that will be remembered?' },
]

const STORAGE_KEY = 'life_legacy'
const LETTERS_KEY = 'legacy_letters'
const VALUES_KEY = 'legacy_values'

export default function LifeLegacy() {
  const { toastSuccess } = useToast()
  const [statements, setStatements] = useState<LegacyStatement[]>([])
  const [letters, setLetters] = useState<LegacyLetter[]>([])
  const [values, setValues] = useState<LifeValue[]>([])
  const [tab, setTab] = useState<'statements' | 'letters' | 'values'>('statements')
  const [editId, setEditId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [showAddLetter, setShowAddLetter] = useState(false)
  const [letterForm, setLetterForm] = useState({ recipient: '', message: '' })
  const [valueForm, setValueForm] = useState({ value: '', why: '' })
  const [showAddValue, setShowAddValue] = useState(false)

  useEffect(() => {
    try {
      setStatements(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setLetters(JSON.parse(localStorage.getItem(LETTERS_KEY) || '[]'))
      setValues(JSON.parse(localStorage.getItem(VALUES_KEY) || '[]'))
    } catch { /**/ }
    // Initialize default categories if none
  }, [])

  const saveStatements = (updated: LegacyStatement[]) => {
    setStatements(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const saveLetters = (updated: LegacyLetter[]) => {
    setLetters(updated)
    localStorage.setItem(LETTERS_KEY, JSON.stringify(updated))
  }

  const saveValues = (updated: LifeValue[]) => {
    setValues(updated)
    localStorage.setItem(VALUES_KEY, JSON.stringify(updated))
  }

  const startEdit = (s: LegacyStatement) => {
    setEditId(s.id)
    setEditText(s.statement)
  }

  const saveEdit = () => {
    if (!editText.trim() || !editId) return
    const exists = statements.find(s => s.id === editId)
    if (exists) {
      saveStatements(statements.map(s => s.id === editId
        ? { ...s, statement: editText.trim(), updatedAt: new Date().toISOString().split('T')[0] }
        : s))
    } else {
      const cat = CATEGORIES.find(c => c.name === editId)
      if (cat) {
        const ns: LegacyStatement = {
          id: Date.now().toString(),
          category: cat.name,
          statement: editText.trim(),
          updatedAt: new Date().toISOString().split('T')[0],
        }
        saveStatements([...statements, ns])
      }
    }
    setEditId(null)
    setEditText('')
    toastSuccess('Legacy statement saved ✨')
  }

  const addLetter = () => {
    if (!letterForm.recipient.trim() || !letterForm.message.trim()) return
    const letter: LegacyLetter = {
      id: Date.now().toString(),
      recipient: letterForm.recipient.trim(),
      message: letterForm.message.trim(),
      date: new Date().toISOString().split('T')[0],
    }
    saveLetters([letter, ...letters])
    setLetterForm({ recipient: '', message: '' })
    setShowAddLetter(false)
    toastSuccess(`Letter to ${letter.recipient} saved 💌`)
  }

  const addValue = () => {
    if (!valueForm.value.trim()) return
    const v: LifeValue = { id: Date.now().toString(), value: valueForm.value.trim(), why: valueForm.why.trim() }
    saveValues([...values, v])
    setValueForm({ value: '', why: '' })
    setShowAddValue(false)
    toastSuccess('Core value added')
  }

  const completedCategories = CATEGORIES.filter(c => statements.some(s => s.category === c.name)).length

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Star className="w-7 h-7 text-yellow-400" />
          Life Legacy
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Define how you want to be remembered. Write your story.</p>
      </div>

      {/* Completion */}
      <div className="game-card p-4 border border-yellow-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Legacy defined: {completedCategories}/{CATEGORIES.length} dimensions</span>
          <span className="text-sm font-bold text-yellow-400">{Math.round((completedCategories/CATEGORIES.length)*100)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 rounded-full transition-all"
            style={{ width: `${(completedCategories/CATEGORIES.length)*100}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['statements', 'letters', 'values'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
            {t === 'statements' ? `Statements (${statements.length})` : t === 'letters' ? `Letters (${letters.length})` : `Values (${values.length})`}
          </button>
        ))}
      </div>

      {/* Statements tab */}
      {tab === 'statements' && (
        <div className="space-y-3">
          {CATEGORIES.map(cat => {
            const existing = statements.find(s => s.category === cat.name)
            const isEditing = editId === (existing?.id ?? cat.name)
            return (
              <div key={cat.name} className="game-card p-4" style={{ borderLeft: `3px solid ${cat.color}` }}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-sm font-semibold flex-1" style={{ color: cat.color }}>{cat.name}</span>
                  {existing && !isEditing && (
                    <button onClick={() => startEdit(existing)} className="p-1 text-slate-600 hover:text-slate-300">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {existing && !isEditing && (
                    <button onClick={() => saveStatements(statements.filter(s => s.id !== existing.id))}
                      className="p-1 text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      placeholder={cat.prompt}
                      className="game-input w-full h-20 resize-none text-sm" autoFocus />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-xs font-semibold">
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button onClick={() => { setEditId(null); setEditText('') }} className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : existing ? (
                  <div>
                    <p className="text-sm text-white leading-relaxed">{existing.statement}</p>
                    <p className="text-xs text-slate-600 mt-1">Updated {existing.updatedAt}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-600 italic mb-2">{cat.prompt}</p>
                    <button onClick={() => { setEditId(cat.name); setEditText('') }}
                      className="text-xs px-3 py-1.5 rounded-lg border border-dashed transition-colors hover:border-slate-500"
                      style={{ borderColor: cat.color + '40', color: cat.color + 'aa' }}>
                      + Write your {cat.name} legacy
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Letters tab */}
      {tab === 'letters' && (
        <div className="space-y-4">
          <button onClick={() => setShowAddLetter(true)}
            className="w-full p-3 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 hover:border-slate-600 text-sm transition-colors flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Write a legacy letter
          </button>
          {showAddLetter && (
            <div className="game-card p-4 space-y-3 border border-yellow-500/20">
              <input value={letterForm.recipient} onChange={e => setLetterForm(f => ({ ...f, recipient: e.target.value }))}
                placeholder="To: (e.g., My children, Future self, The world)" className="game-input w-full" autoFocus />
              <textarea value={letterForm.message} onChange={e => setLetterForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Write your message... What do you want them to know? What wisdom do you leave behind?"
                className="game-input w-full h-40 resize-none" />
              <div className="flex gap-2">
                <button onClick={addLetter} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">Save Letter</button>
                <button onClick={() => setShowAddLetter(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          {letters.map(l => (
            <div key={l.id} className="game-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-yellow-400">To: {l.recipient}</span>
                <span className="text-xs text-slate-600 ml-auto">{l.date}</span>
                <button onClick={() => saveLetters(letters.filter(x => x.id !== l.id))} className="p-1 text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{l.message}</p>
            </div>
          ))}
          {letters.length === 0 && !showAddLetter && (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No legacy letters written yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Values tab */}
      {tab === 'values' && (
        <div className="space-y-3">
          <button onClick={() => setShowAddValue(true)}
            className="w-full p-3 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Add core value
          </button>
          {showAddValue && (
            <div className="game-card p-4 space-y-3 border border-yellow-500/20">
              <input value={valueForm.value} onChange={e => setValueForm(f => ({ ...f, value: e.target.value }))}
                placeholder="Core value (e.g., Integrity, Family, Growth)" className="game-input w-full" autoFocus />
              <textarea value={valueForm.why} onChange={e => setValueForm(f => ({ ...f, why: e.target.value }))}
                placeholder="Why is this a core value for you?" className="game-input w-full h-20 resize-none" />
              <div className="flex gap-2">
                <button onClick={addValue} className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold">Add Value</button>
                <button onClick={() => setShowAddValue(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          {values.map((v, i) => (
            <div key={v.id} className="game-card p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-500/10 text-yellow-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{v.value}</div>
                {v.why && <p className="text-xs text-slate-500 mt-1">{v.why}</p>}
              </div>
              <button onClick={() => saveValues(values.filter(x => x.id !== v.id))} className="p-1 text-slate-700 hover:text-red-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {values.length === 0 && !showAddValue && (
            <div className="text-center py-8 text-slate-500">
              <Star className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Define your core values — the principles that guide your life.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
