import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(@InjectModel(AuditLog) private auditModel: typeof AuditLog) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const user = req.user as any;
    const churchId = req.headers['x-church-id'];

    const actionMap: Record<string, string> = {
      POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete',
    };
    const action = actionMap[method];
    if (!action || !user?.sub) return next.handle();

    const entityType = req.route?.path?.split('/').pop() || 'unknown';

    return next.handle().pipe(
      tap((response) => {
        const entityId = response?.id || req.params?.id || null;
        this.auditModel.create({
          churchId,
          actorId: user.sub,
          action,
          entityType,
          entityId,
          ipAddress: req.ip,
        } as any).catch((err) => this.logger.warn(`Audit log failed: ${err.message}`));
      }),
    );
  }
}
