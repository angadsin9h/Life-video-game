import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppShell from './components/AppShell'
import { ToastProvider } from './contexts/ToastContext'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
const AccountPage = lazy(() => import('./pages/AccountPage'))
import Dashboard from './pages/Dashboard'
const LogTasks = lazy(() => import('./pages/LogTasks'))
const Progress = lazy(() => import('./pages/Progress'))
const AICoach = lazy(() => import('./pages/AICoach'))
const Goals = lazy(() => import('./pages/Goals'))
const Achievements = lazy(() => import('./pages/Achievements'))
const Habits = lazy(() => import('./pages/Habits'))
const BossBattle = lazy(() => import('./pages/BossBattle'))
const Journal = lazy(() => import('./pages/Journal'))
const Heatmap = lazy(() => import('./pages/Heatmap'))
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'))
const Timer = lazy(() => import('./pages/Timer'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const SkillTree = lazy(() => import('./pages/SkillTree'))
const Quests = lazy(() => import('./pages/Quests'))
const Milestones = lazy(() => import('./pages/Milestones'))
const Challenges = lazy(() => import('./pages/Challenges'))
const Insights = lazy(() => import('./pages/Insights'))
const MoodTracker = lazy(() => import('./pages/MoodTracker'))
const Notes = lazy(() => import('./pages/Notes'))
const DailyReview = lazy(() => import('./pages/DailyReview'))
const BodyMetrics = lazy(() => import('./pages/BodyMetrics'))
const Planner = lazy(() => import('./pages/Planner'))
const Gratitude = lazy(() => import('./pages/Gratitude'))
const Records = lazy(() => import('./pages/Records'))
const Intentions = lazy(() => import('./pages/Intentions'))
const LifeScore = lazy(() => import('./pages/LifeScore'))
const CategoryGoals = lazy(() => import('./pages/CategoryGoals'))
const FocusSessions = lazy(() => import('./pages/FocusSessions'))
const YearView = lazy(() => import('./pages/YearView'))
const Affirmations = lazy(() => import('./pages/Affirmations'))
const MoodAnalytics = lazy(() => import('./pages/MoodAnalytics'))
const WeeklyGoals = lazy(() => import('./pages/WeeklyGoals'))
const Breathing = lazy(() => import('./pages/Breathing'))
const SleepTracker = lazy(() => import('./pages/SleepTracker'))
const HabitAnalytics = lazy(() => import('./pages/HabitAnalytics'))
const DailyChallenge = lazy(() => import('./pages/DailyChallenge'))
const Books = lazy(() => import('./pages/Books'))
const Workouts = lazy(() => import('./pages/Workouts'))
const Expenses = lazy(() => import('./pages/Expenses'))
const Briefing = lazy(() => import('./pages/Briefing'))
const Nutrition = lazy(() => import('./pages/Nutrition'))
const Timeline = lazy(() => import('./pages/Timeline'))
const LifeCalendar = lazy(() => import('./pages/LifeCalendar'))
const Streaks = lazy(() => import('./pages/Streaks'))
const CheckIn = lazy(() => import('./pages/CheckIn'))
const WindDown = lazy(() => import('./pages/WindDown'))
const Learning = lazy(() => import('./pages/Learning'))
const AmbientFocus = lazy(() => import('./pages/AmbientFocus'))
const TaskBoard = lazy(() => import('./pages/TaskBoard'))
const Routines = lazy(() => import('./pages/Routines'))
const LifeWheel = lazy(() => import('./pages/LifeWheel'))
const DecisionJournal = lazy(() => import('./pages/DecisionJournal'))
const Values = lazy(() => import('./pages/Values'))
const WeeklyPlanning = lazy(() => import('./pages/WeeklyPlanning'))
const XPLog = lazy(() => import('./pages/XPLog'))
const WaterTracker = lazy(() => import('./pages/WaterTracker'))
const FocusStats = lazy(() => import('./pages/FocusStats'))
const JournalInsights = lazy(() => import('./pages/JournalInsights'))
const MealPlanner = lazy(() => import('./pages/MealPlanner'))
const ReadingNotes = lazy(() => import('./pages/ReadingNotes'))
const Projects = lazy(() => import('./pages/Projects'))
const WellnessCheck = lazy(() => import('./pages/WellnessCheck'))
const MeditationTimer = lazy(() => import('./pages/MeditationTimer'))
const HabitChallenges = lazy(() => import('./pages/HabitChallenges'))
const LifeOS = lazy(() => import('./pages/LifeOS'))
const QuoteJournal = lazy(() => import('./pages/QuoteJournal'))
const Relationships = lazy(() => import('./pages/Relationships'))
const SleepAnalytics = lazy(() => import('./pages/SleepAnalytics'))
const MorningPages = lazy(() => import('./pages/MorningPages'))
const ExpenseAnalytics = lazy(() => import('./pages/ExpenseAnalytics'))
const StreaksCalendar = lazy(() => import('./pages/StreaksCalendar'))
const GoalAnalytics = lazy(() => import('./pages/GoalAnalytics'))
const WorkoutAnalytics = lazy(() => import('./pages/WorkoutAnalytics'))
const NutritionAnalytics = lazy(() => import('./pages/NutritionAnalytics'))
const BookAnalytics = lazy(() => import('./pages/BookAnalytics'))
const ProductivityDashboard = lazy(() => import('./pages/ProductivityDashboard'))
const LearningAnalytics = lazy(() => import('./pages/LearningAnalytics'))
const ProjectAnalytics = lazy(() => import('./pages/ProjectAnalytics'))
const MetricsAnalytics = lazy(() => import('./pages/MetricsAnalytics'))
const GratitudeAnalytics = lazy(() => import('./pages/GratitudeAnalytics'))
const RelationshipAnalytics = lazy(() => import('./pages/RelationshipAnalytics'))
const TimeBlocking = lazy(() => import('./pages/TimeBlocking'))
const EmotionCheck = lazy(() => import('./pages/EmotionCheck'))
const VisionBoard = lazy(() => import('./pages/VisionBoard'))
const PriorityMatrix = lazy(() => import('./pages/PriorityMatrix'))
const HabitWizard = lazy(() => import('./pages/HabitWizard'))
const MindsetJournal = lazy(() => import('./pages/MindsetJournal'))
const HabitStacking = lazy(() => import('./pages/HabitStacking'))
const DailyWins = lazy(() => import('./pages/DailyWins'))
const ReflectionPrompts = lazy(() => import('./pages/ReflectionPrompts'))
const WeeklyScorecard = lazy(() => import('./pages/WeeklyScorecard'))
const Accountability = lazy(() => import('./pages/Accountability'))
const SleepOptimizer = lazy(() => import('./pages/SleepOptimizer'))
const FinancialGoals = lazy(() => import('./pages/FinancialGoals'))
const EnergyTracker = lazy(() => import('./pages/EnergyTracker'))
const ChallengeMode = lazy(() => import('./pages/ChallengeMode'))
const SkillProgress = lazy(() => import('./pages/SkillProgress'))
const LifeMetricsDashboard = lazy(() => import('./pages/LifeMetricsDashboard'))
const FocusRituals = lazy(() => import('./pages/FocusRituals'))
const HabitInsights = lazy(() => import('./pages/HabitInsights'))
const PersonalManifesto = lazy(() => import('./pages/PersonalManifesto'))
const MoodPatterns = lazy(() => import('./pages/MoodPatterns'))
const TaskAnalytics = lazy(() => import('./pages/TaskAnalytics'))
const BodyComposition = lazy(() => import('./pages/BodyComposition'))
const DailyIntentions = lazy(() => import('./pages/DailyIntentions'))
const GrowthLog = lazy(() => import('./pages/GrowthLog'))
const PomodoroTracker = lazy(() => import('./pages/PomodoroTracker'))
const WeeklyReview = lazy(() => import('./pages/WeeklyReview'))
const MindMapPage = lazy(() => import('./pages/MindMap'))
const LifeAudit = lazy(() => import('./pages/LifeAudit'))
const AnxietyJournal = lazy(() => import('./pages/AnxietyJournal'))
const FitnessGoals = lazy(() => import('./pages/FitnessGoals'))
const SocialBattery = lazy(() => import('./pages/SocialBattery'))
const ContentLibrary = lazy(() => import('./pages/ContentLibrary'))
const DeepWorkPlanner = lazy(() => import('./pages/DeepWorkPlanner'))
const StreakChallenge = lazy(() => import('./pages/StreakChallenge'))
const LifeEvents = lazy(() => import('./pages/LifeEvents'))
const StressTracker = lazy(() => import('./pages/StressTracker'))
const GratitudeChain = lazy(() => import('./pages/GratitudeChain'))
const OKRTracker = lazy(() => import('./pages/OKRTracker'))
const DailyStandup = lazy(() => import('./pages/DailyStandup'))
const StudyTracker = lazy(() => import('./pages/StudyTracker'))
const PersonalKPIs = lazy(() => import('./pages/PersonalKPIs'))
const BucketList = lazy(() => import('./pages/BucketList'))
const HabitCoach = lazy(() => import('./pages/HabitCoach'))
const TimeAudit = lazy(() => import('./pages/TimeAudit'))
const IdentityBuilder = lazy(() => import('./pages/IdentityBuilder'))
const WeeklyWins = lazy(() => import('./pages/WeeklyWins'))
const NightlyReview = lazy(() => import('./pages/NightlyReview'))
const PowerHour = lazy(() => import('./pages/PowerHour'))
const HabitDesigner = lazy(() => import('./pages/HabitDesigner'))
const DailyCheckIn = lazy(() => import('./pages/DailyCheckIn'))
const XPCenter = lazy(() => import('./pages/XPCenter'))
const CognitiveReframe = lazy(() => import('./pages/CognitiveReframe'))
const PersonalBrand = lazy(() => import('./pages/PersonalBrand'))
const MicroHabits = lazy(() => import('./pages/MicroHabits'))
const SuccessFormula = lazy(() => import('./pages/SuccessFormula'))
const GoalHierarchy = lazy(() => import('./pages/GoalHierarchy'))
const PerformanceReview = lazy(() => import('./pages/PerformanceReview'))
const FocusJournal = lazy(() => import('./pages/FocusJournal'))
const LifeMap = lazy(() => import('./pages/LifeMap'))
const AntiHabits = lazy(() => import('./pages/AntiHabits'))
const LifeRules = lazy(() => import('./pages/LifeRules'))
const RewardSystem = lazy(() => import('./pages/RewardSystem'))
const ContentCalendar = lazy(() => import('./pages/ContentCalendar'))
const SkillChallenge = lazy(() => import('./pages/SkillChallenge'))
const PodcastTracker = lazy(() => import('./pages/PodcastTracker'))
const DigitalDetox = lazy(() => import('./pages/DigitalDetox'))
const EmotionalIntelligence = lazy(() => import('./pages/EmotionalIntelligence'))
const GratitudeLetter = lazy(() => import('./pages/GratitudeLetter'))
const HealthDashboard = lazy(() => import('./pages/HealthDashboard'))
const SavingsChallenge = lazy(() => import('./pages/SavingsChallenge'))
const LifeTimeline = lazy(() => import('./pages/LifeTimeline'))
const ObstacleLog = lazy(() => import('./pages/ObstacleLog'))
const SleepRituals = lazy(() => import('./pages/SleepRituals'))
const TodayFocus = lazy(() => import('./pages/TodayFocus'))
const GratitudeJar = lazy(() => import('./pages/GratitudeJar'))
const DailyScorecard = lazy(() => import('./pages/DailyScorecard'))
const BreathworkTimer = lazy(() => import('./pages/BreathworkTimer'))
const IdeaIncubator = lazy(() => import('./pages/IdeaIncubator'))
const ProjectRetro = lazy(() => import('./pages/ProjectRetro'))
const HealthMetrics = lazy(() => import('./pages/HealthMetrics'))
const MentalHealthLog = lazy(() => import('./pages/MentalHealthLog'))
const WeeklySprint = lazy(() => import('./pages/WeeklySprint'))
const PersonalOKR = lazy(() => import('./pages/PersonalOKR'))
const LifeLegacy = lazy(() => import('./pages/LifeLegacy'))
const DecisionMatrix = lazy(() => import('./pages/DecisionMatrix'))
const ChallengeCalendar = lazy(() => import('./pages/ChallengeCalendar'))
const FinanceTracker = lazy(() => import('./pages/FinanceTracker'))
const LifeTheme = lazy(() => import('./pages/LifeTheme'))
const NetWorthTracker = lazy(() => import('./pages/NetWorthTracker'))
const SleepScore = lazy(() => import('./pages/SleepScore'))
const StudyFlashcards = lazy(() => import('./pages/StudyFlashcards'))
const RecoveryTracker = lazy(() => import('./pages/RecoveryTracker'))
const SkillRoadmap = lazy(() => import('./pages/SkillRoadmap'))
const QuickCapture = lazy(() => import('./pages/QuickCapture'))
const ConversationLog = lazy(() => import('./pages/ConversationLog'))
const FitnessLog = lazy(() => import('./pages/FitnessLog'))
const EveningReview = lazy(() => import('./pages/EveningReview'))
const YearInReview = lazy(() => import('./pages/YearInReview'))
const MorningRoutine = lazy(() => import('./pages/MorningRoutine'))
const MoneyMindset = lazy(() => import('./pages/MoneyMindset'))
const NutritionGoals = lazy(() => import('./pages/NutritionGoals'))
const CareerTracker = lazy(() => import('./pages/CareerTracker'))
const IdeaVault = lazy(() => import('./pages/IdeaVault'))
const ProjectSprint = lazy(() => import('./pages/ProjectSprint'))
const CreativeJournal = lazy(() => import('./pages/CreativeJournal'))
const FlowState = lazy(() => import('./pages/FlowState'))
const FearLog = lazy(() => import('./pages/FearLog'))
const WinStreak = lazy(() => import('./pages/WinStreak'))
const DailyScript = lazy(() => import('./pages/DailyScript'))
const LifeVision = lazy(() => import('./pages/LifeVision'))
const LifeChapters = lazy(() => import('./pages/LifeChapters'))
const NetworkMap = lazy(() => import('./pages/NetworkMap'))
const TrainingPlan = lazy(() => import('./pages/TrainingPlan'))
const GriefJournal = lazy(() => import('./pages/GriefJournal'))
const SpiritualJourney = lazy(() => import('./pages/SpiritualJourney'))
const ParentingLog = lazy(() => import('./pages/ParentingLog'))
const SideProjects = lazy(() => import('./pages/SideProjects'))
const VolunteerLog = lazy(() => import('./pages/VolunteerLog'))
const TravelLog = lazy(() => import('./pages/TravelLog'))
const LanguageLearning = lazy(() => import('./pages/LanguageLearning'))
const DietTracker = lazy(() => import('./pages/DietTracker'))
const PetCare = lazy(() => import('./pages/PetCare'))
const HomeImprovement = lazy(() => import('./pages/HomeImprovement'))
const MentoringJournal = lazy(() => import('./pages/MentoringJournal'))
const PublicSpeaking = lazy(() => import('./pages/PublicSpeaking'))
const CoffeeLog = lazy(() => import('./pages/CoffeeLog'))
const CreativeProjects = lazy(() => import('./pages/CreativeProjects'))
const HealthSymptoms = lazy(() => import('./pages/HealthSymptoms'))
const InvestmentTracker = lazy(() => import('./pages/InvestmentTracker'))
const WeightTracker = lazy(() => import('./pages/WeightTracker'))
const CharityTracker = lazy(() => import('./pages/CharityTracker'))
const MoodBoard = lazy(() => import('./pages/MoodBoard'))
const LessonLearned = lazy(() => import('./pages/LessonLearned'))
const ConflictLog = lazy(() => import('./pages/ConflictLog'))
const GardeningLog = lazy(() => import('./pages/GardeningLog'))
const ReadingChallenge = lazy(() => import('./pages/ReadingChallenge'))
const NegotiationLog = lazy(() => import('./pages/NegotiationLog'))
const LoveLanguages = lazy(() => import('./pages/LoveLanguages'))
const DreamsJournal = lazy(() => import('./pages/DreamsJournal'))
const GratitudeToParents = lazy(() => import('./pages/GratitudeToParents'))
const MindfulEating = lazy(() => import('./pages/MindfulEating'))
const HobbiesTracker = lazy(() => import('./pages/HobbiesTracker'))
const SkinCareLog = lazy(() => import('./pages/SkinCareLog'))
const CareerSkills = lazy(() => import('./pages/CareerSkills'))
const MorningMindset = lazy(() => import('./pages/MorningMindset'))
const AllergyLog = lazy(() => import('./pages/AllergyLog'))
const PasswordVault = lazy(() => import('./pages/PasswordVault'))
const SportStats = lazy(() => import('./pages/SportStats'))
const ForgivenessLog = lazy(() => import('./pages/ForgivenessLog'))
const EcoTracker = lazy(() => import('./pages/EcoTracker'))
const LifeRegrets = lazy(() => import('./pages/LifeRegrets'))
const FutureLetters = lazy(() => import('./pages/FutureLetters'))
const PersonalPolicies = lazy(() => import('./pages/PersonalPolicies'))
const MonthlyRetro = lazy(() => import('./pages/MonthlyRetro'))
const TherapyLog = lazy(() => import('./pages/TherapyLog'))
const SupplementLog = lazy(() => import('./pages/SupplementLog'))
const ScreenTimeLog = lazy(() => import('./pages/ScreenTimeLog'))
const RecipeJournal = lazy(() => import('./pages/RecipeJournal'))
const SocialCalendar = lazy(() => import('./pages/SocialCalendar'))
const PersonalInventory = lazy(() => import('./pages/PersonalInventory'))
const GiftIdeas = lazy(() => import('./pages/GiftIdeas'))
const AppointmentsLog = lazy(() => import('./pages/AppointmentsLog'))
const WishList = lazy(() => import('./pages/WishList'))
const MemoriesVault = lazy(() => import('./pages/MemoriesVault'))
const PersonalChallenges = lazy(() => import('./pages/PersonalChallenges'))
const HealthVitals = lazy(() => import('./pages/HealthVitals'))
const PersonalResearch = lazy(() => import('./pages/PersonalResearch'))
const DailyAffirmations = lazy(() => import('./pages/DailyAffirmations'))
const BodyScanLog = lazy(() => import('./pages/BodyScanLog'))
const ExerciseLog = lazy(() => import('./pages/ExerciseLog'))
const CareerJourney = lazy(() => import('./pages/CareerJourney'))
const MentalModels = lazy(() => import('./pages/MentalModels'))
const TravelPlanner = lazy(() => import('./pages/TravelPlanner'))
const MoneyTracker = lazy(() => import('./pages/MoneyTracker'))
const CreativityLog = lazy(() => import('./pages/CreativityLog'))
const PersonalBrandBuilder = lazy(() => import('./pages/PersonalBrandBuilder'))
const FoodDiary = lazy(() => import('./pages/FoodDiary'))
const FinancialLiteracy = lazy(() => import('./pages/FinancialLiteracy'))
const PasswordJournal = lazy(() => import('./pages/PasswordJournal'))
const RelationshipGoals = lazy(() => import('./pages/RelationshipGoals'))
const LifeExperiences = lazy(() => import('./pages/LifeExperiences'))
const BudgetPlanner = lazy(() => import('./pages/BudgetPlanner'))
const SleepDiary = lazy(() => import('./pages/SleepDiary'))
const LifePhilosophy = lazy(() => import('./pages/LifePhilosophy'))
const MusicLog = lazy(() => import('./pages/MusicLog'))
const MoviesLog = lazy(() => import('./pages/MoviesLog'))
const FamilyTree = lazy(() => import('./pages/FamilyTree'))
const CommunicationLog = lazy(() => import('./pages/CommunicationLog'))
const LanguageJournal = lazy(() => import('./pages/LanguageJournal'))
const VisionJournal = lazy(() => import('./pages/VisionJournal'))
const PersonalConstitution = lazy(() => import('./pages/PersonalConstitution'))
const FriendshipTracker = lazy(() => import('./pages/FriendshipTracker'))
const DigitalFootprint = lazy(() => import('./pages/DigitalFootprint'))
const LifeLetters = lazy(() => import('./pages/LifeLetters'))
const MindfulnessLog = lazy(() => import('./pages/MindfulnessLog'))
const AngerLog = lazy(() => import('./pages/AngerLog'))
const CuriosityJournal = lazy(() => import('./pages/CuriosityJournal'))
const PersonalTimeCapsule = lazy(() => import('./pages/PersonalTimeCapsule'))
const WorkplaceLog = lazy(() => import('./pages/WorkplaceLog'))
const SuccessStories = lazy(() => import('./pages/SuccessStories'))
const ConfidenceBuilder = lazy(() => import('./pages/ConfidenceBuilder'))
const SocialSkillsLog = lazy(() => import('./pages/SocialSkillsLog'))
const LifeNumbersTracker = lazy(() => import('./pages/LifeNumbersTracker'))
const PersonalMythology = lazy(() => import('./pages/PersonalMythology'))
const DailyQuestions = lazy(() => import('./pages/DailyQuestions'))
const EnergyAudit = lazy(() => import('./pages/EnergyAudit'))
const MoralCompass = lazy(() => import('./pages/MoralCompass'))
const SabbaticalPlanner = lazy(() => import('./pages/SabbaticalPlanner'))
const AdventureLog = lazy(() => import('./pages/AdventureLog'))
const DatingJournal = lazy(() => import('./pages/DatingJournal'))
const BreakupJournal = lazy(() => import('./pages/BreakupJournal'))
const SelfCarePlan = lazy(() => import('./pages/SelfCarePlan'))
const MonthlyIntentions = lazy(() => import('./pages/MonthlyIntentions'))
const PersonalLegacy = lazy(() => import('./pages/PersonalLegacy'))
const ClimateLog = lazy(() => import('./pages/ClimateLog'))
const JoyLog = lazy(() => import('./pages/JoyLog'))
const LearningGoals = lazy(() => import('./pages/LearningGoals'))
const LifePurpose = lazy(() => import('./pages/LifePurpose'))
const ThoughtPatterns = lazy(() => import('./pages/ThoughtPatterns'))
const PersonalFinanceRatios = lazy(() => import('./pages/PersonalFinanceRatios'))
const HabitMindsetShift = lazy(() => import('./pages/HabitMindsetShift'))
const GratefulMoments = lazy(() => import('./pages/GratefulMoments'))
const SkillInventory = lazy(() => import('./pages/SkillInventory'))
const WeeklyReflection = lazy(() => import('./pages/WeeklyReflection'))
const MantraLog = lazy(() => import('./pages/MantraLog'))
const PersonalSWOT = lazy(() => import('./pages/PersonalSWOT'))
const GoalPostMortem = lazy(() => import('./pages/GoalPostMortem'))
const SelfTalk = lazy(() => import('./pages/SelfTalk'))
const VulnerabilityLog = lazy(() => import('./pages/VulnerabilityLog'))
const MicroWins = lazy(() => import('./pages/MicroWins'))
const RelationshipValues = lazy(() => import('./pages/RelationshipValues'))
const FocusBatteries = lazy(() => import('./pages/FocusBatteries'))
const RitualsLog = lazy(() => import('./pages/RitualsLog'))
const InnerCriticLog = lazy(() => import('./pages/InnerCriticLog'))
const PeakPerformance = lazy(() => import('./pages/PeakPerformance'))
const BreathworkLog = lazy(() => import('./pages/BreathworkLog'))
const PersonalPRs = lazy(() => import('./pages/PersonalPRs'))
const EmotionLibrary = lazy(() => import('./pages/EmotionLibrary'))
const SocialProjects = lazy(() => import('./pages/SocialProjects'))
const DigitalMinimalism = lazy(() => import('./pages/DigitalMinimalism'))
const NutritionWins = lazy(() => import('./pages/NutritionWins'))
const CrisisLog = lazy(() => import('./pages/CrisisLog'))
const StrengthsLog = lazy(() => import('./pages/StrengthsLog'))
const TimeWasters = lazy(() => import('./pages/TimeWasters'))
const HealthHabits = lazy(() => import('./pages/HealthHabits'))
const WisdomLog = lazy(() => import('./pages/WisdomLog'))
const GratitudePractice = lazy(() => import('./pages/GratitudePractice'))
const MindfulMovement = lazy(() => import('./pages/MindfulMovement'))
const ExperienceLedger = lazy(() => import('./pages/ExperienceLedger'))
const ConfidenceJournal = lazy(() => import('./pages/ConfidenceJournal'))
const MonthlyGoals = lazy(() => import('./pages/MonthlyGoals'))
const BodyLanguageLog = lazy(() => import('./pages/BodyLanguageLog'))
const ReadingList = lazy(() => import('./pages/ReadingList'))
const PersonalValues2 = lazy(() => import('./pages/PersonalValues2'))
const AnnualReview = lazy(() => import('./pages/AnnualReview'))
const GoalReview = lazy(() => import('./pages/GoalReview'))
const NegativeVisualization = lazy(() => import('./pages/NegativeVisualization'))
const RelapseLog = lazy(() => import('./pages/RelapseLog'))
const EnergyFood = lazy(() => import('./pages/EnergyFood'))
const LifeInterests = lazy(() => import('./pages/LifeInterests'))
const BoundariesLog = lazy(() => import('./pages/BoundariesLog'))
const PhilosophyNotes = lazy(() => import('./pages/PhilosophyNotes'))
const SleepGoals = lazy(() => import('./pages/SleepGoals'))
const ChallengeTracker = lazy(() => import('./pages/ChallengeTracker'))
const PersonalDebts = lazy(() => import('./pages/PersonalDebts'))
const PersonalAudit = lazy(() => import('./pages/PersonalAudit'))
const LegacyLetters = lazy(() => import('./pages/LegacyLetters'))
const EmotionalTriggers = lazy(() => import('./pages/EmotionalTriggers'))
const StoicPractice = lazy(() => import('./pages/StoicPractice'))
const CourageLog = lazy(() => import('./pages/CourageLog'))
const EgoJournal = lazy(() => import('./pages/EgoJournal'))
const IntentionSetter = lazy(() => import('./pages/IntentionSetter'))
const MotivationLog = lazy(() => import('./pages/MotivationLog'))
const HabitAutopsy = lazy(() => import('./pages/HabitAutopsy'))
const ProcrastinationLog = lazy(() => import('./pages/ProcrastinationLog'))
const MentorQuotes = lazy(() => import('./pages/MentorQuotes'))
const PersonalCredo = lazy(() => import('./pages/PersonalCredo'))
const GrowthEdges = lazy(() => import('./pages/GrowthEdges'))
const ShadowWork = lazy(() => import('./pages/ShadowWork'))
const LifeDesign = lazy(() => import('./pages/LifeDesign'))
const PowerBeliefs = lazy(() => import('./pages/PowerBeliefs'))
const FamilyGoals = lazy(() => import('./pages/FamilyGoals'))
const MicroJournal = lazy(() => import('./pages/MicroJournal'))
const ExerciseLibrary = lazy(() => import('./pages/ExerciseLibrary'))
const MealLog = lazy(() => import('./pages/MealLog'))
const MindsetShifts = lazy(() => import('./pages/MindsetShifts'))
const FinancialIndependence = lazy(() => import('./pages/FinancialIndependence'))
const SocialCircle = lazy(() => import('./pages/SocialCircle'))
const CareerMilestones = lazy(() => import('./pages/CareerMilestones'))
const PersonalRituals = lazy(() => import('./pages/PersonalRituals'))
const SkillGaps = lazy(() => import('./pages/SkillGaps'))
const PainPoints = lazy(() => import('./pages/PainPoints'))
const DisciplineLog = lazy(() => import('./pages/DisciplineLog'))
const WinJournal = lazy(() => import('./pages/WinJournal'))
const GratitudeMap = lazy(() => import('./pages/GratitudeMap'))
const LifeContracts = lazy(() => import('./pages/LifeContracts'))
const FocusModes = lazy(() => import('./pages/FocusModes'))
const SpiritualPractice = lazy(() => import('./pages/SpiritualPractice'))
const PerformanceLog = lazy(() => import('./pages/PerformanceLog'))
const ObstacleMap = lazy(() => import('./pages/ObstacleMap'))
const ResilienceLog = lazy(() => import('./pages/ResilienceLog'))
const BreakLog = lazy(() => import('./pages/BreakLog'))
const CharacterSheet = lazy(() => import('./pages/CharacterSheet'))
const DebtFreeJourney = lazy(() => import('./pages/DebtFreeJourney'))
const LifeExperiments = lazy(() => import('./pages/LifeExperiments'))
const MindfulnessTimer = lazy(() => import('./pages/MindfulnessTimer'))
const HealthProtocols = lazy(() => import('./pages/HealthProtocols'))
const NetworkBuilder = lazy(() => import('./pages/NetworkBuilder'))
const LearningRoadmap = lazy(() => import('./pages/LearningRoadmap'))
const MorningMindfulnessJournal = lazy(() => import('./pages/MorningMindfulnessJournal'))
const EveningWindDown = lazy(() => import('./pages/EveningWindDown'))
const ValuesAlignment = lazy(() => import('./pages/ValuesAlignment'))
const BodyBudget = lazy(() => import('./pages/BodyBudget'))
const GoalSprint = lazy(() => import('./pages/GoalSprint'))
const ThoughtLeadership = lazy(() => import('./pages/ThoughtLeadership'))
const FearInventory = lazy(() => import('./pages/FearInventory'))
const InvestmentPortfolio = lazy(() => import('./pages/InvestmentPortfolio'))
const HabitStacks = lazy(() => import('./pages/HabitStacks'))
const IdentityLog = lazy(() => import('./pages/IdentityLog'))
const RelationshipNurture = lazy(() => import('./pages/RelationshipNurture'))
const LifePhilosophyLog = lazy(() => import('./pages/LifePhilosophyLog'))
const SuccessRituals = lazy(() => import('./pages/SuccessRituals'))
const AntifragileLog = lazy(() => import('./pages/AntifragileLog'))
const DeepWorkSession = lazy(() => import('./pages/DeepWorkSession'))
const ClarityJournal = lazy(() => import('./pages/ClarityJournal'))
const MindsetArmor = lazy(() => import('./pages/MindsetArmor'))
const LifeConversations = lazy(() => import('./pages/LifeConversations'))
const PersonalBoardroom = lazy(() => import('./pages/PersonalBoardroom'))
const FlowTriggers = lazy(() => import('./pages/FlowTriggers'))
const GrowthChallenges = lazy(() => import('./pages/GrowthChallenges'))
const StrategicVision = lazy(() => import('./pages/StrategicVision'))
const EmotionalRegulation = lazy(() => import('./pages/EmotionalRegulation'))
const PurposeAlignment = lazy(() => import('./pages/PurposeAlignment'))
const LifeMoments = lazy(() => import('./pages/LifeMoments'))
const BeliefSystem = lazy(() => import('./pages/BeliefSystem'))
const SocialContributions = lazy(() => import('./pages/SocialContributions'))
const MoneyBeliefs = lazy(() => import('./pages/MoneyBeliefs'))
const CognitiveLoad = lazy(() => import('./pages/CognitiveLoad'))
const SkillMastery = lazy(() => import('./pages/SkillMastery'))
const HealthOptimization = lazy(() => import('./pages/HealthOptimization'))
const CreativeProcess = lazy(() => import('./pages/CreativeProcess'))
const LifeBalance = lazy(() => import('./pages/LifeBalance'))
const MortalityLog = lazy(() => import('./pages/MortalityLog'))
const DecisionArchive = lazy(() => import('./pages/DecisionArchive'))
const PersonalAlgorithm = lazy(() => import('./pages/PersonalAlgorithm'))
const WellbeingCheck = lazy(() => import('./pages/WellbeingCheck'))
const GratitudeDepth = lazy(() => import('./pages/GratitudeDepth'))
const AbundanceMindset = lazy(() => import('./pages/AbundanceMindset'))
const PowerMoments = lazy(() => import('./pages/PowerMoments'))
const IntegrityLog = lazy(() => import('./pages/IntegrityLog'))
const SoulPurpose = lazy(() => import('./pages/SoulPurpose'))
const LifeCurriculum = lazy(() => import('./pages/LifeCurriculum'))
const FutureSelfLog = lazy(() => import('./pages/FutureSelfLog'))
const PeakStateLog = lazy(() => import('./pages/PeakStateLog'))
const InnerDialogue = lazy(() => import('./pages/InnerDialogue'))
const ContributionLog = lazy(() => import('./pages/ContributionLog'))
const MindBodyLog = lazy(() => import('./pages/MindBodyLog'))
const WisdomArchive = lazy(() => import('./pages/WisdomArchive'))
const GratitudeForChallenges = lazy(() => import('./pages/GratitudeForChallenges'))
const LifeExitStrategy = lazy(() => import('./pages/LifeExitStrategy'))
const CharacterVirtues = lazy(() => import('./pages/CharacterVirtues'))
const LifeExperimentLog = lazy(() => import('./pages/LifeExperimentLog'))
const LifePhases = lazy(() => import('./pages/LifePhases'))
const RelationshipDepth = lazy(() => import('./pages/RelationshipDepth'))
const NarrativeReframe = lazy(() => import('./pages/NarrativeReframe'))
const ValueHierarchy = lazy(() => import('./pages/ValueHierarchy'))
const MindfulnessDepth = lazy(() => import('./pages/MindfulnessDepth'))
const SuccessDNA = lazy(() => import('./pages/SuccessDNA'))
const LifeInvestments = lazy(() => import('./pages/LifeInvestments'))
const ThinkingStyles = lazy(() => import('./pages/ThinkingStyles'))
const LifeOptimizer = lazy(() => import('./pages/LifeOptimizer'))
const DeepListening = lazy(() => import('./pages/DeepListening'))
const EmotionMastery = lazy(() => import('./pages/EmotionMastery'))
const PresenceLog = lazy(() => import('./pages/PresenceLog'))
const CompassionLog = lazy(() => import('./pages/CompassionLog'))
const LegacyBuilder = lazy(() => import('./pages/LegacyBuilder'))
const LifeAlchemy = lazy(() => import('./pages/LifeAlchemy'))
const ExistentialLog = lazy(() => import('./pages/ExistentialLog'))
const InnerPeaceLog = lazy(() => import('./pages/InnerPeaceLog'))
const ServiceLog = lazy(() => import('./pages/ServiceLog'))
const CreativeFlow = lazy(() => import('./pages/CreativeFlow'))
const GrowthMindset = lazy(() => import('./pages/GrowthMindset'))
const WealthMindset = lazy(() => import('./pages/WealthMindset'))
const BoundaryBuilder = lazy(() => import('./pages/BoundaryBuilder'))
const HealingJournal = lazy(() => import('./pages/HealingJournal'))
const VisionCasting = lazy(() => import('./pages/VisionCasting'))
const PurposeLog = lazy(() => import('./pages/PurposeLog'))
const SelfMasteryLog = lazy(() => import('./pages/SelfMasteryLog'))
const TimePhilosophy = lazy(() => import('./pages/TimePhilosophy'))
const JoyDesign = lazy(() => import('./pages/JoyDesign'))
const EnergyBudget = lazy(() => import('./pages/EnergyBudget'))
const InspiredAction = lazy(() => import('./pages/InspiredAction'))
const MindfulCommunication = lazy(() => import('./pages/MindfulCommunication'))
const PhysicalPeak = lazy(() => import('./pages/PhysicalPeak'))
const SocialIntelligence = lazy(() => import('./pages/SocialIntelligence'))
const DailyExcellence = lazy(() => import('./pages/DailyExcellence'))
const LifeReview = lazy(() => import('./pages/LifeReview'))
const ResilientThinking = lazy(() => import('./pages/ResilientThinking'))
const DigitalWellness = lazy(() => import('./pages/DigitalWellness'))
const NeuroplasticityLog = lazy(() => import('./pages/NeuroplasticityLog'))
const IntuitiveDecision = lazy(() => import('./pages/IntuitiveDecision'))
const BodyWisdom = lazy(() => import('./pages/BodyWisdom'))
const GratitudeToself = lazy(() => import('./pages/GratitudeToself'))
const WillpowerLog = lazy(() => import('./pages/WillpowerLog'))
const MindfulSleep = lazy(() => import('./pages/MindfulSleep'))
const ConflictResolution = lazy(() => import('./pages/ConflictResolution'))
const AbundanceLog = lazy(() => import('./pages/AbundanceLog'))
const LifeRhythm = lazy(() => import('./pages/LifeRhythm'))
const HighPerformance = lazy(() => import('./pages/HighPerformance'))
const ScreenTimeConnect = lazy(() => import('./pages/ScreenTimeConnect'))
const LifeScoreEngine = lazy(() => import('./pages/LifeScoreEngine'))
const UltimateMorningRitual = lazy(() => import('./pages/UltimateMorningRitual'))
const IkigaiCompass = lazy(() => import('./pages/IkigaiCompass'))
const CommandCenter = lazy(() => import('./pages/CommandCenter'))
const DailyDriver = lazy(() => import('./pages/DailyDriver'))
const WeeklyPowerSession = lazy(() => import('./pages/WeeklyPowerSession'))
const LifeGPS = lazy(() => import('./pages/LifeGPS'))
const NightlyDebrief = lazy(() => import('./pages/NightlyDebrief'))
const PersonalPlaybook = lazy(() => import('./pages/PersonalPlaybook'))
const MindBodyBalance = lazy(() => import('./pages/MindBodyBalance'))
const EmotionalDashboard = lazy(() => import('./pages/EmotionalDashboard'))
const StrategicLifePlan = lazy(() => import('./pages/StrategicLifePlan'))
const HabitMatrix = lazy(() => import('./pages/HabitMatrix'))
const LifeCheckup = lazy(() => import('./pages/LifeCheckup'))
const FlowStateTracker = lazy(() => import('./pages/FlowStateTracker'))
const MindfulnessCenter = lazy(() => import('./pages/MindfulnessCenter'))
const WealthBuilder = lazy(() => import('./pages/WealthBuilder'))
const RelationshipTracker = lazy(() => import('./pages/RelationshipTracker'))
const CreativeStudio = lazy(() => import('./pages/CreativeStudio'))
const DeepWorkLog = lazy(() => import('./pages/DeepWorkLog'))
const GrowthJournal = lazy(() => import('./pages/GrowthJournal'))
const LifeEnergy = lazy(() => import('./pages/LifeEnergy'))
const IdentityArchitect = lazy(() => import('./pages/IdentityArchitect'))
const ValueAlignmentLog = lazy(() => import('./pages/ValueAlignmentLog'))
const WinBoard = lazy(() => import('./pages/WinBoard'))
const ReflectionEngine = lazy(() => import('./pages/ReflectionEngine'))
const LifeRating = lazy(() => import('./pages/LifeRating'))
const LifeMetricsHub = lazy(() => import('./pages/LifeMetricsHub'))
const MorningPowerup = lazy(() => import('./pages/MorningPowerup'))

const GoalCrusher = lazy(() => import('./pages/GoalCrusher'))
const HabitEvolution = lazy(() => import('./pages/HabitEvolution'))
const SpiritualLog = lazy(() => import('./pages/SpiritualLog'))
const ObstacleDestroyer = lazy(() => import('./pages/ObstacleDestroyer'))
const FocusProtocol = lazy(() => import('./pages/FocusProtocol'))
const BodyOptimizer = lazy(() => import('./pages/BodyOptimizer'))
const MindsetGym = lazy(() => import('./pages/MindsetGym'))
const LifeDesignBoard = lazy(() => import('./pages/LifeDesignBoard'))
const GratitudePower = lazy(() => import('./pages/GratitudePower'))
const SuccessBlueprintLog = lazy(() => import('./pages/SuccessBlueprintLog'))
const TimeInvestment = lazy(() => import('./pages/TimeInvestment'))
const ClaritySession = lazy(() => import('./pages/ClaritySession'))
const PeakMomentLog = lazy(() => import('./pages/PeakMomentLog'))
const ChallengeAcceptor = lazy(() => import('./pages/ChallengeAcceptor'))
const PersonalFinanceLog = lazy(() => import('./pages/PersonalFinanceLog'))
const MentalStrengthLog = lazy(() => import('./pages/MentalStrengthLog'))
const SocialCapitalLog = lazy(() => import('./pages/SocialCapitalLog'))
const LegacyProjectLog = lazy(() => import('./pages/LegacyProjectLog'))
const SelfCompassionLog = lazy(() => import('./pages/SelfCompassionLog'))
const PresenceTracker = lazy(() => import('./pages/PresenceTracker'))
const LifeLab = lazy(() => import('./pages/LifeLab'))
const DailyIntentionSetter = lazy(() => import('./pages/DailyIntentionSetter'))
const MorningIntentionRitual = lazy(() => import('./pages/MorningIntentionRitual'))
const EmotionalAlchemy = lazy(() => import('./pages/EmotionalAlchemy'))
const BodySignalLog = lazy(() => import('./pages/BodySignalLog'))
const MicroMomentLog = lazy(() => import('./pages/MicroMomentLog'))
const LifeForceLog = lazy(() => import('./pages/LifeForceLog'))
const NeuralReprogramming = lazy(() => import('./pages/NeuralReprogramming'))
const ThoughtAudit = lazy(() => import('./pages/ThoughtAudit'))
const EnergyRituals = lazy(() => import('./pages/EnergyRituals'))
const MomentumTracker = lazy(() => import('./pages/MomentumTracker'))
const FearInventoryLog = lazy(() => import('./pages/FearInventoryLog'))
const MindReset = lazy(() => import('./pages/MindReset'))
const VitalityRituals = lazy(() => import('./pages/VitalityRituals'))
const DataHub = lazy(() => import('./pages/DataHub'))
const ReminderSettings = lazy(() => import('./pages/ReminderSettings'))
const LifeHistoryTimeline = lazy(() => import('./pages/LifeHistoryTimeline'))
const WeeklyChanges = lazy(() => import('./pages/WeeklyChanges'))
const MonthlyChanges = lazy(() => import('./pages/MonthlyChanges'))
const ScoreTrends = lazy(() => import('./pages/ScoreTrends'))
import PlatformStatusBar from './components/PlatformStatusBar'
const SleepProtocol = lazy(() => import('./pages/SleepProtocol'))
const QuantifiedSelf = lazy(() => import('./pages/QuantifiedSelf'))
const PersonalMission = lazy(() => import('./pages/PersonalMission'))
const AnnualPlanning = lazy(() => import('./pages/AnnualPlanning'))
const LifeAlignmentPage = lazy(() => import('./pages/LifeAlignmentPage'))
const MomentumDashboard = lazy(() => import('./pages/MomentumDashboard'))
const FutureSelfLetter = lazy(() => import('./pages/FutureSelfLetter'))
const RelationshipHealth = lazy(() => import('./pages/RelationshipHealth'))
const HabitDesignLab = lazy(() => import('./pages/HabitDesignLab'))
const PersonalEconomy = lazy(() => import('./pages/PersonalEconomy'))
const EveningRitualDesigner = lazy(() => import('./pages/EveningRitualDesigner'))
const MentalModelLab = lazy(() => import('./pages/MentalModelLab'))
const BodyReset = lazy(() => import('./pages/BodyReset'))
const LifeVisionBoard = lazy(() => import('./pages/LifeVisionBoard'))
const DailyWinsLog = lazy(() => import('./pages/DailyWinsLog'))
const MorningGratitudeRitual = lazy(() => import('./pages/MorningGratitudeRitual'))
const LifeScorecard = lazy(() => import('./pages/LifeScorecard'))
const WeeklyRetrospective = lazy(() => import('./pages/WeeklyRetrospective'))
const CreativeIdeaVault = lazy(() => import('./pages/CreativeIdeaVault'))
const SkillLevelUp = lazy(() => import('./pages/SkillLevelUp'))
const ProjectTracker = lazy(() => import('./pages/ProjectTrackerPage'))
const SelfCareRitual = lazy(() => import('./pages/SelfCareRitual'))
const GratitudeChainLog = lazy(() => import('./pages/GratitudeChainLog'))
const NutritionPlanner = lazy(() => import('./pages/NutritionPlanner'))
const StressTrackerLog = lazy(() => import('./pages/StressTrackerLog'))
const TimeAuditLog = lazy(() => import('./pages/TimeAuditLog'))
const SleepQualityTracker = lazy(() => import('./pages/SleepQualityTracker'))
const ConcentrationTracker = lazy(() => import('./pages/ConcentrationTracker'))
const DailyHighlights = lazy(() => import('./pages/DailyHighlights'))
const AnticipationJournal = lazy(() => import('./pages/AnticipationJournal'))
const DigitalHabitsLog = lazy(() => import('./pages/DigitalHabitsLog'))
const CognitiveFitnessLog = lazy(() => import('./pages/CognitiveFitnessLog'))
const PhysicalWellnessLog = lazy(() => import('./pages/PhysicalWellnessLog'))
const SerendipityLog = lazy(() => import('./pages/SerendipityLog'))
const MoodTriggerLog = lazy(() => import('./pages/MoodTriggerLog'))
const EmotionalWeatherLog = lazy(() => import('./pages/EmotionalWeatherLog'))
const MinuteJournal = lazy(() => import('./pages/MinuteJournal'))
const BodyLanguageTracker = lazy(() => import('./pages/BodyLanguageTracker'))
const IntentionalLiving = lazy(() => import('./pages/IntentionalLiving'))
const SocialEnergyLog = lazy(() => import('./pages/SocialEnergyLog'))
const FinancialFreedomLog = lazy(() => import('./pages/FinancialFreedomLog'))
const LifeExperimentDesigner = lazy(() => import('./pages/LifeExperimentDesigner'))
const GratitudeLetterLog = lazy(() => import('./pages/GratitudeLetterLog'))
const LifePurposeLog = lazy(() => import('./pages/LifePurposeLog'))
const RelationshipCheckIn = lazy(() => import('./pages/RelationshipCheckIn'))
const CreativeSprintLog = lazy(() => import('./pages/CreativeSprintLog'))
const HabitReflectionLog = lazy(() => import('./pages/HabitReflectionLog'))
const PersonalGrowthPlan = lazy(() => import('./pages/PersonalGrowthPlan'))
const MicroWinLog = lazy(() => import('./pages/MicroWinLog'))
const DailyRitualDesigner = lazy(() => import('./pages/DailyRitualDesigner'))
const VoiceJournal = lazy(() => import('./pages/VoiceJournal'))
const LegacyTimelineLog = lazy(() => import('./pages/LegacyTimelineLog'))
const SleepRitualDesigner = lazy(() => import('./pages/SleepRitualDesigner'))
const WakeUpLog = lazy(() => import('./pages/WakeUpLog'))
const NetworkStrengthLog = lazy(() => import('./pages/NetworkStrengthLog'))
const ContributionTracker = lazy(() => import('./pages/ContributionTracker'))
const HealthProtocolLog = lazy(() => import('./pages/HealthProtocolLog'))
const BiomarkerTracker = lazy(() => import('./pages/BiomarkerTracker'))
const FlowStateJournal = lazy(() => import('./pages/FlowStateJournal'))
const GratitudeVisualization = lazy(() => import('./pages/GratitudeVisualization'))
const MoneyFlowLog = lazy(() => import('./pages/MoneyFlowLog'))
const AffirmationBuilder = lazy(() => import('./pages/AffirmationBuilder'))
const EdgeOfComfortLog = lazy(() => import('./pages/EdgeOfComfortLog'))
const EnergyVampireLog = lazy(() => import('./pages/EnergyVampireLog'))
const PeakHoursLog = lazy(() => import('./pages/PeakHoursLog'))
const SuccessAutopsy = lazy(() => import('./pages/SuccessAutopsy'))
const TimeWarpLog = lazy(() => import('./pages/TimeWarpLog'))
const WealthRitualLog = lazy(() => import('./pages/WealthRitualLog'))
const SpiralJournal = lazy(() => import('./pages/SpiralJournal'))
const AliveLog = lazy(() => import('./pages/AliveLog'))
const ResonanceJournal = lazy(() => import('./pages/ResonanceJournal'))
const MomentumBuilderLog = lazy(() => import('./pages/MomentumBuilderLog'))
const SeasonsOfLife = lazy(() => import('./pages/SeasonsOfLife'))
const ConversationDebrief = lazy(() => import('./pages/ConversationDebrief'))
const InnerCompass = lazy(() => import('./pages/InnerCompass'))
const NarrativeIdentity = lazy(() => import('./pages/NarrativeIdentity'))
const GenerosityLog = lazy(() => import('./pages/GenerosityLog'))
const VitalityStack = lazy(() => import('./pages/VitalityStack'))
const DeepWorkOS = lazy(() => import('./pages/DeepWorkOS'))
const QuantumLeapLog = lazy(() => import('./pages/QuantumLeapLog'))
const AnxietyAlchemy = lazy(() => import('./pages/AnxietyAlchemy'))
const MindfulMoneyLog = lazy(() => import('./pages/MindfulMoneyLog'))
const LongevityLog = lazy(() => import('./pages/LongevityLog'))
const CognitiveEdgeLog = lazy(() => import('./pages/CognitiveEdgeLog'))
const IntegrityCheckLog = lazy(() => import('./pages/IntegrityCheckLog'))
const BeliefAudit = lazy(() => import('./pages/BeliefAudit'))
const EnvironmentDesignLog = lazy(() => import('./pages/EnvironmentDesignLog'))
const RitualsOfExcellence = lazy(() => import('./pages/RitualsOfExcellence'))
const PersonalWinsLog = lazy(() => import('./pages/PersonalWinsLog'))
const MastermindLog = lazy(() => import('./pages/MastermindLog'))
const SkillPracticeLog = lazy(() => import('./pages/SkillPracticeLog'))
const LearningReview = lazy(() => import('./pages/LearningReview'))

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <LoginPage />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
      <AuthGate>
      <AppShell>
      <div className="min-h-screen bg-slate-900">
        <PlatformStatusBar />
        <Navbar />
        <main className="pb-20 md:pb-0 md:pl-56">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-24">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/account" element={<AccountPage />} />
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
              <Route path="/charity"              element={<CharityTracker />}        />
              <Route path="/mood-board"           element={<MoodBoard />}             />
              <Route path="/lessons"              element={<LessonLearned />}         />
              <Route path="/conflict-log"         element={<ConflictLog />}           />
              <Route path="/garden"               element={<GardeningLog />}          />
              <Route path="/reading-challenge"   element={<ReadingChallenge />}      />
              <Route path="/negotiation-log"     element={<NegotiationLog />}        />
              <Route path="/love-languages"      element={<LoveLanguages />}         />
              <Route path="/recipes"             element={<RecipeJournal />}         />
              <Route path="/social-calendar"     element={<SocialCalendar />}        />
              <Route path="/inventory"           element={<PersonalInventory />}     />
              <Route path="/dreams"             element={<DreamsJournal />}         />
              <Route path="/therapy"            element={<TherapyLog />}            />
              <Route path="/supplements"        element={<SupplementLog />}         />
              <Route path="/screen-time"        element={<ScreenTimeLog />}         />
              <Route path="/family-gratitude"   element={<GratitudeToParents />}    />
              <Route path="/future-letters"     element={<FutureLetters />}         />
              <Route path="/personal-policies"  element={<PersonalPolicies />}      />
              <Route path="/monthly-retro"      element={<MonthlyRetro />}          />
              <Route path="/mindful-eating"     element={<MindfulEating />}         />
              <Route path="/forgiveness"        element={<ForgivenessLog />}        />
              <Route path="/eco"                element={<EcoTracker />}            />
              <Route path="/life-regrets"       element={<LifeRegrets />}           />
              <Route path="/hobbies"            element={<HobbiesTracker />}        />
              <Route path="/allergies"          element={<AllergyLog />}            />
              <Route path="/account-vault"      element={<PasswordVault />}         />
              <Route path="/sport-stats"        element={<SportStats />}            />
              <Route path="/skincare"           element={<SkinCareLog />}           />
              <Route path="/career-skills"      element={<CareerSkills />}          />
              <Route path="/morning-mindset"    element={<MorningMindset />}        />
              <Route path="/gift-ideas"         element={<GiftIdeas />}             />
              <Route path="/appointments"       element={<AppointmentsLog />}       />
              <Route path="/wish-list"          element={<WishList />}              />
              <Route path="/memories"           element={<MemoriesVault />}         />
              <Route path="/budget"             element={<BudgetPlanner />}         />
              <Route path="/sleep-diary"        element={<SleepDiary />}            />
              <Route path="/philosophy"         element={<LifePhilosophy />}        />
              <Route path="/music-log"          element={<MusicLog />}              />
              <Route path="/movies"             element={<MoviesLog />}             />
              <Route path="/family-tree"        element={<FamilyTree />}            />
              <Route path="/comm-log"           element={<CommunicationLog />}      />
              <Route path="/personal-challenges" element={<PersonalChallenges />}   />
              <Route path="/health-vitals"      element={<HealthVitals />}          />
              <Route path="/personal-research"  element={<PersonalResearch />}      />
              <Route path="/daily-affirmations" element={<DailyAffirmations />}     />
              <Route path="/body-scan"          element={<BodyScanLog />}           />
              <Route path="/financial-literacy" element={<FinancialLiteracy />}     />
              <Route path="/private-journal"    element={<PasswordJournal />}       />
              <Route path="/rel-goals"          element={<RelationshipGoals />}     />
              <Route path="/life-experiences"   element={<LifeExperiences />}       />
              <Route path="/money-tracker"      element={<MoneyTracker />}          />
              <Route path="/creativity-log"     element={<CreativityLog />}         />
              <Route path="/brand-builder"      element={<PersonalBrandBuilder />}  />
              <Route path="/food-diary"         element={<FoodDiary />}             />
              <Route path="/exercise-log"       element={<ExerciseLog />}           />
              <Route path="/career-journey"     element={<CareerJourney />}         />
              <Route path="/mental-models"      element={<MentalModels />}          />
              <Route path="/travel-planner"     element={<TravelPlanner />}         />
              <Route path="/language-journal"    element={<LanguageJournal />}        />
              <Route path="/vision-journal"     element={<VisionJournal />}         />
              <Route path="/constitution"       element={<PersonalConstitution />}  />
              <Route path="/friendships"        element={<FriendshipTracker />}     />
              <Route path="/digital-footprint"  element={<DigitalFootprint />}      />
              <Route path="/life-letters"       element={<LifeLetters />}           />
              <Route path="/mindfulness-log"    element={<MindfulnessLog />}        />
              <Route path="/anger-log"          element={<AngerLog />}              />
              <Route path="/curiosity-journal"  element={<CuriosityJournal />}      />
              <Route path="/time-capsule"       element={<PersonalTimeCapsule />}   />
              <Route path="/workplace-log"      element={<WorkplaceLog />}          />
              <Route path="/success-stories"    element={<SuccessStories />}        />
              <Route path="/confidence"         element={<ConfidenceBuilder />}     />
              <Route path="/social-skills"      element={<SocialSkillsLog />}       />
              <Route path="/life-numbers"       element={<LifeNumbersTracker />}    />
              <Route path="/personal-mythology" element={<PersonalMythology />}     />
              <Route path="/daily-questions"    element={<DailyQuestions />}        />
              <Route path="/energy-audit"       element={<EnergyAudit />}           />
              <Route path="/moral-compass"      element={<MoralCompass />}          />
              <Route path="/sabbatical"         element={<SabbaticalPlanner />}     />
              <Route path="/adventure-log"      element={<AdventureLog />}          />
              <Route path="/dating-journal"     element={<DatingJournal />}         />
              <Route path="/breakup-journal"    element={<BreakupJournal />}        />
              <Route path="/self-care"          element={<SelfCarePlan />}          />
              <Route path="/monthly-intentions" element={<MonthlyIntentions />}     />
              <Route path="/personal-legacy"    element={<PersonalLegacy />}        />
              <Route path="/climate-log"        element={<ClimateLog />}            />
              <Route path="/joy-log"            element={<JoyLog />}                />
              <Route path="/learning-goals"     element={<LearningGoals />}         />
              <Route path="/life-purpose"       element={<LifePurpose />}           />
              <Route path="/thought-patterns"   element={<ThoughtPatterns />}       />
              <Route path="/finance-ratios"     element={<PersonalFinanceRatios />} />
              <Route path="/mindset-shifts"     element={<HabitMindsetShift />}     />
              <Route path="/grateful-moments"   element={<GratefulMoments />}       />
              <Route path="/skill-inventory"    element={<SkillInventory />}        />
              <Route path="/weekly-reflection"  element={<WeeklyReflection />}      />
              <Route path="/mantra-log"         element={<MantraLog />}             />
              <Route path="/personal-swot"      element={<PersonalSWOT />}          />
              <Route path="/goal-post-mortem"   element={<GoalPostMortem />}        />
              <Route path="/self-talk"          element={<SelfTalk />}              />
              <Route path="/vulnerability-log"  element={<VulnerabilityLog />}      />
              <Route path="/micro-wins"         element={<MicroWins />}             />
              <Route path="/rel-values"         element={<RelationshipValues />}    />
              <Route path="/focus-batteries"    element={<FocusBatteries />}        />
              <Route path="/rituals-log"        element={<RitualsLog />}            />
              <Route path="/inner-critic"       element={<InnerCriticLog />}        />
              <Route path="/peak-performance"   element={<PeakPerformance />}       />
              <Route path="/breathwork-log"     element={<BreathworkLog />}         />
              <Route path="/personal-prs"       element={<PersonalPRs />}           />
              <Route path="/emotion-library"    element={<EmotionLibrary />}        />
              <Route path="/social-projects"   element={<SocialProjects />}        />
              <Route path="/digital-minimalism" element={<DigitalMinimalism />}   />
              <Route path="/nutrition-wins"    element={<NutritionWins />}         />
              <Route path="/crisis-log"       element={<CrisisLog />}             />
              <Route path="/boundaries"       element={<BoundariesLog />}         />
              <Route path="/philosophy-notes" element={<PhilosophyNotes />}       />
              <Route path="/sleep-goals"      element={<SleepGoals />}            />
              <Route path="/challenge-tracker" element={<ChallengeTracker />}    />
              <Route path="/debt-tracker"     element={<PersonalDebts />}         />
              <Route path="/strengths-log"   element={<StrengthsLog />}          />
              <Route path="/time-wasters"    element={<TimeWasters />}           />
              <Route path="/health-habits"   element={<HealthHabits />}          />
              <Route path="/wisdom-log"      element={<WisdomLog />}             />
              <Route path="/gratitude-practice" element={<GratitudePractice />} />
              <Route path="/mindful-movement" element={<MindfulMovement />}    />
              <Route path="/experience-ledger" element={<ExperienceLedger />}  />
              <Route path="/confidence-journal" element={<ConfidenceJournal />}/>
              <Route path="/monthly-goals"    element={<MonthlyGoals />}       />
              <Route path="/body-language"    element={<BodyLanguageLog />}    />
              <Route path="/reading-list"    element={<ReadingList />}        />
              <Route path="/core-values"     element={<PersonalValues2 />}   />
              <Route path="/annual-review"   element={<AnnualReview />}      />
              <Route path="/goal-review"     element={<GoalReview />}        />
              <Route path="/neg-visualization" element={<NegativeVisualization />} />
              <Route path="/relapse-log"     element={<RelapseLog />}        />
              <Route path="/energy-food"     element={<EnergyFood />}        />
              <Route path="/life-interests"  element={<LifeInterests />}     />
              <Route path="/personal-audit"  element={<PersonalAudit />}    />
              <Route path="/legacy-letters"  element={<LegacyLetters />}    />
              <Route path="/emotional-triggers" element={<EmotionalTriggers />} />
              <Route path="/stoic-practice"    element={<StoicPractice />}     />
              <Route path="/courage-log"       element={<CourageLog />}        />
              <Route path="/ego-journal"       element={<EgoJournal />}        />
              <Route path="/intention-setter"  element={<IntentionSetter />}   />
              <Route path="/motivation-log"    element={<MotivationLog />}     />
              <Route path="/habit-autopsy"    element={<HabitAutopsy />}      />
              <Route path="/procrastination"  element={<ProcrastinationLog />}/>
              <Route path="/mentor-quotes"    element={<MentorQuotes />}      />
              <Route path="/personal-credo"   element={<PersonalCredo />}     />
              <Route path="/growth-edges"     element={<GrowthEdges />}       />
              <Route path="/shadow-work"      element={<ShadowWork />}        />
              <Route path="/life-design"      element={<LifeDesign />}        />
              <Route path="/power-beliefs"    element={<PowerBeliefs />}      />
              <Route path="/family-goals"     element={<FamilyGoals />}       />
              <Route path="/micro-journal"    element={<MicroJournal />}      />
              <Route path="/exercise-library" element={<ExerciseLibrary />}  />
              <Route path="/meal-log"         element={<MealLog />}          />
              <Route path="/mindset-shifts-v2" element={<MindsetShifts />}  />
              <Route path="/fi-tracker"       element={<FinancialIndependence />} />
              <Route path="/social-circle"    element={<SocialCircle />}      />
              <Route path="/career-milestones" element={<CareerMilestones />} />
              <Route path="/personal-rituals" element={<PersonalRituals />}   />
              <Route path="/skill-gaps"       element={<SkillGaps />}         />
              <Route path="/pain-points"      element={<PainPoints />}        />
              <Route path="/discipline-log"   element={<DisciplineLog />}     />
              <Route path="/win-journal"       element={<WinJournal />}        />
              <Route path="/gratitude-map"     element={<GratitudeMap />}      />
              <Route path="/life-contracts"    element={<LifeContracts />}     />
              <Route path="/focus-modes"       element={<FocusModes />}        />
              <Route path="/spiritual-practice" element={<SpiritualPractice />}/>
              <Route path="/performance-log"   element={<PerformanceLog />}    />
              <Route path="/obstacle-map"      element={<ObstacleMap />}       />
              <Route path="/resilience-log"    element={<ResilienceLog />}     />
              <Route path="/break-log"         element={<BreakLog />}          />
              <Route path="/character-sheet"   element={<CharacterSheet />}    />
              <Route path="/debt-free"         element={<DebtFreeJourney />}   />
              <Route path="/life-experiments"   element={<LifeExperiments />}    />
              <Route path="/mindfulness-timer" element={<MindfulnessTimer />}  />
              <Route path="/health-protocols"  element={<HealthProtocols />}   />
              <Route path="/network-builder"   element={<NetworkBuilder />}    />
              <Route path="/learning-roadmap"       element={<LearningRoadmap />}          />
              <Route path="/morning-mindfulness"     element={<MorningMindfulnessJournal />}/>
              <Route path="/evening-wind-down"       element={<EveningWindDown />}          />
              <Route path="/values-alignment"        element={<ValuesAlignment />}          />
              <Route path="/body-budget"             element={<BodyBudget />}               />
              <Route path="/goal-sprint"            element={<GoalSprint />}               />
              <Route path="/thought-leadership"     element={<ThoughtLeadership />}        />
              <Route path="/fear-inventory"         element={<FearInventory />}            />
              <Route path="/investment-portfolio"   element={<InvestmentPortfolio />}      />
              <Route path="/habit-stacks-v2"        element={<HabitStacks />}              />
              <Route path="/identity-log"           element={<IdentityLog />}              />
              <Route path="/relationship-nurture"   element={<RelationshipNurture />}      />
              <Route path="/philosophy-log"         element={<LifePhilosophyLog />}        />
              <Route path="/success-rituals"        element={<SuccessRituals />}           />
              <Route path="/antifragile-log"        element={<AntifragileLog />}           />
              <Route path="/deep-work-sessions"     element={<DeepWorkSession />}          />
              <Route path="/clarity-journal"        element={<ClarityJournal />}           />
              <Route path="/mindset-armor"          element={<MindsetArmor />}             />
              <Route path="/life-conversations"     element={<LifeConversations />}        />
              <Route path="/personal-boardroom"     element={<PersonalBoardroom />}        />
              <Route path="/flow-triggers"          element={<FlowTriggers />}             />
              <Route path="/growth-challenges"      element={<GrowthChallenges />}         />
              <Route path="/strategic-vision"       element={<StrategicVision />}          />
              <Route path="/emotional-regulation"   element={<EmotionalRegulation />}      />
              <Route path="/purpose-alignment"      element={<PurposeAlignment />}         />
              <Route path="/life-moments"           element={<LifeMoments />}              />
              <Route path="/belief-system"          element={<BeliefSystem />}             />
              <Route path="/social-contributions"   element={<SocialContributions />}      />
              <Route path="/money-beliefs"          element={<MoneyBeliefs />}             />
              <Route path="/cognitive-load"         element={<CognitiveLoad />}            />
              <Route path="/skill-mastery"          element={<SkillMastery />}             />
              <Route path="/health-optimization"    element={<HealthOptimization />}       />
              <Route path="/creative-process"       element={<CreativeProcess />}          />
              <Route path="/life-balance"           element={<LifeBalance />}              />
              <Route path="/mortality-log"          element={<MortalityLog />}             />
              <Route path="/decision-archive"       element={<DecisionArchive />}          />
              <Route path="/personal-algorithm"     element={<PersonalAlgorithm />}        />
              <Route path="/wellbeing-check"        element={<WellbeingCheck />}           />
              <Route path="/gratitude-depth"        element={<GratitudeDepth />}           />
              <Route path="/abundance-mindset"      element={<AbundanceMindset />}         />
              <Route path="/power-moments"          element={<PowerMoments />}             />
              <Route path="/integrity-log"          element={<IntegrityLog />}             />
              <Route path="/soul-purpose"           element={<SoulPurpose />}              />
              <Route path="/life-curriculum"        element={<LifeCurriculum />}           />
              <Route path="/future-self"            element={<FutureSelfLog />}            />
              <Route path="/peak-state"             element={<PeakStateLog />}             />
              <Route path="/inner-dialogue"         element={<InnerDialogue />}            />
              <Route path="/contribution-log"       element={<ContributionLog />}          />
              <Route path="/mind-body-log"          element={<MindBodyLog />}              />
              <Route path="/wisdom-archive"         element={<WisdomArchive />}            />
              <Route path="/gratitude-challenges"   element={<GratitudeForChallenges />}   />
              <Route path="/life-exit-strategy"     element={<LifeExitStrategy />}         />
              <Route path="/character-virtues"      element={<CharacterVirtues />}         />
              <Route path="/life-experiment-log"    element={<LifeExperimentLog />}        />
              <Route path="/life-phases"            element={<LifePhases />}               />
              <Route path="/relationship-depth"     element={<RelationshipDepth />}        />
              <Route path="/narrative-reframe"      element={<NarrativeReframe />}         />
              <Route path="/value-hierarchy"        element={<ValueHierarchy />}           />
              <Route path="/mindfulness-depth"      element={<MindfulnessDepth />}         />
              <Route path="/success-dna"            element={<SuccessDNA />}               />
              <Route path="/life-investments"       element={<LifeInvestments />}          />
              <Route path="/thinking-styles"        element={<ThinkingStyles />}           />
              <Route path="/life-optimizer"         element={<LifeOptimizer />}            />
              <Route path="/deep-listening"         element={<DeepListening />}            />
              <Route path="/emotion-mastery"        element={<EmotionMastery />}           />
              <Route path="/presence-log"           element={<PresenceLog />}              />
              <Route path="/compassion-log"         element={<CompassionLog />}            />
              <Route path="/legacy-builder"         element={<LegacyBuilder />}            />
              <Route path="/life-alchemy"           element={<LifeAlchemy />}              />
              <Route path="/existential-log"        element={<ExistentialLog />}           />
              <Route path="/inner-peace-log"        element={<InnerPeaceLog />}            />
              <Route path="/service-log"            element={<ServiceLog />}               />
              <Route path="/creative-flow"          element={<CreativeFlow />}             />
              <Route path="/growth-mindset"         element={<GrowthMindset />}            />
              <Route path="/wealth-mindset"         element={<WealthMindset />}            />
              <Route path="/boundary-builder"       element={<BoundaryBuilder />}          />
              <Route path="/healing-journal"        element={<HealingJournal />}           />
              <Route path="/vision-casting"         element={<VisionCasting />}            />
              <Route path="/purpose-log"            element={<PurposeLog />}               />
              <Route path="/self-mastery-log"       element={<SelfMasteryLog />}           />
              <Route path="/time-philosophy"        element={<TimePhilosophy />}           />
              <Route path="/joy-design"             element={<JoyDesign />}                />
              <Route path="/energy-budget"          element={<EnergyBudget />}             />
              <Route path="/inspired-action"        element={<InspiredAction />}           />
              <Route path="/mindful-communication"  element={<MindfulCommunication />}     />
              <Route path="/physical-peak"          element={<PhysicalPeak />}             />
              <Route path="/social-intelligence"    element={<SocialIntelligence />}       />
              <Route path="/daily-excellence"       element={<DailyExcellence />}          />
              <Route path="/life-review"            element={<LifeReview />}               />
              <Route path="/resilient-thinking"     element={<ResilientThinking />}        />
              <Route path="/digital-wellness"       element={<DigitalWellness />}          />
              <Route path="/neuroplasticity"        element={<NeuroplasticityLog />}       />
              <Route path="/intuitive-decision"     element={<IntuitiveDecision />}        />
              <Route path="/body-wisdom"            element={<BodyWisdom />}               />
              <Route path="/gratitude-to-self"      element={<GratitudeToself />}          />
              <Route path="/willpower-log"          element={<WillpowerLog />}             />
              <Route path="/mindful-sleep"          element={<MindfulSleep />}             />
              <Route path="/conflict-resolution"    element={<ConflictResolution />}       />
              <Route path="/abundance-log"          element={<AbundanceLog />}             />
              <Route path="/life-rhythm"            element={<LifeRhythm />}               />
              <Route path="/high-performance"       element={<HighPerformance />}          />
              <Route path="/screen-time-connect"   element={<ScreenTimeConnect />}        />
              <Route path="/life-score-engine"     element={<LifeScoreEngine />}          />
              <Route path="/ultimate-morning"      element={<UltimateMorningRitual />}    />
              <Route path="/ikigai-compass"        element={<IkigaiCompass />}            />
              <Route path="/command-center"        element={<CommandCenter />}            />
              <Route path="/daily-driver"          element={<DailyDriver />}              />
              <Route path="/weekly-power"          element={<WeeklyPowerSession />}       />
              <Route path="/life-gps"              element={<LifeGPS />}                  />
              <Route path="/nightly-debrief"       element={<NightlyDebrief />}           />
              <Route path="/personal-playbook"     element={<PersonalPlaybook />}         />
              <Route path="/mind-body-balance"     element={<MindBodyBalance />}          />
              <Route path="/emotional-dashboard"   element={<EmotionalDashboard />}       />
              <Route path="/strategic-life-plan"   element={<StrategicLifePlan />}        />
              <Route path="/habit-matrix"          element={<HabitMatrix />}              />
              <Route path="/life-checkup"          element={<LifeCheckup />}              />
              <Route path="/flow-state-tracker"    element={<FlowStateTracker />}         />
              <Route path="/mindfulness-center"    element={<MindfulnessCenter />}        />
              <Route path="/wealth-builder"        element={<WealthBuilder />}            />
              <Route path="/relationship-tracker"  element={<RelationshipTracker />}      />
              <Route path="/creative-studio"       element={<CreativeStudio />}           />
              <Route path="/deep-work-log"         element={<DeepWorkLog />}              />
              <Route path="/growth-journal"        element={<GrowthJournal />}            />
              <Route path="/life-energy"           element={<LifeEnergy />}               />
              <Route path="/identity-architect"    element={<IdentityArchitect />}        />
              <Route path="/value-alignment-log"   element={<ValueAlignmentLog />}        />
              <Route path="/win-board"             element={<WinBoard />}                 />
              <Route path="/reflection-engine"     element={<ReflectionEngine />}         />
              <Route path="/life-rating"           element={<LifeRating />}               />
              <Route path="/life-metrics-hub"      element={<LifeMetricsHub />}           />
              <Route path="/morning-powerup"       element={<MorningPowerup />}           />

              <Route path="/goal-crusher"          element={<GoalCrusher />}              />
              <Route path="/habit-evolution"       element={<HabitEvolution />}           />
              <Route path="/spiritual-log"         element={<SpiritualLog />}             />
              <Route path="/obstacle-destroyer"    element={<ObstacleDestroyer />}        />
              <Route path="/focus-protocol"        element={<FocusProtocol />}            />
              <Route path="/body-optimizer"        element={<BodyOptimizer />}            />
              <Route path="/mindset-gym"           element={<MindsetGym />}               />
              <Route path="/life-design-board"     element={<LifeDesignBoard />}          />
              <Route path="/gratitude-power"       element={<GratitudePower />}           />
              <Route path="/success-blueprint"     element={<SuccessBlueprintLog />}      />
              <Route path="/time-investment"       element={<TimeInvestment />}           />
              <Route path="/clarity-session"       element={<ClaritySession />}           />
              <Route path="/peak-moment-log"       element={<PeakMomentLog />}            />
              <Route path="/challenge-acceptor"    element={<ChallengeAcceptor />}        />
              <Route path="/personal-finance-log"  element={<PersonalFinanceLog />}       />
              <Route path="/mental-strength-log"   element={<MentalStrengthLog />}        />
              <Route path="/social-capital-log"    element={<SocialCapitalLog />}         />
              <Route path="/legacy-project-log"    element={<LegacyProjectLog />}         />
              <Route path="/self-compassion-log"   element={<SelfCompassionLog />}        />
              <Route path="/presence-tracker"      element={<PresenceTracker />}          />
              <Route path="/life-lab"              element={<LifeLab />}                  />
              <Route path="/daily-intention-setter"  element={<DailyIntentionSetter />}    />
              <Route path="/morning-intention"       element={<MorningIntentionRitual />}  />
              <Route path="/emotional-alchemy"       element={<EmotionalAlchemy />}        />
              <Route path="/body-signal-log"         element={<BodySignalLog />}           />
              <Route path="/micro-moment-log"        element={<MicroMomentLog />}          />
              <Route path="/life-force-log"          element={<LifeForceLog />}            />
              <Route path="/neural-reprogramming"    element={<NeuralReprogramming />}     />
              <Route path="/thought-audit"          element={<ThoughtAudit />}            />
              <Route path="/energy-rituals"         element={<EnergyRituals />}           />
              <Route path="/momentum-tracker"       element={<MomentumTracker />}         />
              <Route path="/fear-inventory-log"     element={<FearInventoryLog />}        />
              <Route path="/mind-reset"             element={<MindReset />}               />
              <Route path="/vitality-rituals"       element={<VitalityRituals />}         />
              <Route path="/data-hub"              element={<DataHub />}                 />
              <Route path="/reminders"            element={<ReminderSettings />}         />
              <Route path="/life-history"          element={<LifeHistoryTimeline />}      />
              <Route path="/weekly-changes"        element={<WeeklyChanges />}            />
              <Route path="/monthly-changes"       element={<MonthlyChanges />}           />
              <Route path="/score-trends"          element={<ScoreTrends />}              />
              <Route path="/sleep-protocol"        element={<SleepProtocol />}            />
              <Route path="/quantified-self"       element={<QuantifiedSelf />}           />
              <Route path="/personal-mission"      element={<PersonalMission />}          />
              <Route path="/annual-planning"       element={<AnnualPlanning />}           />
              <Route path="/life-alignment"        element={<LifeAlignmentPage />}        />
              <Route path="/momentum-dashboard"    element={<MomentumDashboard />}        />
              <Route path="/future-self-letter"    element={<FutureSelfLetter />}         />
              <Route path="/relationship-health"   element={<RelationshipHealth />}       />
              <Route path="/habit-design-lab"      element={<HabitDesignLab />}           />
              <Route path="/personal-economy"      element={<PersonalEconomy />}          />
              <Route path="/evening-ritual"        element={<EveningRitualDesigner />}    />
              <Route path="/mental-model-lab"      element={<MentalModelLab />}           />
              <Route path="/body-reset"            element={<BodyReset />}                />
              <Route path="/life-vision-board"     element={<LifeVisionBoard />}          />
              <Route path="/daily-wins"            element={<DailyWinsLog />}             />
              <Route path="/morning-gratitude"     element={<MorningGratitudeRitual />}   />
              <Route path="/life-scorecard"        element={<LifeScorecard />}            />
              <Route path="/weekly-retro"          element={<WeeklyRetrospective />}      />
              <Route path="/idea-vault"            element={<CreativeIdeaVault />}        />
              <Route path="/skill-levelup"         element={<SkillLevelUp />}             />
              <Route path="/project-tracker"       element={<ProjectTracker />}           />
              <Route path="/self-care"             element={<SelfCareRitual />}           />
              <Route path="/gratitude-chain-log"   element={<GratitudeChainLog />}        />
              <Route path="/nutrition-planner"     element={<NutritionPlanner />}         />
              <Route path="/stress-tracker-log"    element={<StressTrackerLog />}         />
              <Route path="/time-audit-log"        element={<TimeAuditLog />}             />
              <Route path="/sleep-quality"         element={<SleepQualityTracker />}      />
              <Route path="/concentration"         element={<ConcentrationTracker />}     />
              <Route path="/daily-highlights"      element={<DailyHighlights />}          />
              <Route path="/anticipation"          element={<AnticipationJournal />}      />
              <Route path="/digital-habits"        element={<DigitalHabitsLog />}         />
              <Route path="/cognitive-fitness"     element={<CognitiveFitnessLog />}      />
              <Route path="/physical-wellness"     element={<PhysicalWellnessLog />}      />
              <Route path="/serendipity"           element={<SerendipityLog />}           />
              <Route path="/mood-triggers"         element={<MoodTriggerLog />}           />
              <Route path="/emotional-weather"     element={<EmotionalWeatherLog />}      />
              <Route path="/minute-journal"        element={<MinuteJournal />}            />
              <Route path="/body-language"         element={<BodyLanguageTracker />}      />
              <Route path="/intentional-living"    element={<IntentionalLiving />}        />
              <Route path="/social-energy"         element={<SocialEnergyLog />}          />
              <Route path="/financial-freedom"     element={<FinancialFreedomLog />}      />
              <Route path="/experiment-designer"   element={<LifeExperimentDesigner />}   />
              <Route path="/gratitude-letters"     element={<GratitudeLetterLog />}       />
              <Route path="/life-purpose-log"      element={<LifePurposeLog />}           />
              <Route path="/relationship-checkin"  element={<RelationshipCheckIn />}      />
              <Route path="/creative-sprint"       element={<CreativeSprintLog />}        />
              <Route path="/habit-reflection"      element={<HabitReflectionLog />}       />
              <Route path="/growth-plan"           element={<PersonalGrowthPlan />}       />
              <Route path="/micro-win-log"         element={<MicroWinLog />}              />
              <Route path="/ritual-designer"       element={<DailyRitualDesigner />}      />
              <Route path="/voice-journal"         element={<VoiceJournal />}             />
              <Route path="/legacy-timeline"       element={<LegacyTimelineLog />}        />
              <Route path="/sleep-ritual-designer" element={<SleepRitualDesigner />}      />
              <Route path="/wake-up-log"           element={<WakeUpLog />}                />
              <Route path="/network-strength"      element={<NetworkStrengthLog />}       />
              <Route path="/contributions"         element={<ContributionTracker />}      />
              <Route path="/health-protocols-log"  element={<HealthProtocolLog />}        />
              <Route path="/biomarkers"            element={<BiomarkerTracker />}         />
              <Route path="/flow-state-journal"    element={<FlowStateJournal />}         />
              <Route path="/gratitude-visualization" element={<GratitudeVisualization />} />
              <Route path="/money-flow-log"        element={<MoneyFlowLog />}             />
              <Route path="/affirmation-builder"   element={<AffirmationBuilder />}       />
              <Route path="/edge-of-comfort"       element={<EdgeOfComfortLog />}         />
              <Route path="/energy-vampires"       element={<EnergyVampireLog />}         />
              <Route path="/peak-hours"            element={<PeakHoursLog />}             />
              <Route path="/success-autopsy"       element={<SuccessAutopsy />}           />
              <Route path="/time-warp"             element={<TimeWarpLog />}              />
              <Route path="/wealth-rituals"        element={<WealthRitualLog />}          />
              <Route path="/spiral-journal"        element={<SpiralJournal />}            />
              <Route path="/alive-log"             element={<AliveLog />}                 />
              <Route path="/resonance-journal"     element={<ResonanceJournal />}         />
              <Route path="/momentum-builder"      element={<MomentumBuilderLog />}       />
              <Route path="/skill-practice"        element={<SkillPracticeLog />}         />
              <Route path="/learning-review"       element={<LearningReview />}           />
              <Route path="/seasons-of-life"       element={<SeasonsOfLife />}            />
              <Route path="/conversation-debrief"  element={<ConversationDebrief />}      />
              <Route path="/inner-compass"         element={<InnerCompass />}             />
              <Route path="/narrative-identity"    element={<NarrativeIdentity />}        />
              <Route path="/generosity-log"        element={<GenerosityLog />}            />
              <Route path="/vitality-stack"        element={<VitalityStack />}            />
              <Route path="/deep-work-os"          element={<DeepWorkOS />}               />
              <Route path="/quantum-leap-log"      element={<QuantumLeapLog />}           />
              <Route path="/anxiety-alchemy"       element={<AnxietyAlchemy />}           />
              <Route path="/mindful-money"         element={<MindfulMoneyLog />}          />
              <Route path="/longevity-log"         element={<LongevityLog />}             />
              <Route path="/cognitive-edge"        element={<CognitiveEdgeLog />}         />
              <Route path="/integrity-check"       element={<IntegrityCheckLog />}        />
              <Route path="/belief-audit"          element={<BeliefAudit />}              />
              <Route path="/environment-design"    element={<EnvironmentDesignLog />}     />
              <Route path="/rituals-excellence"    element={<RitualsOfExcellence />}      />
              <Route path="/personal-wins"         element={<PersonalWinsLog />}          />
              <Route path="/mastermind-log"        element={<MastermindLog />}            />
            </Routes>
            </Suspense>
          </div>
        </main>
      </div>
      </AppShell>
      </AuthGate>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
