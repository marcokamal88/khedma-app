import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const churchId = request.churchId;
    const user = request.user;

    if (!churchId) {
      throw new ForbiddenException('No church context');
    }

    if (user && user.churchId !== churchId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    return true;
  }
}
