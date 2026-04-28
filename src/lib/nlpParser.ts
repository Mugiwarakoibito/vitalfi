import type { ParsedTransaction } from '@/types/finance';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './categories';

const KEYWORDS: Record<string, string> = {
  starbucks: 'Coffee',
  coffee: 'Coffee',
  spotify: 'Subscriptions',
  netflix: 'Streaming',
  gym: 'Gym',
  'uber eats': 'Delivery',
  doordash: 'Delivery',
  grubhub: 'Delivery',
  amazon: 'Shopping',
  uber: 'Rideshare',
  lyft: 'Rideshare',
  shell: 'Fuel',
  chevron: 'Fuel',
  exxon: 'Fuel',
  'whole foods': 'Groceries',
  'trader joe': 'Groceries',
  safeway: 'Groceries',
  'grocery outlet': 'Groceries',
  aldi: 'Groceries',
  costco: 'Groceries',
  target: 'Shopping',
  walmart: 'Shopping',
  nike: 'Clothing',
  adidas: 'Clothing',
  hulu: 'Streaming',
  disney: 'Streaming',
  'apple tv': 'Streaming',
  'youtube premium': 'Subscriptions',
  hotel: 'Hotels',
  airbnb: 'Hotels',
  'best buy': 'Electronics',
  'apple store': 'Electronics',
  cinema: 'Movies',
  ticket: 'Concerts',
  flight: 'Flights',
  dentist: 'Medical',
  pharmacy: 'Medical',
  cvs: 'Medical',
  walgreens: 'Medical',
  'haircut': 'Haircut',
  parking: 'Parking',
  bus: 'Public Transit',
  metro: 'Public Transit',
  train: 'Public Transit',
  'car wash': 'Car Maintenance',
  mechanic: 'Car Maintenance',
  'oil change': 'Car Maintenance',
  rent: 'Rent',
  landlord: 'Rent',
  mortgage: 'Mortgage',
  electric: 'Utilities',
  'water bill': 'Utilities',
  gas: 'Utilities',
  internet: 'Internet',
  'comcast': 'Internet',
  'at&t': 'Internet',
  verizon: 'Internet',
  'paycheck': 'Paycheck',
  salary: 'Paycheck',
  invoice: 'Freelance',
  dividend: 'Dividends',
  interest: 'Interest',
  cashback: 'Cashback',
  refund: 'Refunds',
  gift: 'Gifts',
  bonus: 'Bonus',
  tuition: 'Tuition',
  book: 'Books',
  course: 'Courses',
  certification: 'Certifications',
};

const INCOME_KEYWORDS = [
  'income', 'earned', 'received', 'paid me', 'got paid', 'deposit',
  'dividend', 'interest', 'refund', 'cashback', 'bonus', 'paycheck',
  'salary', 'wage', 'payment received', 'invoice paid',
];

const DATE_KEYWORDS: Record<string, number> = {
  'today': 0,
  'yesterday': 1,
  'last week': 7,
  'two days ago': 2,
  'three days ago': 3,
  '2 days ago': 2,
  '3 days ago': 3,
  '4 days ago': 4,
  '5 days ago': 5,
  '6 days ago': 6,
  'a week ago': 7,
  'last month': 30,
};

function inferCategory(description: string): { category: string; subcategory: string } | null {
  const lowerDesc = description.toLowerCase();

  for (const [keyword, subcategory] of Object.entries(KEYWORDS)) {
    if (lowerDesc.includes(keyword)) {
      const catDef =
        EXPENSE_CATEGORIES.find((c) => c.subcategories.includes(subcategory)) ||
        INCOME_CATEGORIES.find((c) => c.subcategories.includes(subcategory));
      if (catDef) {
        return { category: catDef.name, subcategory };
      }
    }
  }

  return null;
}

function inferType(description: string, amount: number): 'income' | 'expense' {
  const lowerDesc = description.toLowerCase();

  if (amount < 0) return 'income';

  for (const keyword of INCOME_KEYWORDS) {
    if (lowerDesc.includes(keyword) || lowerDesc.includes('received') || lowerDesc.includes('deposit')) {
      return 'income';
    }
  }

  return 'expense';
}

function extractDate(input: string): { date: string; cleanedInput: string } | null {
  const lowerInput = input.toLowerCase();

  for (const [keyword, daysAgo] of Object.entries(DATE_KEYWORDS)) {
    if (lowerInput.includes(keyword)) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const cleanedInput = lowerInput.replace(keyword, '').trim();
      return { date: date.toISOString().split('T')[0], cleanedInput };
    }
  }

  const yesterdayMatch = lowerInput.match(/\byesterday\b/);
  if (yesterdayMatch) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return { date: date.toISOString().split('T')[0], cleanedInput: lowerInput.replace('yesterday', '').trim() };
  }

  return null;
}

function extractAmount(input: string): { amount: number; currency: string | null } | null {
  const patterns = [
    /\$\s?([\d,]+\.?\d{0,2})/,
    /([\d,]+\.\d{2})\s?(usd|eur|gbp)?/i,
    /([\d,]+)\s?dollars/i,
    /([\d,]+)\s?euro/i,
    /([\d,]+)\s?pounds/i,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0) {
        return { amount, currency: match[2]?.toUpperCase() || null };
      }
    }
  }

  return null;
}

export function parseNaturalLanguage(input: string): ParsedTransaction & { raw: string } {
  let workingInput = input.trim();

  const dateResult = extractDate(workingInput);
  const date = dateResult?.date || new Date().toISOString().split('T')[0];
  if (dateResult) workingInput = dateResult.cleanedInput;

  const amountResult = extractAmount(workingInput);
  const amount = amountResult?.amount || 0;
  if (amountResult) {
    workingInput = workingInput.replace(/\$?\s?[\d,]+\.?\d{0,2}\s?(usd|eur|gbp)?/i, '').trim();
  }

  const categoryResult = inferCategory(workingInput);
  const type = inferType(workingInput, amount);

  let confidence = 0;
  if (amount > 0) confidence += 0.4;
  if (categoryResult) confidence += 0.35;
  if (dateResult) confidence += 0.15;
  if (type === 'income' || type === 'expense') confidence += 0.1;

  return {
    description: workingInput.replace(/^for\s+/i, '').replace(/^at\s+/i, '').trim() || 'Unknown transaction',
    amount,
    category: categoryResult?.category || 'Miscellaneous',
    subcategory: categoryResult?.subcategory || 'Other',
    type,
    date,
    confidence: Math.min(confidence, 1),
    raw: input,
  };
}

export function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
