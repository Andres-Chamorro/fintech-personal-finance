import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { Category } from '../../src/modules/categories/entities/category.entity';
import { CreateCategoryDto } from '../../src/modules/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../src/modules/categories/dto/update-category.dto';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: Repository<Category>;

  const userId = 'user-123';
  const otherUserId = 'other-user-456';

  const mockCategory: Category = {
    id: 'category-1',
    name: 'Alimentación',
    description: 'Gastos en comida y restaurantes',
    color: '#FF6B6B',
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {} as any,
    transactions: [],
    budgets: [],
  };

  const mockCategoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryRepository = module.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      name: 'Transporte',
      description: 'Gastos en transporte público y combustible',
      color: '#4ECDC4',
    };

    it('should create a new category successfully', async () => {
      const newCategory = { ...mockCategory, ...createDto, id: 'category-2' };
      mockCategoryRepository.create.mockReturnValue(newCategory);
      mockCategoryRepository.save.mockResolvedValue(newCategory);

      const result = await service.create(userId, createDto);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
      });
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(newCategory);
      expect(result).toEqual(newCategory);
      expect(result.userId).toBe(userId);
    });

    it('should include all fields from createDto', async () => {
      const newCategory = { ...mockCategory, ...createDto };
      mockCategoryRepository.create.mockReturnValue(newCategory);
      mockCategoryRepository.save.mockResolvedValue(newCategory);

      const result = await service.create(userId, createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.description).toBe(createDto.description);
      expect(result.color).toBe(createDto.color);
    });
  });

  describe('findAll', () => {
    it('should return all categories for a user', async () => {
      const categories = [
        mockCategory,
        { ...mockCategory, id: 'category-2', name: 'Transporte' },
        { ...mockCategory, id: 'category-3', name: 'Entretenimiento' },
      ];
      mockCategoryRepository.find.mockResolvedValue(categories);

      const result = await service.findAll(userId);

      expect(mockCategoryRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { name: 'ASC' },
      });
      expect(result).toEqual(categories);
      expect(result).toHaveLength(3);
    });

    it('should return empty array if user has no categories', async () => {
      mockCategoryRepository.find.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should order categories by name ascending', async () => {
      const categories = [
        { ...mockCategory, name: 'Transporte' },
        { ...mockCategory, name: 'Alimentación' },
        { ...mockCategory, name: 'Entretenimiento' },
      ];
      mockCategoryRepository.find.mockResolvedValue(categories);

      await service.findAll(userId);

      expect(mockCategoryRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { name: 'ASC' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a category if it exists and user owns it', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(userId, mockCategory.id);

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userId, 'non-existent')).rejects.toThrow(
        'Categoría con ID non-existent no encontrada',
      );
    });

    it('should throw ForbiddenException if user does not own the category', async () => {
      const otherUserCategory = { ...mockCategory, userId: otherUserId };
      mockCategoryRepository.findOne.mockResolvedValue(otherUserCategory);

      await expect(service.findOne(userId, mockCategory.id)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne(userId, mockCategory.id)).rejects.toThrow(
        'No tienes permiso para acceder a esta categoría',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = {
      name: 'Alimentación Actualizada',
      description: 'Nueva descripción',
      color: '#00FF00',
    };

    it('should update a category successfully', async () => {
      const updatedCategory = { ...mockCategory, ...updateDto };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.update(userId, mockCategory.id, updateDto);

      expect(mockCategoryRepository.findOne).toHaveBeenCalled();
      expect(mockCategoryRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
      expect(result.description).toBe(updateDto.description);
      expect(result.color).toBe(updateDto.color);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the category', async () => {
      const otherUserCategory = { ...mockCategory, userId: otherUserId };
      mockCategoryRepository.findOne.mockResolvedValue(otherUserCategory);

      await expect(
        service.update(userId, mockCategory.id, updateDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only update provided fields', async () => {
      const partialUpdate: UpdateCategoryDto = { name: 'Nuevo Nombre' };
      const updatedCategory = { ...mockCategory, name: 'Nuevo Nombre' };
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.update(userId, mockCategory.id, partialUpdate);

      expect(result.name).toBe('Nuevo Nombre');
      expect(result.description).toBe(mockCategory.description); // Unchanged
      expect(result.color).toBe(mockCategory.color); // Unchanged
    });
  });

  describe('remove', () => {
    it('should delete a category successfully', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(mockCategory);
      mockCategoryRepository.remove.mockResolvedValue(mockCategory);

      const result = await service.remove(userId, mockCategory.id);

      expect(mockCategoryRepository.findOne).toHaveBeenCalled();
      expect(mockCategoryRepository.remove).toHaveBeenCalledWith(mockCategory);
      expect(result).toEqual({ message: 'Categoría eliminada exitosamente' });
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockCategoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCategoryRepository.remove).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own the category', async () => {
      const otherUserCategory = { ...mockCategory, userId: otherUserId };
      mockCategoryRepository.findOne.mockResolvedValue(otherUserCategory);

      await expect(service.remove(userId, mockCategory.id)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockCategoryRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('authorization', () => {
    it('should validate ownership on all operations', async () => {
      const otherUserCategory = { ...mockCategory, userId: otherUserId };
      mockCategoryRepository.findOne.mockResolvedValue(otherUserCategory);

      // findOne
      await expect(service.findOne(userId, mockCategory.id)).rejects.toThrow(
        ForbiddenException,
      );

      // update
      await expect(
        service.update(userId, mockCategory.id, { name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);

      // remove
      await expect(service.remove(userId, mockCategory.id)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockCategoryRepository.findOne).toHaveBeenCalledTimes(3);
    });
  });
});
