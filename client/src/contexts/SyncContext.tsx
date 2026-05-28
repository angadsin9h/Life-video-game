/**
 * SyncContext — bidirectional localStorage ↔ Firestore sync
 *
 * Strategy:
 *  - On sign-in: pull all cloud data → merge into localStorage (cloud wins on conflict)
 *  - On localStorage write (any key in SYNC_KEYS): debounce 4s → push to Firestore
 *  - Provides syncStatus so any page can show "Saved to cloud ✓"
 */
import {
  createContext, useContext, useEffect, useState,
  useCallback, useRef, ReactNode,
} from 'react'
import {
  doc, getDoc, setDoc, collection, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'

// All localStorage keys we want to sync to the cloud
export const SYNC_KEYS = [
  'mindful_sleep_log', 'energy_budget_log', 'daily_excellence_log',
  'growth_mindset_log', 'social_intelligence_log', 'willpower_log',
  'joy_design_log', 'inner_peace_log', 'purpose_log', 'physical_peak_log',
  'neuroplasticity_log', 'life_review_log', 'resilient_thinking_log',
  'digital_wellness_log', 'intuitive_decision_log', 'body_wisdom_log',
  'gratitude_to_self_log', 'conflict_resolution_log', 'abundance_log',
  'life_rhythm_log', 'high_performance_log', 'screen_time_connect',
  'healing_journal_log', 'ikigai_compass', 'morning_ritual_log',
  'morning_ritual_streak', 'daily_driver_log', 'weekly_power_log',
  'life_gps_log', 'nightly_debrief_log', 'personal_playbook',
  'mind_body_balance_log', 'emotional_dashboard_log', 'strategic_life_plan',
  'habit_matrix', 'life_checkup_log', 'flow_state_tracker_log',
  'mindfulness_center_log', 'wealth_builder_log', 'relationship_tracker_log',
  'relationship_tracker_people', 'creative_studio_log', 'deep_work_log',
  'growth_journal_log', 'life_energy_log', 'identity_architect',
  'value_alignment_log', 'value_alignment_values', 'win_board_log',
  'reflection_engine_log', 'life_rating_log', 'morning_powerup_log',
  'evening_winddown_log', 'goal_crusher', 'habit_evolution',
  'spiritual_log', 'obstacle_destroyer_log', 'focus_protocol_log',
  'body_optimizer_log', 'mindset_gym_log', 'life_design_board',
  'gratitude_power_log', 'thought_audit_log', 'energy_rituals',
  'momentum_tracker_log', 'fear_inventory_log', 'mental_strength_log',
  'social_capital_log', 'legacy_project_log', 'self_compassion_log',
  'presence_tracker_log', 'life_lab_log', 'success_blueprint_log',
  'time_investment_log', 'clarity_session_log', 'peak_moment_log',
  'challenge_acceptor', 'personal_finance_log', 'micro_moment_log',
  'life_force_log', 'neural_reprogramming_log', 'life_balance_wheel_log',
  'growth_conversation_log', 'service_mindset_log', 'sleep_protocol_design',
  'sleep_protocol_log', 'life_streak', 'lifequest_reminders',
  'quantified_self_metrics', 'quantified_self_log',
]

type SyncStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'offline'

interface SyncContextValue {
  syncStatus: SyncStatus
  lastSynced: Date | null
  forcePush: () => Promise<void>
  forcePull: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Pull: cloud → localStorage ──────────────────────────────────────────────
  const forcePull = useCallback(async () => {
    if (!user) return
    setSyncStatus('syncing')
    try {
      const snap = await getDocs(collection(db, 'users', user.uid, 'logs'))
      snap.forEach((docSnap) => {
        const data = docSnap.data()
        if (data.value !== undefined) {
          localStorage.setItem(docSnap.id, data.value)
        }
      })
      setLastSynced(new Date())
      setSyncStatus('saved')
    } catch {
      setSyncStatus('error')
    }
  }, [user])

  // ── Push: localStorage → Firestore ─────────────────────────────────────────
  const forcePush = useCallback(async () => {
    if (!user) return
    setSyncStatus('syncing')
    try {
      const writes = SYNC_KEYS
        .map(key => ({ key, value: localStorage.getItem(key) }))
        .filter(({ value }) => value !== null)

      await Promise.all(
        writes.map(({ key, value }) =>
          setDoc(doc(db, 'users', user.uid, 'logs', key), {
            value,
            updatedAt: serverTimestamp(),
          }, { merge: true })
        )
      )
      setLastSynced(new Date())
      setSyncStatus('saved')
    } catch {
      setSyncStatus('error')
    }
  }, [user])

  // ── On sign-in: pull then watch for local changes ─────────────────────────
  useEffect(() => {
    if (!user) { setSyncStatus('idle'); return }

    // Pull on login
    forcePull()

    // Intercept localStorage.setItem to schedule pushes
    const original = localStorage.setItem.bind(localStorage)
    localStorage.setItem = (key: string, value: string) => {
      original(key, value)
      if (!SYNC_KEYS.includes(key)) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setSyncStatus('syncing')
      debounceRef.current = setTimeout(() => {
        forcePush()
      }, 4000)
    }

    return () => {
      // Restore original on unmount/logout
      localStorage.setItem = original
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [user, forcePull, forcePush])

  return (
    <SyncContext.Provider value={{ syncStatus, lastSynced, forcePush, forcePull }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}
