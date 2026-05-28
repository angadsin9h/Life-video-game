import { useEffect, useState } from 'react'
import { Scroll, Save, Edit3, Eye } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface ManifestoSection {
  id: string
  title: string
  placeholder: string
  content: string
  prompt: string
}

const DEFAULT_SECTIONS: ManifestoSection[] = [
  {
    id: 'identity',
    title: 'Who I Am',
    placeholder: 'I am someone who...',
    content: '',
    prompt: 'Define your core identity. Who are you at your best? What do you stand for?',
  },
  {
    id: 'values',
    title: 'What I Value',
    placeholder: 'I believe in...',
    content: '',
    prompt: 'List your non-negotiable values. What principles guide every decision you make?',
  },
  {
    id: 'mission',
    title: 'My Mission',
    placeholder: 'I exist to...',
    content: '',
    prompt: 'What is your purpose? What impact do you want to have on the world?',
  },
  {
    id: 'commitments',
    title: 'My Commitments',
    placeholder: 'I commit to...',
    content: '',
    prompt: 'What behaviors and habits do you commit to unconditionally?',
  },
  {
    id: 'standards',
    title: 'My Standards',
    placeholder: 'I will not...',
    content: '',
    prompt: 'What standards do you hold yourself to? What will you not tolerate from yourself?',
  },
  {
    id: 'vision',
    title: 'My Vision',
    placeholder: 'In 10 years, I will have...',
    content: '',
    prompt: 'Paint a vivid picture of your ideal life in 10 years. Be specific and bold.',
  },
]

const STORAGE_KEY = 'personal_manifesto'
const LAST_EDITED_KEY = 'personal_manifesto_edited'

export default function PersonalManifesto() {
  const { toastSuccess } = useToast()
  const [sections, setSections] = useState<ManifestoSection[]>(DEFAULT_SECTIONS)
  const [editing, setEditing] = useState(false)
  const [lastEdited, setLastEdited] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const savedSections = JSON.parse(saved) as ManifestoSection[]
      // Merge with defaults to handle new sections added later
      setSections(DEFAULT_SECTIONS.map(def => {
        const found = savedSections.find(s => s.id === def.id)
        return found ? { ...def, content: found.content } : def
      }))
    }
    const le = localStorage.getItem(LAST_EDITED_KEY)
    if (le) setLastEdited(le)
  }, [])

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
    const now = new Date().toLocaleString()
    localStorage.setItem(LAST_EDITED_KEY, now)
    setLastEdited(now)
    setEditing(false)
    setActiveSection(null)
    toastSuccess('Manifesto saved!')
  }

  const updateSection = (id: string, content: string) => {
    setSections(s => s.map(sec => sec.id === id ? { ...sec, content } : sec))
  }

  const filledCount = sections.filter(s => s.content.trim()).length
  const totalWords = sections.reduce((sum, s) => sum + s.content.trim().split(/\s+/).filter(Boolean).length, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Scroll className="w-7 h-7 text-amber-400" />
            Personal Manifesto
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define who you are and what you stand for</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={save}
                className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={() => { setEditing(false); setActiveSection(null) }}
                className="px-3 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="game-card p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Manifesto completeness</span>
            <span className="text-white font-semibold">{filledCount}/{sections.length} sections · {totalWords} words</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(filledCount / sections.length) * 100}%` }} />
          </div>
        </div>
        {lastEdited && (
          <div className="text-xs text-slate-600 flex-shrink-0">
            <Eye className="w-3 h-3 inline mr-1" />Last edited {lastEdited}
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map(s => (
          <div key={s.id} className="game-card overflow-hidden"
            style={{ borderLeft: s.content.trim() ? '3px solid #d97706' : '3px solid #334155' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-white text-sm">{s.title}</h3>
                {editing && (
                  <button onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
                    className="text-xs text-slate-500 hover:text-amber-400 transition-colors">
                    {activeSection === s.id ? 'Collapse' : 'Expand'}
                  </button>
                )}
              </div>

              {editing && <p className="text-xs text-slate-500 italic mb-2">{s.prompt}</p>}

              {editing && (activeSection === s.id || !s.content) ? (
                <textarea
                  value={s.content}
                  onChange={e => updateSection(s.id, e.target.value)}
                  placeholder={s.placeholder}
                  className="game-input w-full h-32 resize-none text-sm"
                  autoFocus={activeSection === s.id}
                  onFocus={() => setActiveSection(s.id)}
                />
              ) : s.content.trim() ? (
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{s.content}</p>
              ) : (
                <p className="text-slate-600 text-sm italic">{s.placeholder}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Full manifesto read mode */}
      {!editing && filledCount > 0 && (
        <div className="game-card p-6 border border-amber-500/10 bg-amber-900/5">
          <h3 className="text-lg font-bold text-amber-400 mb-4 text-center" style={{ fontFamily: 'Orbitron, monospace' }}>
            My Personal Manifesto
          </h3>
          <div className="space-y-6">
            {sections.filter(s => s.content.trim()).map(s => (
              <div key={s.id}>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{s.title}</h4>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{s.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {filledCount === 0 && !editing && (
        <div className="text-center py-12 text-slate-500">
          <Scroll className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Your manifesto is blank.</p>
          <p className="text-sm mb-5">Spend 20 minutes defining who you are. It will change how you live.</p>
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Write My Manifesto
          </button>
        </div>
      )}
    </div>
  )
}
