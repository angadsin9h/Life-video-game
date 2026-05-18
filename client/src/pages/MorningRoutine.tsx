import { useState, useEffect } from 'react'
import { Sun, Plus, Trash2, Check, ArrowUp, ArrowDown, Clock, Star, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface RoutineItem { id: string; name: string; duration: number; category: string; order: number }
const CATEGORIES = ['Mind','Body','Spirit','Work','Social']
const CAT_COLORS: Record<string,string> = {Mind:'#a855f7',Body:'#22c55e',Spirit:'#f59e0b',Work:'#3b82f6',Social:'#ec4899'}
const PRESETS = [
  {name:'Drink 16oz water',duration:2,category:'Body'},
  {name:'Meditate 10min',duration:10,category:'Mind'},
  {name:'Exercise 30min',duration:30,category:'Body'},
  {name:'Cold shower',duration:10,category:'Body'},
  {name:'Journal 5min',duration:5,category:'Mind'},
  {name:'Read 20min',duration:20,category:'Mind'},
  {name:'Review goals',duration:5,category:'Work'},
  {name:'Healthy breakfast',duration:15,category:'Body'},
  {name:'Gratitude 3 things',duration:3,category:'Spirit'},
]
const ITEMS_KEY = 'morning_routine_items'
const today = () => new Date().toISOString().split('T')[0]

export default function MorningRoutine() {
  const { toastSuccess } = useToast()
  const tod = today()
  const [items, setItems] = useState<RoutineItem[]>([])
  const [done, setDone] = useState<Set<string>>(new Set())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({name:'',duration:10,category:'Mind'})
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(ITEMS_KEY)||'[]'))
      const saved = localStorage.getItem(`morning_routine_${tod}`)
      setDone(new Set(saved ? JSON.parse(saved) : []))
    } catch {/**/}
    // calc streak
    let s = 0
    const d = new Date(tod)
    while (true) {
      const ds = d.toISOString().split('T')[0]
      const saved = localStorage.getItem(`morning_routine_${ds}`)
      if (!saved) break
      const comp = JSON.parse(saved) as string[]
      const its = JSON.parse(localStorage.getItem(ITEMS_KEY)||'[]') as RoutineItem[]
      if (its.length > 0 && comp.length / its.length >= 0.8) s++
      else break
      d.setDate(d.getDate()-1)
    }
    setStreak(s)
  }, [])

  const saveItems = (updated: RoutineItem[]) => {
    setItems(updated)
    localStorage.setItem(ITEMS_KEY, JSON.stringify(updated))
  }
  const saveCompletion = (updated: Set<string>) => {
    setDone(updated)
    localStorage.setItem(`morning_routine_${tod}`, JSON.stringify([...updated]))
  }
  const toggleDone = (id: string) => {
    const next = new Set(done)
    if (next.has(id)) next.delete(id); else { next.add(id); toastSuccess('✓ Done!') }
    saveCompletion(next)
  }
  const addItem = () => {
    if (!form.name.trim()) return
    const item: RoutineItem = {id:Date.now().toString(),name:form.name.trim(),duration:form.duration,category:form.category,order:items.length}
    saveItems([...items,item])
    setForm({name:'',duration:10,category:'Mind'})
    setShowForm(false)
  }
  const addPreset = (p: typeof PRESETS[0]) => {
    if (items.some(i=>i.name===p.name)) return
    const item: RoutineItem = {id:Date.now().toString(),...p,order:items.length}
    saveItems([...items,item])
    toastSuccess(`Added: ${p.name}`)
  }
  const move = (id: string, dir: -1|1) => {
    const idx = items.findIndex(i=>i.id===id)
    if (idx+dir<0||idx+dir>=items.length) return
    const u=[...items];[u[idx],u[idx+dir]]=[u[idx+dir],u[idx]]
    saveItems(u)
  }
  const del = (id: string) => saveItems(items.filter(i=>i.id!==id))

  const total = items.reduce((s,i)=>s+i.duration,0)
  const pct = items.length ? Math.round(done.size/items.length*100) : 0

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{fontFamily:'Orbitron,monospace'}}>
            <Sun className="w-7 h-7 text-amber-400"/>Morning Routine
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Build your ideal morning. Track your streaks.</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4"/>Add
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{pct}%</div>
          <div className="text-xs text-slate-500">Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">{streak}d</div>
          <div className="text-xs text-slate-500">Streak</div>
        </div>
        <div className="game-card p-3 text-center">
          <Clock className="w-4 h-4 text-slate-500 mx-auto mb-0.5"/>
          <div className="text-xl font-bold text-slate-400">{total}m</div>
          <div className="text-xs text-slate-500">Total Time</div>
        </div>
      </div>
      {/* Progress bar */}
      {items.length > 0 && (
        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all" style={{width:`${pct}%`}}/>
        </div>
      )}
      {/* Presets */}
      {items.length < 3 && (
        <div className="game-card p-4">
          <div className="text-xs text-slate-500 mb-3">Quick add preset activities:</div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.filter(p=>!items.some(i=>i.name===p.name)).slice(0,6).map(p=>(
              <button key={p.name} onClick={()=>addPreset(p)}
                className="text-left p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-white transition-colors">
                {p.name} <span className="text-xs text-slate-500 ml-1">{p.duration}m</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {showForm && (
        <div className="game-card p-4 space-y-3 border border-amber-500/20">
          <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
            placeholder="Activity name..." className="game-input w-full" autoFocus/>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400 mb-1 block">Duration (min)</label>
              <input type="number" min="1" max="120" value={form.duration}
                onChange={e=>setForm(f=>({...f,duration:+e.target.value}))} className="game-input w-full"/></div>
            <div><label className="text-xs text-slate-400 mb-1 block">Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="game-input w-full">
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select></div>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold">Add Activity</button>
            <button onClick={()=>setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {items.map(item=>{
          const color = CAT_COLORS[item.category]||'#6366f1'
          const isDone = done.has(item.id)
          return (
            <div key={item.id} className={`game-card p-3 flex items-center gap-3 ${isDone?'opacity-60':''}`}>
              <button onClick={()=>toggleDone(item.id)}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isDone?'bg-green-500 border-green-500':'border-slate-600 hover:border-green-500'}`}>
                {isDone&&<Check className="w-3.5 h-3.5 text-white"/>}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${isDone?'line-through text-slate-600':'text-white'}`}>{item.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{color}}>{item.category}</span>
                  <span className="text-xs text-slate-600">{item.duration}m</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <button onClick={()=>move(item.id,-1)} className="p-0.5 text-slate-700 hover:text-slate-400"><ArrowUp className="w-3 h-3"/></button>
                <button onClick={()=>move(item.id,1)} className="p-0.5 text-slate-700 hover:text-slate-400"><ArrowDown className="w-3 h-3"/></button>
              </div>
              <button onClick={()=>del(item.id)} className="p-1 text-slate-700 hover:text-red-400">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          )
        })}
      </div>
      {items.length===0&&!showForm&&(
        <div className="text-center py-12 text-slate-500">
          <Sun className="w-12 h-12 mx-auto mb-3 opacity-20"/>
          <p className="mb-2">No morning routine defined yet.</p>
          <p className="text-sm">Build your ideal morning — one activity at a time.</p>
        </div>
      )}
    </div>
  )
}
