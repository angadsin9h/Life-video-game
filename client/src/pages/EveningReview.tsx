import { useState, useEffect } from 'react'
import { Moon, Check, Star, ChevronDown, ChevronUp, Target, Zap, Heart } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface EveningData {
  date: string
  win1: string; win2: string; win3: string
  notPlanned: string; doDifferently: string
  energyRating: number; focusRating: number; moodRating: number; progressRating: number
  gratitude: string; tomorrowPriority: string; savedAt: string
}

const LABELS = ['','Terrible','Bad','Poor','Meh','OK','Decent','Good','Great','Excellent','Perfect']
const PREFIX = 'evening_review'
const today = () => new Date().toISOString().split('T')[0]
const empty = (date: string): EveningData => ({
  date, win1:'', win2:'', win3:'', notPlanned:'', doDifferently:'',
  energyRating:7, focusRating:7, moodRating:7, progressRating:7,
  gratitude:'', tomorrowPriority:'', savedAt:''
})
const loadDay = (d: string): EveningData => {
  try { const s = localStorage.getItem(`${PREFIX}_${d}`); return s ? JSON.parse(s) : empty(d) }
  catch { return empty(d) }
}

export default function EveningReview() {
  const { toastSuccess } = useToast()
  const tod = today()
  const [date, setDate] = useState(tod)
  const [data, setData] = useState<EveningData>(() => loadDay(tod))
  const [open, setOpen] = useState(1)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setData(loadDay(date)); setSaved(false) }, [date])

  const upd = (f: keyof EveningData, v: string | number) => { setData(d => ({...d,[f]:v})); setSaved(false) }
  const saveReview = () => {
    const u = {...data, savedAt: new Date().toISOString()}
    localStorage.setItem(`${PREFIX}_${date}`, JSON.stringify(u))
    setData(u); setSaved(true)
    toastSuccess('Evening review saved ✨')
  }
  const score = Math.round((data.energyRating+data.focusRating+data.moodRating+data.progressRating)/4)
  const sections = [
    {id:1,t:"Today's Wins",done:!!(data.win1||data.win2||data.win3)},
    {id:2,t:"What Didn't Go as Planned",done:!!data.notPlanned},
    {id:3,t:"What I'd Do Differently",done:!!data.doDifferently},
    {id:4,t:"Day Ratings",done:true},
    {id:5,t:"Gratitude",done:!!data.gratitude},
    {id:6,t:"Tomorrow's #1 Priority",done:!!data.tomorrowPriority},
  ]
  const completed = sections.filter(s => s.done).length
  const hist = Array.from({length:7}).map((_,i) => {
    const d = new Date(tod); d.setDate(d.getDate()-i)
    const ds = d.toISOString().split('T')[0]
    const day = loadDay(ds)
    return {date:ds, saved:!!day.savedAt, score:Math.round((day.energyRating+day.focusRating+day.moodRating+day.progressRating)/4)}
  }).reverse()

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{fontFamily:'Orbitron,monospace'}}>
            <Moon className="w-7 h-7 text-indigo-400"/>Evening Review
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Close the day with intention.</p>
        </div>
        <input type="date" value={date} max={tod} onChange={e=>setDate(e.target.value)} className="game-input text-sm"/>
      </div>
      <div className="game-card p-4 border border-indigo-500/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{completed}/{sections.length} sections done</span>
          {saved && <span className="text-sm font-bold" style={{color:score>=8?'#22c55e':score>=6?'#f59e0b':'#ef4444'}}>Score: {score}/10</span>}
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{width:`${completed/sections.length*100}%`}}/>
        </div>
        <div className="flex gap-1 mt-3">
          {hist.map(d=>(
            <button key={d.date} onClick={()=>setDate(d.date)} title={d.date}
              className="flex-1 h-5 rounded-sm" style={{
                background:d.saved?(d.score>=8?'#22c55e40':d.score>=6?'#f59e0b40':'#ef444440'):'#1e293b',
                border:d.date===date?'1px solid #6366f1':'1px solid transparent'
              }}/>
          ))}
        </div>
      </div>
      {sections.map(sec=>(
        <div key={sec.id} className="game-card">
          <button onClick={()=>setOpen(open===sec.id?0:sec.id)} className="w-full flex items-center justify-between p-4 text-left">
            <div className="flex items-center gap-2">
              {sec.done?<Check className="w-4 h-4 text-green-400"/>:<div className="w-4 h-4 rounded-full border-2 border-slate-700"/>}
              <span className={`text-sm font-medium ${sec.done?'text-white':'text-slate-400'}`}>{sec.t}</span>
            </div>
            {open===sec.id?<ChevronUp className="w-4 h-4 text-slate-500"/>:<ChevronDown className="w-4 h-4 text-slate-500"/>}
          </button>
          {open===sec.id&&(
            <div className="px-4 pb-4 space-y-3">
              {sec.id===1&&(['win1','win2','win3'] as const).map((k,i)=>(
                <input key={k} value={data[k]} onChange={e=>upd(k,e.target.value)}
                  placeholder={`Win #${i+1}...`} className="game-input w-full text-sm"/>
              ))}
              {sec.id===2&&<textarea value={data.notPlanned} onChange={e=>upd('notPlanned',e.target.value)}
                placeholder="What went differently than expected?" className="game-input w-full h-20 resize-none text-sm"/>}
              {sec.id===3&&<input value={data.doDifferently} onChange={e=>upd('doDifferently',e.target.value)}
                placeholder="If you could redo today, what would you change?" className="game-input w-full text-sm"/>}
              {sec.id===4&&(
                <div className="space-y-3">
                  {([['energyRating','Energy'],[`focusRating`,'Focus'],['moodRating','Mood'],['progressRating','Progress']] as const).map(([key,label])=>(
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-20 flex-shrink-0">{label}</span>
                      <input type="range" min="1" max="10" value={data[key]}
                        onChange={e=>upd(key,+e.target.value)} className="flex-1"/>
                      <span className="text-xs font-bold text-indigo-400 w-16 text-right">{data[key]} - {LABELS[data[key]]}</span>
                    </div>
                  ))}
                </div>
              )}
              {sec.id===5&&<textarea value={data.gratitude} onChange={e=>upd('gratitude',e.target.value)}
                placeholder="What are you grateful for today?" className="game-input w-full h-20 resize-none text-sm"/>}
              {sec.id===6&&<input value={data.tomorrowPriority} onChange={e=>upd('tomorrowPriority',e.target.value)}
                placeholder="The ONE thing that will make tomorrow a success..." className="game-input w-full text-sm"/>}
              <button onClick={()=>setOpen(sec.id<6?sec.id+1:0)} className="text-xs text-indigo-400 hover:text-indigo-300">
                {sec.id<6?'Next →':'Done'}
              </button>
            </div>
          )}
        </div>
      ))}
      <button onClick={saveReview}
        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${saved?'bg-green-600 text-white':'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
        {saved?'✓ Review Saved':'Save Evening Review'}
      </button>
    </div>
  )
}
