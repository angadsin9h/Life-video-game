import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Star, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface LifeChapter {
  id: string; title: string; startYear: number; endYear: number | null
  description: string; lessons: string; moments: string[]; tone: string; color: string
  createdAt: string
}
const TONES = ['Exciting','Transformative','Difficult','Peaceful','Adventurous','Formative','Joyful','Challenging']
const TONE_COLORS: Record<string,string> = {Exciting:'#f59e0b',Transformative:'#a855f7',Difficult:'#ef4444',Peaceful:'#22c55e',Adventurous:'#3b82f6',Formative:'#6366f1',Joyful:'#ec4899',Challenging:'#f97316'}
const PALETTE = ['#6366f1','#a855f7','#ec4899','#f97316','#f59e0b','#22c55e','#3b82f6','#10b981','#ef4444','#64748b']
const STORAGE_KEY = 'life_chapters'

export default function LifeChapters() {
  const { toastSuccess } = useToast()
  const curYear = new Date().getFullYear()
  const [chapters, setChapters] = useState<LifeChapter[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [form, setForm] = useState({title:'',startYear:2020,endYear:null as number|null,description:'',lessons:'',moments:[] as string[],tone:'Transformative',color:'#6366f1'})
  const [momentInput, setMomentInput] = useState('')

  useEffect(()=>{try{setChapters(JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'))}catch{/**/}},[])
  const save = (u: LifeChapter[]) => { setChapters(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const addChapter = () => {
    if (!form.title.trim()) return
    const ch: LifeChapter = {id:Date.now().toString(),...form,createdAt:new Date().toISOString()}
    save([...chapters, ch])
    setForm({title:'',startYear:2020,endYear:null,description:'',lessons:'',moments:[],tone:'Transformative',color:'#6366f1'})
    setShowForm(false)
    toastSuccess(`Chapter added: "${ch.title}"`)
  }
  const addMoment = () => {
    if (!momentInput.trim()) return
    setForm(f=>({...f,moments:[...f.moments,momentInput.trim()]}))
    setMomentInput('')
  }
  const totalYears = chapters.reduce((s,c)=>{
    const end = c.endYear ?? curYear
    return s + (end - c.startYear)
  }, 0)

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{fontFamily:'Orbitron,monospace'}}>
            <BookOpen className="w-7 h-7 text-purple-400"/>Life Chapters
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">The story of your life, told in chapters.</p>
        </div>
        <button onClick={()=>setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4"/>Add Chapter
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-purple-400">{chapters.length}</div>
          <div className="text-xs text-slate-500">Chapters</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-indigo-400">{totalYears}</div>
          <div className="text-xs text-slate-500">Years Documented</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-xl font-bold text-pink-400">{chapters.filter(c=>!c.endYear).length}</div>
          <div className="text-xs text-slate-500">Open Chapters</div>
        </div>
      </div>
      {/* Timeline */}
      {chapters.length > 0 && (
        <div className="game-card p-4">
          <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Life Timeline</div>
          <div className="flex gap-1 items-end h-12">
            {[...chapters].sort((a,b)=>a.startYear-b.startYear).map(c=>{
              const width = ((c.endYear??curYear)-c.startYear+1)
              return (
                <div key={c.id} className="flex flex-col items-center flex-1 min-w-0" title={`${c.title} (${c.startYear}–${c.endYear??'now'})`}>
                  <div className="w-full rounded-t-lg" style={{height:`${Math.min(48,width*6)}px`,background:c.color}}/>
                  <div className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">{c.startYear}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {showForm && (
        <div className="game-card p-5 space-y-3 border border-purple-500/20">
          <h3 className="font-semibold text-slate-300">New Life Chapter</h3>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
            placeholder="Chapter title (e.g. 'The College Years')" className="game-input w-full" autoFocus/>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400 mb-1 block">Start Year</label>
              <input type="number" min="1950" max={curYear} value={form.startYear}
                onChange={e=>setForm(f=>({...f,startYear:+e.target.value}))} className="game-input w-full"/></div>
            <div><label className="text-xs text-slate-400 mb-1 block">End Year (blank=present)</label>
              <input type="number" min="1950" max={curYear} value={form.endYear??''}
                onChange={e=>setForm(f=>({...f,endYear:e.target.value?+e.target.value:null}))}
                placeholder="Present" className="game-input w-full"/></div>
          </div>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
            placeholder="Describe this chapter of your life..." className="game-input w-full h-20 resize-none"/>
          <textarea value={form.lessons} onChange={e=>setForm(f=>({...f,lessons:e.target.value}))}
            placeholder="Key lessons from this chapter..." className="game-input w-full h-16 resize-none"/>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Tone / Emotion</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t=>(
                <button key={t} onClick={()=>setForm(f=>({...f,tone:t}))}
                  className="px-2 py-0.5 rounded-full text-xs transition-all"
                  style={form.tone===t?{background:TONE_COLORS[t]+'30',color:TONE_COLORS[t],border:`1px solid ${TONE_COLORS[t]}60`}:{background:'#1e293b',color:'#64748b'}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Chapter Color</label>
            <div className="flex gap-2">
              {PALETTE.map(c=>(
                <button key={c} onClick={()=>setForm(f=>({...f,color:c}))}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  style={{background:c,border:form.color===c?'2px solid white':'2px solid transparent'}}/>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Defining Moments</label>
            {form.moments.map((m,i)=>(
              <div key={i} className="flex items-center gap-2 mb-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0"/>
                <span className="text-sm text-white flex-1">{m}</span>
                <button onClick={()=>setForm(f=>({...f,moments:f.moments.filter((_,idx)=>idx!==i)}))}><X className="w-3 h-3 text-slate-600 hover:text-red-400"/></button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input value={momentInput} onChange={e=>setMomentInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addMoment()}
                placeholder="A defining moment..." className="game-input flex-1 text-sm"/>
              <button onClick={addMoment} className="p-2 bg-slate-700 rounded-lg"><Plus className="w-4 h-4 text-slate-400"/></button>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addChapter} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold">Add Chapter</button>
            <button onClick={()=>setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {[...chapters].sort((a,b)=>b.startYear-a.startYear).map(c=>{
          const toneColor = TONE_COLORS[c.tone]||'#6366f1'
          const isOpen = expanded===c.id
          return (
            <div key={c.id} className="game-card" style={{borderLeft:`3px solid ${c.color}`}}>
              <button onClick={()=>setExpanded(isOpen?null:c.id)} className="w-full flex items-start gap-3 p-4 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{c.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{background:toneColor+'20',color:toneColor}}>{c.tone}</span>
                    <span className="text-xs text-slate-500">{c.startYear}–{c.endYear??'Now'}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isOpen?<ChevronUp className="w-4 h-4 text-slate-500"/>:<ChevronDown className="w-4 h-4 text-slate-500"/>}
                  <button onClick={e=>{e.stopPropagation();save(chapters.filter(x=>x.id!==c.id))}}
                    className="p-1 text-slate-700 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3">
                  {c.description&&<p className="text-sm text-slate-300 leading-relaxed">{c.description}</p>}
                  {c.lessons&&<div><div className="text-xs text-slate-500 mb-1">Key Lessons</div><p className="text-sm text-slate-300">{c.lessons}</p></div>}
                  {c.moments.length>0&&(
                    <div>
                      <div className="text-xs text-slate-500 mb-2">Defining Moments</div>
                      {c.moments.map((m,i)=>(
                        <div key={i} className="flex items-center gap-2 mb-1">
                          <Star className="w-3 h-3 text-yellow-400 flex-shrink-0"/>
                          <span className="text-sm text-white">{m}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {chapters.length===0&&!showForm&&(
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20"/>
          <p className="mb-2">No chapters written yet.</p>
          <p className="text-sm">Document the eras of your life — each one shaped who you are.</p>
        </div>
      )}
    </div>
  )
}
