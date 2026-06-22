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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva transacción' })
  @ApiResponse({ status: 201, description: 'Transacción creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  create(@GetUser() user: User, @Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las transacciones con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de transacciones' })
  findAll(@GetUser() user: User, @Query() filters: FilterTransactionDto) {
    return this.transactionsService.findAll(user.id, filters);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Obtener el balance actual (Ingresos - Egresos)' })
  @ApiResponse({ status: 200, description: 'Balance calculado' })
  getBalance(@GetUser() user: User) {
    return this.transactionsService.getBalance(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una transacción específica' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  findOne(@GetUser() user: User, @Param('id') id: string) {
    return this.transactionsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una transacción' })
  @ApiResponse({ status: 200, description: 'Transacción actualizada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  update(@GetUser() user: User, @Param('id') id: string, @Body() updateDto: UpdateTransactionDto) {
    return this.transactionsService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una transacción' })
  @ApiResponse({ status: 200, description: 'Transacción eliminada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.transactionsService.remove(user.id, id);
  }
}
