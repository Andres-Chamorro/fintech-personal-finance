import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@fintech.com',
    description: 'Correo electrónico del usuario',
  })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd123',
    description: 'Contraseña del usuario',
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}
