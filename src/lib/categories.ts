export interface CategoryDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  subcategories: string[];
}

export const EXPENSE_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    icon: 'coffee',
    color: '#F97316',
    type: 'expense',
    subcategories: ['Restaurants', 'Groceries', 'Coffee', 'Delivery', 'Bars'],
  },
  {
    id: 'transport',
    name: 'Transportation',
    icon: 'car',
    color: '#3B82F6',
    type: 'expense',
    subcategories: ['Fuel', 'Parking', 'Public Transit', 'Rideshare', 'Car Maintenance'],
  },
  {
    id: 'housing',
    name: 'Housing',
    icon: 'home',
    color: '#8B5CF6',
    type: 'expense',
    subcategories: ['Rent', 'Mortgage', 'Utilities', 'Internet', 'Repairs'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: 'shopping-bag',
    color: '#EC4899',
    type: 'expense',
    subcategories: ['Clothing', 'Electronics', 'Home', 'Books', 'Gifts'],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: 'film',
    color: '#A855F7',
    type: 'expense',
    subcategories: ['Movies', 'Games', 'Concerts', 'Streaming', 'Subscriptions'],
  },
  {
    id: 'health',
    name: 'Health & Fitness',
    icon: 'heart-pulse',
    color: '#10B981',
    type: 'expense',
    subcategories: ['Gym', 'Supplements', 'Medical', 'Therapy', 'Sports'],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: 'plane',
    color: '#06B6D4',
    type: 'expense',
    subcategories: ['Flights', 'Hotels', 'Activities', 'Car Rental', 'Insurance'],
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'graduation-cap',
    color: '#F59E0B',
    type: 'expense',
    subcategories: ['Courses', 'Books', 'Tuition', 'Certifications', 'Workshops'],
  },
  {
    id: 'personal',
    name: 'Personal Care',
    icon: 'user',
    color: '#EF4444',
    type: 'expense',
    subcategories: ['Haircut', 'Skincare', 'Laundry', 'Dry Cleaning'],
  },
  {
    id: 'finance',
    name: 'Financial',
    icon: 'landmark',
    color: '#14B8A6',
    type: 'both',
    subcategories: ['Fees', 'Taxes', 'Investments', 'Insurance', 'Loans'],
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    icon: 'circle-help',
    color: '#6B7280',
    type: 'expense',
    subcategories: ['Other', 'Uncategorized'],
  },
];

export const INCOME_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'salary',
    name: 'Salary & Wages',
    icon: 'banknote',
    color: '#22C55E',
    type: 'income',
    subcategories: ['Paycheck', 'Overtime', 'Bonus'],
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: 'laptop',
    color: '#10B981',
    type: 'income',
    subcategories: ['Design', 'Development', 'Consulting', 'Writing'],
  },
  {
    id: 'investment',
    name: 'Investment Income',
    icon: 'trending-up',
    color: '#14B8A6',
    type: 'income',
    subcategories: ['Dividends', 'Interest', 'Capital Gains', 'Rental'],
  },
  {
    id: 'gifts',
    name: 'Gifts & Refunds',
    icon: 'gift',
    color: '#F59E0B',
    type: 'income',
    subcategories: ['Gifts', 'Refunds', 'Rewards', 'Cashback'],
  },
  {
    id: 'other-income',
    name: 'Other Income',
    icon: 'wallet',
    color: '#6B7280',
    type: 'income',
    subcategories: ['Side Business', 'Rental', 'Miscellaneous'],
  },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function getCategoryById(id: string): CategoryDefinition | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryByName(name: string): CategoryDefinition | undefined {
  return ALL_CATEGORIES.find(
    (c) => c.name.toLowerCase() === name.toLowerCase() || c.id === name.toLowerCase()
  );
}

export function getSubcategoryColors(): Record<string, string> {
  const colors: Record<string, string> = {};
  ALL_CATEGORIES.forEach((cat) => {
    cat.subcategories.forEach((sub) => {
      colors[sub] = cat.color;
    });
  });
  return colors;
}
