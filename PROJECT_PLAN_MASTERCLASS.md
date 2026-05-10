# PROJECT_PLAN_MASTERCLASS.md

## Project: VitalFi Evolution
## Description: Transforming VitalFi into a "Tesla of fitness apps" — a sleek, AI-driven wellness command center with predictive intelligence and behavioral science.
## Status: 🚀 Ready to Execute

---

### PHASE 1: Intelligence Engine & Unified Architecture
- **Goal:** Shift from a split Financial/Health app to a unified "Wellness Command Center" that treats both as vital health metrics.
- **Tasks:**
  - Update `useAppStore.ts` to include more sophisticated health metrics (HRV, VO2 Max, Stress).
  - Implement the **Behavioral Pillars** logic: Movement, Nutrition, Recovery, Mindset, Social.
  - Create `src/lib/ai-engine.ts` for natural language parsing of activities and meals.
  - Refactor `AppShell` to remove the binary toggle and favor a truly unified navigation.
- **MCP tools to use:** context7 (for latest React/Tailwind patterns).
- **Success condition:** App shell reflects unified "Pillars" navigation. Store supports advanced metrics.

---

### PHASE 2: Advanced Activity & Nutrition Engines
- **Goal:** Implement the "Intelligent Activity Engine" with Natural Language Input.
- **Tasks:**
  - Create `src/components/fitness/SmartActivityInput.tsx` (NLP based entry).
  - Build `src/lib/nlp-activity.ts` to parse "Morning run 5K in 25min".
  - Implement hierarchical category system (Cardio, Strength, Flexibility, etc.).
  - Add "Pattern Recognition" to suggest recurring workouts.
- **MCP tools to use:** None.
- **Success condition:** User can type a sentence to log a workout. Categories are structured hierarchically.

---

### PHASE 3: Predictive Analytics & "The Crystal Ball"
- **Goal:** Move from history to future capability with predictive modeling.
- **Tasks:**
  - Implement `src/lib/forecasting.ts` for energy balance and recovery projection.
  - Create `src/components/dashboard/PredictiveOverview.tsx`.
  - Build the **Recovery Score** (0-100) based on sleep, HRV, and training load.
  - Implement "What-if" scenarios for training blocks.
- **MCP tools to use:** minimax-gen (for generating predictive insights logic).
- **Success condition:** Dashboard shows a "Readiness/Recovery Score" and a 7-day energy forecast.

---

### PHASE 4: Behavioral Momentum & Goals 2.0
- **Goal:** Integrate behavioral economics and smart goal routing.
- **Tasks:**
  - Create `src/components/behavioral/MovementReminders.tsx`.
  - Implement **Fitness Health Score** (Single meaningful metric).
  - Build "Auto-Routing Rules" for goals (e.g., 60min workout adds to volume target).
  - Add "Motivation Restoration" (converting stats to tangible outcomes like "fat loss equivalent").
- **MCP tools to use:** slack (for momentum alerts).
- **Success condition:** User sees a dynamic Health Score. Goals update automatically based on activity.

---

### PHASE 5: Masterclass UI/UX & Layout Overhaul
- **Goal:** Achieve the "Tesla" level of design with deep glassmorphism and micro-animations.
- **Tasks:**
  - Overhaul `Dashboard.tsx` with a high-density, card-based "Command Center" layout.
  - Implement advanced Framer Motion transitions between all views.
  - Add "Skeleton Screens" and "Optimistic UI" for all state changes.
  - Refine dark mode palette with electric purples and neon accents.
- **MCP tools to use:** context7 (for modern UI patterns).
- **Success condition:** UI feels premium, fluid, and "alive". No generic colors or basic layouts.

---

### PHASE 6: Verification & Launch
- **Goal:** Self-correction loop and deployment.
- **Tasks:**
  - Run `/verify` to fix bugs and lint errors.
  - Deploy to Vercel.
  - Send launch notification to Slack.
- **MCP tools to use:** vercel, slack, sentry.
- **Success condition:** App is live and perfectly functional.
