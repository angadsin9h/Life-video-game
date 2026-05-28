import { useState, useEffect } from 'react'
import { Star, Check, Plus, Trash2, Trophy, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface YearData {
  year: number
  win1: string; win2: string; win3: string
  bigChallenge: string; bigLesson: string; bestMemory: string
  thankfulPeople: string[]
  goalsAchieved: string[]
  habitsStuck: string[]
  habitsDidnt: string[]
  yearRating: number
  yearWord: string
  nextYearTheme: string; nextYearDesc: string
  savedAt: string
}
const PREFIX = 'year_review'
const empty = (year: number): YearData => ({
  year, win1:'',win2:'',win3:'',bigChallenge:'',bigLesson:'',bestMemory:'',
  thankfulPeople:[],goalsAchieved:[],habitsStuck:[],habitsDidnt:[],
  yearRating:8,yearWord:'',nextYearTheme:'',nextYearDesc:'',savedAt:''
})
const load = (y: number): YearData => {
  try { const s = localStorage.getItem(`${PREFIX}_${y}`); return s ? JSON.parse(s) : empty(y) }
  catch { return empty(y) }
}

const SECTIONS = [
  {id:1,t:'Top 3 Wins'},{id:2,t:'Biggest Challenge'},{id:3,t:'Key Lesson'},
  {id:4,t:'Best Memory'},{id:5,t:'People to Thank'},{id:6,t:'Goals Achieved'},
  {id:7,t:'Habits'},{id:8,t:'Year Rating'},{id:9,t:'Next Year Theme'}
]

export default function YearInReview() {
  const { toastSuccess } = useToast()
  const curYear = new Date().getFullYear()
  const [year, setYear] = useState(curYear)
  const [data, setData] = useState<YearData>(() => load(curYear))
  const [open, setOpen] = useState(1)
  const [input, setInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => { setData(load(year)); setSaved(false) }, [year])
  const upd = (f: keyof YearData, v: unknown) => { setData(d=>({...d,[f]:v} as YearData)); setSaved(false) }
  const saveReview = () => {
    const u = {...data, savedAt: new Date().toISOString()}
    localStorage.setItem(`${PREFIX}_${year}`, JSON.stringify(u))
    setData(u); setSaved(true)
    toastSuccess(`${year} Year in Review saved 🎊`)
  }
  const addToList = (field: 'thankfulPeople'|'goalsAchieved'|'habitsStuck'|'habitsDidnt') => {
    if (!input.trim()) return
    upd(field, [...data[field], input.trim()])
    setInput('')
  }
  const removeFromList = (field: 'thankfulPeople'|'goalsAchieved'|'habitsStuck'|'habitsDidnt', i: number) => {
    upd(field, data[field].filter((_,idx)=>idx!==i))
  }
  const filledSections = SECTIONS.filter(s => {
    if (s.id===1) return !!(data.win1||data.win2||data.win3)
    if (s.id===2) return !!data.bigChallenge
    if (s.id===3) return !!data.bigLesson
    if (s.id===4) return !!data.bestMemory
    if (s.id===5) return data.thankfulPeople.length > 0
    if (s.id===6) return data.goalsAchieved.length > 0
    if (s.id===7) return data.habitsStuck.length > 0 || data.habitsDidnt.length > 0
    if (s.id===8) return data.yearRating > 0
    if (s.id===9) return !!data.nextYearTheme
    return false
  }).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{fontFamily:'Orbitron,monospace'}}>
            <Trophy className="w-7 h-7 text-yellow-400"/>Year in Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Document, reflect, and plan your year.</p>
        </div>
        <select value={year} onChange={e=>setYear(+e.target.value)} className="game-input text-sm">
          {Array.from({length:10}).map((_,i)=>{const y=curYear-i;return <option key={y} value={y}>{y}</option>})}
        </select>
      </div>
      <div className="game-card p-4 border border-yellow-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{filledSections}/{SECTIONS.length} sections</span>
          {data.yearWord && <span className="text-lg font-bold text-yellow-400">"{data.yearWord}"</span>}
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 rounded-full" style={{width:`${filledSections/SECTIONS.length*100}%`}}/>
        </div>
      </div>

      {SECTIONS.map(sec => {
        const isOpen = open === sec.id
        return (
          <div key={sec.id} className="game-card">
            <button onClick={()=>setOpen(isOpen?0:sec.id)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-sm font-medium text-white">{sec.t}</span>
              {isOpen?<ChevronUp className="w-4 h-4 text-slate-500"/>:<ChevronDown className="w-4 h-4 text-slate-500"/>}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                {sec.id===1&&(['win1','win2','win3'] as const).map((k,i)=>(
                  <input key={k} value={data[k]} onChange={e=>upd(k,e.target.value)}
                    placeholder={`Win #${i+1} of ${year}...`} className="game-input w-full text-sm"/>
                ))}
                {sec.id===2&&<textarea value={data.bigChallenge} onChange={e=>upd('bigChallenge',e.target.value)}
                  placeholder="The biggest challenge you overcame this year..." className="game-input w-full h-24 resize-none text-sm"/>}
                {sec.id===3&&<textarea value={data.bigLesson} onChange={e=>upd('bigLesson',e.target.value)}
                  placeholder="The most important lesson you learned..." className="game-input w-full h-24 resize-none text-sm"/>}
                {sec.id===4&&<textarea value={data.bestMemory} onChange={e=>upd('bestMemory',e.target.value)}
                  placeholder="Your best memory of this year..." className="game-input w-full h-24 resize-none text-sm"/>}
                {(sec.id===5||sec.id===6)&&(()=>{
                  const field = sec.id===5?'thankfulPeople':'goalsAchieved'
                  return <>
                    {data[field].map((item,i)=>(
                      <div key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400 flex-shrink-0"/>
                        <span className="text-sm text-white flex-1">{item}</span>
                        <button onClick={()=>removeFromList(field,i)}><X className="w-3.5 h-3.5 text-slate-600 hover:text-red-400"/></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input value={input} onChange={e=>setInput(e.target.value)}
                        onKeyDown={e=>e.key==='Enter'&&addToList(field)}
                        placeholder={sec.id===5?"Someone who made this year better...":"A goal you achieved..."}
                        className="game-input flex-1 text-sm"/>
                      <button onClick={()=>addToList(field)} className="p-2 bg-slate-700 rounded-lg"><Plus className="w-4 h-4 text-slate-400"/></button>
                    </div>
                  </>
                })()}
                {sec.id===7&&<>
                  <div className="text-xs text-green-400 mb-1">Habits that stuck ✓</div>
                  {data.habitsStuck.map((h,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-white flex-1">{h}</span>
                      <button onClick={()=>removeFromList('habitsStuck',i)}><X className="w-3.5 h-3.5 text-slate-600 hover:text-red-400"/></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input placeholder="Habit that worked..." className="game-input flex-1 text-sm"
                      onKeyDown={e=>{if(e.key==='Enter'){upd('habitsStuck',[...data.habitsStuck,(e.target as HTMLInputElement).value]);(e.target as HTMLInputElement).value=''}}}/>
                  </div>
                  <div className="text-xs text-red-400 mb-1 mt-2">Habits that didn't stick ✗</div>
                  {data.habitsDidnt.map((h,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 flex-1">{h}</span>
                      <button onClick={()=>removeFromList('habitsDidnt',i)}><X className="w-3.5 h-3.5 text-slate-600 hover:text-red-400"/></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input placeholder="Habit that didn't stick..." className="game-input flex-1 text-sm"
                      onKeyDown={e=>{if(e.key==='Enter'){upd('habitsDidnt',[...data.habitsDidnt,(e.target as HTMLInputElement).value]);(e.target as HTMLInputElement).value=''}}}/>
                  </div>
                </>}
                {sec.id===8&&<>
                  <div className="flex items-center gap-3">
                    <input type="range" min="1" max="10" value={data.yearRating}
                      onChange={e=>upd('yearRating',+e.target.value)} className="flex-1"/>
                    <span className="text-2xl font-bold text-yellow-400 w-12">{data.yearRating}/10</span>
                  </div>
                  <div className="flex gap-1 justify-center">
                    {Array.from({length:10}).map((_,i)=>(
                      <button key={i} onClick={()=>upd('yearRating',i+1)}>
                        <Star className={`w-6 h-6 ${i<data.yearRating?'text-yellow-400 fill-yellow-400':'text-slate-700'}`}/>
                      </button>
                    ))}
                  </div>
                  <input value={data.yearWord} onChange={e=>upd('yearWord',e.target.value)}
                    placeholder="One word that describes this year..." className="game-input w-full text-sm"/>
                </>}
                {sec.id===9&&<>
                  <input value={data.nextYearTheme} onChange={e=>upd('nextYearTheme',e.target.value)}
                    placeholder={`Theme for ${year+1} (e.g. 'Year of Health')`} className="game-input w-full text-sm"/>
                  <textarea value={data.nextYearDesc} onChange={e=>upd('nextYearDesc',e.target.value)}
                    placeholder="What does this theme mean to you? What will you focus on?" className="game-input w-full h-20 resize-none text-sm"/>
                </>}
              </div>
            )}
          </div>
        )
      })}
      <button onClick={saveReview}
        className={`w-full py-3 rounded-xl font-semibold text-sm ${saved?'bg-green-600 text-white':'bg-yellow-600 hover:bg-yellow-500 text-white'}`}>
        {saved?`✓ ${year} Review Saved!`:`Save ${year} Year in Review`}
      </button>
    </div>
  )
}
