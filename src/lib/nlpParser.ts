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
  'salary', 'wage', 'payment received', 'invoice paid', 'freelance',
  '.transfer', 'from', 'gift', 'reimbursement', 'returned', 'owed me',
  'client payment', 'sale', 'sold', 'earning', 'made',
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

function inferType(description: string, amount: number): 'income' | 'expense' | 'transfer' {
  const lowerDesc = description.toLowerCase();

  if (amount < 0) return 'expense';

  // Check for + sign indicating income
  if (lowerDesc.startsWith('+') || lowerDesc.includes(' +')) {
    return 'income';
  }

  // Transfer keywords
  const transferKeywords = ['transfer', 'sent to', 'received from', 'moved to', 'moved from', 
    'wired', 'wire transfer', 'venmo', 'zelle', 'paypal to', 'stripe', 'rental']
  for (const keyword of transferKeywords) {
    if (lowerDesc.includes(keyword)) {
      return 'transfer';
    }
  }

  // Income keywords - more comprehensive list
  for (const keyword of INCOME_KEYWORDS) {
    if (lowerDesc.includes(keyword)) {
      return 'income';
    }
  }

  // Additional income detection words
  const incomePatterns = ['salary', 'payroll', 'wages', 'bonus', 'commission', 'dividend', 'interest earned', 
    'refund', 'reimbursement', 'cashback', 'rebate', 'grant', 'stipend', 'pension', 'social security',
    'allowance', 'aid', 'scholarship', 'award', 'prize', 'lottery', 'inheritance']
  
  for (const pattern of incomePatterns) {
    if (lowerDesc.includes(pattern)) {
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
  const inputLower = input.toLowerCase()
  
  // Check for currency keywords first
  let detectedCurrency = null
  if (inputLower.includes('mad') || inputLower.includes('dh') || inputLower.includes('dirham')) {
    detectedCurrency = 'MAD'
  } else if (inputLower.includes('usd') || inputLower.includes('$')) {
    detectedCurrency = 'USD'
  } else if (inputLower.includes('eur') || inputLower.includes('euro')) {
    detectedCurrency = 'EUR'
  } else if (inputLower.includes('gbp') || inputLower.includes('pound')) {
    detectedCurrency = 'GBP'
  }
  
  // Extract any number from the input
  const numberMatch = input.match(/([\d,]+\.?\d{0,2})/)
  if (numberMatch) {
    const amount = parseFloat(numberMatch[1].replace(/,/g, ''))
    if (!isNaN(amount) && amount > 0) {
      return { amount, currency: detectedCurrency }
    }
  }

  return null
}

export function parseNaturalLanguage(input: string): ParsedTransaction & { raw: string } {
  const transactions = parseMultipleTransactions(input);
  if (transactions.length > 0) {
    return transactions[0];
  }
  
  let workingInput = input.trim();

  const dateResult = extractDate(workingInput);
  const date = dateResult?.date || new Date().toISOString().split('T')[0];
  if (dateResult) workingInput = dateResult.cleanedInput;

  const amountResult = extractAmount(workingInput);
  const amount = amountResult?.amount || 0;
  if (amountResult) {
    workingInput = workingInput.replace(/\$?\s?[\d,]+\.?\d{0,2}\s?(usd|eur|gbp|mad|dh)?/i, '').trim();
  }

  const categoryResult = inferCategory(workingInput);
  const type = inferType(workingInput, amount);

  let confidence = 0;
  if (amount > 0) confidence += 0.4;
  if (categoryResult) confidence += 0.35;
  if (dateResult) confidence += 0.15;
  if (type === 'income' || type === 'expense' || type === 'transfer') confidence += 0.1;

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

function parseMultipleTransactions(input: string): (ParsedTransaction & { raw: string })[] {
  const results: (ParsedTransaction & { raw: string })[] = [];
  
  const separators = [/[,;]\s*(?=[A-Z])/, /\band\b(?=\s*[A-Z])/];
  let parts: string[] = [input];
  
  for (const sep of separators) {
    const newParts: string[] = [];
    for (const part of parts) {
      newParts.push(...part.split(sep));
    }
    parts = newParts;
  }
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    const amountMatch = trimmed.match(/([\d,]+\.?\d{0,2})/);
    if (!amountMatch) continue;
    
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const cleaned = trimmed.replace(/\$?\s?[\d,]+\.?\d{0,2}\s?(usd|eur|gbp|mad|dh)?/i, '').trim();
    
    if (cleaned && amount > 0) {
      const dateResult = extractDate(cleaned);
      const date = dateResult?.date || new Date().toISOString().split('T')[0];
      let workingIn = dateResult ? dateResult.cleanedInput : cleaned;
      
      const categoryResult = inferCategory(workingIn);
      const type = inferType(workingIn, amount);
      
      let confidence = 0.4;
      if (categoryResult) confidence += 0.35;
      if (dateResult) confidence += 0.15;
      if (type === 'income' || type === 'expense' || type === 'transfer') confidence += 0.1;
      
      results.push({
        description: workingIn.replace(/^for\s+/i, '').replace(/^at\s+/i, '').trim() || 'Transaction',
        amount,
        category: categoryResult?.category || 'Miscellaneous',
        subcategory: categoryResult?.subcategory || 'Other',
        type,
        date,
        confidence: Math.min(confidence, 1),
        raw: trimmed,
      });
    }
  }
  
  return results;
}

export function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
