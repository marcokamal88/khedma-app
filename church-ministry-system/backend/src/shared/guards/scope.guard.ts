import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SCOPE_KEY } from '../decorators/context.decorator';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(REQUIRED_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopes || requiredScopes.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const activeContext = request.user?.activeContext;

    if (!activeContext) {
      throw new ForbiddenException('No active context set');
    }

    const scope = activeContext.scope || {};
    const hasScope = requiredScopes.some((s) => scope[s] != null);

    if (!hasScope) {
      throw new ForbiddenException(
        `Requires one of scopes: [${requiredScopes.join(', ')}], but none found in active context`,
      );
    }

    return true;
  }
}
