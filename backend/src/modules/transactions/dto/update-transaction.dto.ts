import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiProperty({
    description: 'Campos opcionales para actualización',
    required: false,
  })
  _description?: string;
}
