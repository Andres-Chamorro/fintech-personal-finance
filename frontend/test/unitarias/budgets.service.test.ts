import { describe, it, expect, vi, beforeEach } from 'vitest';
import { budgetsService } from '../../src/services/budgets.service';
import { axiosInstance } from '../../src/lib/axios';

vi.mock('../../src/lib/axios', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('BudgetsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all budgets', async () => {
      const mockBudgets = [
        {
          id: '1',
          amount: 500000,
          month: 6,
          year: 2026,
          categoryId: 'cat-1',
          spent: 200000,
          percentage: 40,
        },
      ];

      (axiosInstance.get as any).mockResolvedValue({ data: mockBudgets });

      const result = await budgetsService.getAll();

      expect(axiosInstance.get).toHaveBeenCalledWith('/budgets', {
        params: { month: undefined, year: undefined },
      });
      expect(result).toEqual(mockBudgets);
    });

    it('should filter budgets by month and year', async () => {
      const mockBudgets = [
        {
          id: '1',
          amount: 500000,
          month: 6,
          year: 2026,
          categoryId: 'cat-1',
        },
      ];

      (axiosInstance.get as any).mockResolvedValue({ data: mockBudgets });

      const result = await budgetsService.getAll(6, 2026);

      expect(axiosInstance.get).toHaveBeenCalledWith('/budgets', {
        params: { month: 6, year: 2026 },
      });
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('getById', () => {
    it('should get a specific budget', async () => {
      const mockBudget = {
        id: '1',
        amount: 500000,
        month: 6,
        year: 2026,
        categoryId: 'cat-1',
      };

      (axiosInstance.get as any).mockResolvedValue({ data: mockBudget });

      const result = await budgetsService.getById('1');

      expect(axiosInstance.get).toHaveBeenCalledWith('/budgets/1');
      expect(result).toEqual(mockBudget);
    });
  });

  describe('create', () => {
    it('should create a budget', async () => {
      const mockBudget = {
        id: '1',
        amount: 500000,
        month: 7,
        year: 2026,
        categoryId: 'cat-1',
      };

      (axiosInstance.post as any).mockResolvedValue({ data: mockBudget });

      const result = await budgetsService.create({
        amount: 500000,
        month: 7,
        year: 2026,
        categoryId: 'cat-1',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/budgets', {
        amount: 500000,
        month: 7,
        year: 2026,
        categoryId: 'cat-1',
      });
      expect(result).toEqual(mockBudget);
    });

    it('should throw error for duplicate budget', async () => {
      (axiosInstance.post as any).mockRejectedValue({
        response: {
          status: 409,
          data: { message: 'Budget already exists for this category and month' },
        },
      });

      await expect(
        budgetsService.create({
          amount: 500000,
          month: 6,
          year: 2026,
          categoryId: 'cat-1',
        })
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a budget', async () => {
      const mockUpdated = {
        id: '1',
        amount: 600000,
        month: 6,
        year: 2026,
        categoryId: 'cat-1',
      };

      (axiosInstance.patch as any).mockResolvedValue({ data: mockUpdated });

      const result = await budgetsService.update('1', { amount: 600000 });

      expect(axiosInstance.patch).toHaveBeenCalledWith('/budgets/1', {
        amount: 600000,
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('should delete a budget', async () => {
      (axiosInstance.delete as any).mockResolvedValue({});

      await budgetsService.delete('1');

      expect(axiosInstance.delete).toHaveBeenCalledWith('/budgets/1');
    });
  });
});
