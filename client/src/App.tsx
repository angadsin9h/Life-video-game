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
import Relationships from './pages/Relationships'
import SleepAnalytics from './pages/SleepAnalytics'
import MorningPages from './pages/MorningPages'
import ExpenseAnalytics from './pages/ExpenseAnalytics'
import StreaksCalendar from './pages/StreaksCalendar'
import GoalAnalytics from './pages/GoalAnalytics'
import WorkoutAnalytics from './pages/WorkoutAnalytics'
import NutritionAnalytics from './pages/NutritionAnalytics'
import BookAnalytics from './pages/BookAnalytics'
import ProductivityDashboard from './pages/ProductivityDashboard'
import LearningAnalytics from './pages/LearningAnalytics'
import ProjectAnalytics from './pages/ProjectAnalytics'
import MetricsAnalytics from './pages/MetricsAnalytics'
import GratitudeAnalytics from './pages/GratitudeAnalytics'
import RelationshipAnalytics from './pages/RelationshipAnalytics'
import TimeBlocking from './pages/TimeBlocking'
import EmotionCheck from './pages/EmotionCheck'
import VisionBoard from './pages/VisionBoard'
import PriorityMatrix from './pages/PriorityMatrix'
import HabitWizard from './pages/HabitWizard'
import MindsetJournal from './pages/MindsetJournal'
import HabitStacking from './pages/HabitStacking'
import DailyWins from './pages/DailyWins'
import ReflectionPrompts from './pages/ReflectionPrompts'
import WeeklyScorecard from './pages/WeeklyScorecard'
import Accountability from './pages/Accountability'
import SleepOptimizer from './pages/SleepOptimizer'
import FinancialGoals from './pages/FinancialGoals'
import EnergyTracker from './pages/EnergyTracker'
import ChallengeMode from './pages/ChallengeMode'
import SkillProgress from './pages/SkillProgress'
import LifeMetricsDashboard from './pages/LifeMetricsDashboard'
import FocusRituals from './pages/FocusRituals'
import HabitInsights from './pages/HabitInsights'
import PersonalManifesto from './pages/PersonalManifesto'
import MoodPatterns from './pages/MoodPatterns'
import TaskAnalytics from './pages/TaskAnalytics'
import BodyComposition from './pages/BodyComposition'
import DailyIntentions from './pages/DailyIntentions'
import GrowthLog from './pages/GrowthLog'
import PomodoroTracker from './pages/PomodoroTracker'
import WeeklyReview from './pages/WeeklyReview'
import MindMapPage from './pages/MindMap'
import LifeAudit from './pages/LifeAudit'
import AnxietyJournal from './pages/AnxietyJournal'
import FitnessGoals from './pages/FitnessGoals'
import SocialBattery from './pages/SocialBattery'
import ContentLibrary from './pages/ContentLibrary'
import DeepWorkPlanner from './pages/DeepWorkPlanner'
import StreakChallenge from './pages/StreakChallenge'
import LifeEvents from './pages/LifeEvents'
import StressTracker from './pages/StressTracker'
import GratitudeChain from './pages/GratitudeChain'
import OKRTracker from './pages/OKRTracker'
import DailyStandup from './pages/DailyStandup'
import StudyTracker from './pages/StudyTracker'
import PersonalKPIs from './pages/PersonalKPIs'
import BucketList from './pages/BucketList'
import HabitCoach from './pages/HabitCoach'
import TimeAudit from './pages/TimeAudit'
import IdentityBuilder from './pages/IdentityBuilder'
import WeeklyWins from './pages/WeeklyWins'
import NightlyReview from './pages/NightlyReview'
import PowerHour from './pages/PowerHour'
import HabitDesigner from './pages/HabitDesigner'
import DailyCheckIn from './pages/DailyCheckIn'
import XPCenter from './pages/XPCenter'
import CognitiveReframe from './pages/CognitiveReframe'
import PersonalBrand from './pages/PersonalBrand'
import MicroHabits from './pages/MicroHabits'
import SuccessFormula from './pages/SuccessFormula'
import GoalHierarchy from './pages/GoalHierarchy'
import PerformanceReview from './pages/PerformanceReview'
import FocusJournal from './pages/FocusJournal'
import LifeMap from './pages/LifeMap'
import AntiHabits from './pages/AntiHabits'
import LifeRules from './pages/LifeRules'
import RewardSystem from './pages/RewardSystem'
import ContentCalendar from './pages/ContentCalendar'
import SkillChallenge from './pages/SkillChallenge'
import PodcastTracker from './pages/PodcastTracker'
import DigitalDetox from './pages/DigitalDetox'
import EmotionalIntelligence from './pages/EmotionalIntelligence'
import GratitudeLetter from './pages/GratitudeLetter'
import HealthDashboard from './pages/HealthDashboard'
import SavingsChallenge from './pages/SavingsChallenge'
import LifeTimeline from './pages/LifeTimeline'
import ObstacleLog from './pages/ObstacleLog'
import SleepRituals from './pages/SleepRituals'
import TodayFocus from './pages/TodayFocus'
import GratitudeJar from './pages/GratitudeJar'
import DailyScorecard from './pages/DailyScorecard'
import BreathworkTimer from './pages/BreathworkTimer'
import IdeaIncubator from './pages/IdeaIncubator'
import ProjectRetro from './pages/ProjectRetro'
import HealthMetrics from './pages/HealthMetrics'
import MentalHealthLog from './pages/MentalHealthLog'
import WeeklySprint from './pages/WeeklySprint'
import PersonalOKR from './pages/PersonalOKR'
import LifeLegacy from './pages/LifeLegacy'
import DecisionMatrix from './pages/DecisionMatrix'
import ChallengeCalendar from './pages/ChallengeCalendar'
import FinanceTracker from './pages/FinanceTracker'
import LifeTheme from './pages/LifeTheme'
import NetWorthTracker from './pages/NetWorthTracker'
import SleepScore from './pages/SleepScore'
import StudyFlashcards from './pages/StudyFlashcards'
import RecoveryTracker from './pages/RecoveryTracker'
import SkillRoadmap from './pages/SkillRoadmap'
import QuickCapture from './pages/QuickCapture'
import ConversationLog from './pages/ConversationLog'
import FitnessLog from './pages/FitnessLog'
import EveningReview from './pages/EveningReview'
import YearInReview from './pages/YearInReview'
import MorningRoutine from './pages/MorningRoutine'
import MoneyMindset from './pages/MoneyMindset'
import NutritionGoals from './pages/NutritionGoals'
import CareerTracker from './pages/CareerTracker'
import IdeaVault from './pages/IdeaVault'
import ProjectSprint from './pages/ProjectSprint'
import CreativeJournal from './pages/CreativeJournal'
import FlowState from './pages/FlowState'
import FearLog from './pages/FearLog'
import WinStreak from './pages/WinStreak'
import DailyScript from './pages/DailyScript'
import LifeVision from './pages/LifeVision'
import LifeChapters from './pages/LifeChapters'
import NetworkMap from './pages/NetworkMap'
import TrainingPlan from './pages/TrainingPlan'
import GriefJournal from './pages/GriefJournal'
import SpiritualJourney from './pages/SpiritualJourney'
import ParentingLog from './pages/ParentingLog'
import SideProjects from './pages/SideProjects'
import VolunteerLog from './pages/VolunteerLog'
import TravelLog from './pages/TravelLog'
import LanguageLearning from './pages/LanguageLearning'
import DietTracker from './pages/DietTracker'
import PetCare from './pages/PetCare'
import HomeImprovement from './pages/HomeImprovement'
import MentoringJournal from './pages/MentoringJournal'
import PublicSpeaking from './pages/PublicSpeaking'
import CoffeeLog from './pages/CoffeeLog'
import CreativeProjects from './pages/CreativeProjects'
import HealthSymptoms from './pages/HealthSymptoms'
import InvestmentTracker from './pages/InvestmentTracker'
import WeightTracker from './pages/WeightTracker'

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
              <Route path="/relationships"   element={<Relationships />}  />
              <Route path="/sleep-stats"     element={<SleepAnalytics />} />
              <Route path="/morning-pages"   element={<MorningPages />}   />
              <Route path="/expense-analytics" element={<ExpenseAnalytics />} />
              <Route path="/streaks-calendar"  element={<StreaksCalendar />}  />
              <Route path="/goal-analytics"    element={<GoalAnalytics />}    />
              <Route path="/workout-analytics" element={<WorkoutAnalytics />} />
              <Route path="/nutrition-analytics" element={<NutritionAnalytics />} />
              <Route path="/book-analytics"      element={<BookAnalytics />}      />
              <Route path="/productivity"        element={<ProductivityDashboard />} />
              <Route path="/learning-analytics"  element={<LearningAnalytics />}     />
              <Route path="/project-analytics"   element={<ProjectAnalytics />}      />
              <Route path="/metrics-analytics"  element={<MetricsAnalytics />}     />
              <Route path="/gratitude-analytics"    element={<GratitudeAnalytics />}    />
              <Route path="/relationship-analytics" element={<RelationshipAnalytics />} />
              <Route path="/time-blocking"          element={<TimeBlocking />}          />
              <Route path="/emotions"               element={<EmotionCheck />}          />
              <Route path="/vision-board"          element={<VisionBoard />}           />
              <Route path="/priority-matrix"       element={<PriorityMatrix />}        />
              <Route path="/habit-wizard"          element={<HabitWizard />}           />
              <Route path="/mindset-journal"       element={<MindsetJournal />}        />
              <Route path="/habit-stacking"        element={<HabitStacking />}         />
              <Route path="/daily-wins"            element={<DailyWins />}             />
              <Route path="/reflection"            element={<ReflectionPrompts />}     />
              <Route path="/weekly-scorecard"      element={<WeeklyScorecard />}       />
              <Route path="/accountability"        element={<Accountability />}        />
              <Route path="/sleep-optimizer"      element={<SleepOptimizer />}        />
              <Route path="/financial-goals"      element={<FinancialGoals />}        />
              <Route path="/energy"               element={<EnergyTracker />}         />
              <Route path="/challenge-mode"       element={<ChallengeMode />}         />
              <Route path="/skill-progress"       element={<SkillProgress />}         />
              <Route path="/life-metrics"         element={<LifeMetricsDashboard />}  />
              <Route path="/focus-rituals"        element={<FocusRituals />}          />
              <Route path="/habit-insights"       element={<HabitInsights />}         />
              <Route path="/manifesto"            element={<PersonalManifesto />}     />
              <Route path="/mood-patterns"        element={<MoodPatterns />}          />
              <Route path="/task-analytics"       element={<TaskAnalytics />}         />
              <Route path="/body-composition"     element={<BodyComposition />}       />
              <Route path="/daily-intentions"     element={<DailyIntentions />}       />
              <Route path="/growth-log"           element={<GrowthLog />}             />
              <Route path="/pomodoro"             element={<PomodoroTracker />}       />
              <Route path="/weekly-review"        element={<WeeklyReview />}          />
              <Route path="/mind-map"             element={<MindMapPage />}           />
              <Route path="/life-audit"           element={<LifeAudit />}             />
              <Route path="/anxiety-journal"      element={<AnxietyJournal />}        />
              <Route path="/fitness-goals"        element={<FitnessGoals />}          />
              <Route path="/social-battery"       element={<SocialBattery />}         />
              <Route path="/content-library"      element={<ContentLibrary />}        />
              <Route path="/deep-work"            element={<DeepWorkPlanner />}       />
              <Route path="/streak-challenge"     element={<StreakChallenge />}        />
              <Route path="/life-events"          element={<LifeEvents />}            />
              <Route path="/stress"               element={<StressTracker />}         />
              <Route path="/gratitude-chain"      element={<GratitudeChain />}        />
              <Route path="/okr"                  element={<OKRTracker />}            />
              <Route path="/standup"              element={<DailyStandup />}          />
              <Route path="/study"                element={<StudyTracker />}          />
              <Route path="/kpis"                 element={<PersonalKPIs />}          />
              <Route path="/bucket-list"          element={<BucketList />}            />
              <Route path="/habit-coach"          element={<HabitCoach />}            />
              <Route path="/time-audit"           element={<TimeAudit />}             />
              <Route path="/identity"             element={<IdentityBuilder />}       />
              <Route path="/weekly-wins"          element={<WeeklyWins />}            />
              <Route path="/nightly-review"       element={<NightlyReview />}         />
              <Route path="/power-hour"           element={<PowerHour />}             />
              <Route path="/habit-designer"       element={<HabitDesigner />}         />
              <Route path="/daily-check-in"       element={<DailyCheckIn />}          />
              <Route path="/xp-center"            element={<XPCenter />}              />
              <Route path="/cognitive-reframe"    element={<CognitiveReframe />}      />
              <Route path="/personal-brand"       element={<PersonalBrand />}         />
              <Route path="/micro-habits"         element={<MicroHabits />}           />
              <Route path="/success-formula"      element={<SuccessFormula />}        />
              <Route path="/goal-hierarchy"       element={<GoalHierarchy />}         />
              <Route path="/monthly-review"       element={<PerformanceReview />}     />
              <Route path="/focus-journal"        element={<FocusJournal />}          />
              <Route path="/life-map"             element={<LifeMap />}               />
              <Route path="/anti-habits"          element={<AntiHabits />}            />
              <Route path="/life-rules"           element={<LifeRules />}             />
              <Route path="/reward-system"        element={<RewardSystem />}          />
              <Route path="/content-calendar"     element={<ContentCalendar />}       />
              <Route path="/digital-detox"        element={<DigitalDetox />}          />
              <Route path="/emotional-iq"         element={<EmotionalIntelligence />} />
              <Route path="/gratitude-letter"     element={<GratitudeLetter />}       />
              <Route path="/health-dashboard"     element={<HealthDashboard />}       />
              <Route path="/savings-challenge"    element={<SavingsChallenge />}      />
              <Route path="/skill-challenge"      element={<SkillChallenge />}        />
              <Route path="/podcast"              element={<PodcastTracker />}        />
              <Route path="/life-timeline"        element={<LifeTimeline />}          />
              <Route path="/obstacle-log"         element={<ObstacleLog />}           />
              <Route path="/sleep-rituals"        element={<SleepRituals />}          />
              <Route path="/today-focus"          element={<TodayFocus />}            />
              <Route path="/gratitude-jar"        element={<GratitudeJar />}          />
              <Route path="/daily-scorecard"      element={<DailyScorecard />}        />
              <Route path="/breathwork"           element={<BreathworkTimer />}       />
              <Route path="/idea-incubator"       element={<IdeaIncubator />}         />
              <Route path="/project-retro"        element={<ProjectRetro />}          />
              <Route path="/health-metrics"       element={<HealthMetrics />}         />
              <Route path="/mental-health"        element={<MentalHealthLog />}       />
              <Route path="/weekly-sprint"        element={<WeeklySprint />}          />
              <Route path="/personal-okr"         element={<PersonalOKR />}           />
              <Route path="/life-legacy"          element={<LifeLegacy />}            />
              <Route path="/decision-matrix"      element={<DecisionMatrix />}        />
              <Route path="/challenge-calendar"   element={<ChallengeCalendar />}     />
              <Route path="/finance-tracker"      element={<FinanceTracker />}        />
              <Route path="/life-theme"           element={<LifeTheme />}             />
              <Route path="/net-worth"            element={<NetWorthTracker />}       />
              <Route path="/sleep-score"          element={<SleepScore />}            />
              <Route path="/flashcards"           element={<StudyFlashcards />}       />
              <Route path="/recovery"             element={<RecoveryTracker />}       />
              <Route path="/skill-roadmap"        element={<SkillRoadmap />}          />
              <Route path="/quick-capture"        element={<QuickCapture />}          />
              <Route path="/evening-review"       element={<EveningReview />}         />
              <Route path="/year-review"          element={<YearInReview />}          />
              <Route path="/morning-routine"      element={<MorningRoutine />}        />
              <Route path="/conversation-log"     element={<ConversationLog />}       />
              <Route path="/fitness-log"          element={<FitnessLog />}            />
              <Route path="/money-mindset"        element={<MoneyMindset />}          />
              <Route path="/nutrition-goals"      element={<NutritionGoals />}        />
              <Route path="/career"               element={<CareerTracker />}         />
              <Route path="/idea-vault"           element={<IdeaVault />}             />
              <Route path="/project-sprint"       element={<ProjectSprint />}         />
              <Route path="/creative-journal"     element={<CreativeJournal />}       />
              <Route path="/flow-state"           element={<FlowState />}             />
              <Route path="/fear-log"             element={<FearLog />}               />
              <Route path="/win-streak"           element={<WinStreak />}             />
              <Route path="/daily-script"         element={<DailyScript />}           />
              <Route path="/life-vision"          element={<LifeVision />}            />
              <Route path="/life-chapters"        element={<LifeChapters />}          />
              <Route path="/network-map"          element={<NetworkMap />}            />
              <Route path="/training-plan"        element={<TrainingPlan />}          />
              <Route path="/grief-journal"        element={<GriefJournal />}          />
              <Route path="/spiritual"            element={<SpiritualJourney />}      />
              <Route path="/parenting"            element={<ParentingLog />}          />
              <Route path="/side-projects"        element={<SideProjects />}          />
              <Route path="/volunteer"            element={<VolunteerLog />}          />
              <Route path="/travel"               element={<TravelLog />}             />
              <Route path="/languages"            element={<LanguageLearning />}      />
              <Route path="/diet"                 element={<DietTracker />}           />
              <Route path="/pet-care"             element={<PetCare />}               />
              <Route path="/home-improvement"     element={<HomeImprovement />}       />
              <Route path="/mentoring"            element={<MentoringJournal />}      />
              <Route path="/public-speaking"      element={<PublicSpeaking />}        />
              <Route path="/coffee-log"           element={<CoffeeLog />}             />
              <Route path="/creative-projects"    element={<CreativeProjects />}      />
              <Route path="/health-symptoms"      element={<HealthSymptoms />}        />
              <Route path="/investments"          element={<InvestmentTracker />}     />
              <Route path="/weight"               element={<WeightTracker />}         />
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
