import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BudgetsService } from '../../src/modules/budgets/budgets.service';
import { Budget } from '../../src/modules/budgets/entities/budget.entity';
import { Transaction, TransactionType } from '../../src/modules/transactions/entities/transaction.entity';
import { CreateBudgetDto } from '../../src/modules/budgets/dto/create-budget.dto';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let budgetRepository: Repository<Budget>;
  let transactionRepository: Repository<Transaction>;

  const mockUserId = 'user-123';
  const mockCategoryId = 'category-123';
  const mockBudgetId = 'budget-123';

  const mockBudget: Budget = {
    id: mockBudgetId,
    amount: 500000,
    month: 6,
    year: 2026,
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

  const mockBudgetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockTransactionRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getRepositoryToken(Budget),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    budgetRepository = module.get<Repository<Budget>>(getRepositoryToken(Budget));
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a budget successfully', async () => {
      const createDto: CreateBudgetDto = {
        amount: 500000,
        month: 6,
        year: 2026,
        categoryId: mockCategoryId,
      };

      mockBudgetRepository.findOne.mockResolvedValue(null); // No existing budget
      mockBudgetRepository.create.mockReturnValue(mockBudget);
      mockBudgetRepository.save.mockResolvedValue(mockBudget);

      const result = await service.create(mockUserId, createDto);

      expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          categoryId: mockCategoryId,
          month: 6,
          year: 2026,
        },
      });
      expect(mockBudgetRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId: mockUserId,
      });
      expect(result).toEqual(mockBudget);
    });

    it('should throw ConflictException if budget already exists', async () => {
      const createDto: CreateBudgetDto = {
        amount: 500000,
        month: 6,
        year: 2026,
        categoryId: mockCategoryId,
      };

      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(ConflictException);
      expect(mockBudgetRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return budgets with calculated spent and alerts', async () => {
      mockBudgetRepository.find.mockResolvedValue([mockBudget]);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '400000' }), // 80% gastado
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUserId, 6, 2026);

      expect(mockBudgetRepository.find).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          month: 6,
          year: 2026,
        },
        relations: ['category'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].spent).toBe(400000);
      expect(result[0].remaining).toBe(100000);
      expect(result[0].percentage).toBe(80);
      expect(result[0].alerts).toContain(
        '⚠️ ADVERTENCIA: Has utilizado el 80% o más de tu presupuesto',
      );
    });

    it('should show critical alert when budget exceeded', async () => {
      mockBudgetRepository.find.mockResolvedValue([mockBudget]);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '550000' }), // 110% gastado
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUserId, 6, 2026);

      expect(result[0].percentage).toBe(110);
      expect(result[0].alerts).toContain('⛔ CRÍTICO: Has excedido tu presupuesto mensual');
    });

    it('should not show alerts when under 80%', async () => {
      mockBudgetRepository.find.mockResolvedValue([mockBudget]);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '300000' }), // 60% gastado
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll(mockUserId, 6, 2026);

      expect(result[0].percentage).toBe(60);
      expect(result[0].alerts).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a budget with calculations', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ total: '250000' }),
      };

      mockTransactionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findOne(mockUserId, mockBudgetId);

      expect(result.spent).toBe(250000);
      expect(result.remaining).toBe(250000);
      expect(result.percentage).toBe(50);
    });

    it('should throw NotFoundException if budget not found', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockUserId, mockBudgetId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own budget', async () => {
      const otherUserBudget = { ...mockBudget, userId: 'other-user' };
      mockBudgetRepository.findOne.mockResolvedValue(otherUserBudget);

      await expect(service.findOne(mockUserId, mockBudgetId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update a budget amount successfully', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      const updatedBudget = { ...mockBudget, amount: 700000 };
      mockBudgetRepository.save.mockResolvedValue(updatedBudget);

      const result = await service.update(mockUserId, mockBudgetId, { amount: 700000 });

      expect(mockBudgetRepository.findOne).toHaveBeenCalledWith({ where: { id: mockBudgetId } });
      expect(mockBudgetRepository.save).toHaveBeenCalled();
      expect(result.amount).toBe(700000);
    });

    it('should throw NotFoundException if budget not found', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockUserId, mockBudgetId, { amount: 700000 })).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own budget', async () => {
      const otherUserBudget = { ...mockBudget, userId: 'other-user' };
      mockBudgetRepository.findOne.mockResolvedValue(otherUserBudget);

      await expect(service.update(mockUserId, mockBudgetId, { amount: 700000 })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a budget successfully', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(mockBudget);
      mockBudgetRepository.remove.mockResolvedValue(mockBudget);

      const result = await service.remove(mockUserId, mockBudgetId);

      expect(mockBudgetRepository.remove).toHaveBeenCalledWith(mockBudget);
      expect(result).toEqual({ message: 'Presupuesto eliminado exitosamente' });
    });

    it('should throw NotFoundException if budget not found', async () => {
      mockBudgetRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockBudgetId)).rejects.toThrow(NotFoundException);
    });
  });
});
