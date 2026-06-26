import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import environment from './config/environment';
import { DatabaseModule } from './core/database/database.module';
import { ModelsModule } from './core/database/models.module';
import { TenantModule } from './core/tenant/tenant.module';
import { AuthModule } from './core/auth/auth.module';
import { ContextModule } from './core/context/context.module';
import { UsersModule } from './modules/users/users.module';
import { ChurchModule } from './modules/church/church.module';
import { ServiceYearModule } from './modules/service-year/service-year.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PreparationModule } from './modules/preparation/preparation.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TaioModule } from './modules/taio/taio.module';
import { EventsModule } from './modules/events/events.module';
import { FamilyModule } from './modules/family/family.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FollowUpsModule } from './modules/follow-ups/follow-ups.module';
import { LessonLibraryModule } from './modules/lesson-library/lesson-library.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './shared/interceptors/audit.module';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
import { JwtAuthGuard } from './core/auth/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { ContextGuard } from './core/auth/context.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environment],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    DatabaseModule,
    ModelsModule,
    TenantModule,
    ContextModule,
    AuthModule,
    UsersModule,
    ChurchModule,
    ServiceYearModule,
    AttendanceModule,
    PreparationModule,
    TasksModule,
    TaioModule,
    EventsModule,
    FamilyModule,
    NotificationsModule,
    ReportsModule,
    FollowUpsModule,
    LessonLibraryModule,
    ActivitiesModule,
    AchievementsModule,
    DashboardModule,
    AuditModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ContextGuard },
  ],
})
export class AppModule {}
