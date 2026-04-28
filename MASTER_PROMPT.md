# VITALFI — MASTER PROMPT
## All-In-One Finance & Health Tracker

---

## VISION & POSITIONING

VitalFi is the "Tesla of personal apps" — sleek, intelligent, and redefining expectations. It combines finance management and fitness/health tracking into one unified platform, eliminating the need for multiple apps. Every dollar is tracked, every workout is optimized, every meal is logged, and every decision is empowered by intelligent automation.

Most apps fail because they are passive data graveyards. Users log data, see a chart, feel guilt, and quit. VitalFi must be active, predictive, and behavioral — it should change how users manage money and care for their bodies, not just record what they did.

Target market: individuals who want both financial discipline and fitness excellence in one beautiful app. Millennials, professionals, freelancers, families — anyone tired of using separate apps for money and health.

Competitive differentiation:
- Unified platform — finance + fitness in one app
- AI-first architecture with intelligent suggestions
- Glassmorphic dark mode — premium design, easy on eyes
- Behavioral economics that drive real change
- Simple email-based licensing

---

## CORE PHILOSOPHY

Users do not want history — they want future control. Every transaction recorded should enable better financial predictions. Every workout logged should enable better training decisions. Every meal tracked should improve nutrition. Every insight delivered should drive action.

Cognitive load protection: Don't overwhelm users with 50 categories or 100 metrics. Focus on what actually matters. Financial behavioral buckets instead of rigid categories. Fitness key indicators instead of exhaustive tracking.

Behavioral economics is the secret weapon: streak rewards, micro-goals, pause-before-purchase, pain-of-paying restoration, social accountability. These mechanisms transform tracking into lasting change.

---

## STORAGE & LICENSING

### Local Storage Architecture

All data stored in user's browser using localStorage. No backend, no cloud — data lives on the user's device.

Data structure:
- User profile (name, email, settings)
- Transactions (finance)
- Budgets
- Accounts
- Workouts
- Body metrics
- Meals
- Sleep records
- Goals
- Settings

### Email-Based Licensing System

**Simple Licensing Model:**
- Purchase creates a license tied to ONE email address
- On first launch, user enters their purchase email
- App stores a hash of the email + a secret key
- Each time app loads, verify the stored hash matches the entered email
- If email doesn't match: show license screen, block access

**Implementation:**
```
On first launch:
1. User enters email used for purchase
2. App generates hash: SHA256(email + "VITALFI_SECRET_KEY")
3. Store hash in localStorage as "vitalfi_license"
4. Grant access

On each visit:
1. User enters their registered email
2. Generate hash, compare to stored hash
3. Match = access granted
4. No match = show purchase/license screen
```

**License Screen:**
- Shows when unlicensed or email mismatch
- Has "Enter License Email" input
- Has "Purchase License" button linking to Lemon Squeezy
- Clean, simple design — no access until verified

---

## PHASE 1: CORE ENGINE

### 1.1 Finance — Transaction Engine

Natural Language Input: Type "Coffee with Sarah at Starbucks yesterday $12.50" — auto-fills date (yesterday), category (Coffee Shops), merchant (Starbucks), amount ($12.50), suggests tags.

Smart Manual Entry: Quick-add templates, duplicate detection ("Similar transaction exists — Starbucks $5.45 three days ago"), smart defaults remembering typical amounts.

Transaction fields: date, amount, category, merchant, note, tags, payment method, attachments.

Recurring Transactions: Auto-detect subscriptions, pattern recognition, smart scheduling (weekly, bi-weekly, monthly, quarterly, annual), variable amounts, skip/pause.

Pattern Recognition: After three similar transactions, suggest making recurring. Anomaly detection flags unusual spending.

### 1.2 Finance — Category System

Hierarchical categories with smart defaults:
- **Income** (Salary, Freelance, Investments, Other)
- **Housing** (Rent/Mortgage, Utilities — Electric, Water, Gas, Internet, Maintenance, Insurance)
- **Food & Dining** (Groceries, Restaurants, Coffee Shops, Meal Delivery)
- **Transportation** (Gas, Public Transit, rideshare, Parking)
- **Entertainment** (Streaming, Gaming, Events, Hobbies)
- **Shopping** (Clothing, Electronics, Online)
- **Healthcare** (Doctors, Pharmacy, Insurance)
- **Personal Care** (Gym, Hair, Spa)

Smart features: icons, colors, budget linking, custom categories, category merging.

### 1.3 Finance — Multi-Account

Account types: Checking, Savings, Credit Card, Cash, Investment (future).

Account features: starting balance, current balance calculated from transactions, color coding, active/archived.

Transfers: Move money between accounts with options to exclude from reports (prevents double-counting).

### 1.4 Fitness — Workout Tracking

Workout types: Strength (sets, reps, weight), Cardio (duration, distance, HR), HIIT, Flexibility/Yoga, Sport-specific.

Exercise library: 200+ exercises with muscle groups, equipment, form tips.

Set/Rep/Weight: Log each set with weight, reps, RPE (1-10), notes. Auto-fill from previous session.

Cardio tracking: Timer, distance (GPS or manual), pace, heart rate zones.

Rest timer: Configurable between sets with audio alerts.

Workout templates: Save sequences as reusable routines. One-tap start.

### 1.5 Fitness — Body Metrics

Weight: Daily logging with graph. Goal weight with timeline.

Body measurements: Waist, arms, chest, hips, thighs. Photo progress upload.

BMI & BMR: Automatic calculations from weight/height.

Body fat: Manual logging with trend.

### 1.6 Fitness — Steps & Activity

Step counter: Manual entry with daily goal. History with totals.

Active minutes: Track moderate-to-vigorous activity. Daily goals.

Calorie burn: BMR-based estimation. Activity-specific rates.

### 1.7 Fitness — Nutrition

Meal logger: Breakfast, lunch, dinner, snacks with timestamps.

Calorie & macros: Calories, protein, carbs, fat, fiber. Daily goals.

Custom foods: Create foods with nutritional data. Barcode scanning (future).

Meal templates: Save frequent meals for quick-add.

### 1.8 Fitness — Hydration & Sleep

Water intake: Log in customizable amounts. Daily goal with progress ring.

Sleep: Bedtime, wake time, duration, quality rating (1-5 stars).

### 1.9 Authentication

Sign up: Email + password with validation, social login (Google, Apple).

Login: Email/password, remember me.

Profile: Name, primary currency, country, fitness goals.

Security: Session management, data export, delete account option.

---

## PHASE 2: INTELLIGENCE LAYER

### 2.1 Finance — Dynamic Budgeting

Envelope budgeting: Virtual envelopes for each category. Visual — filled portion (spent), available portion.

Budget types: Monthly, weekly, custom period.

Auto-suggestions: "Based on your last 3 months, suggested: Groceries $450, Dining $280..."

Budget alerts: Configurable at 50%, 80%, 100%.

Budget scenarios: What-if planning ("New car payment $350 — adjust other categories").

### 2.2 Finance — Predictive Cash Flow

Forward projection: 30/60/90 days of projected cash flow.

Scenario builder: What-if inputs — "hire help" or "delayed payment" — compare.

Runway chart: Months until cash runs out.

### 2.3 Finance — AI Insights

Pattern analysis: Spending rhythm, lifestyle signature, merchant loyalty.

Anomaly detection: Flag unusual transactions.

Smart recommendations: "3 streaming services — consider consolidation."

### 2.4 Fitness — AI Workout Suggestions

Smart exercise selection: Based on goals, past performance, muscle needs.

Workout generation: Generate full workout from parameters.

Recovery-based: Suggest rest when needed. Lower intensity when recovering.

### 2.5 Fitness — Predictive Analytics

Progress prediction: Project goals based on trajectory.

Training load: Predict overtraining before it happens.

Calorie projections: Project weight changes based on intake.

---

## PHASE 3: BEHAVIORAL LAYER

### 3.1 Finance — Behavioral Friction

Pause before purchase: For discretionary expenses above threshold — "Will this matter in 30 days?"

Pain of paying: Show equivalent in hours-worked or foregone goals.

Social accountability: Optional weekly sharing with accountability partner.

### 3.2 Finance — Goals

Goal types: Savings (target, deadline, auto-contributions), Debt payoff (Snowball/Avalanche), Purchase goals.

Auto-routing: Rules like "20% of deposits to Emergency Fund."

Progress visualization: Tangible milestones.

### 3.3 Finance — Health Score

Single score (0-100): Liquidity, savings rate, debt burden, spending volatility.

Grade display: A, B, C, D.

Improvement quests: Actionable tasks.

### 3.4 Finance — Anonymous Benchmarking

Comparisons: "People like you spend 12% less on dining."

Percentile rankings: Savings rate, spending categories.

### 3.5 Fitness — Streak System

Streak tracking: Consecutive days for any metric.

Streak rewards: Milestone badges at 7, 30, 100, 365 days.

### 3.6 Fitness — Goals

Goal types: Weight, Strength PRs, Running distances, Custom.

Auto-routing: Workouts route to goals automatically.

Milestone visualization: Progress to tangible milestones.

### 3.7 Fitness — Health Score

Composite score (0-100): Sleep, activity, nutrition, recovery, consistency.

Grade display: A, B, C, D, F.

Improvement areas: Highlight lowest areas.

### 3.8 Fitness — Social

Friend profiles: Add friends, view activities.

Leaderboards: Weekly/monthly.

Challenges: Weekly challenges.

---

## PHASE 4: DESIGN & UX

### 4.1 Master Dashboard

Four tabs: Finance, Fitness, Insights, Settings.

Finance tab: Net worth, recent transactions, budget progress, upcoming bills.

Fitness tab: Health score, today's workouts, nutrition, sleep.

Insights tab: AI recommendations for both Finance and Fitness.

Settings tab: Profile, accounts, categories, goals, license.

### 4.2 Navigation

Bottom tab bar: Home, Finance, Fitness, Insights, Settings.

Home shows combined overview.

### 4.3 Visual Design

Dark mode by default: Deep backgrounds (#0a0a0f, #12121a), not pure black.

Glassmorphism: Frosted glass cards, subtle blur, transparency layers.

Colors:
- Primary: Electric purple (#8B5CF6)
- Accent: Cyan (#06B6D4)
- Success: Emerald (#10B981)
- Warning: Amber (#F59E0B)
- Error: Rose (#F43F5E)
- Text: White (#FFFFFF) / Gray (#9CA3AF)

Typography: Inter font, clear hierarchy.

Animations: Smooth transitions, micro-interactions on every tap.

### 4.4 Empty States

Welcoming prompts when no data: "Add your first transaction" / "Log your first workout"

Encouraging, not boring.

### 4.5 Mobile-First

44x44px minimum touch targets.

Swipe gestures for common actions.

Pull to refresh.

Bottom sheet modals.

---

## PHASE 5: TECHNICAL

### 5.1 Storage

localStorage for all data:
- vitalfi_profile
- vitalfi_transactions
- vitalfi_accounts
- vitalfi_budgets
- vitalfi_workouts
- vitalfi_meals
- vitalfi_body
- vitalfi_sleep
- vitalfi_goals
- vitalfi_settings
- vitalfi_license

### 5.2 Performance

First Contentful Paint: <1.0s

Time to Interactive: <2.5s

Code splitting: Load only what's needed.

Lazy loading: Images and charts.

### 5.3 Offline

View cached data offline. Queue changes for sync.

### 5.4 Security

No sensitive data transmitted.

Everything stays on user's device.

License hash stored locally.

---

## FEATURE GATING — FREE vs PREMIUM

### Free Tier
- 2 accounts
- 100 transactions
- 50 workouts
- Basic categories
- Basic budgets
- Manual tracking only
- No AI insights

### Premium Tier
- Unlimited everything
- All accounts
- AI insights
- Advanced budgets
- Export data
- All features

### License Check

On app load:
```
if (!localStorage.getItem('vitalfi_license')) {
  showLicenseScreen()
} else {
  verifyLicense()
}
```

License screen blocks all features until valid email entered.

---

## BUILD SPECIFICATIONS

### Tech Stack
- React 18 + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui or Radix UI
- Framer Motion

### Design Requirements
- Dark mode always
- Glassmorphism cards
- Electric purple + cyan accents
- Inter font
- Smooth animations
- Premium feel — never basic

### Structure
```
src/
  components/
    finance/
      TransactionList.tsx
      BudgetCard.tsx
      AccountCard.tsx
      ...
    fitness/
      WorkoutCard.tsx
      NutritionCard.tsx
      SleepCard.tsx
      ...
    shared/
      BottomNav.tsx
      Header.tsx
      ...
  hooks/
    useFinance.ts
    useFitness.ts
    useLicense.ts
    useStorage.ts
  lib/
    storage.ts
    license.ts
    insights.ts
  pages/
    Home.tsx
    Finance.tsx
    Fitness.tsx
    Insights.tsx
    Settings.tsx
    License.tsx
  types/
    transaction.ts
    workout.ts
    ...
  App.tsx
  main.tsx
```

---

## SUCCESS CRITERIA

1. License system works — email verification gates all access
2. Transactions fully trackable with categories and budgets
3. Workouts loggable with sets/reps/weights
4. Nutrition trackable with calories/macros
5. Both Finance and Fitness visible from dashboard
6. AI insights provide actionable recommendations
7. Premium dark mode glassmorphic design
8. Smooth animations on every interaction
9. Mobile-responsive, works on phone and desktop
10. Data persists in localStorage across sessions