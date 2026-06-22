import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsOptional, Matches } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Alimentación',
    description: 'Nombre de la categoría',
  })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @ApiProperty({
    example: 'Gastos relacionados con alimentos y supermercado',
    description: 'Descripción de la categoría',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @ApiProperty({
    example: '#FF5733',
    description: 'Color en formato hexadecimal',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'El color debe estar en formato hexadecimal (#RRGGBB)',
  })
  color?: string;
}
