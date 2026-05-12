import { useEffect, useState } from 'react'
import { Network, Plus, Trash2, Edit3, Save, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface MindMapNode {
  id: string
  text: string
  parentId: string | null
  color: string
  x: number
  y: number
}

interface MindMap {
  id: string
  title: string
  nodes: MindMapNode[]
  createdAt: string
}

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#ef4444', '#eab308', '#14b8a6', '#ec4899']

const STORAGE_KEY = 'mind_maps'

export default function MindMapPage() {
  const { toastSuccess } = useToast()
  const [maps, setMaps] = useState<MindMap[]>([])
  const [activeMap, setActiveMap] = useState<MindMap | null>(null)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newMapTitle, setNewMapTitle] = useState('')
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newNodeText, setNewNodeText] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as MindMap[]
      setMaps(parsed)
      if (parsed.length > 0) setActiveMap(parsed[0])
    }
  }, [])

  const persist = (updated: MindMap[]) => {
    setMaps(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const persistMap = (map: MindMap) => {
    const updated = maps.map(m => m.id === map.id ? map : m)
    persist(updated)
    setActiveMap(map)
  }

  const createMap = () => {
    if (!newMapTitle.trim()) return
    const rootNode: MindMapNode = {
      id: 'root',
      text: newMapTitle,
      parentId: null,
      color: '#8b5cf6',
      x: 300,
      y: 200,
    }
    const map: MindMap = {
      id: Date.now().toString(),
      title: newMapTitle,
      nodes: [rootNode],
      createdAt: new Date().toISOString(),
    }
    const updated = [map, ...maps]
    persist(updated)
    setActiveMap(map)
    setNewMapTitle('')
    toastSuccess('Mind map created!')
  }

  const addNode = (parentId: string) => {
    if (!newNodeText.trim() || !activeMap) return
    const parent = activeMap.nodes.find(n => n.id === parentId)
    const siblings = activeMap.nodes.filter(n => n.parentId === parentId)
    const angle = siblings.length * 45 + (parent?.parentId === null ? 0 : 0)
    const rad = (angle * Math.PI) / 180
    const dist = 150
    const x = (parent?.x || 300) + Math.cos(rad) * dist
    const y = (parent?.y || 200) + Math.sin(rad) * dist

    const node: MindMapNode = {
      id: Date.now().toString(),
      text: newNodeText,
      parentId,
      color: COLORS[siblings.length % COLORS.length],
      x: Math.max(50, Math.min(550, x)),
      y: Math.max(30, Math.min(370, y)),
    }
    const updated = { ...activeMap, nodes: [...activeMap.nodes, node] }
    persistMap(updated)
    setNewNodeText('')
    setAddingTo(null)
  }

  const updateNodeText = (id: string) => {
    if (!activeMap) return
    const updated = { ...activeMap, nodes: activeMap.nodes.map(n => n.id === id ? { ...n, text: editText } : n) }
    persistMap(updated)
    setEditingNode(null)
  }

  const deleteNode = (id: string) => {
    if (!activeMap || id === 'root') return
    const toDelete = new Set<string>([id])
    let changed = true
    while (changed) {
      changed = false
      activeMap.nodes.forEach(n => {
        if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
          toDelete.add(n.id)
          changed = true
        }
      })
    }
    const updated = { ...activeMap, nodes: activeMap.nodes.filter(n => !toDelete.has(n.id)) }
    persistMap(updated)
  }

  const deleteMap = (id: string) => {
    const updated = maps.filter(m => m.id !== id)
    persist(updated)
    if (activeMap?.id === id) setActiveMap(updated[0] || null)
  }

  const getChildren = (id: string) => activeMap?.nodes.filter(n => n.parentId === id) || []

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Network className="w-7 h-7 text-violet-400" />
            Mind Maps
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Visual thinking and idea organization</p>
        </div>
      </div>

      {/* Create new map */}
      <div className="flex gap-2">
        <input value={newMapTitle} onChange={e => setNewMapTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createMap()}
          placeholder="New mind map title..." className="game-input flex-1" />
        <button onClick={createMap} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Map list */}
      {maps.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {maps.map(m => (
            <button key={m.id}
              onClick={() => setActiveMap(m)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all ${activeMap?.id === m.id ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
              {m.title}
              {maps.length > 1 && (
                <span onClick={e => { e.stopPropagation(); deleteMap(m.id) }}
                  className="text-slate-600 hover:text-red-400 transition-colors">×</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Mind map canvas */}
      {activeMap && (
        <div className="game-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-white">{activeMap.title}</h3>
            <div className="text-xs text-slate-500">{activeMap.nodes.length} nodes</div>
          </div>

          <div className="relative bg-slate-900/50 rounded-xl overflow-hidden" style={{ height: '420px' }}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {activeMap.nodes.filter(n => n.parentId).map(n => {
                const parent = activeMap.nodes.find(p => p.id === n.parentId)
                if (!parent) return null
                return (
                  <line key={n.id}
                    x1={`${parent.x / 600 * 100}%`} y1={`${parent.y / 420 * 100}%`}
                    x2={`${n.x / 600 * 100}%`} y2={`${n.y / 420 * 100}%`}
                    stroke={n.color} strokeWidth="2" opacity="0.4" />
                )
              })}
            </svg>

            {activeMap.nodes.map(n => (
              <div key={n.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${n.x / 600 * 100}%`, top: `${n.y / 420 * 100}%` }}>
                {editingNode === n.id ? (
                  <div className="flex items-center gap-1">
                    <input value={editText} onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') updateNodeText(n.id); if (e.key === 'Escape') setEditingNode(null) }}
                      className="game-input text-xs w-32" autoFocus />
                    <button onClick={() => updateNodeText(n.id)} className="p-1 text-green-400"><Save className="w-3 h-3" /></button>
                    <button onClick={() => setEditingNode(null)} className="p-1 text-slate-500"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all hover:scale-105"
                      style={{ background: n.color + '22', color: n.color, border: `1px solid ${n.color}66` }}>
                      {n.text}
                    </div>
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 bg-slate-800 rounded-lg p-1">
                      <button onClick={() => { setAddingTo(n.id); setNewNodeText('') }}
                        className="p-0.5 text-slate-400 hover:text-green-400 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => { setEditingNode(n.id); setEditText(n.text) }}
                        className="p-0.5 text-slate-400 hover:text-blue-400 transition-colors">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      {n.id !== 'root' && (
                        <button onClick={() => deleteNode(n.id)}
                          className="p-0.5 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {addingTo === n.id && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10 bg-slate-800 p-2 rounded-xl border border-slate-700">
                    <input value={newNodeText} onChange={e => setNewNodeText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addNode(n.id); if (e.key === 'Escape') setAddingTo(null) }}
                      placeholder="New idea..." className="game-input text-xs w-28" autoFocus />
                    <button onClick={() => addNode(n.id)} className="px-2 py-1 bg-violet-600 text-white rounded-lg text-xs">Add</button>
                    <button onClick={() => setAddingTo(null)} className="px-2 py-1 bg-slate-700 text-slate-400 rounded-lg text-xs">✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 text-xs text-slate-500 text-center">
            Hover a node to add children, edit, or delete. Press Enter to confirm.
          </div>
        </div>
      )}

      {maps.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-4">No mind maps yet.</p>
          <p className="text-sm">Create your first map to start organizing your thoughts visually.</p>
        </div>
      )}
    </div>
  )
}
