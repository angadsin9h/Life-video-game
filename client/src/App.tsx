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
import Nutrition from './pages/Nutrition'
import Timeline from './pages/Timeline'
import LifeCalendar from './pages/LifeCalendar'
import Streaks from './pages/Streaks'
import CheckIn from './pages/CheckIn'
import WindDown from './pages/WindDown'
import Learning from './pages/Learning'
import AmbientFocus from './pages/AmbientFocus'
import TaskBoard from './pages/TaskBoard'
import Routines from './pages/Routines'
import LifeWheel from './pages/LifeWheel'
import DecisionJournal from './pages/DecisionJournal'
import Values from './pages/Values'
import WeeklyPlanning from './pages/WeeklyPlanning'
import XPLog from './pages/XPLog'
import WaterTracker from './pages/WaterTracker'
import FocusStats from './pages/FocusStats'
import JournalInsights from './pages/JournalInsights'
import MealPlanner from './pages/MealPlanner'
import ReadingNotes from './pages/ReadingNotes'
import Projects from './pages/Projects'
import WellnessCheck from './pages/WellnessCheck'
import MeditationTimer from './pages/MeditationTimer'
import HabitChallenges from './pages/HabitChallenges'
import LifeOS from './pages/LifeOS'
import QuoteJournal from './pages/QuoteJournal'

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
              <Route path="/nutrition"      element={<Nutrition />}      />
              <Route path="/timeline"       element={<Timeline />}       />
              <Route path="/life-calendar"  element={<LifeCalendar />}   />
              <Route path="/streaks"        element={<Streaks />}        />
              <Route path="/checkin"         element={<CheckIn />}        />
              <Route path="/winddown"        element={<WindDown />}       />
              <Route path="/learning"        element={<Learning />}       />
              <Route path="/ambient"         element={<AmbientFocus />}   />
              <Route path="/taskboard"       element={<TaskBoard />}      />
              <Route path="/routines"        element={<Routines />}       />
              <Route path="/life-wheel"      element={<LifeWheel />}      />
              <Route path="/decisions"       element={<DecisionJournal />}/>
              <Route path="/values"          element={<Values />}         />
              <Route path="/week-plan"       element={<WeeklyPlanning />} />
              <Route path="/xp-log"          element={<XPLog />}          />
              <Route path="/water"           element={<WaterTracker />}   />
              <Route path="/focus-stats"     element={<FocusStats />}     />
              <Route path="/journal-insights" element={<JournalInsights />}/>
              <Route path="/meal-plan"       element={<MealPlanner />}    />
              <Route path="/reading-notes"   element={<ReadingNotes />}   />
              <Route path="/projects"        element={<Projects />}       />
              <Route path="/wellness"        element={<WellnessCheck />}  />
              <Route path="/meditation"      element={<MeditationTimer />}/>
              <Route path="/habit-challenges" element={<HabitChallenges />}/>
              <Route path="/life-os"         element={<LifeOS />}         />
              <Route path="/quotes"          element={<QuoteJournal />}   />
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
