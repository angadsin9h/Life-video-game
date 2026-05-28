import { useState, useEffect } from 'react'
import { Leaf, Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type PlantStatus = 'seedling' | 'growing' | 'flowering' | 'fruiting' | 'dormant' | 'dead'

interface Plant {
  id: string
  name: string
  species: string
  location: 'indoor' | 'outdoor' | 'balcony' | 'greenhouse'
  status: PlantStatus
  plantedDate: string
  lastWatered: string
  waterFrequency: number
  lastFertilized: string
  sunlight: 'full' | 'partial' | 'shade'
  notes: string
  emoji: string
}

interface GardenTask {
  id: string
  date: string
  type: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'harvesting' | 'planting' | 'other'
  plants: string[]
  notes: string
}

const STATUS_CONFIG: Record<PlantStatus, { label: string; color: string }> = {
  seedling:  { label: 'Seedling',   color: '#22c55e' },
  growing:   { label: 'Growing',    color: '#16a34a' },
  flowering: { label: 'Flowering',  color: '#ec4899' },
  fruiting:  { label: 'Fruiting',   color: '#f97316' },
  dormant:   { label: 'Dormant',    color: '#94a3b8' },
  dead:      { label: 'Dead',       color: '#475569' },
}

const PLANT_EMOJIS = ['🌱', '🌿', '🍀', '🌺', '🌸', '🌼', '🌻', '🌹', '🌷', '🍅', '🥦', '🥕', '🌵', '🎋', '🌴', '🍁', '🌾', '🍃']
const TASK_TYPES = ['watering', 'fertilizing', 'pruning', 'repotting', 'harvesting', 'planting', 'other'] as const

const PLANTS_KEY = 'garden_plants'
const TASKS_KEY = 'garden_tasks'

export default function GardeningLog() {
  const { toastSuccess } = useToast()
  const [plants, setPlants] = useState<Plant[]>([])
  const [tasks, setTasks] = useState<GardenTask[]>([])
  const [tab, setTab] = useState<'plants' | 'log'>('plants')
  const [showPlantForm, setShowPlantForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pForm, setPForm] = useState<Omit<Plant, 'id'>>({
    name: '', species: '', location: 'indoor', status: 'growing',
    plantedDate: new Date().toISOString().split('T')[0], lastWatered: new Date().toISOString().split('T')[0],
    waterFrequency: 3, lastFertilized: '', sunlight: 'partial', notes: '', emoji: '🌱',
  })
  const [tForm, setTForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'watering' as GardenTask['type'], plants: [] as string[], notes: '' })

  useEffect(() => {
    try {
      setPlants(JSON.parse(localStorage.getItem(PLANTS_KEY) || '[]'))
      setTasks(JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const savePlants = (u: Plant[]) => { setPlants(u); localStorage.setItem(PLANTS_KEY, JSON.stringify(u)) }
  const saveTasks = (u: GardenTask[]) => { setTasks(u); localStorage.setItem(TASKS_KEY, JSON.stringify(u)) }

  const addPlant = () => {
    if (!pForm.name.trim()) return
    const p: Plant = { id: Date.now().toString(), ...pForm }
    savePlants([...plants, p])
    setPForm({ name: '', species: '', location: 'indoor', status: 'growing', plantedDate: new Date().toISOString().split('T')[0], lastWatered: new Date().toISOString().split('T')[0], waterFrequency: 3, lastFertilized: '', sunlight: 'partial', notes: '', emoji: '🌱' })
    setShowPlantForm(false)
    toastSuccess(`${pForm.name} added to garden!`)
  }

  const logTask = () => {
    if (!tForm.type) return
    const t: GardenTask = { id: Date.now().toString(), ...tForm }
    saveTasks([t, ...tasks])
    // Update lastWatered for watered plants
    if (tForm.type === 'watering' && tForm.plants.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      savePlants(plants.map(p => tForm.plants.includes(p.id) ? { ...p, lastWatered: today } : p))
    }
    setTForm({ date: new Date().toISOString().split('T')[0], type: 'watering', plants: [], notes: '' })
    setShowTaskForm(false)
    toastSuccess('Task logged 🌿')
  }

  const daysUntilWater = (plant: Plant) => {
    if (!plant.lastWatered) return 0
    const last = new Date(plant.lastWatered)
    const next = new Date(last.getTime() + plant.waterFrequency * 86400000)
    return Math.ceil((next.getTime() - Date.now()) / 86400000)
  }

  const wateringDue = plants.filter(p => daysUntilWater(p) <= 0 && p.status !== 'dead')

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Leaf className="w-7 h-7 text-green-400" />
          Gardening Log
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track your plants, watering schedules, and garden tasks.</p>
      </div>

      {/* Watering due alert */}
      {wateringDue.length > 0 && (
        <div className="game-card p-3 border border-blue-500/30 bg-blue-500/5 flex items-center gap-2">
          <span className="text-xl">💧</span>
          <div>
            <p className="text-sm text-blue-400 font-medium">Watering due: {wateringDue.map(p => p.name).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['plants', 'log'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
            {t === 'plants' ? `Plants (${plants.length})` : `Task Log (${tasks.length})`}
          </button>
        ))}
      </div>

      {tab === 'plants' && (
        <>
          <button onClick={() => setShowPlantForm(true)}
            className="w-full py-2.5 border border-dashed border-green-700/50 rounded-xl text-green-400 text-sm flex items-center gap-2 justify-center hover:border-green-600">
            <Plus className="w-4 h-4" /> Add plant
          </button>
          {showPlantForm && (
            <div className="game-card p-4 border border-green-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">Add Plant</h3>
              <div className="flex gap-2">
                <input value={pForm.name} onChange={e => setPForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Plant name *" className="game-input flex-1" autoFocus />
                <input value={pForm.species} onChange={e => setPForm(f => ({ ...f, species: e.target.value }))}
                  placeholder="Species" className="game-input flex-1 text-sm" />
              </div>
              <div className="flex gap-2">
                <select value={pForm.location} onChange={e => setPForm(f => ({ ...f, location: e.target.value as Plant['location'] }))} className="game-input text-sm flex-1">
                  <option value="indoor">🏠 Indoor</option>
                  <option value="outdoor">🌳 Outdoor</option>
                  <option value="balcony">🏙️ Balcony</option>
                  <option value="greenhouse">🌿 Greenhouse</option>
                </select>
                <select value={pForm.sunlight} onChange={e => setPForm(f => ({ ...f, sunlight: e.target.value as Plant['sunlight'] }))} className="game-input text-sm flex-1">
                  <option value="full">☀️ Full sun</option>
                  <option value="partial">🌤️ Partial</option>
                  <option value="shade">🌑 Shade</option>
                </select>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-500">Water every:</span>
                <input type="number" value={pForm.waterFrequency} min={1}
                  onChange={e => setPForm(f => ({ ...f, waterFrequency: Number(e.target.value) }))}
                  className="game-input w-16 text-sm text-center" />
                <span className="text-xs text-slate-500">days</span>
                <input type="date" value={pForm.plantedDate} onChange={e => setPForm(f => ({ ...f, plantedDate: e.target.value }))}
                  className="game-input flex-1 text-sm" />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {PLANT_EMOJIS.map(e => (
                  <button key={e} onClick={() => setPForm(f => ({ ...f, emoji: e }))}
                    className={`text-xl p-1 rounded-lg ${pForm.emoji === e ? 'bg-green-700/30 ring-1 ring-green-500' : 'bg-slate-800'}`}>{e}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={addPlant} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Add Plant</button>
                <button onClick={() => setShowPlantForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {plants.map(p => {
              const st = STATUS_CONFIG[p.status]
              const daysToWater = daysUntilWater(p)
              const isExp = expanded === p.id
              return (
                <div key={p.id} className={`game-card overflow-hidden ${daysToWater <= 0 && p.status !== 'dead' ? 'border-l-2 border-blue-500/50' : ''}`}>
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : p.id)}>
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{p.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: st.color + '20', color: st.color }}>{st.label}</span>
                      </div>
                      <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                        {p.species && <span>{p.species}</span>}
                        <span className="capitalize">{p.location}</span>
                        {daysToWater <= 0 ? <span className="text-blue-400">💧 Water now!</span> : <span>💧 in {daysToWater}d</span>}
                      </div>
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </div>
                  {isExp && (
                    <div className="border-t border-slate-800 p-3 space-y-2">
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span>Planted: {p.plantedDate}</span>
                        <span>Last watered: {p.lastWatered}</span>
                        <span>Sunlight: {p.sunlight}</span>
                      </div>
                      {p.notes && <p className="text-sm text-slate-400 italic">{p.notes}</p>}
                      <div className="flex gap-2 flex-wrap">
                        {(Object.keys(STATUS_CONFIG) as PlantStatus[]).map(s => (
                          <button key={s} onClick={() => savePlants(plants.map(x => x.id === p.id ? { ...x, status: s } : x))}
                            className={`px-2 py-0.5 rounded-full text-xs ${p.status === s ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                            style={p.status === s ? { background: STATUS_CONFIG[s].color + '30', color: STATUS_CONFIG[s].color } : {}}>
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                        <button onClick={() => { savePlants(plants.map(x => x.id === p.id ? { ...x, lastWatered: new Date().toISOString().split('T')[0] } : x)); toastSuccess('Watered! 💧') }}
                          className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">💧 Water now</button>
                      </div>
                      <button onClick={() => savePlants(plants.filter(x => x.id !== p.id))} className="text-xs text-slate-700 hover:text-red-400">Delete</button>
                    </div>
                  )}
                </div>
              )
            })}
            {plants.length === 0 && !showPlantForm && (
              <div className="text-center py-12 text-slate-500">
                <Leaf className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Start your garden log!</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'log' && (
        <div className="space-y-3">
          <button onClick={() => setShowTaskForm(true)}
            className="w-full py-2.5 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Log garden task
          </button>
          {showTaskForm && (
            <div className="game-card p-4 border border-green-500/20 space-y-2">
              <div className="flex gap-2">
                <input type="date" value={tForm.date} onChange={e => setTForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm" />
                <select value={tForm.type} onChange={e => setTForm(f => ({ ...f, type: e.target.value as GardenTask['type'] }))} className="game-input text-sm flex-1">
                  {TASK_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select>
              </div>
              {plants.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 mr-1">Plants:</span>
                  {plants.map(p => (
                    <button key={p.id} onClick={() => setTForm(f => ({ ...f, plants: f.plants.includes(p.id) ? f.plants.filter(x => x !== p.id) : [...f.plants, p.id] }))}
                      className={`text-xs px-2 py-0.5 rounded-full ${tForm.plants.includes(p.id) ? 'bg-green-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {p.emoji} {p.name}
                    </button>
                  ))}
                </div>
              )}
              <input value={tForm.notes} onChange={e => setTForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes..." className="game-input w-full text-sm" />
              <div className="flex gap-2">
                <button onClick={logTask} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Log</button>
                <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          {tasks.map(t => (
            <div key={t.id} className="game-card p-3 flex items-start gap-3">
              <span className="text-xl">{t.type === 'watering' ? '💧' : t.type === 'fertilizing' ? '🌿' : t.type === 'pruning' ? '✂️' : t.type === 'harvesting' ? '🌾' : '🌱'}</span>
              <div className="flex-1">
                <div className="font-medium text-white capitalize text-sm">{t.type}</div>
                <div className="text-xs text-slate-500">{t.date}</div>
                {t.plants.length > 0 && <p className="text-xs text-green-400 mt-0.5">{t.plants.map(id => plants.find(p => p.id === id)?.name).filter(Boolean).join(', ')}</p>}
                {t.notes && <p className="text-xs text-slate-500 mt-0.5">{t.notes}</p>}
              </div>
              <button onClick={() => saveTasks(tasks.filter(x => x.id !== t.id))} className="text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
