import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2, Check, X, Star, RefreshCw } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

interface Language {
  id: string
  name: string
  level: 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'fluent'
  targetDate: string
  dailyGoal: number
  notes: string
}

interface VocabWord {
  id: string
  languageId: string
  word: string
  translation: string
  example: string
  mastered: boolean
  reviewCount: number
  createdAt: string
}

interface StudySession {
  id: string
  languageId: string
  date: string
  minutes: number
  activity: string
}

const LEVELS = ['beginner', 'elementary', 'intermediate', 'advanced', 'fluent'] as const
const LEVEL_COLORS: Record<string, string> = {
  beginner: '#94a3b8', elementary: '#3b82f6', intermediate: '#f59e0b', advanced: '#22c55e', fluent: '#a855f7',
}

const ACTIVITIES = ['Duolingo', 'Anki', 'Reading', 'Writing', 'Speaking', 'Listening', 'Grammar', 'Vocabulary', 'Watching TV', 'Conversation']

const LANG_KEY = 'lang_learning'
const VOCAB_KEY = 'lang_vocab'
const SESSION_KEY = 'lang_sessions'

export default function LanguageLearning() {
  const { toastSuccess } = useToast()
  const [languages, setLanguages] = useState<Language[]>([])
  const [vocab, setVocab] = useState<VocabWord[]>([])
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [activeLang, setActiveLang] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'vocab' | 'log'>('overview')
  const [showLangForm, setShowLangForm] = useState(false)
  const [showVocabForm, setShowVocabForm] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [langForm, setLangForm] = useState({ name: '', level: 'beginner' as Language['level'], targetDate: '', dailyGoal: 15, notes: '' })
  const [vocabForm, setVocabForm] = useState({ word: '', translation: '', example: '' })
  const [sessionForm, setSessionForm] = useState({ date: new Date().toISOString().split('T')[0], minutes: 20, activity: 'Vocabulary' })
  const [quizMode, setQuizMode] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  useEffect(() => {
    try {
      setLanguages(JSON.parse(localStorage.getItem(LANG_KEY) || '[]'))
      setVocab(JSON.parse(localStorage.getItem(VOCAB_KEY) || '[]'))
      setSessions(JSON.parse(localStorage.getItem(SESSION_KEY) || '[]'))
    } catch { /**/ }
  }, [])

  const saveLangs = (u: Language[]) => { setLanguages(u); localStorage.setItem(LANG_KEY, JSON.stringify(u)) }
  const saveVocab = (u: VocabWord[]) => { setVocab(u); localStorage.setItem(VOCAB_KEY, JSON.stringify(u)) }
  const saveSessions = (u: StudySession[]) => { setSessions(u); localStorage.setItem(SESSION_KEY, JSON.stringify(u)) }

  const addLang = () => {
    if (!langForm.name.trim()) return
    const l: Language = { id: Date.now().toString(), ...langForm }
    saveLangs([...languages, l])
    setLangForm({ name: '', level: 'beginner', targetDate: '', dailyGoal: 15, notes: '' })
    setShowLangForm(false)
    setActiveLang(l.id)
    toastSuccess(`${langForm.name} added! 🗣️`)
  }

  const addVocab = () => {
    if (!vocabForm.word.trim() || !activeLang) return
    const v: VocabWord = { id: Date.now().toString(), languageId: activeLang, ...vocabForm, mastered: false, reviewCount: 0, createdAt: new Date().toISOString() }
    saveVocab([...vocab, v])
    setVocabForm({ word: '', translation: '', example: '' })
    toastSuccess('Word added!')
  }

  const logSession = () => {
    if (!activeLang) return
    const s: StudySession = { id: Date.now().toString(), languageId: activeLang, ...sessionForm }
    saveSessions([s, ...sessions])
    setShowSessionForm(false)
    toastSuccess(`${sessionForm.minutes}m logged!`)
  }

  const markVocab = (id: string, mastered: boolean) => {
    saveVocab(vocab.map(v => v.id === id ? { ...v, mastered, reviewCount: v.reviewCount + 1 } : v))
    if (quizMode) {
      const langVocab = vocab.filter(v => v.languageId === activeLang && !v.mastered)
      if (quizIdx < langVocab.length - 1) { setQuizIdx(q => q + 1); setShowAnswer(false) }
      else { setQuizMode(false); toastSuccess('Quiz complete! 🎉') }
    }
  }

  const lang = languages.find(l => l.id === activeLang)
  const langVocab = vocab.filter(v => v.languageId === activeLang)
  const langSessions = sessions.filter(s => s.languageId === activeLang)
  const totalMinutes = langSessions.reduce((s, x) => s + x.minutes, 0)
  const unmasteredVocab = langVocab.filter(v => !v.mastered)
  const quizWord = unmasteredVocab[quizIdx % Math.max(unmasteredVocab.length, 1)]

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Orbitron, monospace' }}>
          <BookOpen className="w-7 h-7 text-blue-400" />
          Language Learning
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Track your language journey and build vocabulary.</p>
      </div>

      {/* Language selector */}
      <div className="flex gap-2 flex-wrap">
        {languages.map(l => (
          <button key={l.id} onClick={() => setActiveLang(l.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${activeLang === l.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            {l.name}
            <span className="ml-1.5 text-xs opacity-60" style={{ color: LEVEL_COLORS[l.level] }}>● {l.level}</span>
          </button>
        ))}
        <button onClick={() => setShowLangForm(true)}
          className="px-3 py-1.5 rounded-xl text-sm bg-slate-800 text-slate-500 hover:text-slate-300 flex items-center gap-1">
          <Plus className="w-3 h-3" /> Add language
        </button>
      </div>

      {showLangForm && (
        <div className="game-card p-4 border border-blue-500/20 space-y-2">
          <div className="flex gap-2">
            <input value={langForm.name} onChange={e => setLangForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Language (e.g., Spanish)" className="game-input flex-1" autoFocus />
            <select value={langForm.level} onChange={e => setLangForm(f => ({ ...f, level: e.target.value as Language['level'] }))} className="game-input text-sm">
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input type="date" value={langForm.targetDate} onChange={e => setLangForm(f => ({ ...f, targetDate: e.target.value }))}
              className="game-input text-sm flex-1" placeholder="Target fluency date" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Daily:</span>
              <input type="number" value={langForm.dailyGoal} min={5}
                onChange={e => setLangForm(f => ({ ...f, dailyGoal: Number(e.target.value) }))}
                className="game-input w-16 text-sm text-center" />
              <span className="text-xs text-slate-500">min</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addLang} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">Add</button>
            <button onClick={() => setShowLangForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
          </div>
        </div>
      )}

      {lang && (
        <>
          {/* Lang stats */}
          <div className="game-card p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-white">{lang.name}</span>
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: LEVEL_COLORS[lang.level] + '20', color: LEVEL_COLORS[lang.level] }}>{lang.level}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowSessionForm(true)}
                  className="text-xs px-3 py-1.5 bg-blue-700/30 text-blue-400 rounded-lg hover:bg-blue-700/50">+ Log session</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-lg font-bold text-white">{langVocab.length}</div><div className="text-xs text-slate-500">Words</div></div>
              <div><div className="text-lg font-bold text-green-400">{langVocab.filter(v => v.mastered).length}</div><div className="text-xs text-slate-500">Mastered</div></div>
              <div><div className="text-lg font-bold text-blue-400">{Math.round(totalMinutes / 60)}h</div><div className="text-xs text-slate-500">Study time</div></div>
            </div>
          </div>

          {showSessionForm && (
            <div className="game-card p-4 border border-blue-500/20 space-y-2">
              <div className="flex gap-2">
                <input type="date" value={sessionForm.date} onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))}
                  className="game-input text-sm" />
                <input type="number" value={sessionForm.minutes} min={1}
                  onChange={e => setSessionForm(f => ({ ...f, minutes: Number(e.target.value) }))}
                  className="game-input w-20 text-sm text-center" />
                <span className="flex items-center text-xs text-slate-500">min</span>
              </div>
              <select value={sessionForm.activity} onChange={e => setSessionForm(f => ({ ...f, activity: e.target.value }))} className="game-input w-full text-sm">
                {ACTIVITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={logSession} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold">Log</button>
                <button onClick={() => setShowSessionForm(false)} className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
            {(['overview', 'vocab', 'log'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'vocab' && (
            <div className="space-y-3">
              {unmasteredVocab.length > 0 && !quizMode && (
                <button onClick={() => { setQuizMode(true); setQuizIdx(0); setShowAnswer(false) }}
                  className="w-full py-2 border border-dashed border-yellow-600/50 rounded-xl text-yellow-400 text-sm flex items-center gap-2 justify-center hover:border-yellow-500">
                  <RefreshCw className="w-4 h-4" /> Quiz me ({unmasteredVocab.length} words)
                </button>
              )}

              {quizMode && quizWord && (
                <div className="game-card p-6 text-center border border-yellow-500/30">
                  <p className="text-xs text-slate-500 mb-2">What does this mean?</p>
                  <p className="text-2xl font-bold text-white mb-4">{quizWord.word}</p>
                  {showAnswer ? (
                    <>
                      <p className="text-lg text-yellow-400 mb-1">{quizWord.translation}</p>
                      {quizWord.example && <p className="text-xs text-slate-500 italic mb-4">"{quizWord.example}"</p>}
                      <div className="flex gap-2">
                        <button onClick={() => markVocab(quizWord.id, false)} className="flex-1 py-2 bg-red-700/30 text-red-400 rounded-xl text-sm">Still learning</button>
                        <button onClick={() => markVocab(quizWord.id, true)} className="flex-1 py-2 bg-green-700/30 text-green-400 rounded-xl text-sm">Mastered ✓</button>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => setShowAnswer(true)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm">Reveal</button>
                  )}
                  <button onClick={() => setQuizMode(false)} className="mt-3 text-xs text-slate-600 hover:text-slate-400">Exit quiz</button>
                </div>
              )}

              <button onClick={() => setShowVocabForm(!showVocabForm)}
                className="w-full py-2 border border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 justify-center">
                <Plus className="w-4 h-4" /> Add vocabulary word
              </button>

              {showVocabForm && (
                <div className="game-card p-3 space-y-2">
                  <div className="flex gap-2">
                    <input value={vocabForm.word} onChange={e => setVocabForm(f => ({ ...f, word: e.target.value }))}
                      placeholder="Word *" className="game-input flex-1 text-sm" autoFocus />
                    <input value={vocabForm.translation} onChange={e => setVocabForm(f => ({ ...f, translation: e.target.value }))}
                      placeholder="Translation *" className="game-input flex-1 text-sm" />
                  </div>
                  <input value={vocabForm.example} onChange={e => setVocabForm(f => ({ ...f, example: e.target.value }))}
                    placeholder="Example sentence" className="game-input w-full text-sm" />
                  <button onClick={addVocab} className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold">Add Word</button>
                </div>
              )}

              <div className="space-y-1.5">
                {langVocab.map(v => (
                  <div key={v.id} className={`game-card p-3 flex items-center gap-3 ${v.mastered ? 'opacity-50' : ''}`}>
                    <button onClick={() => markVocab(v.id, !v.mastered)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${v.mastered ? 'bg-green-500 border-green-500' : 'border-slate-600'}`}>
                      {v.mastered && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1">
                      <span className="font-medium text-white text-sm">{v.word}</span>
                      <span className="ml-2 text-sm text-slate-400">{v.translation}</span>
                      {v.example && <p className="text-xs text-slate-600 italic mt-0.5">"{v.example}"</p>}
                    </div>
                    <button onClick={() => saveVocab(vocab.filter(x => x.id !== v.id))} className="text-slate-700 hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {langVocab.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No vocabulary words yet.</div>}
              </div>
            </div>
          )}

          {tab === 'log' && (
            <div className="space-y-2">
              {langSessions.map(s => (
                <div key={s.id} className="game-card p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center justify-center">{s.minutes}m</div>
                  <div className="flex-1">
                    <span className="text-sm text-white">{s.activity}</span>
                    <p className="text-xs text-slate-600">{s.date}</p>
                  </div>
                  <button onClick={() => saveSessions(sessions.filter(x => x.id !== s.id))} className="text-slate-700 hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {langSessions.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No sessions logged yet.</div>}
            </div>
          )}

          {tab === 'overview' && (
            <div className="game-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Progress Overview</h3>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Vocabulary mastery</span>
                  <span>{langVocab.filter(v => v.mastered).length}/{langVocab.length}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${langVocab.length ? (langVocab.filter(v => v.mastered).length / langVocab.length) * 100 : 0}%` }} />
                </div>
              </div>
              {lang.targetDate && (
                <p className="text-xs text-slate-500">Target fluency: {lang.targetDate}</p>
              )}
              <p className="text-xs text-slate-500">Daily goal: {lang.dailyGoal} min/day</p>
              {lang.notes && <p className="text-xs text-slate-500 italic">{lang.notes}</p>}
              <div className="border-t border-slate-800 pt-3">
                <p className="text-xs text-slate-500 mb-1">Recent study sessions</p>
                {langSessions.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-400">{s.activity}</span>
                    <span className="text-xs text-blue-400">{s.minutes}m · {s.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {languages.length === 0 && !showLangForm && (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="mb-2">Start your language learning journey.</p>
          <p className="text-sm">Add a language and begin building your vocabulary.</p>
        </div>
      )}
    </div>
  )
}
