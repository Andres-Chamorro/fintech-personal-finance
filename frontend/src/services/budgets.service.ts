import { axiosInstance } from '@/lib/axios';
import type { Budget, CreateBudgetDto } from '@/types';

export const budgetsService = {
  async getAll(month?: number, year?: number): Promise<Budget[]> {
    const response = await axiosInstance.get<Budget[]>('/budgets', {
      params: { month, year },
    });
    return response.data;
  },

  async getById(id: string): Promise<Budget> {
    const response = await axiosInstance.get<Budget>(`/budgets/${id}`);
    return response.data;
  },

  async create(data: CreateBudgetDto): Promise<Budget> {
    const response = await axiosInstance.post<Budget>('/budgets', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateBudgetDto>): Promise<Budget> {
    const response = await axiosInstance.patch<Budget>(`/budgets/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/budgets/${id}`);
  },
};
