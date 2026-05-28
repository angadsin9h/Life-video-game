import { useEffect, useState, useMemo } from 'react'
import {
  BookOpen, Plus, Trash2, RefreshCw, Check, Star,
  ChevronDown, ChevronUp, Brain, X,
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Flashcard {
  id: string
  front: string
  back: string
  interval: number       // days until next review
  ease: number           // multiplier (starts at 2.5)
  nextReview: string     // ISO date string
  lastReview: string     // ISO date string
  history: Array<'Easy' | 'Medium' | 'Hard'>
}

interface Deck {
  id: string
  name: string
  subject: string
  cards: Flashcard[]
  createdAt: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'study_flashcards'

const SUBJECTS = [
  'Programming',
  'Language',
  'History',
  'Science',
  'Math',
  'Business',
  'Personal',
  'Other',
] as const

type Subject = typeof SUBJECTS[number]

const SUBJECT_COLORS: Record<Subject, string> = {
  Programming: '#8b5cf6',
  Language:    '#06b6d4',
  History:     '#f97316',
  Science:     '#22c55e',
  Math:        '#3b82f6',
  Business:    '#eab308',
  Personal:    '#ec4899',
  Other:       '#64748b',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function isDue(card: Flashcard): boolean {
  return card.nextReview <= todayStr()
}

function calcNextInterval(card: Flashcard, rating: 'Easy' | 'Medium' | 'Hard'): number {
  if (rating === 'Hard') return 1
  if (rating === 'Medium') return Math.max(1, card.interval)
  // Easy: interval * ease (min 1)
  return Math.max(1, Math.round(card.interval * card.ease))
}

function applyRating(card: Flashcard, rating: 'Easy' | 'Medium' | 'Hard'): Flashcard {
  const nextInterval = calcNextInterval(card, rating)
  const nextEase =
    rating === 'Easy'   ? Math.min(4, card.ease + 0.15) :
    rating === 'Hard'   ? Math.max(1.3, card.ease - 0.2) :
    card.ease
  const today = todayStr()
  return {
    ...card,
    interval: nextInterval,
    ease: nextEase,
    lastReview: today,
    nextReview: addDays(today, nextInterval),
    history: [...card.history, rating],
  }
}

function newCard(front: string, back: string): Flashcard {
  const today = todayStr()
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    front: front.trim(),
    back: back.trim(),
    interval: 1,
    ease: 2.5,
    nextReview: today,
    lastReview: '',
    history: [],
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Deck[]
  } catch { /* ignore */ }
  return []
}

function saveDecks(decks: Deck[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
}

// ─── Study Session State ──────────────────────────────────────────────────────

interface StudyState {
  deckId: string
  queue: string[]       // card ids remaining
  currentIdx: number
  flipped: boolean
  sessionsToday: number
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudyFlashcards() {
  const { toastSuccess, toastError } = useToast()
  const today = todayStr()

  // ── State ──────────────────────────────────────────────────────────────────

  const [decks, setDecks] = useState<Deck[]>([])
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null)
  const [studyState, setStudyState] = useState<StudyState | null>(null)
  const [sessionsCompletedToday, setSessionsCompletedToday] = useState(0)

  // Create deck form
  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [newDeckName, setNewDeckName] = useState('')
  const [newDeckSubject, setNewDeckSubject] = useState<Subject>('Programming')

  // Add card form (per-deck)
  const [addCardDeckId, setAddCardDeckId] = useState<string | null>(null)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')

  // ── Load ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setDecks(loadDecks())
    // Load sessions-today count from localStorage
    const key = `sf_sessions_${today}`
    const val = parseInt(localStorage.getItem(key) ?? '0', 10)
    setSessionsCompletedToday(val)
  }, [today])

  function persist(next: Deck[]) {
    setDecks(next)
    saveDecks(next)
  }

  // ── Deck management ─────────────────────────────────────────────────────────

  function createDeck() {
    const name = newDeckName.trim()
    if (!name) { toastError('Enter a deck name'); return }
    if (decks.find(d => d.name.toLowerCase() === name.toLowerCase())) {
      toastError('Deck name already exists')
      return
    }
    const deck: Deck = {
      id: Date.now().toString(),
      name,
      subject: newDeckSubject,
      cards: [],
      createdAt: today,
    }
    persist([...decks, deck])
    setNewDeckName('')
    setNewDeckSubject('Programming')
    setShowCreateDeck(false)
    toastSuccess(`Deck "${name}" created!`)
  }

  function deleteDeck(id: string) {
    if (studyState?.deckId === id) setStudyState(null)
    persist(decks.filter(d => d.id !== id))
    toastSuccess('Deck deleted')
  }

  // ── Card management ─────────────────────────────────────────────────────────

  function addCard(deckId: string) {
    const front = newFront.trim()
    const back = newBack.trim()
    if (!front || !back) { toastError('Fill in both sides of the card'); return }
    const card = newCard(front, back)
    persist(decks.map(d => d.id === deckId ? { ...d, cards: [...d.cards, card] } : d))
    setNewFront('')
    setNewBack('')
    toastSuccess('Card added!')
  }

  function deleteCard(deckId: string, cardId: string) {
    persist(decks.map(d =>
      d.id === deckId
        ? { ...d, cards: d.cards.filter(c => c.id !== cardId) }
        : d
    ))
  }

  // ── Study mode ──────────────────────────────────────────────────────────────

  function startStudy(deckId: string) {
    const deck = decks.find(d => d.id === deckId)
    if (!deck) return
    const dueIds = deck.cards.filter(isDue).map(c => c.id)
    if (dueIds.length === 0) { toastError('No cards due for review right now'); return }
    setStudyState({
      deckId,
      queue: [...dueIds],
      currentIdx: 0,
      flipped: false,
      sessionsToday: sessionsCompletedToday,
    })
  }

  function flipCard() {
    if (!studyState) return
    setStudyState(s => s ? { ...s, flipped: !s.flipped } : s)
  }

  function rateCard(rating: 'Easy' | 'Medium' | 'Hard') {
    if (!studyState) return
    const deck = decks.find(d => d.id === studyState.deckId)
    if (!deck) return

    const cardId = studyState.queue[studyState.currentIdx]
    const card = deck.cards.find(c => c.id === cardId)
    if (!card) return

    const updatedCard = applyRating(card, rating)
    const updatedDecks = decks.map(d =>
      d.id === studyState.deckId
        ? { ...d, cards: d.cards.map(c => c.id === cardId ? updatedCard : c) }
        : d
    )
    persist(updatedDecks)

    const nextIdx = studyState.currentIdx + 1
    if (nextIdx >= studyState.queue.length) {
      // Session complete
      const newCount = sessionsCompletedToday + 1
      setSessionsCompletedToday(newCount)
      localStorage.setItem(`sf_sessions_${today}`, String(newCount))
      setStudyState(null)
      toastSuccess('Session complete!', `Reviewed ${studyState.queue.length} card${studyState.queue.length !== 1 ? 's' : ''}`)
    } else {
      setStudyState(s => s ? { ...s, currentIdx: nextIdx, flipped: false } : s)
    }
  }

  function exitStudy() {
    setStudyState(null)
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0)
    const cardsDueToday = decks.reduce((acc, d) => acc + d.cards.filter(isDue).length, 0)

    const allHistory = decks.flatMap(d => d.cards.flatMap(c => c.history))
    const easyCount = allHistory.filter(r => r === 'Easy').length
    const retention = allHistory.length > 0
      ? Math.round((easyCount / allHistory.length) * 100)
      : 0

    return { totalCards, cardsDueToday, retention }
  }, [decks])

  // ── Current study card ──────────────────────────────────────────────────────

  const studyDeck = studyState ? decks.find(d => d.id === studyState.deckId) : null
  const studyCard = studyDeck && studyState
    ? studyDeck.cards.find(c => c.id === studyState.queue[studyState.currentIdx])
    : null

  // ─── Study mode UI ──────────────────────────────────────────────────────────

  if (studyState && studyCard && studyDeck) {
    const progress = studyState.currentIdx / studyState.queue.length
    const subjectColor = SUBJECT_COLORS[studyDeck.subject as Subject] ?? '#8b5cf6'

    return (
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-xl font-bold text-white flex items-center gap-2"
              style={{ fontFamily: 'Orbitron, monospace' }}
            >
              <Brain className="w-5 h-5" style={{ color: subjectColor }} />
              {studyDeck.name}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Card {studyState.currentIdx + 1} of {studyState.queue.length}
            </p>
          </div>
          <button
            onClick={exitStudy}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%`, background: subjectColor }}
          />
        </div>

        {/* Flashcard */}
        <div
          onClick={flipCard}
          className="game-card p-8 min-h-48 flex flex-col items-center justify-center cursor-pointer select-none transition-all hover:border-violet-500/50 text-center"
          style={{ borderColor: studyState.flipped ? `${subjectColor}66` : undefined }}
        >
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-4">
            {studyState.flipped ? 'Answer' : 'Question'}
          </div>
          <div className="text-xl text-slate-100 font-semibold leading-relaxed">
            {studyState.flipped ? studyCard.back : studyCard.front}
          </div>
          {!studyState.flipped && (
            <div className="mt-6 text-xs text-slate-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Click to reveal answer
            </div>
          )}
        </div>

        {/* Rating buttons — only show when flipped */}
        {studyState.flipped ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-slate-400">How well did you recall it?</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => rateCard('Hard')}
                className="py-3 rounded-xl text-sm font-bold transition-all border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-400"
              >
                Hard
                <div className="text-[10px] font-normal text-red-500/70 mt-0.5">Back to 1 day</div>
              </button>
              <button
                onClick={() => rateCard('Medium')}
                className="py-3 rounded-xl text-sm font-bold transition-all border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400"
              >
                Medium
                <div className="text-[10px] font-normal text-amber-500/70 mt-0.5">Same interval</div>
              </button>
              <button
                onClick={() => rateCard('Easy')}
                className="py-3 rounded-xl text-sm font-bold transition-all border border-green-500/40 text-green-400 hover:bg-green-500/20 hover:border-green-400"
              >
                Easy
                <div className="text-[10px] font-normal text-green-500/70 mt-0.5">
                  +{calcNextInterval(studyCard, 'Easy')}d
                </div>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={flipCard}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Flip Card
          </button>
        )}
      </div>
    )
  }

  // ─── Main UI ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-white flex items-center gap-2"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            <Brain className="w-7 h-7 text-violet-400" />
            Study Flashcards
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Spaced-repetition learning system</p>
        </div>
        <button
          onClick={() => setShowCreateDeck(v => !v)}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Deck
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-3 text-center">
          <div
            className="text-2xl font-bold text-violet-400"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {decks.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Decks</div>
        </div>
        <div className="game-card p-3 text-center">
          <div
            className="text-2xl font-bold text-blue-400"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {stats.totalCards}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Total Cards</div>
        </div>
        <div className="game-card p-3 text-center">
          <div
            className="text-2xl font-bold text-amber-400"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {stats.cardsDueToday}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Due Today</div>
        </div>
        <div className="game-card p-3 text-center">
          <div
            className="text-2xl font-bold text-green-400"
            style={{ fontFamily: 'Orbitron, monospace' }}
          >
            {stats.retention}%
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Retention</div>
        </div>
      </div>

      {/* Sessions today */}
      {sessionsCompletedToday > 0 && (
        <div className="game-card p-3 flex items-center gap-3">
          <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-sm text-slate-300">
            <span className="font-bold text-yellow-400">{sessionsCompletedToday}</span> study session{sessionsCompletedToday !== 1 ? 's' : ''} completed today
          </span>
        </div>
      )}

      {/* Create deck form */}
      {showCreateDeck && (
        <div className="game-card p-5 space-y-4 border border-violet-500/30">
          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            New Deck
          </h3>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Deck Name *</label>
            <input
              className="game-input w-full text-sm"
              placeholder="e.g. JavaScript Fundamentals, Spanish Vocab…"
              value={newDeckName}
              onChange={e => setNewDeckName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createDeck()}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Subject</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map(subj => {
                const active = newDeckSubject === subj
                const color = SUBJECT_COLORS[subj]
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setNewDeckSubject(subj)}
                    className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                    style={
                      active
                        ? { background: color + '33', color, border: `1px solid ${color}` }
                        : { background: '#1e293b', color: '#64748b', border: '1px solid transparent' }
                    }
                  >
                    {active && <Check className="w-3 h-3 inline mr-1" />}
                    {subj}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={createDeck}
              className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Deck
            </button>
            <button
              onClick={() => { setShowCreateDeck(false); setNewDeckName('') }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-400 rounded-xl text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Deck list */}
      {decks.length === 0 && !showCreateDeck ? (
        <div className="text-center py-16 text-slate-500">
          <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-base mb-1">No decks yet.</p>
          <p className="text-sm mb-5">Create your first deck to start learning with spaced repetition.</p>
          <button
            onClick={() => setShowCreateDeck(true)}
            className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Create First Deck
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map(deck => {
            const color = SUBJECT_COLORS[deck.subject as Subject] ?? '#8b5cf6'
            const dueCount = deck.cards.filter(isDue).length
            const lastReviewed = deck.cards
              .filter(c => c.lastReview)
              .map(c => c.lastReview)
              .sort()
              .pop() ?? null
            const isExpanded = expandedDeck === deck.id
            const isAddingCard = addCardDeckId === deck.id

            return (
              <div key={deck.id} className="game-card">
                {/* Deck header */}
                <div className="p-4 flex items-center gap-3">
                  {/* Subject color strip */}
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: color }} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-200 text-sm">{deck.name}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: color + '22', color, border: `1px solid ${color}44` }}
                      >
                        {deck.subject}
                      </span>
                      {dueCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {dueCount} due
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span>{deck.cards.length} card{deck.cards.length !== 1 ? 's' : ''}</span>
                      {lastReviewed && <span>last studied: {lastReviewed}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => startStudy(deck.id)}
                      disabled={dueCount === 0}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={
                        dueCount > 0
                          ? { background: color + '33', color, border: `1px solid ${color}66` }
                          : { background: '#1e293b', color: '#334155', border: '1px solid #334155', cursor: 'not-allowed' }
                      }
                    >
                      Study Now
                    </button>
                    <button
                      onClick={() => setExpandedDeck(isExpanded ? null : deck.id)}
                      className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteDeck(deck.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: cards + add card */}
                {isExpanded && (
                  <div className="border-t border-slate-700 px-4 pb-4 pt-3 space-y-3">

                    {/* Add card toggle */}
                    <button
                      onClick={() => {
                        setAddCardDeckId(isAddingCard ? null : deck.id)
                        setNewFront('')
                        setNewBack('')
                      }}
                      className="flex items-center gap-1 text-xs font-semibold transition-colors"
                      style={{ color }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Card
                    </button>

                    {/* Add card form */}
                    {isAddingCard && (
                      <div className="p-3 bg-slate-900/60 rounded-xl space-y-2 border border-slate-700">
                        <div>
                          <label className="text-[11px] text-slate-500 mb-1 block">Front (Question / Term)</label>
                          <textarea
                            className="game-input w-full h-16 resize-none text-sm"
                            placeholder="What is…? Define…"
                            value={newFront}
                            onChange={e => setNewFront(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-500 mb-1 block">Back (Answer / Definition)</label>
                          <textarea
                            className="game-input w-full h-16 resize-none text-sm"
                            placeholder="The answer is…"
                            value={newBack}
                            onChange={e => setNewBack(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addCard(deck.id)}
                            className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save Card
                          </button>
                          <button
                            onClick={() => { setAddCardDeckId(null); setNewFront(''); setNewBack('') }}
                            className="px-3 py-1.5 bg-slate-700 text-slate-400 rounded-lg text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Card list */}
                    {deck.cards.length === 0 ? (
                      <p className="text-xs text-slate-600 italic text-center py-2">
                        No cards yet. Add your first card above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {deck.cards.map(card => {
                          const cardDue = isDue(card)
                          const easyPct = card.history.length > 0
                            ? Math.round((card.history.filter(r => r === 'Easy').length / card.history.length) * 100)
                            : null
                          return (
                            <div
                              key={card.id}
                              className="flex items-start gap-2 py-2.5 px-3 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors"
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="text-sm text-slate-200 font-medium truncate">
                                  {card.front}
                                </div>
                                <div className="text-xs text-slate-500 truncate">{card.back}</div>
                                <div className="flex items-center gap-3 flex-wrap">
                                  {cardDue && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                      due
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-600">
                                    interval: {card.interval}d
                                  </span>
                                  {easyPct !== null && (
                                    <span className="text-[10px] text-slate-600">
                                      retention: {easyPct}%
                                    </span>
                                  )}
                                  {card.lastReview && (
                                    <span className="text-[10px] text-slate-600">
                                      reviewed: {card.lastReview}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => deleteCard(deck.id, card.id)}
                                className="p-1 text-slate-700 hover:text-red-400 transition-colors flex-shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
