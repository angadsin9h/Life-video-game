import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppShell from './components/AppShell'
import { ToastProvider } from './contexts/ToastContext'
import Dashboard from './pages/Dashboard'
import LogTasks from './pages/LogTasks'
import Progress from './pages/Progress'
import AICoach from './pages/AICoach'
import Goals from './pages/Goals'
import Achievements from './pages/Achievements'
import Habits from './pages/Habits'
import BossBattle from './pages/BossBattle'
import Journal from './pages/Journal'
import Heatmap from './pages/Heatmap'
import WeeklyReport from './pages/WeeklyReport'
import Timer from './pages/Timer'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import SkillTree from './pages/SkillTree'
import Quests from './pages/Quests'
import Milestones from './pages/Milestones'
import Challenges from './pages/Challenges'
import Insights from './pages/Insights'
import MoodTracker from './pages/MoodTracker'
import Notes from './pages/Notes'
import DailyReview from './pages/DailyReview'
import BodyMetrics from './pages/BodyMetrics'
import Planner from './pages/Planner'
import Gratitude from './pages/Gratitude'
import Records from './pages/Records'
import Intentions from './pages/Intentions'
import LifeScore from './pages/LifeScore'
import CategoryGoals from './pages/CategoryGoals'
import FocusSessions from './pages/FocusSessions'
import YearView from './pages/YearView'
import Affirmations from './pages/Affirmations'
import MoodAnalytics from './pages/MoodAnalytics'
import WeeklyGoals from './pages/WeeklyGoals'
import Breathing from './pages/Breathing'
import SleepTracker from './pages/SleepTracker'
import HabitAnalytics from './pages/HabitAnalytics'
import DailyChallenge from './pages/DailyChallenge'
import Books from './pages/Books'
import Workouts from './pages/Workouts'
import Expenses from './pages/Expenses'
import Briefing from './pages/Briefing'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AppShell>
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <main className="pb-20 md:pb-0 md:pl-56">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/"             element={<Dashboard />}    />
              <Route path="/log"          element={<LogTasks />}     />
              <Route path="/progress"     element={<Progress />}     />
              <Route path="/activity"     element={<Heatmap />}      />
              <Route path="/journal"      element={<Journal />}      />
              <Route path="/ai-coach"     element={<AICoach />}      />
              <Route path="/goals"        element={<Goals />}        />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/habits"       element={<Habits />}       />
              <Route path="/boss"         element={<BossBattle />}   />
              <Route path="/weekly"       element={<WeeklyReport />} />
              <Route path="/timer"        element={<Timer />}        />
              <Route path="/profile"      element={<Profile />}      />
              <Route path="/settings"     element={<Settings />}     />
              <Route path="/skills"       element={<SkillTree />}    />
              <Route path="/quests"       element={<Quests />}       />
              <Route path="/milestones"   element={<Milestones />}   />
              <Route path="/challenges"   element={<Challenges />}   />
              <Route path="/insights"     element={<Insights />}     />
              <Route path="/mood"         element={<MoodTracker />}  />
              <Route path="/notes"        element={<Notes />}        />
              <Route path="/review"       element={<DailyReview />}  />
              <Route path="/metrics"      element={<BodyMetrics />}  />
              <Route path="/planner"      element={<Planner />}      />
              <Route path="/gratitude"    element={<Gratitude />}    />
              <Route path="/records"      element={<Records />}      />
              <Route path="/intentions"   element={<Intentions />}   />
              <Route path="/lifescore"    element={<LifeScore />}    />
              <Route path="/cat-goals"    element={<CategoryGoals />}/>
              <Route path="/focus-log"    element={<FocusSessions />}/>
              <Route path="/year"         element={<YearView />}     />
              <Route path="/affirmations"  element={<Affirmations />}  />
              <Route path="/mood-stats"    element={<MoodAnalytics />} />
              <Route path="/weekly-goals"  element={<WeeklyGoals />}   />
              <Route path="/breathing"     element={<Breathing />}     />
              <Route path="/sleep"         element={<SleepTracker />}  />
              <Route path="/habit-stats"     element={<HabitAnalytics />}/>
              <Route path="/daily-challenge" element={<DailyChallenge />}/>
              <Route path="/books"          element={<Books />}          />
              <Route path="/workouts"       element={<Workouts />}       />
              <Route path="/expenses"       element={<Expenses />}       />
              <Route path="/briefing"       element={<Briefing />}       />
            </Routes>
          </div>
        </main>
      </div>
      </AppShell>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
