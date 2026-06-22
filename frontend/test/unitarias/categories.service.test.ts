import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoriesService } from '../../src/services/categories.service';
import { axiosInstance } from '../../src/lib/axios';

vi.mock('../../src/lib/axios', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CategoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all categories', async () => {
      const mockCategories = [
        {
          id: '1',
          name: 'Alimentación',
          description: 'Gastos en comida',
          color: '#FF6B6B',
        },
        {
          id: '2',
          name: 'Transporte',
          description: 'Gastos en transporte',
          color: '#4ECDC4',
        },
      ];

      (axiosInstance.get as any).mockResolvedValue({ data: mockCategories });

      const result = await categoriesService.getAll();

      expect(axiosInstance.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);
    });
  });

  describe('getById', () => {
    it('should get a specific category', async () => {
      const mockCategory = {
        id: '1',
        name: 'Alimentación',
        description: 'Gastos en comida',
        color: '#FF6B6B',
      };

      (axiosInstance.get as any).mockResolvedValue({ data: mockCategory });

      const result = await categoriesService.getById('1');

      expect(axiosInstance.get).toHaveBeenCalledWith('/categories/1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const mockCategory = {
        id: '1',
        name: 'Entretenimiento',
        description: 'Gastos en ocio',
        color: '#9B59B6',
      };

      (axiosInstance.post as any).mockResolvedValue({ data: mockCategory });

      const result = await categoriesService.create({
        name: 'Entretenimiento',
        description: 'Gastos en ocio',
        color: '#9B59B6',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/categories', {
        name: 'Entretenimiento',
        description: 'Gastos en ocio',
        color: '#9B59B6',
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw error on validation failure', async () => {
      (axiosInstance.post as any).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Validation failed' },
        },
      });

      await expect(
        categoriesService.create({
          name: '',
          description: 'Invalid',
          color: '#000000',
        })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const mockUpdated = {
        id: '1',
        name: 'Alimentación Actualizada',
        description: 'Nueva descripción',
        color: '#FF0000',
      };

      (axiosInstance.patch as any).mockResolvedValue({ data: mockUpdated });

      const result = await categoriesService.update('1', {
        name: 'Alimentación Actualizada',
        description: 'Nueva descripción',
      });

      expect(axiosInstance.patch).toHaveBeenCalledWith('/categories/1', {
        name: 'Alimentación Actualizada',
        description: 'Nueva descripción',
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      (axiosInstance.delete as any).mockResolvedValue({});

      await categoriesService.delete('1');

      expect(axiosInstance.delete).toHaveBeenCalledWith('/categories/1');
    });

    it('should throw error if category has transactions', async () => {
      (axiosInstance.delete as any).mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Cannot delete category with existing transactions' },
        },
      });

      await expect(categoriesService.delete('1')).rejects.toThrow();
    });
  });
});
