// User types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Transaction types
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string;
  categoryId?: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  type: TransactionType;
  amount: number;
  description: string;
  transactionDate: string;
  categoryId?: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color?: string;
}

// Budget types
export interface Budget {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  category: Category;
  spent: number;
  remaining: number;
  percentage: number;
  alerts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  amount: number;
  month: number;
  year: number;
  categoryId: string;
}

// Balance types
export interface Balance {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

// Pagination types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
