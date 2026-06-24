import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditLog } from './audit-log.entity';
import { AuditInterceptor } from './audit.interceptor';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([AuditLog])],
  providers: [AuditInterceptor],
  exports: [AuditInterceptor, SequelizeModule],
})
export class AuditModule {}
