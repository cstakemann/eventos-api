import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from 'src/common/enums/roles.enum';

export const META_ROLES = 'roles';

export const RoleProtected = (...args: RolesEnum[]) => {
  return SetMetadata(META_ROLES, args);
};
