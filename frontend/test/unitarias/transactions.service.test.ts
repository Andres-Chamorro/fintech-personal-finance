import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transactionsService } from '../../src/services/transactions.service';
import { axiosInstance } from '../../src/lib/axios';

vi.mock('../../src/lib/axios', () => ({
  axiosInstance: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TransactionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should get all transactions with filters', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              type: 'expense',
              amount: 50000,
              description: 'Test transaction',
              transactionDate: '2026-06-15',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      (axiosInstance.get as any).mockResolvedValue(mockResponse);

      const filters = { type: 'expense', page: 1, limit: 10 };
      const result = await transactionsService.getAll(filters);

      expect(axiosInstance.get).toHaveBeenCalledWith('/transactions', {
        params: filters,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should get all transactions without filters', async () => {
      const mockResponse = {
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
        },
      };

      (axiosInstance.get as any).mockResolvedValue(mockResponse);

      const result = await transactionsService.getAll();

      expect(axiosInstance.get).toHaveBeenCalledWith('/transactions', {
        params: undefined,
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('create', () => {
    it('should create a transaction', async () => {
      const mockTransaction = {
        id: '1',
        type: 'expense',
        amount: 50000,
        description: 'New transaction',
        transactionDate: '2026-06-15',
        categoryId: 'cat-1',
      };

      (axiosInstance.post as any).mockResolvedValue({ data: mockTransaction });

      const result = await transactionsService.create({
        type: 'expense' as any,
        amount: 50000,
        description: 'New transaction',
        transactionDate: '2026-06-15',
        categoryId: 'cat-1',
      });

      expect(axiosInstance.post).toHaveBeenCalledWith('/transactions', {
        type: 'expense',
        amount: 50000,
        description: 'New transaction',
        transactionDate: '2026-06-15',
        categoryId: 'cat-1',
      });
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('update', () => {
    it('should update a transaction', async () => {
      const mockUpdated = {
        id: '1',
        type: 'expense',
        amount: 75000,
        description: 'Updated transaction',
        transactionDate: '2026-06-15',
        categoryId: 'cat-1',
      };

      (axiosInstance.patch as any).mockResolvedValue({ data: mockUpdated });

      const result = await transactionsService.update('1', {
        amount: 75000,
        description: 'Updated transaction',
      });

      expect(axiosInstance.patch).toHaveBeenCalledWith('/transactions/1', {
        amount: 75000,
        description: 'Updated transaction',
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      (axiosInstance.delete as any).mockResolvedValue({});

      await transactionsService.delete('1');

      expect(axiosInstance.delete).toHaveBeenCalledWith('/transactions/1');
    });
  });

  describe('getBalance', () => {
    it('should get balance', async () => {
      const mockBalance = {
        totalIncome: 1000000,
        totalExpenses: 500000,
        balance: 500000,
      };

      (axiosInstance.get as any).mockResolvedValue({ data: mockBalance });

      const result = await transactionsService.getBalance();

      expect(axiosInstance.get).toHaveBeenCalledWith('/transactions/balance');
      expect(result).toEqual(mockBalance);
    });
  });
});
