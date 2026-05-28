import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, Check, Bell } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Pet {
  id: string
  name: string
  species: string
  breed: string
  birthdate: string
  avatar: string
  notes: string
}

interface CareTask {
  id: string
  petId: string
  task: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'asneeded'
  lastDone: string
  notes: string
}

interface HealthRecord {
  id: string
  petId: string
  date: string
  type: 'vet' | 'vaccine' | 'medicine' | 'grooming' | 'weight' | 'note'
  description: string
  weight?: number
  cost?: number
}

const RECORD_TYPES = {
  vet:      { label: 'Vet Visit',  emoji: '🏥' },
  vaccine:  { label: 'Vaccine',    emoji: '💉' },
  medicine: { label: 'Medicine',   emoji: '💊' },
  grooming: { label: 'Grooming',   emoji: '✂️' },
  weight:   { label: 'Weight',     emoji: '⚖️' },
  note:     { label: 'Note',       emoji: '📝' },
}

const PET_AVATARS = ['🐶', '🐱', '🐰', '🐹', '🐦', '🐟', '🐢', '🦎', '🐍', '🐠']

const PETS_KEY = 'pet_list'
const TASKS_KEY = 'pet_tasks'
const RECORDS_KEY = 'pet_records'

export default function PetCare() {
  const { toastSuccess } = useToast()
  const [pets, setPets] = useState<Pet[]>([])
  const [tasks, setTasks] = useState<CareTask[]>([])
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [activePet, setActivePet] = useState<string | null>(null)
  const [tab, setTab] = useState<'care' | 'health'>('care')
  const [showPetForm, setShowPetForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [petForm, setPetForm] = useState({ name: '', species: '', breed: '', birthdate: '', avatar: '🐶', notes: '' })
  const [taskForm, setTaskForm] = useState({ task: '', frequency: 'daily' as CareTask['frequency'], notes: '' })
  const [recForm, setRecForm] = useState({ date: new Date().toISOString().split('T')[0], type: 'vet' as HealthRecord['type'], description: '', weight: 0, cost: 0 })

  useEffect(() => {
    try {
      setPets(JSON.parse(localStorage.getItem(PETS_KEY) || '[]'))
      setTasks(JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'))
      setRecords(JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const savePets = (u: Pet[]) => { setPets(u); localStorage.setItem(PETS_KEY, JSON.stringify(u)) }
  const saveTasks = (u: CareTask[]) => { setTasks(u); localStorage.setItem(TASKS_KEY, JSON.stringify(u)) }
  const saveRecords = (u: HealthRecord[]) => { setRecords(u); localStorage.setItem(RECORDS_KEY, JSON.stringify(u)) }

  const addPet = () => {
    if (!petForm.name.trim()) return
    const p: Pet = { id: Date.now().toString(), ...petForm }
    savePets([...pets, p])
    setPetForm({ name: '', species: '', breed: '', birthdate: '', avatar: '🐶', notes: '' })
    setShowPetForm(false)
    setActivePet(p.id)
    toastSuccess(`${petForm.name} added! 🐾`)
  }

  const addTask = () => {
    if (!taskForm.task.trim() || !activePet) return
    const t: CareTask = { id: Date.now().toString(), petId: activePet, ...taskForm, lastDone: '' }
    saveTasks([...tasks, t])
    setTaskForm({ task: '', frequency: 'daily', notes: '' })
    setShowTaskForm(false)
    toastSuccess('Task added')
  }

  const addRecord = () => {
    if (!recForm.description.trim() || !activePet) return
    const r: HealthRecord = { id: Date.now().toString(), petId: activePet, ...recForm }
    saveRecords([r, ...records])
    setRecForm({ date: new Date().toISOString().split('T')[0], type: 'vet', description: '', weight: 0, cost: 0 })
    setShowRecordForm(false)
    toastSuccess('Record saved')
  }

  const markDone = (taskId: string) => {
    const today = new Date().toISOString().split('T')[0]
    saveTasks(tasks.map(t => t.id === taskId ? { ...t, lastDone: today } : t))
    toastSuccess('Task done! 🐾')
  }

  const isDue = (task: CareTask) => {
    if (!task.lastDone) return true
    const last = new Date(task.lastDone)
    const today = new Date()
    const diffDays = Math.floor((today.getTime() - last.getTime()) / 86400000)
    if (task.frequency === 'daily') return diffDays >= 1
    if (task.frequency === 'weekly') return diffDays >= 7
    if (task.frequency === 'monthly') return diffDays >= 30
    return false
  }

  const pet = pets.find(p => p.id === activePet)
  const petTasks = tasks.filter(t => t.petId === activePet)
  const petRecords = records.filter(r => r.petId === activePet)
  const dueTasks = petTasks.filter(isDue)

  const getAge = (birthdate: string) => {
    if (!birthdate) return ''
    const years = new Date().getFullYear() - new Date(birthdate).getFullYear()
    return years > 0 ? `${years}y` : 'pup'
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Heart className="w-7 h-7 text-pink-400" />
          Pet Care
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Care routines and health records for your pets.</p>
      </div>

      {/* Pet selector */}
      <div className="flex gap-2 flex-wrap">
        {pets.map(p => (
          <button key={p.id} onClick={() => setActivePet(p.id)}
            className={`px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 ${activePet === p.id ? 'bg-pink-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {p.avatar} {p.name}
            {p.birthdate && <span className="text-xs opacity-60">{getAge(p.birthdate)}</span>}
          </button>
        ))}
        <button onClick={() => setShowPetForm(true)} className="px-3 py-1.5 rounded-xl text-sm bg-slate-800 text-slate-500 hover:text-slate-300 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add pet
        </button>
      </div>

      {showPetForm && (
        <div className="game-card p-4 border border-pink-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Pet</h3>
          <div className="flex gap-2">
            <input value={petForm.name} onChange={e => setPetForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *" className="game-input flex-1" autoFocus />
            <input type="date" value={petForm.birthdate} onChange={e => setPetForm(f => ({ ...f, birthdate: e.target.value }))}
              className="game-input" />
          </div>
          <div className="flex gap-2">
            <input value={petForm.species} onChange={e => setPetForm(f => ({ ...f, species: e.target.value }))}
              placeholder="Species (dog, cat...)" className="game-input flex-1 text-sm" />
            <input value={petForm.breed} onChange={e => setPetForm(f => ({ ...f, breed: e.target.value }))}
              placeholder="Breed" className="game-input flex-1 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {PET_AVATARS.map(a => (
              <button key={a} onClick={() => setPetForm(f => ({ ...f, avatar: a }))}
                className={`text-xl p-1.5 rounded-lg ${petForm.avatar === a ? 'bg-pink-700/30 ring-1 ring-pink-500' : 'bg-slate-800'}`}>
                {a}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addPet} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-sm font-semibold">Add Pet</button>
            <button onClick={() => setShowPetForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {pet && (
        <>
          {/* Due tasks banner */}
          {dueTasks.length > 0 && (
            <div className="game-card p-3 border border-yellow-500/30 bg-yellow-500/5 flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">{dueTasks.length} task{dueTasks.length > 1 ? 's' : ''} due for {pet.name}</span>
            </div>
          )}

          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
            {(['care', 'health'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
                {t === 'care' ? `Care Tasks (${petTasks.length})` : `Health (${petRecords.length})`}
              </button>
            ))}
          </div>

          {tab === 'care' && (
            <div className="space-y-3">
              <button onClick={() => setShowTaskForm(true)}
                className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 justify-center">
                <Plus className="w-4 h-4" /> Add care task
              </button>
              {showTaskForm && (
                <div className="game-card p-4 border border-pink-500/20 space-y-2">
                  <input value={taskForm.task} onChange={e => setTaskForm(f => ({ ...f, task: e.target.value }))}
                    placeholder="Task (e.g., Feed, Walk, Brush)" className="game-input w-full" autoFocus />
                  <div className="flex gap-2">
                    <select value={taskForm.frequency} onChange={e => setTaskForm(f => ({ ...f, frequency: e.target.value as CareTask['frequency'] }))} className="game-input flex-1 text-sm">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="asneeded">As needed</option>
                    </select>
                    <input value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Notes" className="game-input flex-1 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addTask} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-xs font-semibold">Add Task</button>
                    <button onClick={() => setShowTaskForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-xs">Cancel</button>
                  </div>
                </div>
              )}
              {petTasks.map(t => (
                <div key={t.id} className={`game-card p-3 flex items-center gap-3 ${isDue(t) ? 'border-l-2 border-yellow-500/50' : ''}`}>
                  <button onClick={() => markDone(t.id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${!isDue(t) ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-green-500'}`}>
                    {!isDue(t) && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1">
                    <span className="text-sm text-white">{t.task}</span>
                    <div className="flex gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="capitalize">{t.frequency}</span>
                      {t.lastDone && <span>Last: {t.lastDone}</span>}
                      {isDue(t) && <span className="text-yellow-400">● Due</span>}
                    </div>
                  </div>
                  <button onClick={() => saveTasks(tasks.filter(x => x.id !== t.id))} className="text-slate-700 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'health' && (
            <div className="space-y-3">
              <button onClick={() => setShowRecordForm(true)}
                className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 justify-center">
                <Plus className="w-4 h-4" /> Add health record
              </button>
              {showRecordForm && (
                <div className="game-card p-4 border border-pink-500/20 space-y-2">
                  <div className="flex gap-2">
                    <input type="date" value={recForm.date} onChange={e => setRecForm(f => ({ ...f, date: e.target.value }))}
                      className="game-input text-sm" />
                    <select value={recForm.type} onChange={e => setRecForm(f => ({ ...f, type: e.target.value as HealthRecord['type'] }))} className="game-input text-sm flex-1">
                      {Object.entries(RECORD_TYPES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                    </select>
                  </div>
                  <input value={recForm.description} onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description *" className="game-input w-full" autoFocus />
                  <div className="flex gap-2">
                    {recForm.type === 'weight' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Weight:</span>
                        <input type="number" value={recForm.weight} min={0} step={0.1}
                          onChange={e => setRecForm(f => ({ ...f, weight: Number(e.target.value) }))}
                          className="game-input w-20 text-sm" />
                        <span className="text-xs text-slate-500">kg</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Cost:</span>
                      <input type="number" value={recForm.cost} min={0}
                        onChange={e => setRecForm(f => ({ ...f, cost: Number(e.target.value) }))}
                        className="game-input w-20 text-sm" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addRecord} className="flex-1 py-2 bg-pink-700 hover:bg-pink-600 text-white rounded-xl text-xs font-semibold">Save Record</button>
                    <button onClick={() => setShowRecordForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-xs">Cancel</button>
                  </div>
                </div>
              )}
              {petRecords.map(r => {
                const rt = RECORD_TYPES[r.type]
                return (
                  <div key={r.id} className="game-card p-3 flex gap-3">
                    <span className="text-xl">{rt.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{r.description}</span>
                        <span className="text-xs text-slate-500">{rt.label}</span>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-600 mt-0.5">
                        <span>{r.date}</span>
                        {r.weight && r.weight > 0 && <span>{r.weight}kg</span>}
                        {r.cost && r.cost > 0 && <span>${r.cost}</span>}
                      </div>
                    </div>
                    <button onClick={() => saveRecords(records.filter(x => x.id !== r.id))} className="text-slate-700 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {pets.length === 0 && !showPetForm && (
        <div className="text-center py-12 text-slate-500">
          <Heart className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Add your pets to start tracking their care.</p>
        </div>
      )}
    </div>
  )
}
