/**
 * LifeSync - Financial & Fitness Analytics & Insights
 *
 * Cross-feature analytics engine combining financial and fitness data
 * to produce actionable insights, projections, and health scores.
 */

import {
  calculateCalorieNeeds,
  calculateProteinNeeds,
  projectWeightChange,
  round,
  safeDivide,
  type FitnessGoal,
  type ActivityLevel,
  type WeightProjection,
  recommendWorkoutFrequency,
} from './calculations';

// ============================================================
// TYPES
// ============================================================

export interface DebtEntry {
  id: string;
  name: string;
  balance: number;
  apr: number;
  minimumPayment: number;
  extraPayment?: number;
  dueDay?: number;
}

export interface DebtPayoffMonth {
  month: number;
  debtId: string;
  debtName: string;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface DebtPayoffResult {
  strategy: 'avalanche' | 'snowball';
  totalMonths: number;
  totalPaid: number;
  totalInterest: number;
  totalPrincipal: number;
  savingsVsMinimum: number;
  schedule: DebtPayoffMonth[];
  debtCompletionOrder: { debtId: string; debtName: string; monthPaidOff: number }[];
}

export interface InvestmentProjectionParams {
  initialAmount: number;
  monthlyContribution: number;
  annualReturnRate: number;
  years: number;
  compoundingFrequency?: 'monthly' | 'quarterly' | 'annually';
  inflationRate?: number;
}

export interface InvestmentProjectionYear {
  year: number;
  contributions: number;
  totalContributions: number;
  interestEarned: number;
  totalInterest: number;
  balance: number;
  inflationAdjustedBalance: number;
}

export interface InvestmentProjectionResult {
  params: InvestmentProjectionParams;
  years: InvestmentProjectionYear[];
  finalBalance: number;
  totalContributions: number;
  totalInterest: number;
  realReturnRate: number;
  dividendYield?: number;
}

export interface DCAResult {
  totalInvested: number;
  currentValue: number;
  totalShares: number;
  averageCostPerShare: number;
  profitLoss: number;
  profitLossPercent: number;
  purchases: { date: string; pricePerShare: number; sharesBought: number; amount: number }[];
}

export interface BudgetRecommendation {
  category: string;
  currentSpending: number;
  recommendedLimit: number;
  percentOfIncome: number;
  rulePercent: number;
  status: 'under' | 'on_track' | 'over' | 'critical';
  suggestion: string;
}

export interface BudgetRecommendationResult {
  income: number;
  needsBudget: number;
  wantsBudget: number;
  savingsBudget: number;
  recommendations: BudgetRecommendation[];
  overallStatus: 'healthy' | 'warning' | 'critical';
}

export interface SavingsRateResult {
  grossIncome: number;
  totalExpenses: number;
  totalSavings: number;
  savingsRate: number;
  optimalRate: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  suggestion: string;
  fiftyThirtyTwenty: {
    needs: { amount: number; percent: number; actual: number };
    wants: { amount: number; percent: number; actual: number };
    savings: { amount: number; percent: number; actual: number };
  };
}

export interface SpendingTrend {
  category: string;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercent: number;
  isRecurring: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'irregular';
  confidence: number;
}

export interface FinancialHealthScore {
  score: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  components: {
    savingsRate: { score: number; weight: number; value: number };
    debtToIncomeRatio: { score: number; weight: number; value: number };
    budgetAdherence: { score: number; weight: number; value: number };
    emergencyFundMonths: { score: number; weight: number; value: number };
    investmentRate: { score: number; weight: number; value: number };
    billTimeliness: { score: number; weight: number; value: number };
  };
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface WorkoutFrequencyInsight {
  currentWeekly: number;
  recommendedWeekly: number;
  goal: FitnessGoal;
  streakDays: number;
  suggestion: string;
  optimalDays: number[];
}

export interface ProgressPrediction {
  currentWeightKg: number;
  targetWeightKg: number;
  projectedWeeks: number | null;
  projectedDate: Date | null;
  weeklyChangeRate: number;
  isOnTrack: boolean;
  calorieTarget: number;
  proteinTarget: number;
  projection: WeightProjection;
  warnings: string[];
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  topCategories: { category: string; amount: number; percent: number }[];
  monthOverMonthChange: number;
  trends: SpendingTrend[];
}

// ============================================================
// BACKWARDS COMPATIBILITY TYPES
// ============================================================

export interface CategorySpend {
  category: string;
  amount: number;
  percentage: number;
}

export interface TodayNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
}

export interface WorkoutStats {
  totalThisMonth: number;
  totalDuration: number;
  streak: number;
}

export interface ActivityItem {
  id: string;
  type: 'workout' | 'meal' | 'transaction' | 'sleep' | 'hydration';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  color?: string;
  subtitle?: string;
  amount?: number;
}

// ============================================================
// DEBT PAYOFF STRATEGIES
// ============================================================

export function calculateDebtPayoffAvalanche(debts: DebtEntry[], totalMonthlyBudget: number): DebtPayoffResult {
  return calculateDebtPayoff(debts, totalMonthlyBudget, 'avalanche');
}

export function calculateDebtPayoffSnowball(debts: DebtEntry[], totalMonthlyBudget: number): DebtPayoffResult {
  return calculateDebtPayoff(debts, totalMonthlyBudget, 'snowball');
}

export function calculateDebtPayoffMinimumOnly(debts: DebtEntry[]): { totalMonths: number; totalInterest: number; totalPaid: number } {
  if (debts.length === 0) return { totalMonths: 0, totalInterest: 0, totalPaid: 0 };

  const workingDebts = debts.map(d => ({ ...d, remainingBalance: d.balance }));
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;
  const maxMonths = 600;

  while (workingDebts.some(d => d.remainingBalance > 0.01) && month < maxMonths) {
    month++;
    for (const debt of workingDebts) {
      if (debt.remainingBalance <= 0.01) continue;
      const monthlyRate = debt.apr / 100 / 12;
      const interest = debt.remainingBalance * monthlyRate;
      totalInterest += interest;
      let payment = Math.min(debt.minimumPayment, debt.remainingBalance + interest);
      const principal = payment - interest;
      debt.remainingBalance = Math.max(0, debt.remainingBalance - principal);
      totalPaid += payment;
    }
  }

  return { totalMonths: month, totalInterest: round(totalInterest, 2), totalPaid: round(totalPaid, 2) };
}

function calculateDebtPayoff(debts: DebtEntry[], totalMonthlyBudget: number, strategy: 'avalanche' | 'snowball'): DebtPayoffResult {
  if (debts.length === 0) {
    return { strategy, totalMonths: 0, totalPaid: 0, totalInterest: 0, totalPrincipal: 0, savingsVsMinimum: 0, schedule: [], debtCompletionOrder: [] };
  }

  const totalMinimums = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const budget = totalMonthlyBudget < totalMinimums ? totalMinimums : totalMonthlyBudget;
  const extraBudget = budget - totalMinimums;

  const workingDebts = debts.map(d => ({
    id: d.id, name: d.name, balance: d.balance, apr: d.apr,
    minimumPayment: d.minimumPayment, extraPayment: d.extraPayment ?? 0, remainingBalance: d.balance,
  }));

  const schedule: DebtPayoffMonth[] = [];
  const completionOrder: { debtId: string; debtName: string; monthPaidOff: number }[] = [];
  let totalInterest = 0, totalPaid = 0, month = 0;
  const maxMonths = 600;

  while (workingDebts.some(d => d.remainingBalance > 0.01) && month < maxMonths) {
    month++;
    const interestMap = new Map<string, number>();
    for (const debt of workingDebts) {
      if (debt.remainingBalance <= 0.01) continue;
      const monthlyRate = debt.apr / 100 / 12;
      interestMap.set(debt.id, debt.remainingBalance * monthlyRate);
    }

    let remainingExtra = extraBudget;

    for (const debt of workingDebts) {
      if (debt.remainingBalance <= 0.01) continue;
      const interest = interestMap.get(debt.id) ?? 0;
      const minPayment = Math.min(debt.minimumPayment, debt.remainingBalance + interest);
      const principal = minPayment - interest;
      debt.remainingBalance = Math.max(0, debt.remainingBalance - principal);
      totalInterest += interest;
      totalPaid += minPayment;

      schedule.push({ month, debtId: debt.id, debtName: debt.name, payment: minPayment, principal: round(principal, 2), interest: round(interest, 2), remainingBalance: round(debt.remainingBalance, 2) });

      if (debt.remainingBalance <= 0.01 && !completionOrder.find(c => c.debtId === debt.id)) {
        completionOrder.push({ debtId: debt.id, debtName: debt.name, monthPaidOff: month });
      }
    }

    const activeDebts = workingDebts.filter(d => d.remainingBalance > 0.01);
    if (activeDebts.length > 0 && remainingExtra > 0) {
      const sorted = [...activeDebts].sort((a, b) => strategy === 'avalanche' ? b.apr - a.apr : a.remainingBalance - b.remainingBalance);
      const target = sorted[0];
      const extraPayment = Math.min(remainingExtra, target.remainingBalance);
      target.remainingBalance = Math.max(0, target.remainingBalance - extraPayment);
      totalPaid += extraPayment;

      const lastEntry = [...schedule].reverse().find(s => s.debtId === target.id);
      if (lastEntry) {
        lastEntry.payment = round(lastEntry.payment + extraPayment, 2);
        lastEntry.principal = round(lastEntry.principal + extraPayment, 2);
        lastEntry.remainingBalance = round(target.remainingBalance, 2);
      }

      if (target.remainingBalance <= 0.01 && !completionOrder.find(c => c.debtId === target.id)) {
        completionOrder.push({ debtId: target.id, debtName: target.name, monthPaidOff: month });
      }
    }
  }

  const minimumOnly = calculateDebtPayoffMinimumOnly(debts);
  const savingsVsMinimum = round(minimumOnly.totalInterest - totalInterest, 2);
  const totalPrincipal = debts.reduce((sum, d) => sum + d.balance, 0);

  return { strategy, totalMonths: month, totalPaid: round(totalPaid, 2), totalInterest: round(totalInterest, 2), totalPrincipal: round(totalPrincipal, 2), savingsVsMinimum, schedule, debtCompletionOrder: completionOrder };
}

export function compareDebtStrategies(debts: DebtEntry[], totalMonthlyBudget: number): { avalanche: DebtPayoffResult; snowball: DebtPayoffResult; winner: 'avalanche' | 'snowball'; interestSavings: number; recommendation: string } {
  const avalanche = calculateDebtPayoffAvalanche(debts, totalMonthlyBudget);
  const snowball = calculateDebtPayoffSnowball(debts, totalMonthlyBudget);
  const interestSavings = round(snowball.totalInterest - avalanche.totalInterest, 2);

  let winner: 'avalanche' | 'snowball';
  let recommendation: string;

  if (avalanche.totalInterest < snowball.totalInterest) {
    winner = 'avalanche';
    recommendation = `Avalanche saves $${interestSavings} in interest. Best if you can stay motivated by numbers.`;
  } else {
    winner = 'snowball';
    recommendation = `Snowball pays off the first debt ${snowball.debtCompletionOrder[0]?.monthPaidOff - avalanche.debtCompletionOrder[0]?.monthPaidOff} months sooner. Best for motivation.`;
  }

  return { avalanche, snowball, winner, interestSavings: Math.abs(interestSavings), recommendation };
}

// ============================================================
// INVESTMENT PROJECTIONS
// ============================================================

export function calculateInvestmentProjection(params: InvestmentProjectionParams): InvestmentProjectionResult {
  const { initialAmount, monthlyContribution, annualReturnRate, years, compoundingFrequency = 'monthly', inflationRate = 0 } = params;

  if (initialAmount < 0 || monthlyContribution < 0 || years <= 0) {
    return { params, years: [], finalBalance: 0, totalContributions: 0, totalInterest: 0, realReturnRate: 0 };
  }

  const periodsPerYear: Record<string, number> = { monthly: 12, quarterly: 4, annually: 1 };
  const n = periodsPerYear[compoundingFrequency] ?? 12;
  const r = annualReturnRate;
  const ratePerPeriod = r / n;

  const projectionYears: InvestmentProjectionYear[] = [];
  let balance = initialAmount;
  let totalContributions = initialAmount;
  let totalInterest = 0;

  for (let year = 1; year <= years; year++) {
    let yearInterest = 0;
    let yearContributions = 0;
    const periodsThisYear = n;
    const contributionsPerPeriod = monthlyContribution * (12 / n);

    for (let period = 0; period < periodsThisYear; period++) {
      balance += contributionsPerPeriod;
      yearContributions += contributionsPerPeriod;
      const periodInterest = balance * ratePerPeriod;
      balance += periodInterest;
      yearInterest += periodInterest;
    }

    totalContributions += yearContributions;
    totalInterest += yearInterest;
    const inflationFactor = Math.pow(1 + inflationRate, year);

    projectionYears.push({
      year, contributions: round(yearContributions, 2), totalContributions: round(totalContributions, 2),
      interestEarned: round(yearInterest, 2), totalInterest: round(totalInterest, 2),
      balance: round(balance, 2), inflationAdjustedBalance: round(balance / inflationFactor, 2),
    });
  }

  const realReturnRate = inflationRate > 0 ? round(((1 + r) / (1 + inflationRate) - 1) * 100, 2) : round(r * 100, 2);
  return { params, years: projectionYears, finalBalance: round(balance, 2), totalContributions: round(totalContributions, 2), totalInterest: round(totalInterest, 2), realReturnRate };
}

export function calculateDCA(purchases: { date: string; pricePerShare: number; amountInvested: number }[], currentPrice: number): DCAResult {
  if (purchases.length === 0 || currentPrice <= 0) {
    return { totalInvested: 0, currentValue: 0, totalShares: 0, averageCostPerShare: 0, profitLoss: 0, profitLossPercent: 0, purchases: [] };
  }

  let totalInvested = 0, totalShares = 0;
  const purchaseRecords: DCAResult['purchases'] = [];

  for (const p of purchases) {
    if (p.pricePerShare <= 0 || p.amountInvested <= 0) continue;
    const sharesBought = safeDivide(p.amountInvested, p.pricePerShare, 0);
    totalShares += sharesBought;
    totalInvested += p.amountInvested;
    purchaseRecords.push({ date: p.date, pricePerShare: round(p.pricePerShare, 4), sharesBought: round(sharesBought, 6), amount: round(p.amountInvested, 2) });
  }

  const currentValue = round(totalShares * currentPrice, 2);
  const averageCostPerShare = round(safeDivide(totalInvested, totalShares, 0), 4);
  const profitLoss = round(currentValue - totalInvested, 2);
  const profitLossPercent = round(safeDivide(profitLoss, totalInvested, 0) * 100, 2);

  return { totalInvested: round(totalInvested, 2), currentValue, totalShares: round(totalShares, 6), averageCostPerShare, profitLoss, profitLossPercent, purchases: purchaseRecords };
}

export function calculatePortfolioAllocation(holdings: { symbol: string; shares: number; currentPrice: number; sector?: string }[]): { allocations: { symbol: string; value: number; percent: number; sector: string }[]; sectorAllocations: { sector: string; value: number; percent: number }[]; totalValue: number } {
  const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.currentPrice, 0);
  if (totalValue <= 0) return { allocations: [], sectorAllocations: [], totalValue: 0 };

  const allocations = holdings.map(h => ({
    symbol: h.symbol, value: round(h.shares * h.currentPrice, 2),
    percent: round(safeDivide(h.shares * h.currentPrice, totalValue, 0) * 100, 1),
    sector: h.sector ?? 'Unknown',
  }));

  const sectorMap = new Map<string, number>();
  for (const a of allocations) sectorMap.set(a.sector, (sectorMap.get(a.sector) ?? 0) + a.value);

  const sectorAllocations = Array.from(sectorMap.entries()).map(([sector, value]) => ({
    sector, value: round(value, 2), percent: round(safeDivide(value, totalValue, 0) * 100, 1),
  }));

  return { allocations, sectorAllocations, totalValue: round(totalValue, 2) };
}

export function calculateDividendYield(annualDividendPerShare: number, currentPricePerShare: number, totalShares: number): { annualDividendIncome: number; dividendYield: number; monthlyIncome: number } {
  if (currentPricePerShare <= 0) return { annualDividendIncome: 0, dividendYield: 0, monthlyIncome: 0 };
  const annualDividendIncome = round(annualDividendPerShare * totalShares, 2);
  const dividendYield = round(safeDivide(annualDividendPerShare, currentPricePerShare, 0) * 100, 2);
  const monthlyIncome = round(annualDividendIncome / 12, 2);
  return { annualDividendIncome, dividendYield, monthlyIncome };
}

// ============================================================
// BUDGET RECOMMENDATIONS
// ============================================================

export function generateBudgetRecommendations(monthlyIncome: number, spendingByCategory: Record<string, number>, categoryRules?: Record<string, 'needs' | 'wants' | 'savings'>): BudgetRecommendationResult {
  if (monthlyIncome <= 0) return { income: 0, needsBudget: 0, wantsBudget: 0, savingsBudget: 0, recommendations: [], overallStatus: 'critical' };

  const needsBudget = round(monthlyIncome * 0.5, 2);
  const wantsBudget = round(monthlyIncome * 0.3, 2);
  const savingsBudget = round(monthlyIncome * 0.2, 2);

  const defaultRules: Record<string, 'needs' | 'wants' | 'savings'> = {
    housing: 'needs', utilities: 'needs', groceries: 'needs', insurance: 'needs', healthcare: 'needs', transportation: 'needs', debt_minimums: 'needs',
    dining: 'wants', entertainment: 'wants', subscriptions: 'wants', shopping: 'wants', travel: 'wants', hobbies: 'wants',
    savings: 'savings', investments: 'savings', emergency_fund: 'savings', debt_extra: 'savings',
  };

  const rules = { ...defaultRules, ...categoryRules };
  const groupBudgets: Record<string, number> = { needs: needsBudget, wants: wantsBudget, savings: savingsBudget };
  const recommendations: BudgetRecommendation[] = [];

  for (const [category, spending] of Object.entries(spendingByCategory)) {
    const group = rules[category] ?? 'wants';
    const totalGroupSpending = Object.entries(spendingByCategory).filter(([c]) => rules[c] === group).reduce((s, [, v]) => s + v, 0) || 1;
    const budgetForCategory = round(groupBudgets[group] * safeDivide(spending, totalGroupSpending, 0), 2);
    const percentOfIncome = round(safeDivide(spending, monthlyIncome, 0) * 100, 1);
    const rulePercent = group === 'needs' ? 50 : group === 'wants' ? 30 : 20;

    let status: BudgetRecommendation['status'];
    let suggestion: string;

    if (spending <= budgetForCategory * 0.8) { status = 'under'; suggestion = 'Spending is well within budget. Consider allocating surplus to savings.'; }
    else if (spending <= budgetForCategory) { status = 'on_track'; suggestion = 'Spending is on track. Keep it up!'; }
    else if (spending <= budgetForCategory * 1.2) { status = 'over'; suggestion = 'Slightly over budget. Look for small cuts this month.'; }
    else { status = 'critical'; suggestion = 'Significantly over budget. Review and reduce spending urgently.'; }

    recommendations.push({ category, currentSpending: round(spending, 2), recommendedLimit: round(budgetForCategory, 2), percentOfIncome, rulePercent, status, suggestion });
  }

  const overCount = recommendations.filter(r => r.status === 'over' || r.status === 'critical').length;
  let overallStatus: BudgetRecommendationResult['overallStatus'];
  if (overCount === 0) overallStatus = 'healthy';
  else if (overCount <= 2) overallStatus = 'warning';
  else overallStatus = 'critical';

  return { income: monthlyIncome, needsBudget, wantsBudget, savingsBudget, recommendations, overallStatus };
}

// ============================================================
// SAVINGS RATE
// ============================================================

export function calculateSavingsRate(grossIncome: number, totalExpenses: number, needsSpending: number, wantsSpending: number): SavingsRateResult {
  if (grossIncome <= 0) {
    return {
      grossIncome: 0, totalExpenses: 0, totalSavings: 0, savingsRate: 0, optimalRate: 20, status: 'critical', suggestion: 'No income recorded',
      fiftyThirtyTwenty: { needs: { amount: 0, percent: 50, actual: 0 }, wants: { amount: 0, percent: 30, actual: 0 }, savings: { amount: 0, percent: 20, actual: 0 } },
    };
  }

  const totalSavings = grossIncome - totalExpenses;
  const savingsRate = round(safeDivide(totalSavings, grossIncome, 0) * 100, 1);
  const optimalRate = 20;

  let status: SavingsRateResult['status'];
  let suggestion: string;

  if (savingsRate >= 30) { status = 'excellent'; suggestion = 'Outstanding savings rate! Consider investing surplus for long-term growth.'; }
  else if (savingsRate >= 20) { status = 'good'; suggestion = 'Great savings rate, meeting the 20% benchmark. Keep it up!'; }
  else if (savingsRate >= 10) { status = 'fair'; suggestion = 'Moderate savings rate. Look for ways to reduce wants spending.'; }
  else if (savingsRate >= 5) { status = 'poor'; suggestion = 'Low savings rate. Review subscriptions and discretionary spending.'; }
  else { status = 'critical'; suggestion = 'Critical: spending exceeds income. Immediate action needed to avoid debt.'; }

  return {
    grossIncome, totalExpenses: round(totalExpenses, 2), totalSavings: round(totalSavings, 2), savingsRate, optimalRate, status, suggestion,
    fiftyThirtyTwenty: {
      needs: { amount: round(grossIncome * 0.5, 2), percent: 50, actual: round(safeDivide(needsSpending, grossIncome, 0) * 100, 1) },
      wants: { amount: round(grossIncome * 0.3, 2), percent: 30, actual: round(safeDivide(wantsSpending, grossIncome, 0) * 100, 1) },
      savings: { amount: round(grossIncome * 0.2, 2), percent: 20, actual: round(savingsRate, 1) },
    },
  };
}

// ============================================================
// SPENDING TRENDS
// ============================================================

export function analyzeSpendingTrend(monthlySpending: number[], category: string): SpendingTrend {
  if (monthlySpending.length === 0) return { category, averageMonthly: 0, trend: 'stable', trendPercent: 0, isRecurring: false, frequency: 'irregular', confidence: 0 };

  const averageMonthly = round(monthlySpending.reduce((a, b) => a + b, 0) / monthlySpending.length, 2);

  const n = monthlySpending.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) { sumX += i; sumY += monthlySpending[i]; sumXY += i * monthlySpending[i]; sumX2 += i * i; }
  const slope = safeDivide(n * sumXY - sumX * sumY, n * sumX2 - sumX * sumX, 0);
  const trendPercent = round(safeDivide(slope, averageMonthly, 0) * 100, 1);

  let trend: SpendingTrend['trend'];
  if (trendPercent > 5) trend = 'increasing';
  else if (trendPercent < -5) trend = 'decreasing';
  else trend = 'stable';

  const variance = monthlySpending.reduce((sum, v) => sum + Math.pow(v - averageMonthly, 2), 0) / n;
  const cv = safeDivide(Math.sqrt(variance), averageMonthly, 1);
  const isRecurring = cv < 0.2;

  const nonZeroMonths = monthlySpending.filter(v => v > 0).length;
  let frequency: SpendingTrend['frequency'];
  if (nonZeroMonths === n) frequency = 'monthly';
  else if (nonZeroMonths >= n * 0.75) frequency = 'weekly';
  else if (nonZeroMonths <= 2) frequency = 'yearly';
  else frequency = 'irregular';

  const confidence = round(Math.min(1, n / 6) * (isRecurring ? 0.9 : 0.6) * (cv < 0.5 ? 1 : 0.7), 2);

  return { category, averageMonthly, trend, trendPercent, isRecurring, frequency, confidence };
}

// ============================================================
// FINANCIAL HEALTH SCORE
// ============================================================

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }

export function calculateFinancialHealthScore(params: {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  budgetLimits: Record<string, number>;
  actualSpending: Record<string, number>;
  emergencyFundBalance: number;
  monthlyInvestmentContributions: number;
  onTimePayments: number;
  totalPayments: number;
}): FinancialHealthScore {
  const { monthlyIncome, monthlyExpenses, totalDebt, budgetLimits, actualSpending, emergencyFundBalance, monthlyInvestmentContributions, onTimePayments, totalPayments } = params;

  if (monthlyIncome <= 0) {
    return {
      score: 0, grade: 'F',
      components: {
        savingsRate: { score: 0, weight: 200, value: 0 }, debtToIncomeRatio: { score: 0, weight: 200, value: 0 },
        budgetAdherence: { score: 0, weight: 160, value: 0 }, emergencyFundMonths: { score: 0, weight: 120, value: 0 },
        investmentRate: { score: 0, weight: 80, value: 0 }, billTimeliness: { score: 0, weight: 40, value: 0 },
      },
      strengths: [], weaknesses: ['No income data available'], suggestions: ['Add income and expense data to calculate your financial health'],
    };
  }

  const savingsRate = safeDivide(monthlyIncome - monthlyExpenses, monthlyIncome, 0);
  const savingsScore = clamp(savingsRate >= 0.3 ? 200 : savingsRate >= 0.2 ? 170 : savingsRate >= 0.1 ? 130 : savingsRate >= 0.05 ? 80 : savingsRate >= 0 ? 40 : 0, 0, 200);

  const dti = safeDivide(totalDebt, monthlyIncome * 12, 1);
  const dtiScore = clamp(dti <= 0 ? 200 : dti <= 0.1 ? 180 : dti <= 0.2 ? 150 : dti <= 0.36 ? 120 : dti <= 0.5 ? 80 : 30, 0, 200);

  const budgetCategories = Object.keys(budgetLimits);
  let onBudgetCount = 0;
  for (const cat of budgetCategories) { if ((actualSpending[cat] ?? 0) <= (budgetLimits[cat] ?? 0)) onBudgetCount++; }
  const adherenceRate = safeDivide(onBudgetCount, Math.max(budgetCategories.length, 1), 0);
  const budgetScore = clamp(round(adherenceRate * 160, 0), 0, 160);

  const emergencyMonths = safeDivide(emergencyFundBalance, monthlyExpenses, 0);
  const emergencyScore = clamp(emergencyMonths >= 6 ? 120 : emergencyMonths >= 3 ? 90 : emergencyMonths >= 1 ? 50 : 10, 0, 120);

  const investmentRate = safeDivide(monthlyInvestmentContributions, monthlyIncome, 0);
  const investmentScore = clamp(investmentRate >= 0.15 ? 80 : investmentRate >= 0.1 ? 65 : investmentRate >= 0.05 ? 40 : investmentRate > 0 ? 20 : 0, 0, 80);

  const timelinessRate = safeDivide(onTimePayments, Math.max(totalPayments, 1), 0);
  const timelinessScore = clamp(round(timelinessRate * 40, 0), 0, 40);

  const score = savingsScore + dtiScore + budgetScore + emergencyScore + investmentScore + timelinessScore;

  let grade: FinancialHealthScore['grade'];
  if (score >= 900) grade = 'A+'; else if (score >= 800) grade = 'A'; else if (score >= 700) grade = 'B+'; else if (score >= 600) grade = 'B'; else if (score >= 500) grade = 'C+'; else if (score >= 400) grade = 'C'; else if (score >= 250) grade = 'D'; else grade = 'F';

  const strengths: string[] = [], weaknesses: string[] = [], suggestions: string[] = [];

  if (savingsScore >= 150) strengths.push('Strong savings rate');
  else { weaknesses.push('Low savings rate'); suggestions.push('Aim to save at least 20% of income'); }

  if (dtiScore >= 150) strengths.push('Low debt-to-income ratio');
  else { weaknesses.push('High debt-to-income ratio'); suggestions.push('Focus on paying down high-interest debt'); }

  if (budgetScore >= 120) strengths.push('Good budget adherence');
  else { weaknesses.push('Budget overruns'); suggestions.push('Review and adjust budget categories where you overspend'); }

  if (emergencyScore >= 90) strengths.push('Solid emergency fund');
  else { weaknesses.push('Insufficient emergency fund'); suggestions.push('Build emergency fund to cover 3-6 months of expenses'); }

  if (investmentScore >= 50) strengths.push('Regular investing');
  else { weaknesses.push('Not investing enough'); suggestions.push('Start with at least 5-10% of income toward investments'); }

  if (timelinessScore >= 35) strengths.push('Consistent on-time payments');
  else { weaknesses.push('Late payments'); suggestions.push('Set up autopay for bills to avoid late fees'); }

  return {
    score: round(score, 0), grade,
    components: {
      savingsRate: { score: savingsScore, weight: 200, value: round(savingsRate * 100, 1) },
      debtToIncomeRatio: { score: dtiScore, weight: 200, value: round(dti * 100, 1) },
      budgetAdherence: { score: budgetScore, weight: 160, value: round(adherenceRate * 100, 1) },
      emergencyFundMonths: { score: emergencyScore, weight: 120, value: round(emergencyMonths, 1) },
      investmentRate: { score: investmentScore, weight: 80, value: round(investmentRate * 100, 1) },
      billTimeliness: { score: timelinessScore, weight: 40, value: round(timelinessRate * 100, 1) },
    },
    strengths, weaknesses, suggestions,
  };
}

// ============================================================
// WORKOUT FREQUENCY INSIGHT
// ============================================================

export function generateWorkoutFrequencyInsight(goal: FitnessGoal, activityLevel: ActivityLevel, currentWeeklyWorkouts: number, streakDays: number = 0): WorkoutFrequencyInsight {
  const recommendation = recommendWorkoutFrequency(goal, activityLevel);
  const diff = recommendation.recommended - currentWeeklyWorkouts;

  let suggestion: string;
  if (diff > 0) suggestion = `Add ${diff} more workout(s) per week to align with your ${goal} goal.`;
  else if (diff < 0) suggestion = `You're training more than recommended. Consider adding rest days for recovery.`;
  else suggestion = `Your workout frequency is optimal for your ${goal} goal!`;

  const patterns: Record<number, number[]> = { 2: [1, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  const optimalDays = patterns[recommendation.recommended] ?? patterns[3];

  return { currentWeekly: currentWeeklyWorkouts, recommendedWeekly: recommendation.recommended, goal, streakDays, suggestion, optimalDays };
}

// ============================================================
// PROGRESS PREDICTION
// ============================================================

export function predictProgress(currentWeightKg: number, targetWeightKg: number, tdee: number, avgDailyCalorieIntake: number, avgDailyCaloriesBurned: number = 0, goal: FitnessGoal = 'fat_loss'): ProgressPrediction {
  const warnings: string[] = [];

  if (currentWeightKg <= 0 || tdee <= 0) {
    return {
      currentWeightKg, targetWeightKg, projectedWeeks: null, projectedDate: null, weeklyChangeRate: 0, isOnTrack: false, calorieTarget: 0, proteinTarget: 0,
      projection: { weeks: [], estimatedGoalDate: null, weeksToGoal: null, isRealistic: false, warnings: ['Insufficient data'] },
      warnings: ['Need current weight and TDEE to predict progress'],
    };
  }

  const totalExpenditure = tdee + avgDailyCaloriesBurned;
  const dailyDeficit = totalExpenditure - avgDailyCalorieIntake;
  const weeklyChangeRate = round(safeDivide(dailyDeficit * 7, 7700, 0), 2);

  const calorieNeeds = calculateCalorieNeeds(tdee, goal);
  const calorieTarget = calorieNeeds.targetCalories;
  const proteinNeeds = calculateProteinNeeds(currentWeightKg, goal, calorieTarget);
  const projection = projectWeightChange(currentWeightKg, targetWeightKg, tdee, avgDailyCalorieIntake, 52);

  const isOnTrack = goal === 'fat_loss' ? weeklyChangeRate > 0 : goal === 'muscle_gain' ? weeklyChangeRate < 0 : Math.abs(weeklyChangeRate) < 0.1;

  if (!isOnTrack) {
    warnings.push(goal === 'fat_loss' ? 'You are not in a caloric deficit. Reduce intake or increase activity.' : goal === 'muscle_gain' ? 'You are not in a caloric surplus. Increase intake.' : 'Your weight is fluctuating outside maintenance range.');
  }

  if (Math.abs(weeklyChangeRate) > 1) warnings.push('Rate of change is aggressive. Consider a more moderate approach for sustainability.');

  return { currentWeightKg, targetWeightKg, projectedWeeks: projection.weeksToGoal, projectedDate: projection.estimatedGoalDate, weeklyChangeRate, isOnTrack, calorieTarget, proteinTarget: proteinNeeds.recommendedGrams, projection, warnings: [...warnings, ...projection.warnings] };
}

// ============================================================
// FINANCIAL SUMMARY
// ============================================================

export function generateFinancialSummary(transactions: { amount: number; type: 'income' | 'expense'; category: string; date: string }[], previousPeriodTotal?: number): FinancialSummary {
  if (transactions.length === 0) return { totalIncome: 0, totalExpenses: 0, netIncome: 0, savingsRate: 0, topCategories: [], monthOverMonthChange: 0, trends: [] };

  const totalIncome = round(transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), 2);
  const totalExpenses = round(transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), 2);
  const netIncome = round(totalIncome - totalExpenses, 2);
  const savingsRate = round(safeDivide(netIncome, totalIncome, 0) * 100, 1);

  const categoryMap = new Map<string, number>();
  for (const t of transactions.filter(t => t.type === 'expense')) categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);

  const topCategories = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([category, amount]) => ({ category, amount: round(amount, 2), percent: round(safeDivide(amount, totalExpenses, 0) * 100, 1) }));

  const monthOverMonthChange = previousPeriodTotal ? round(safeDivide(totalExpenses - previousPeriodTotal, previousPeriodTotal, 0) * 100, 1) : 0;

  return { totalIncome, totalExpenses, netIncome, savingsRate, topCategories, monthOverMonthChange, trends: [] };
}

// ============================================================
// BACKWARDS COMPATIBILITY HELPERS
// ============================================================

export function getMonthlyWorkoutStats(workouts: { date: string; durationMinutes?: number; duration?: number }[]): WorkoutStats {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const thisMonthWorkouts = workouts.filter(w => { const d = new Date(w.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
  const totalDuration = thisMonthWorkouts.reduce((sum, w) => sum + (w.durationMinutes ?? w.duration ?? 0), 0);

  let streak = 0;
  const sortedDates = [...new Set(workouts.map(w => w.date.split('T')[0]))].sort().reverse();
  for (let i = 0; i < sortedDates.length; i++) {
    const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (sortedDates.includes(expectedDate)) streak++;
    else break;
  }

  return { totalThisMonth: thisMonthWorkouts.length, totalDuration, streak };
}

export function getTodayNutrition(meals: { date: string; calories: number; proteinG?: number; protein?: number; carbsG?: number; carbs?: number; fatG?: number; fat?: number }[]): TodayNutrition {
  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals.filter(m => m.date.startsWith(today));
  return { calories: todaysMeals.reduce((s, m) => s + m.calories, 0), protein: todaysMeals.reduce((s, m) => s + (m.proteinG ?? m.protein ?? 0), 0), carbs: todaysMeals.reduce((s, m) => s + (m.carbsG ?? m.carbs ?? 0), 0), fat: todaysMeals.reduce((s, m) => s + (m.fatG ?? m.fat ?? 0), 0), meals: todaysMeals.length };
}

export function getTodayHydration(entries: { date: string; amountMl?: number; amount?: number }[]): number {
  const today = new Date().toISOString().split('T')[0];
  return entries.filter(e => e.date.startsWith(today)).reduce((s, e) => s + (e.amountMl ?? e.amount ?? 0), 0);
}

export function getRecentActivity(
  transactions: { id: string; date: string; description?: string; amount?: number; category?: string }[],
  workouts: { id: string; date: string; name?: string }[],
  meals: { id: string; date: string; name?: string }[],
  hydration: { id: string; date: string }[],
  sleep: { id: string; date: string }[],
  bodyMetrics: { id: string; date: string }[],
  goals: { id: string; deadline?: string; date?: string; name?: string }[]
): ActivityItem[] {
  const items: { id: string; type: string; date: string; description?: string; name?: string; amount?: number; category?: string }[] = [];
  for (const t of transactions) items.push({ ...t, type: 'transaction', name: t.category });
  for (const w of workouts) items.push({ ...w, type: 'workout' });
  for (const m of meals) items.push({ ...m, type: 'meal' });
  for (const h of hydration) items.push({ ...h, type: 'hydration' });
  for (const s of sleep) items.push({ ...s, type: 'sleep' });
  for (const b of bodyMetrics) items.push({ ...b, type: 'bodyMetric' });
  for (const g of goals) items.push({ ...g, type: 'goal', date: g.deadline || g.date || '' });
  return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(item => ({
    id: item.id,
    type: item.type as ActivityItem['type'],
    title: item.name || item.type,
    description: item.description || item.date,
    timestamp: item.date,
    icon: item.type,
    color: item.type === 'transaction' ? 'primary' : item.type === 'workout' ? 'success' : item.type === 'meal' ? 'warning' : 'accent',
    subtitle: item.description || item.date,
    amount: item.amount,
  }));
}

export function getSpendingByCategory(transactions: { category: string; amount: number; type: string }[]): CategorySpend[] {
  const expenseTx = transactions.filter(t => t.type === 'expense');
  const total = expenseTx.reduce((s, t) => s + t.amount, 0);
  const categoryMap = new Map<string, number>();
  for (const t of expenseTx) categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount);
  return Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount: round(amount, 2), percentage: round(safeDivide(amount, total, 0) * 100, 1) })).sort((a, b) => b.amount - a.amount);
}

export function compareMonthOverMonth(current: number, previous: number): { change: number; percentChange: number; direction: 'up' | 'down' | 'none' } {
  const change = current - previous;
  const percentChange = previous > 0 ? round(safeDivide(change, previous, 0) * 100, 1) : 0;
  const direction: 'up' | 'down' | 'none' = change > 0 ? 'up' : change < 0 ? 'down' : 'none';
  return { change: round(change, 2), percentChange, direction };
}

export function getAverageSleep(sleepEntries: { durationHours?: number; duration?: number; quality?: number }[]): { duration: number; quality: number } {
  if (sleepEntries.length === 0) return { duration: 0, quality: 0 };
  const totalDuration = sleepEntries.reduce((s, e) => s + (e.durationHours ?? e.duration ?? 0), 0);
  const totalQuality = sleepEntries.reduce((s, e) => s + (e.quality ?? 0), 0);
  return { duration: round(totalDuration / sleepEntries.length, 1), quality: Math.round(totalQuality / sleepEntries.length) };
}