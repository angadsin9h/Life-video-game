import { useState, useEffect } from 'react'
import { Star, Edit2, Save, X, Eye, Plus, Trash2 } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface PersonalBrandData {
  tagline: string
  mission: string
  vision: string
  coreValues: string[]
  superPowers: string[]
  idealPersona: string
  uniqueValue: string
  targetAudience: string
  keyMessage: string
  contentPillars: string[]
  bio: string
  elevator: string
  updatedAt: string
}

const DEFAULT_DATA: PersonalBrandData = {
  tagline: '',
  mission: '',
  vision: '',
  coreValues: ['', '', '', ''],
  superPowers: ['', '', ''],
  idealPersona: '',
  uniqueValue: '',
  targetAudience: '',
  keyMessage: '',
  contentPillars: ['', '', '', '', ''],
  bio: '',
  elevator: '',
  updatedAt: '',
}

const STORAGE_KEY = 'personal_brand'

const SECTIONS = [
  { key: 'tagline', label: 'Personal Tagline', placeholder: 'A short, memorable phrase that captures your essence (e.g. "Builder of Systems, Destroyer of Complexity")', type: 'input' },
  { key: 'mission', label: 'Mission Statement', placeholder: 'Why you do what you do. Your purpose and impact.', type: 'textarea' },
  { key: 'vision', label: 'Vision', placeholder: 'Where you want to be in 10 years. Your ideal future.', type: 'textarea' },
  { key: 'uniqueValue', label: 'Unique Value Proposition', placeholder: 'What makes you uniquely valuable? What can you offer that others can\'t?', type: 'textarea' },
  { key: 'idealPersona', label: 'Ideal Self Persona', placeholder: 'Describe the person you\'re becoming. Traits, habits, achievements.', type: 'textarea' },
  { key: 'targetAudience', label: 'Who You Serve', placeholder: 'Who do you want to impact, help, or work with?', type: 'input' },
  { key: 'keyMessage', label: 'Core Message', placeholder: 'The one thing you want to be known for communicating', type: 'input' },
  { key: 'elevator', label: 'Elevator Pitch (30 seconds)', placeholder: 'How would you describe yourself and your value to someone in an elevator?', type: 'textarea' },
  { key: 'bio', label: 'Short Bio', placeholder: 'A compelling 2-3 sentence bio for professional use', type: 'textarea' },
]

export default function PersonalBrand() {
  const { toastSuccess } = useToast()
  const [data, setData] = useState<PersonalBrandData>(DEFAULT_DATA)
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState<PersonalBrandData>(DEFAULT_DATA)
  const completedSections = SECTIONS.filter(s => (data as unknown as Record<string, unknown>)[s.key]?.toString().trim()).length

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as PersonalBrandData
        setData(parsed)
        setDraft(parsed)
      }
    } catch { /**/ }
  }, [])

  const startEdit = () => {
    setDraft({ ...data })
    setEditMode(true)
  }

  const save = () => {
    const updated = { ...draft, updatedAt: new Date().toISOString() }
    setData(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setEditMode(false)
    toastSuccess('Personal brand updated!')
  }

  const updateList = (key: keyof PersonalBrandData, index: number, value: string) => {
    const arr = [...(draft[key] as string[])]
    arr[index] = value
    setDraft(d => ({ ...d, [key]: arr }))
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Star className="w-7 h-7 text-yellow-400" />
            Personal Brand
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Define your identity, mission, and unique value</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">{completedSections}/{SECTIONS.length} sections</div>
          {!editMode ? (
            <button onClick={startEdit}
              className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={save} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors">
                <Save className="w-4 h-4" /> Save
              </button>
              <button onClick={() => setEditMode(false)} className="p-2 bg-slate-700 text-slate-400 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completion progress */}
      <div className="game-card p-4">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Brand Definition Progress</span>
          <span>{Math.round((completedSections / SECTIONS.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${(completedSections / SECTIONS.length) * 100}%` }} />
        </div>
        {data.updatedAt && <div className="text-xs text-slate-600 mt-1">Last updated: {data.updatedAt.split('T')[0]}</div>}
      </div>

      {/* Tagline hero */}
      {(data.tagline || editMode) && (
        <div className="game-card p-5 border border-yellow-500/30 text-center">
          {editMode ? (
            <input value={draft.tagline} onChange={e => setDraft(d => ({ ...d, tagline: e.target.value }))}
              placeholder="Your personal tagline..." className="game-input w-full text-center text-lg font-bold" />
          ) : (
            <div className="text-xl font-bold text-yellow-400">"{data.tagline}"</div>
          )}
        </div>
      )}

      {/* Core values */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 mb-3">Core Values</h3>
        <div className="grid grid-cols-2 gap-2">
          {(editMode ? draft : data).coreValues.map((v, i) => (
            <div key={i}>
              {editMode ? (
                <input value={v} onChange={e => updateList('coreValues', i, e.target.value)}
                  placeholder={`Value ${i + 1} (e.g. Integrity)`} className="game-input w-full" />
              ) : v ? (
                <div className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm font-medium text-center">
                  {v}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Super powers */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 mb-3">Super Powers</h3>
        <div className="space-y-2">
          {(editMode ? draft : data).superPowers.map((sp, i) => (
            <div key={i}>
              {editMode ? (
                <input value={sp} onChange={e => updateList('superPowers', i, e.target.value)}
                  placeholder={`Super power ${i + 1} (e.g. Problem solving under pressure)`} className="game-input w-full" />
              ) : sp ? (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">⚡</span>
                  <span className="text-slate-300 text-sm">{sp}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Content pillars */}
      <div className="game-card p-5">
        <h3 className="font-semibold text-slate-300 mb-3">Content Pillars</h3>
        <p className="text-xs text-slate-500 mb-3">The 5 topics/themes you consistently speak about and stand for</p>
        <div className="flex flex-wrap gap-2">
          {(editMode ? draft : data).contentPillars.map((p, i) => (
            <div key={i}>
              {editMode ? (
                <input value={p} onChange={e => updateList('contentPillars', i, e.target.value)}
                  placeholder={`Pillar ${i + 1}`} className="game-input w-32" />
              ) : p ? (
                <div className="px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm">
                  {p}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Long form sections */}
      {SECTIONS.filter(s => s.key !== 'tagline').map(section => {
        const val = (editMode ? draft : data)[section.key as keyof PersonalBrandData] as string
        if (!editMode && !val) return null
        return (
          <div key={section.key} className="game-card p-5">
            <h3 className="font-semibold text-slate-300 mb-2">{section.label}</h3>
            {editMode ? (
              section.type === 'textarea' ? (
                <textarea value={val} onChange={e => setDraft(d => ({ ...d, [section.key]: e.target.value }))}
                  placeholder={section.placeholder} className="game-input w-full h-24 resize-none" />
              ) : (
                <input value={val} onChange={e => setDraft(d => ({ ...d, [section.key]: e.target.value }))}
                  placeholder={section.placeholder} className="game-input w-full" />
              )
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{val}</p>
            )}
          </div>
        )
      })}

      {!editMode && completedSections < 3 && (
        <div className="text-center py-10 text-slate-500">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">Your personal brand is your most valuable asset.</p>
          <button onClick={startEdit} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            Define Your Brand
          </button>
        </div>
      )}
    </div>
  )
}
