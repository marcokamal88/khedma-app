import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_CONTEXT_KEY } from '../../shared/decorators/context.decorator';

@Injectable()
export class ContextGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredContext = this.reflector.getAllAndOverride<{
      role?: string;
      serviceId?: string;
    }>(REQUIRED_CONTEXT_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredContext) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const activeContext = user?.activeContext;

    if (!activeContext) {
      throw new ForbiddenException('No active context set');
    }

    if (requiredContext.role && activeContext.role !== requiredContext.role) {
      throw new ForbiddenException(
        `Requires ${requiredContext.role} context, currently ${activeContext.role}`,
      );
    }

    if (requiredContext.serviceId && activeContext.serviceId !== requiredContext.serviceId) {
      throw new ForbiddenException('Context serviceId does not match');
    }

    return true;
  }
}
