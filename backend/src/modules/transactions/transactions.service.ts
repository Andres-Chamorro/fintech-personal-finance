import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Crear una nueva transacción
   */
  async create(userId: string, createDto: CreateTransactionDto) {
    const transaction = this.transactionRepository.create({
      userId,
      type: createDto.type,
      amount: createDto.amount,
      description: createDto.description,
      transactionDate: createDto.transactionDate,
      categoryId: createDto.categoryId ?? undefined,
    });

    return this.transactionRepository.save(transaction);
  }

  /**
   * Obtener todas las transacciones del usuario con filtros y paginación
   */
  async findAll(userId: string, filters: FilterTransactionDto) {
    const { type, categoryId, startDate, endDate, sortOrder, page = 1, limit = 10 } = filters;

    const skip = (page - 1) * limit;

    // Construir query dinámicamente
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.category', 'category')
      .where('transaction.userId = :userId', { userId });

    // Filtro por tipo
    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    // Filtro por categoría
    if (categoryId) {
      queryBuilder.andWhere('transaction.categoryId = :categoryId', { categoryId });
    }

    // Filtro por rango de fechas
    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.transactionDate >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.transactionDate <= :endDate', { endDate });
    }

    // Ordenamiento y paginación
    queryBuilder.orderBy('transaction.transactionDate', sortOrder).skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener una transacción específica
   */
  async findOne(userId: string, id: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }

    // Verificar que la transacción pertenezca al usuario
    if (transaction.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a esta transacción');
    }

    return transaction;
  }

  /**
   * Actualizar una transacción
   */
  async update(userId: string, id: string, updateDto: UpdateTransactionDto) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a esta transacción');
    }

    const updateData: any = {};
    if (updateDto.type !== undefined) updateData.type = updateDto.type;
    if (updateDto.amount !== undefined) updateData.amount = updateDto.amount;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.transactionDate !== undefined) updateData.transactionDate = updateDto.transactionDate;

    if ('categoryId' in updateDto) {
      updateData.categoryId = updateDto.categoryId ?? null;
    }

    await this.transactionRepository.update(id, updateData);

    const result = await this.transactionRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!result) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada después de actualizar`);
    }

    return result;
  }

  /**
   * Eliminar una transacción
   */
  async remove(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);
    await this.transactionRepository.remove(transaction);
    return { message: 'Transacción eliminada exitosamente' };
  }

  /**
   * Obtener el balance del usuario (Total Ingresos - Total Egresos)
   */
  async getBalance(userId: string) {
    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.type', 'type')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .groupBy('transaction.type')
      .getRawMany();

    let totalIncome = 0;
    let totalExpense = 0;

    result.forEach((row) => {
      if (row.type === TransactionType.INCOME) {
        totalIncome = parseFloat(row.total) || 0;
      } else if (row.type === TransactionType.EXPENSE) {
        totalExpense = parseFloat(row.total) || 0;
      }
    });

    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
    };
  }
}
