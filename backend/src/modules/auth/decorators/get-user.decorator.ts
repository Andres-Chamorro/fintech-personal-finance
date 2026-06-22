import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../entities/user.entity';

/**
 * Decorator para obtener el usuario autenticado desde el request
 * Uso: @GetUser() user: User
 */
export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
