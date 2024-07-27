import { UseGuards, applyDecorators } from '@nestjs/common';
import { RoleProtected } from './role-protected.decorator';
import { AuthGuard } from '@nestjs/passport';
import { UserRoleGuard } from '../guards/user-role/user-role.guard';
import { RolesEnum } from 'src/common/enums/roles.enum';

export function Auth(...roles: RolesEnum[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}
