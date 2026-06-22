import { axiosInstance } from '@/lib/axios';
import type { Category, CreateCategoryDto } from '@/types';

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    const response = await axiosInstance.get<Category[]>('/categories');
    return response.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await axiosInstance.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await axiosInstance.post<Category>('/categories', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateCategoryDto>): Promise<Category> {
    const response = await axiosInstance.patch<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axiosInstance.delete(`/categories/${id}`);
  },
};
