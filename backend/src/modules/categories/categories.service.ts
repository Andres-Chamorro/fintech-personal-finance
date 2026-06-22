import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Crear una nueva categoría
   */
  async create(userId: string, createDto: CreateCategoryDto) {
    const category = this.categoryRepository.create({
      ...createDto,
      userId,
    });

    return this.categoryRepository.save(category);
  }

  /**
   * Obtener todas las categorías del usuario
   */
  async findAll(userId: string) {
    return this.categoryRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  /**
   * Obtener una categoría específica
   */
  async findOne(userId: string, id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a esta categoría');
    }

    return category;
  }

  /**
   * Actualizar una categoría
   */
  async update(userId: string, id: string, updateDto: UpdateCategoryDto) {
    const category = await this.findOne(userId, id);
    Object.assign(category, updateDto);
    return this.categoryRepository.save(category);
  }

  /**
   * Eliminar una categoría
   */
  async remove(userId: string, id: string) {
    const category = await this.findOne(userId, id);
    await this.categoryRepository.remove(category);
    return { message: 'Categoría eliminada exitosamente' };
  }

  async createDefaults(userId: string) {
    const defaults = [
      { name: 'Alimentación', description: 'Gastos en comida, supermercado y restaurantes', color: '#FF6B6B' },
      { name: 'Transporte', description: 'Gastos en transporte público, gasolina, Uber', color: '#4ECDC4' },
      { name: 'Vivienda', description: 'Renta, servicios públicos, mantenimiento', color: '#45B7D1' },
      { name: 'Entretenimiento', description: 'Cine, streaming, salidas, hobbies', color: '#96CEB4' },
      { name: 'Salud', description: 'Médicos, medicamentos, seguros de salud', color: '#FFEAA7' },
      { name: 'Educación', description: 'Cursos, libros, material educativo', color: '#DFE6E9' },
      { name: 'Ropa', description: 'Vestuario y accesorios', color: '#FDA7DF' },
      { name: 'Tecnología', description: 'Gadgets, software, suscripciones tech', color: '#6C5CE7' },
      { name: 'Salario', description: 'Ingresos por trabajo principal', color: '#00B894' },
      { name: 'Freelance', description: 'Trabajos independientes y proyectos', color: '#00CEC9' },
      { name: 'Inversiones', description: 'Rendimientos de inversiones', color: '#FDCB6E' },
      { name: 'Otros', description: 'Gastos e ingresos varios', color: '#B2BEC3' },
    ];

    const categories = defaults.map((cat) =>
      this.categoryRepository.create({ ...cat, userId }),
    );

    await this.categoryRepository.save(categories);
  }
}
