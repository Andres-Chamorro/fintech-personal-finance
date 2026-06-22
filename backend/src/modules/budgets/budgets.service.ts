import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './entities/budget.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /**
   * Crear un nuevo presupuesto
   */
  async create(userId: string, createDto: CreateBudgetDto) {
    // Verificar si ya existe un presupuesto para esa categoría en ese mes/año
    const existing = await this.budgetRepository.findOne({
      where: {
        userId,
        categoryId: createDto.categoryId,
        month: createDto.month,
        year: createDto.year,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un presupuesto para esta categoría en el mes/año especificado',
      );
    }

    const budget = this.budgetRepository.create({
      ...createDto,
      userId,
    });

    return this.budgetRepository.save(budget);
  }

  /**
   * Obtener todos los presupuestos del usuario con alertas
   */
  async findAll(userId: string, month?: number, year?: number) {
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();

    const budgets = await this.budgetRepository.find({
      where: {
        userId,
        month: targetMonth,
        year: targetYear,
      },
      relations: ['category'],
    });

    // Calcular gastos y generar alertas
    const budgetsWithAlerts = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpentForBudget(
          userId,
          budget.categoryId,
          targetMonth,
          targetYear,
        );

        const percentage = (spent / parseFloat(budget.amount.toString())) * 100;
        const alerts = this.generateAlerts(percentage);

        return {
          ...budget,
          spent,
          remaining: parseFloat(budget.amount.toString()) - spent,
          percentage: Math.round(percentage * 100) / 100,
          alerts,
        };
      }),
    );

    return budgetsWithAlerts;
  }

  /**
   * Obtener un presupuesto específico
   */
  async findOne(userId: string, id: string) {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!budget) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado`);
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a este presupuesto');
    }

    // Calcular gasto y alertas
    const spent = await this.calculateSpentForBudget(
      userId,
      budget.categoryId,
      budget.month,
      budget.year,
    );

    const percentage = (spent / parseFloat(budget.amount.toString())) * 100;
    const alerts = this.generateAlerts(percentage);

    return {
      ...budget,
      spent,
      remaining: parseFloat(budget.amount.toString()) - spent,
      percentage: Math.round(percentage * 100) / 100,
      alerts,
    };
  }

  /**
   * Actualizar un presupuesto
   */
  async update(userId: string, id: string, updateDto: UpdateBudgetDto) {
    const budget = await this.budgetRepository.findOne({ where: { id } });

    if (!budget) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado`);
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para modificar este presupuesto');
    }

    Object.assign(budget, updateDto);
    return this.budgetRepository.save(budget);
  }

  /**
   * Eliminar un presupuesto
   */
  async remove(userId: string, id: string) {
    const budget = await this.budgetRepository.findOne({ where: { id } });

    if (!budget) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado`);
    }

    if (budget.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para eliminar este presupuesto');
    }

    await this.budgetRepository.remove(budget);
    return { message: 'Presupuesto eliminado exitosamente' };
  }

  /**
   * Calcular gasto acumulado para un presupuesto específico
   */
  private async calculateSpentForBudget(
    userId: string,
    categoryId: string,
    month: number,
    year: number,
  ): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.categoryId = :categoryId', { categoryId })
      .andWhere('transaction.type = :type', { type: TransactionType.EXPENSE })
      .andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  /**
   * Generar alertas basadas en el porcentaje de gasto
   */
  private generateAlerts(percentage: number): string[] {
    const alerts: string[] = [];

    if (percentage >= 100) {
      alerts.push('⛔ CRÍTICO: Has excedido tu presupuesto mensual');
      alerts.push('🔴 Se recomienda reducir gastos en esta categoría');
    } else if (percentage >= 80) {
      alerts.push('⚠️ ADVERTENCIA: Has utilizado el 80% o más de tu presupuesto');
      alerts.push('🟡 Considera moderar tus gastos para no exceder el límite');
    }

    return alerts;
  }
}
