import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, Globe, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface TravelEntry {
  id: string
  destination: string
  country: string
  startDate: string
  endDate: string
  purpose: 'leisure' | 'work' | 'adventure' | 'family' | 'solo'
  highlight: string
  lesson: string
  rating: number
  photos: string
  cost: number
  currency: string
  wouldReturn: boolean
  createdAt: string
}

interface BucketDestination {
  id: string
  place: string
  country: string
  why: string
}

const PURPOSE_CONFIG = {
  leisure:   { label: 'Leisure',   emoji: '🏖️', color: '#22c55e' },
  work:      { label: 'Work',      emoji: '💼', color: '#3b82f6' },
  adventure: { label: 'Adventure', emoji: '🏔️', color: '#f97316' },
  family:    { label: 'Family',    emoji: '👨‍👩‍👧', color: '#ec4899' },
  solo:      { label: 'Solo',      emoji: '🧭', color: '#a855f7' },
}

const STORAGE_KEY = 'travel_log'
const BUCKET_KEY = 'travel_bucket'

export default function TravelLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<TravelEntry[]>([])
  const [bucket, setBucket] = useState<BucketDestination[]>([])
  const [tab, setTab] = useState<'log' | 'bucket'>('log')
  const [showForm, setShowForm] = useState(false)
  const [showBucketForm, setShowBucketForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<TravelEntry, 'id' | 'createdAt'>>({
    destination: '', country: '', startDate: '', endDate: '',
    purpose: 'leisure', highlight: '', lesson: '', rating: 5, photos: '',
    cost: 0, currency: 'USD', wouldReturn: true,
  })
  const [bForm, setBForm] = useState({ place: '', country: '', why: '' })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setBucket(JSON.parse(localStorage.getItem(BUCKET_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveEntries = (u: TravelEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveBucket = (u: BucketDestination[]) => { setBucket(u); localStorage.setItem(BUCKET_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.destination.trim()) return
    const e: TravelEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveEntries([e, ...entries])
    setForm({ destination: '', country: '', startDate: '', endDate: '', purpose: 'leisure', highlight: '', lesson: '', rating: 5, photos: '', cost: 0, currency: 'USD', wouldReturn: true })
    setShowForm(false)
    toastSuccess(`${form.destination} logged 🌍`)
  }

  const addBucket = () => {
    if (!bForm.place.trim()) return
    saveBucket([...bucket, { id: Date.now().toString(), ...bForm }])
    setBForm({ place: '', country: '', why: '' })
    setShowBucketForm(false)
    toastSuccess('Added to travel bucket list!')
  }

  const countries = new Set(entries.map(e => e.country).filter(Boolean)).size
  const totalDays = entries.reduce((s, e) => {
    if (!e.startDate || !e.endDate) return s
    return s + Math.max(1, Math.ceil((new Date(e.endDate).getTime() - new Date(e.startDate).getTime()) / 86400000))
  }, 0)

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
            <Globe className="w-7 h-7 text-green-400" />
            Travel Log
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Chronicle your adventures around the world.</p>
        </div>
        <button onClick={() => { setTab('log'); setShowForm(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">
          <Plus className="w-4 h-4" /> Log Trip
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{entries.length}</div>
          <div className="text-xs text-slate-500">Trips Taken</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{countries}</div>
          <div className="text-xs text-slate-500">Countries</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">{totalDays}</div>
          <div className="text-xs text-slate-500">Days Traveled</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['log', 'bucket'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
            {t === 'log' ? `Trips (${entries.length})` : `Bucket List (${bucket.length})`}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <>
          {showForm && (
            <div className="game-card p-4 border border-green-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">Log a Trip</h3>
              <div className="flex gap-2">
                <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                  placeholder="Destination *" className="game-input flex-1" autoFocus />
                <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="Country" className="game-input w-32 text-sm" />
              </div>
              <div className="flex gap-2">
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  className="game-input flex-1 text-sm" />
                <span className="flex items-center text-xs text-slate-500">→</span>
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  className="game-input flex-1 text-sm" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(PURPOSE_CONFIG) as [TravelEntry['purpose'], typeof PURPOSE_CONFIG.leisure][]).map(([k, p]) => (
                  <button key={k} onClick={() => setForm(f => ({ ...f, purpose: k }))}
                    className={`px-2.5 py-1 rounded-full text-xs ${form.purpose === k ? 'text-white' : 'bg-slate-800 text-slate-500'}`}
                    style={form.purpose === k ? { background: p.color + '30', color: p.color } : {}}>
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
              <textarea value={form.highlight} onChange={e => setForm(f => ({ ...f, highlight: e.target.value }))}
                placeholder="Best moment / highlight" className="game-input w-full h-16 resize-none text-sm" />
              <textarea value={form.lesson} onChange={e => setForm(f => ({ ...f, lesson: e.target.value }))}
                placeholder="What did this trip teach you?" className="game-input w-full h-14 resize-none text-sm" />
              <div className="flex gap-2 items-center">
                <span className="text-xs text-slate-500">Rating: {form.rating}/10</span>
                <input type="range" min={1} max={10} value={form.rating}
                  onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))}
                  className="flex-1 h-1 accent-yellow-400" />
                <div className="flex items-center gap-1.5">
                  <input type="number" value={form.cost} min={0}
                    onChange={e => setForm(f => ({ ...f, cost: Number(e.target.value) }))}
                    placeholder="Cost" className="game-input w-24 text-sm" />
                  <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="game-input w-14 text-sm text-center" placeholder="USD" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input type="checkbox" checked={form.wouldReturn} onChange={e => setForm(f => ({ ...f, wouldReturn: e.target.checked }))}
                  className="rounded" />
                Would return
              </label>
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Save Trip</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {entries.map(e => {
              const p = PURPOSE_CONFIG[e.purpose]
              const isExp = expanded === e.id
              return (
                <div key={e.id} className="game-card overflow-hidden">
                  <div className="p-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(isExp ? null : e.id)}>
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{e.destination}</span>
                        {e.country && <span className="text-xs text-slate-500">{e.country}</span>}
                        <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(e.rating / 2))}</span>
                      </div>
                      <span className="text-xs text-slate-600">{e.startDate}{e.endDate && ` → ${e.endDate}`}</span>
                    </div>
                    {isExp ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                  </div>
                  {isExp && (
                    <div className="border-t border-slate-800 p-3 space-y-2">
                      {e.highlight && <p className="text-sm text-slate-300">✨ {e.highlight}</p>}
                      {e.lesson && <p className="text-sm text-slate-400 italic">💡 {e.lesson}</p>}
                      <div className="flex gap-3 text-xs text-slate-500">
                        {e.cost > 0 && <span>💰 {e.currency}{e.cost.toLocaleString()}</span>}
                        {e.wouldReturn && <span>🔁 Would return</span>}
                        <span>⭐ {e.rating}/10</span>
                      </div>
                      <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))}
                        className="flex items-center gap-1 text-xs text-slate-700 hover:text-red-400">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
            {entries.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-500">
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Start logging your travels!</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'bucket' && (
        <div className="space-y-3">
          <button onClick={() => setShowBucketForm(true)}
            className="w-full py-2.5 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Add dream destination
          </button>
          {showBucketForm && (
            <div className="game-card p-4 border border-green-500/20 space-y-2">
              <div className="flex gap-2">
                <input value={bForm.place} onChange={e => setBForm(f => ({ ...f, place: e.target.value }))}
                  placeholder="Place / City" className="game-input flex-1" autoFocus />
                <input value={bForm.country} onChange={e => setBForm(f => ({ ...f, country: e.target.value }))}
                  placeholder="Country" className="game-input w-28 text-sm" />
              </div>
              <input value={bForm.why} onChange={e => setBForm(f => ({ ...f, why: e.target.value }))}
                placeholder="Why do you want to go?" className="game-input w-full text-sm" />
              <div className="flex gap-2">
                <button onClick={addBucket} className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl text-sm font-semibold">Add</button>
                <button onClick={() => setShowBucketForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          {bucket.map((b, i) => (
            <div key={b.id} className="game-card p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 font-bold text-sm flex items-center justify-center">{i + 1}</div>
              <div className="flex-1">
                <div className="font-medium text-white">{b.place}{b.country && `, ${b.country}`}</div>
                {b.why && <p className="text-xs text-slate-500 mt-0.5">{b.why}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { saveBucket(bucket.filter(x => x.id !== b.id)); saveEntries([{ id: Date.now().toString(), destination: b.place, country: b.country, startDate: '', endDate: '', purpose: 'leisure', highlight: '', lesson: '', rating: 5, photos: '', cost: 0, currency: 'USD', wouldReturn: true, createdAt: new Date().toISOString() }, ...entries]); toastSuccess('Marked as visited!') }}
                  className="text-xs px-2 py-1 bg-green-700/30 text-green-400 rounded-lg hover:bg-green-700/50">
                  Visited!
                </button>
                <button onClick={() => saveBucket(bucket.filter(x => x.id !== b.id))} className="p-1 text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {bucket.length === 0 && !showBucketForm && (
            <div className="text-center py-10 text-slate-500 text-sm">
              <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
              Where do you dream of going?
            </div>
          )}
        </div>
      )}
    </div>
  )
}
