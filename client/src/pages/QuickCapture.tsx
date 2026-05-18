import { useState, useEffect, useRef } from 'react'
import { Zap, Plus, Trash2, Check, Tag, Star, X, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface CaptureItem {
  id: string
  text: string
  type: 'thought' | 'task' | 'idea' | 'question' | 'feeling' | 'quote'
  tags: string[]
  processed: boolean
  starred: boolean
  createdAt: string
}

const TYPE_CONFIG = {
  thought: { label: 'Thought', color: '#6366f1', emoji: '💭' },
  task: { label: 'Task', color: '#f97316', emoji: '✅' },
  idea: { label: 'Idea', color: '#f59e0b', emoji: '💡' },
  question: { label: 'Question', color: '#3b82f6', emoji: '❓' },
  feeling: { label: 'Feeling', color: '#ec4899', emoji: '💜' },
  quote: { label: 'Quote', color: '#22c55e', emoji: '💬' },
}

const STORAGE_KEY = 'quick_capture'

export default function QuickCapture() {
  const { toastSuccess } = useToast()
  const [items, setItems] = useState<CaptureItem[]>([])
  const [text, setText] = useState('')
  const [type, setType] = useState<CaptureItem['type']>('thought')
  const [tagInput, setTagInput] = useState('')
  const [filter, setFilter] = useState<'all' | 'unprocessed' | 'starred'>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
    } catch { /**/ }
    inputRef.current?.focus()
  }, [])

  const save = (updated: CaptureItem[]) => {
    setItems(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const capture = () => {
    if (!text.trim()) return
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    const item: CaptureItem = {
      id: Date.now().toString(),
      text: text.trim(),
      type,
      tags,
      processed: false,
      starred: false,
      createdAt: new Date().toISOString(),
    }
    save([item, ...items])
    setText('')
    setTagInput('')
    toastSuccess(`Captured! ${TYPE_CONFIG[type].emoji}`)
    inputRef.current?.focus()
  }

  const toggle = (id: string, field: 'processed' | 'starred') => {
    save(items.map(i => i.id === id ? { ...i, [field]: !i[field] } : i))
  }

  const del = (id: string) => save(items.filter(i => i.id !== id))

  const clearProcessed = () => {
    save(items.filter(i => !i.processed))
    toastSuccess('Processed items cleared')
  }

  const displayed = items.filter(i => {
    if (filter === 'unprocessed' && i.processed) return false
    if (filter === 'starred' && !i.starred) return false
    if (filterType !== 'all' && i.type !== filterType) return false
    return true
  })

  const unprocessedCount = items.filter(i => !i.processed).length
  const starredCount = items.filter(i => i.starred).length

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Zap className="w-7 h-7 text-yellow-400" />
            Quick Capture
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Capture everything instantly. Process later.</p>
        </div>
        {items.filter(i => i.processed).length > 0 && (
          <button onClick={clearProcessed}
            className="text-xs px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" /> Clear done
          </button>
        )}
      </div>

      {/* Capture box */}
      <div className="game-card p-4 border border-yellow-500/20 space-y-3">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) capture() }}
          placeholder="What's on your mind? Capture it now, process later... (⌘+Enter to save)"
          className="game-input w-full h-20 resize-none text-sm"
          autoFocus
        />
        <div className="flex items-center gap-2 flex-wrap">
          {(Object.entries(TYPE_CONFIG) as [CaptureItem['type'], typeof TYPE_CONFIG.thought][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setType(key)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${type === key ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
              style={type === key ? { background: cfg.color + '30', color: cfg.color, border: `1px solid ${cfg.color}60` } : {}}>
              {cfg.emoji} {cfg.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            placeholder="Tags (comma-separated)..."
            className="game-input flex-1 text-xs" />
          <button onClick={capture}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Capture
          </button>
        </div>
      </div>

      {/* Stats + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === 'all' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          All ({items.length})
        </button>
        <button onClick={() => setFilter('unprocessed')}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === 'unprocessed' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          Inbox ({unprocessedCount})
        </button>
        <button onClick={() => setFilter('starred')}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === 'starred' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
          ★ ({starredCount})
        </button>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="game-input text-xs ml-auto">
          <option value="all">All types</option>
          {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG.thought][]).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {displayed.map(item => {
          const cfg = TYPE_CONFIG[item.type]
          return (
            <div key={item.id} className={`game-card p-3 flex items-start gap-3 transition-opacity ${item.processed ? 'opacity-50' : ''}`}>
              <button onClick={() => toggle(item.id, 'processed')}
                className={`w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center mt-0.5 transition-all ${item.processed ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-green-500'}`}>
                {item.processed && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: cfg.color + '20', color: cfg.color }}>
                    {cfg.emoji} {cfg.label}
                  </span>
                  <span className="text-xs text-slate-600">{formatTime(item.createdAt)}</span>
                </div>
                <p className={`text-sm leading-relaxed ${item.processed ? 'line-through text-slate-600' : 'text-white'}`}>
                  {item.text}
                </p>
                {item.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.tags.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => toggle(item.id, 'starred')}>
                  <Star className={`w-3.5 h-3.5 ${item.starred ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700 hover:text-yellow-400'}`} />
                </button>
                <button onClick={() => del(item.id)}>
                  <X className="w-3.5 h-3.5 text-slate-700 hover:text-red-400" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Your capture inbox is empty.</p>
          <p className="text-sm">Capture thoughts instantly — don't let ideas slip away.</p>
        </div>
      )}
    </div>
  )
}
