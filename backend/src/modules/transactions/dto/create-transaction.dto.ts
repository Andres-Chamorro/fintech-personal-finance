import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsDateString,
  IsUUID,
  IsOptional,
  Min,
  MaxLength,
  ValidateIf,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

// Validador personalizado para fechas no futuras
@ValidatorConstraint({ name: 'IsNotFutureDate', async: false })
export class IsNotFutureDate implements ValidatorConstraintInterface {
  validate(dateString: string, _args: ValidationArguments) {
    if (!dateString) return false;
    
    const inputDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return inputDate <= today;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'La fecha de la transacción no puede ser futura';
  }
}

export class CreateTransactionDto {
  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: 'Tipo de transacción (ingreso o egreso)',
  })
  @IsEnum(TransactionType, {
    message: 'El tipo debe ser "income" (ingreso) o "expense" (egreso)',
  })
  type: TransactionType;

  @ApiProperty({
    example: 50000,
    description: 'Monto de la transacción (en COP)',
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiProperty({
    example: 'Compra de supermercado',
    description: 'Descripción de la transacción',
  })
  @IsString({ message: 'La descripción debe ser un texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description: string;

  @ApiProperty({
    example: '2026-06-20',
    description: 'Fecha de la transacción (formato ISO 8601: YYYY-MM-DD). No puede ser futura.',
  })
  @IsDateString({}, { message: 'La fecha debe tener formato válido (YYYY-MM-DD)' })
  @Validate(IsNotFutureDate)
  transactionDate: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la categoría (opcional)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.categoryId !== null)
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
  categoryId?: string | null;
}
