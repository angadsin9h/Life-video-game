import { useState, useEffect } from 'react'
import { Utensils, Plus, Trash2, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink'
type Cuisine = 'italian' | 'asian' | 'mexican' | 'american' | 'mediterranean' | 'indian' | 'french' | 'other'
type Difficulty = 'easy' | 'medium' | 'hard'

interface Recipe {
  id: string
  name: string
  mealType: MealType
  cuisine: Cuisine
  difficulty: Difficulty
  prepTime: number
  cookTime: number
  servings: number
  ingredients: string
  instructions: string
  notes: string
  rating: number
  madeCount: number
  lastMade: string
  isFavorite: boolean
  createdAt: string
}

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', color: '#f59e0b' },
  lunch:     { label: 'Lunch',     emoji: '🥗', color: '#22c55e' },
  dinner:    { label: 'Dinner',    emoji: '🍽️', color: '#6366f1' },
  snack:     { label: 'Snack',     emoji: '🍎', color: '#f97316' },
  dessert:   { label: 'Dessert',   emoji: '🍰', color: '#ec4899' },
  drink:     { label: 'Drink',     emoji: '🥤', color: '#3b82f6' },
}

const CUISINE_CONFIG: Record<Cuisine, { label: string }> = {
  italian:      { label: 'Italian'       },
  asian:        { label: 'Asian'         },
  mexican:      { label: 'Mexican'       },
  american:     { label: 'American'      },
  mediterranean:{ label: 'Mediterranean' },
  indian:       { label: 'Indian'        },
  french:       { label: 'French'        },
  other:        { label: 'Other'         },
}

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: '#22c55e' },
  medium: { label: 'Medium', color: '#f59e0b' },
  hard:   { label: 'Hard',   color: '#ef4444' },
}

const STORAGE_KEY = 'recipe_journal'

export default function RecipeJournal() {
  const { toastSuccess } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filterMeal, setFilterMeal] = useState<string>('all')
  const [filterFav, setFilterFav] = useState(false)
  const [form, setForm] = useState<Omit<Recipe, 'id' | 'createdAt' | 'madeCount'>>({
    name: '', mealType: 'dinner', cuisine: 'other', difficulty: 'easy',
    prepTime: 15, cookTime: 30, servings: 2, ingredients: '', instructions: '',
    notes: '', rating: 0, lastMade: '', isFavorite: false,
  })

  useEffect(() => {
    try { setRecipes(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')) } catch { /**/ }
  }, [])

  const save = (u: Recipe[]) => { setRecipes(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.name.trim()) return
    const r: Recipe = { id: Date.now().toString(), ...form, madeCount: 0, createdAt: new Date().toISOString() }
    save([r, ...recipes])
    setForm({ name: '', mealType: 'dinner', cuisine: 'other', difficulty: 'easy', prepTime: 15, cookTime: 30, servings: 2, ingredients: '', instructions: '', notes: '', rating: 0, lastMade: '', isFavorite: false })
    setShowForm(false)
    toastSuccess(`"${form.name}" saved 🍳`)
  }

  const markMade = (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    save(recipes.map(r => r.id === id ? { ...r, madeCount: r.madeCount + 1, lastMade: today } : r))
    toastSuccess('Recipe cooked! 👨‍🍳')
  }

  const filtered = recipes.filter(r => {
    if (filterMeal !== 'all' && r.mealType !== filterMeal) return false
    if (filterFav && !r.isFavorite) return false
    return true
  })

  const totalCooked = recipes.reduce((s, r) => s + r.madeCount, 0)
  const favorites = recipes.filter(r => r.isFavorite).length

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Utensils className="w-7 h-7 text-orange-400" />
            Recipe Journal
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Save and track your favorite recipes.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="game-card p-3">
          <div className="text-xl font-bold text-white">{recipes.length}</div>
          <div className="text-xs text-slate-500">Recipes</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-orange-400">{totalCooked}</div>
          <div className="text-xs text-slate-500">Times Cooked</div>
        </div>
        <div className="game-card p-3">
          <div className="text-xl font-bold text-yellow-400">{favorites}</div>
          <div className="text-xs text-slate-500">Favorites</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select value={filterMeal} onChange={e => setFilterMeal(e.target.value)} className="game-input text-sm flex-1">
          <option value="all">All meals</option>
          {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG.dinner][]).map(([k, m]) => (
            <option key={k} value={k}>{m.emoji} {m.label}</option>
          ))}
        </select>
        <button onClick={() => setFilterFav(!filterFav)}
          className={`px-3 py-1.5 rounded-xl text-sm border ${filterFav ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : 'border-slate-700 text-slate-500'}`}>
          ★ Favorites
        </button>
      </div>

      {showForm && (
        <div className="game-card p-4 border border-orange-500/20 space-y-3">
          <h3 className="text-sm font-semibold text-white">Add Recipe</h3>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Recipe name *" className="game-input w-full" autoFocus />
          <div className="flex gap-2">
            <select value={form.mealType} onChange={e => setForm(f => ({ ...f, mealType: e.target.value as MealType }))} className="game-input text-sm flex-1">
              {(Object.entries(MEAL_CONFIG) as [MealType, typeof MEAL_CONFIG.dinner][]).map(([k, m]) => (
                <option key={k} value={k}>{m.emoji} {m.label}</option>
              ))}
            </select>
            <select value={form.cuisine} onChange={e => setForm(f => ({ ...f, cuisine: e.target.value as Cuisine }))} className="game-input text-sm flex-1">
              {(Object.entries(CUISINE_CONFIG) as [Cuisine, typeof CUISINE_CONFIG.italian][]).map(([k, c]) => (
                <option key={k} value={k}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {(Object.entries(DIFF_CONFIG) as [Difficulty, typeof DIFF_CONFIG.easy][]).map(([k, d]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, difficulty: k }))}
                className={`flex-1 py-1.5 rounded-xl text-xs font-medium ${form.difficulty === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                style={form.difficulty === k ? { background: d.color + '30', color: d.color } : {}}>
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-slate-500">Prep (min)</label>
              <input type="number" value={form.prepTime} min={0} onChange={e => setForm(f => ({ ...f, prepTime: Number(e.target.value) }))} className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500">Cook (min)</label>
              <input type="number" value={form.cookTime} min={0} onChange={e => setForm(f => ({ ...f, cookTime: Number(e.target.value) }))} className="game-input w-full text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500">Servings</label>
              <input type="number" value={form.servings} min={1} onChange={e => setForm(f => ({ ...f, servings: Number(e.target.value) }))} className="game-input w-full text-sm" />
            </div>
          </div>
          <textarea value={form.ingredients} onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
            placeholder="Ingredients (one per line)" className="game-input w-full h-20 resize-none text-sm" />
          <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            placeholder="Instructions..." className="game-input w-full h-20 resize-none text-sm" />
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Tips & notes" className="game-input w-full h-12 resize-none text-sm" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.isFavorite} onChange={e => setForm(f => ({ ...f, isFavorite: e.target.checked }))} className="accent-yellow-400" />
              Add to favorites
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Rating:</span>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setForm(f => ({ ...f, rating: n }))}
                  className={`text-lg ${form.rating >= n ? 'text-yellow-400' : 'text-slate-700'}`}>★</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 py-2 bg-orange-700 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Save Recipe</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const m = MEAL_CONFIG[r.mealType]
          const d = DIFF_CONFIG[r.difficulty]
          const isExp = expanded === r.id
          return (
            <div key={r.id} className="game-card overflow-hidden" style={{ borderLeft: `3px solid ${m.color}` }}>
              <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : r.id)}>
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{r.name}</span>
                    {r.isFavorite && <span className="text-yellow-400 text-xs">★</span>}
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: d.color + '20', color: d.color }}>{d.label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{CUISINE_CONFIG[r.cuisine].label} · {r.prepTime + r.cookTime}min · {r.servings} servings</p>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <div>Made {r.madeCount}×</div>
                  {r.rating > 0 && <div className="text-yellow-400">{'★'.repeat(r.rating)}</div>}
                </div>
                {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
              </div>
              {isExp && (
                <div className="border-t border-slate-800 p-3 space-y-2">
                  {r.ingredients && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Ingredients:</p>
                      <p className="text-xs text-slate-400 whitespace-pre-line">{r.ingredients}</p>
                    </div>
                  )}
                  {r.instructions && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Instructions:</p>
                      <p className="text-xs text-slate-400 whitespace-pre-line">{r.instructions}</p>
                    </div>
                  )}
                  {r.notes && <p className="text-xs text-teal-400 italic">💡 {r.notes}</p>}
                  {r.lastMade && <p className="text-xs text-slate-600">Last made: {r.lastMade}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => markMade(r.id)} className="flex-1 py-1.5 bg-orange-700/30 hover:bg-orange-700/50 text-orange-400 rounded-xl text-xs">
                      👨‍🍳 Mark as Cooked
                    </button>
                    <button onClick={() => save(recipes.map(x => x.id === r.id ? { ...x, isFavorite: !x.isFavorite } : x))}
                      className="px-3 py-1.5 bg-slate-700/50 text-yellow-400 rounded-xl text-xs">
                      {r.isFavorite ? '★' : '☆'}
                    </button>
                    <button onClick={() => save(recipes.filter(x => x.id !== r.id))} className="text-xs text-slate-700 hover:text-red-400 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && !showForm && (
          <div className="text-center py-12 text-slate-500">
            <Utensils className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Start adding recipes to your personal cookbook.</p>
          </div>
        )}
      </div>
    </div>
  )
}
