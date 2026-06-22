import { axiosInstance } from '@/lib/axios';
import type {
  Transaction,
  CreateTransactionDto,
  PaginatedResponse,
  Balance,
} from '@/types';

export interface TransactionFilters {
  type?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export const transactionsService = {
  async getAll(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    const response = await axiosInstance.get<PaginatedResponse<Transaction>>('/transactions', {
      params: filters,
    });
    return response.data;
  },

  async getById(id: string): Promise<Transaction> {
    const response = await axiosInstance.get<Transaction>(`/transactions/${id}`);
    return response.data;
  },

  async create(data: CreateTransactionDto): Promise<Transaction> {
    const response = await axiosInstance.post<Transaction>('/transactions', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateTransactionDto>): Promise<Transaction> {
    const response = await axiosInstance.patch<Transaction>(`/transactions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/transactions/${id}`);
  },

  async getBalance(): Promise<Balance> {
    const response = await axiosInstance.get<Balance>('/transactions/balance');
    return response.data;
  },
};
