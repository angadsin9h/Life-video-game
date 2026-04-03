import { Plus, Trash2 } from 'lucide-react'

export interface Task {
  category: string
  task_name: string
  duration_minutes: number
  notes: string
}

interface TaskFormProps {
  tasks: Task[]
  onChange: (tasks: Task[]) => void
}

const CATEGORIES = [
  { value: 'health', label: '❤️ Health', suggestions: ['Morning workout', 'Yoga session', 'Run 5K', 'Meditation', 'Healthy meal prep', 'Sleep 8 hours'] },
  { value: 'mind', label: '🧠 Mind', suggestions: ['Read book', 'Journaling', 'Meditation', 'Learn new skill', 'Brain training', 'Deep thinking session'] },
  { value: 'work', label: '💼 Work', suggestions: ['Deep work session', 'Email management', 'Project planning', 'Team meeting', 'Code review', 'Report writing'] },
  { value: 'social', label: '👥 Social', suggestions: ['Call a friend', 'Family dinner', 'Networking event', 'Help someone', 'Community activity'] },
  { value: 'growth', label: '🚀 Growth', suggestions: ['Online course', 'New skill practice', 'Read industry news', 'Set goals', 'Review progress', 'Side project'] },
]

const emptyTask = (): Task => ({ category: 'health', task_name: '', duration_minutes: 30, notes: '' })

export default function TaskForm({ tasks, onChange }: TaskFormProps) {
  const addTask = () => onChange([...tasks, emptyTask()])
  const removeTask = (i: number) => onChange(tasks.filter((_, idx) => idx !== i))
  const updateTask = (i: number, field: keyof Task, value: string | number) => {
    const updated = tasks.map((t, idx) => idx === i ? { ...t, [field]: value } : t)
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, i) => {
        const catData = CATEGORIES.find(c => c.value === task.category) || CATEGORIES[0]
        return (
          <div key={i} className="game-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-violet-400">Task #{i + 1}</span>
              {tasks.length > 1 && (
                <button onClick={() => removeTask(i)} className="text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  className="game-input w-full"
                  value={task.category}
                  onChange={e => updateTask(i, 'category', e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  className="game-input w-full"
                  value={task.duration_minutes}
                  onChange={e => updateTask(i, 'duration_minutes', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Task Name</label>
              <input
                type="text"
                className="game-input w-full"
                value={task.task_name}
                onChange={e => updateTask(i, 'task_name', e.target.value)}
                placeholder="What did you do?"
                list={`suggestions-${i}`}
              />
              <datalist id={`suggestions-${i}`}>
                {catData.suggestions.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Notes (optional)</label>
              <input
                type="text"
                className="game-input w-full"
                value={task.notes}
                onChange={e => updateTask(i, 'notes', e.target.value)}
                placeholder="Any notes..."
              />
            </div>
          </div>
        )
      })}
      <button onClick={addTask} className="game-btn-secondary flex items-center gap-2 w-full justify-center">
        <Plus className="w-4 h-4" /> Add Task
      </button>
    </div>
  )
}
