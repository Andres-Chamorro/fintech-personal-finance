import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo presupuesto mensual' })
  @ApiResponse({ status: 201, description: 'Presupuesto creado exitosamente' })
  create(@GetUser() user: User, @Body() createDto: CreateBudgetDto) {
    return this.budgetsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los presupuestos con alertas (80% y 100%)',
  })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de presupuestos con alertas' })
  findAll(
    @GetUser() user: User,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.budgetsService.findAll(user.id, month, year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un presupuesto específico' })
  @ApiResponse({ status: 200, description: 'Presupuesto encontrado' })
  findOne(@GetUser() user: User, @Param('id') id: string) {
    return this.budgetsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un presupuesto' })
  @ApiResponse({ status: 200, description: 'Presupuesto actualizado' })
  update(@GetUser() user: User, @Param('id') id: string, @Body() updateDto: UpdateBudgetDto) {
    return this.budgetsService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un presupuesto' })
  @ApiResponse({ status: 200, description: 'Presupuesto eliminado' })
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.budgetsService.remove(user.id, id);
  }
}
