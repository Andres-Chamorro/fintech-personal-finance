import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TransactionsService } from '../../src/modules/transactions/transactions.service';
import { Transaction, TransactionType } from '../../src/modules/transactions/entities/transaction.entity';
import { CreateTransactionDto } from '../../src/modules/transactions/dto/create-transaction.dto';
import { UpdateTransactionDto } from '../../src/modules/transactions/dto/update-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: Repository<Transaction>;

  const mockUserId = 'user-123';
  const mockCategoryId = 'category-123';
  const mockTransactionId = 'transaction-123';

  const mockTransaction: Transaction = {
    id: mockTransactionId,
    type: TransactionType.EXPENSE,
    amount: 50000,
    description: 'Test transaction',
    transactionDate: new Date('2026-06-15'),
    userId: mockUserId,
    categoryId: mockCategoryId,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {} as any,
    category: {
      id: mockCategoryId,
      name: 'Test Category',
      description: 'Test',
      color: '#FF0000',
      userId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {} as any,
      transactions: [],
      budgets: [],
    },
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get<Repository<Transaction>>(getRepositoryToken(Transaction));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a transaction successfully', async () => {
      const createDto: CreateTransactionDto = {
        type: TransactionType.EXPENSE,
        amount: 50000,
        description: 'Test transaction',
        transactionDate: '2026-06-15',
        categoryId: mockCategoryId,
      };

      mockRepository.create.mockReturnValue(mockTransaction);
      mockRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.create(mockUserId, createDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        type: createDto.type,
        amount: createDto.amount,
        description: createDto.description,
        transactionDate: createDto.transactionDate,
        categoryId: mockCategoryId,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockTransaction);
      expect(result).toEqual(mockTransaction);
    });

    it('should create a transaction without category', async () => {
      const createDto: CreateTransactionDto = {
        type: TransactionType.INCOME,
        amount: 100000,
        description: 'Salary',
        transactionDate: '2026-06-15',
        categoryId: null,
      };

      const transactionWithoutCategory = { ...mockTransaction, categoryId: undefined };
      mockRepository.create.mockReturnValue(transactionWithoutCategory);
      mockRepository.save.mockResolvedValue(transactionWithoutCategory);

      const result = await service.create(mockUserId, createDto);

      expect(result.categoryId).toBeUndefined();
    });
  });

  describe('findAll', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockTransaction], 1]),
    };

    beforeEach(() => {
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return paginated transactions', async () => {
      const result = await service.findAll(mockUserId, { page: 1, limit: 10, sortOrder: 'DESC' });

      expect(result.data).toHaveLength(1);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('should filter by type', async () => {
      await service.findAll(mockUserId, { type: TransactionType.EXPENSE, page: 1, limit: 10, sortOrder: 'DESC' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.type = :type', { type: TransactionType.EXPENSE });
    });

    it('should filter by categoryId', async () => {
      await service.findAll(mockUserId, { categoryId: mockCategoryId, page: 1, limit: 10, sortOrder: 'DESC' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.categoryId = :categoryId', { categoryId: mockCategoryId });
    });

    it('should filter by date range', async () => {
      await service.findAll(mockUserId, { startDate: '2026-06-01', endDate: '2026-06-30', page: 1, limit: 10, sortOrder: 'DESC' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.transactionDate BETWEEN :startDate AND :endDate',
        { startDate: '2026-06-01', endDate: '2026-06-30' },
      );
    });

    it('should filter by startDate only', async () => {
      await service.findAll(mockUserId, { startDate: '2026-06-01', page: 1, limit: 10, sortOrder: 'DESC' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.transactionDate >= :startDate', { startDate: '2026-06-01' });
    });

    it('should filter by endDate only', async () => {
      await service.findAll(mockUserId, { endDate: '2026-06-30', page: 1, limit: 10, sortOrder: 'DESC' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('transaction.transactionDate <= :endDate', { endDate: '2026-06-30' });
    });
  });

  describe('findOne', () => {
    it('should return a transaction if found and user owns it', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne(mockUserId, mockTransactionId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTransactionId },
        relations: ['category'],
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, mockTransactionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own transaction', async () => {
      const otherUserTransaction = { ...mockTransaction, userId: 'other-user-123' };
      mockRepository.findOne.mockResolvedValue(otherUserTransaction);

      await expect(service.findOne(mockUserId, mockTransactionId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a transaction successfully', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 75000,
        description: 'Updated description',
      };

      const updatedTransaction = { ...mockTransaction, ...updateDto };

      mockRepository.findOne
        .mockResolvedValueOnce(mockTransaction) // First call in update method
        .mockResolvedValueOnce(updatedTransaction); // Second call to reload

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(mockUserId, mockTransactionId, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockTransactionId,
        expect.objectContaining(updateDto),
      );
      expect(result.amount).toBe(75000);
      expect(result.description).toBe('Updated description');
    });

    it('should update categoryId to null', async () => {
      const updateDto: UpdateTransactionDto = {
        categoryId: null,
      };

      mockRepository.findOne.mockResolvedValueOnce(mockTransaction);
      const updatedTransaction = { ...mockTransaction, categoryId: null };
      mockRepository.findOne.mockResolvedValueOnce(updatedTransaction);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(mockUserId, mockTransactionId, updateDto);

      expect(mockRepository.update).toHaveBeenCalledWith(mockTransactionId, {
        categoryId: undefined,
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockTransactionId, { amount: 100 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own transaction', async () => {
      const otherUserTransaction = { ...mockTransaction, userId: 'other-user' };
      mockRepository.findOne.mockResolvedValue(otherUserTransaction);

      await expect(
        service.update(mockUserId, mockTransactionId, { amount: 100 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a transaction successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockTransaction);
      mockRepository.remove.mockResolvedValue(mockTransaction);

      const result = await service.remove(mockUserId, mockTransactionId);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockTransaction);
      expect(result).toEqual({ message: 'Transacción eliminada exitosamente' });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockTransactionId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBalance', () => {
    it('should calculate balance correctly', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: TransactionType.INCOME, total: '500000' },
          { type: TransactionType.EXPENSE, total: '300000' },
        ]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getBalance(mockUserId);

      expect(result).toEqual({
        totalIncome: 500000,
        totalExpense: 300000,
        balance: 200000,
      });
    });

    it('should handle no transactions', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getBalance(mockUserId);

      expect(result).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      });
    });
  });
});
