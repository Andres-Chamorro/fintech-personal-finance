import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsInt,
  Min,
  Max,
  IsUUID,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Validador personalizado para mes/año no pasados
@ValidatorConstraint({ name: 'IsCurrentOrFutureMonth', async: false })
export class IsCurrentOrFutureMonth implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as CreateBudgetDto;
    const { month, year } = object;
    
    if (!month || !year) return false;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 0-indexed to 1-indexed
    
    // El año debe ser mayor o igual al actual
    if (year < currentYear) {
      return false;
    }
    
    // Si es el año actual, el mes debe ser mayor o igual al actual
    if (year === currentYear && month < currentMonth) {
      return false;
    }
    
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return `No se pueden crear presupuestos para meses anteriores. Mes/Año actual: ${currentMonth}/${currentYear}`;
  }
}

export class CreateBudgetDto {
  @ApiProperty({
    example: 500000,
    description: 'Monto del presupuesto mensual (en COP)',
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(1000, { message: 'El monto debe ser al menos $1,000 COP' })
  amount: number;

  @ApiProperty({
    example: 6,
    description: 'Mes del presupuesto (1-12). No puede ser un mes pasado.',
    minimum: 1,
    maximum: 12,
  })
  @IsInt({ message: 'El mes debe ser un número entero' })
  @Min(1, { message: 'El mes debe estar entre 1 y 12' })
  @Max(12, { message: 'El mes debe estar entre 1 y 12' })
  @Validate(IsCurrentOrFutureMonth)
  month: number;

  @ApiProperty({
    example: 2026,
    description: 'Año del presupuesto. Debe ser igual o mayor al año actual.',
  })
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2020, { message: 'El año debe ser mayor o igual a 2020' })
  year: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la categoría asociada',
  })
  @IsUUID('4', { message: 'El ID de categoría debe ser un UUID válido' })
  categoryId: string;
}
