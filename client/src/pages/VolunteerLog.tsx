import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, Globe, Clock } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface VolunteerEntry {
  id: string
  date: string
  organization: string
  cause: string
  hours: number
  activity: string
  impact: string
  feeling: string
  createdAt: string
}

interface VolunteerOrg {
  id: string
  name: string
  cause: string
  contact: string
  notes: string
}

const CAUSES = ['Education', 'Environment', 'Hunger', 'Health', 'Animals', 'Arts', 'Community', 'Veterans', 'Children', 'Elderly', 'Other']
const STORAGE_KEY = 'volunteer_log'
const ORGS_KEY = 'volunteer_orgs'

export default function VolunteerLog() {
  const { toastSuccess } = useToast()
  const [entries, setEntries] = useState<VolunteerEntry[]>([])
  const [orgs, setOrgs] = useState<VolunteerOrg[]>([])
  const [tab, setTab] = useState<'log' | 'orgs'>('log')
  const [showForm, setShowForm] = useState(false)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], organization: '', cause: 'Community', hours: 2, activity: '', impact: '', feeling: '' })
  const [orgForm, setOrgForm] = useState({ name: '', cause: 'Community', contact: '', notes: '' })

  useEffect(() => {
    try {
      setEntries(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
      setOrgs(JSON.parse(localStorage.getItem(ORGS_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveEntries = (u: VolunteerEntry[]) => { setEntries(u); localStorage.setItem(STORAGE_KEY, JSON.stringify(u)) }
  const saveOrgs = (u: VolunteerOrg[]) => { setOrgs(u); localStorage.setItem(ORGS_KEY, JSON.stringify(u)) }

  const submit = () => {
    if (!form.organization.trim() || !form.activity.trim()) return
    const e: VolunteerEntry = { id: Date.now().toString(), ...form, createdAt: new Date().toISOString() }
    saveEntries([e, ...entries])
    setForm({ date: new Date().toISOString().split('T')[0], organization: '', cause: 'Community', hours: 2, activity: '', impact: '', feeling: '' })
    setShowForm(false)
    toastSuccess(`${form.hours}h logged for ${form.organization} 💙`)
  }

  const addOrg = () => {
    if (!orgForm.name.trim()) return
    const o: VolunteerOrg = { id: Date.now().toString(), ...orgForm }
    saveOrgs([...orgs, o])
    setOrgForm({ name: '', cause: 'Community', contact: '', notes: '' })
    setShowOrgForm(false)
    toastSuccess('Organization saved')
  }

  const totalHours = entries.reduce((s, e) => s + e.hours, 0)
  const uniqueOrgs = new Set(entries.map(e => e.organization)).size
  const causeCounts = entries.reduce((acc, e) => ({ ...acc, [e.cause]: (acc[e.cause] || 0) + e.hours }), {} as Record<string, number>)
  const topCause = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <Heart className="w-7 h-7 text-red-400" />
          Volunteer Log
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track your service and impact in the community.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{totalHours}</div>
          <div className="text-xs text-slate-500">Hours Served</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-2xl font-bold text-white">{uniqueOrgs}</div>
          <div className="text-xs text-slate-500">Organizations</div>
        </div>
        <div className="game-card p-3 text-center">
          <div className="text-lg font-bold text-green-400 truncate">{topCause || '—'}</div>
          <div className="text-xs text-slate-500">Top Cause</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
        {(['log', 'orgs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
            {t === 'log' ? `Log (${entries.length})` : `Organizations (${orgs.length})`}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <>
          <button onClick={() => setShowForm(true)}
            className="w-full py-2.5 border border-dashed border-red-700/50 rounded-xl text-red-400 hover:border-red-600 text-sm flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Log volunteer time
          </button>

          {showForm && (
            <div className="game-card p-4 border border-red-500/20 space-y-3">
              <h3 className="text-sm font-semibold text-white">New Entry</h3>
              <div className="flex gap-2">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm" />
                <input type="number" value={form.hours} min={0.5} step={0.5}
                  onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))}
                  className="game-input w-20 text-sm text-center" />
                <span className="flex items-center text-xs text-slate-500">hours</span>
              </div>
              <div className="flex gap-2">
                <input value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))}
                  placeholder="Organization" className="game-input flex-1 text-sm" autoFocus
                  list="org-list" />
                <datalist id="org-list">
                  {orgs.map(o => <option key={o.id} value={o.name} />)}
                </datalist>
                <select value={form.cause} onChange={e => setForm(f => ({ ...f, cause: e.target.value }))} className="game-input text-sm">
                  {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input value={form.activity} onChange={e => setForm(f => ({ ...f, activity: e.target.value }))}
                placeholder="What did you do?" className="game-input w-full text-sm" />
              <textarea value={form.impact} onChange={e => setForm(f => ({ ...f, impact: e.target.value }))}
                placeholder="What impact did you make?" className="game-input w-full h-16 resize-none text-sm" />
              <textarea value={form.feeling} onChange={e => setForm(f => ({ ...f, feeling: e.target.value }))}
                placeholder="How did it feel?" className="game-input w-full h-12 resize-none text-sm" />
              <div className="flex gap-2">
                <button onClick={submit} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Save</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {entries.map(e => (
              <div key={e.id} className="game-card p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{e.organization}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{e.cause}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{e.activity} · {e.date}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span className="text-xs text-yellow-400 font-medium">{e.hours}h</span>
                  </div>
                  {e.impact && <p className="text-xs text-slate-400 mt-1 italic">{e.impact}</p>}
                </div>
                <button onClick={() => saveEntries(entries.filter(x => x.id !== e.id))} className="p-1 text-slate-700 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {entries.length === 0 && !showForm && (
              <div className="text-center py-12 text-slate-500">
                <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Start logging your volunteer hours.</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'orgs' && (
        <div className="space-y-3">
          <button onClick={() => setShowOrgForm(true)}
            className="w-full py-2.5 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 justify-center">
            <Plus className="w-4 h-4" /> Add organization
          </button>
          {showOrgForm && (
            <div className="game-card p-4 border border-red-500/20 space-y-2">
              <div className="flex gap-2">
                <input value={orgForm.name} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Organization name" className="game-input flex-1" autoFocus />
                <select value={orgForm.cause} onChange={e => setOrgForm(f => ({ ...f, cause: e.target.value }))} className="game-input text-sm">
                  {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input value={orgForm.contact} onChange={e => setOrgForm(f => ({ ...f, contact: e.target.value }))}
                placeholder="Contact / website" className="game-input w-full text-sm" />
              <textarea value={orgForm.notes} onChange={e => setOrgForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes..." className="game-input w-full h-14 resize-none text-sm" />
              <div className="flex gap-2">
                <button onClick={addOrg} className="flex-1 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Add</button>
                <button onClick={() => setShowOrgForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
          {orgs.map(o => (
            <div key={o.id} className="game-card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 text-lg">💙</div>
              <div className="flex-1">
                <span className="font-medium text-white">{o.name}</span>
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{o.cause}</span>
                {o.contact && <p className="text-xs text-blue-400 mt-0.5">{o.contact}</p>}
                {o.notes && <p className="text-xs text-slate-500 mt-0.5">{o.notes}</p>}
                <p className="text-xs text-slate-600 mt-0.5">{entries.filter(e => e.organization === o.name).reduce((s, e) => s + e.hours, 0)}h total</p>
              </div>
              <button onClick={() => saveOrgs(orgs.filter(x => x.id !== o.id))} className="p-1 text-slate-700 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {orgs.length === 0 && !showOrgForm && (
            <div className="text-center py-10 text-slate-500 text-sm">No organizations tracked yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
