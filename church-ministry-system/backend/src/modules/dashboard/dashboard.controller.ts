import { Controller, Get, Req, UseGuards, Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { CurrentContext } from '../../core/context/context.decorator';
import { ActiveContext } from '../../core/auth/jwt.strategy';
import { Request } from 'express';

@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private dashboardService: DashboardService) {}

  @Roles('servant', 'class_leader')
  @Get('servant/stats')
  async servantStats(
    @Req() req: Request,
    @CurrentTenant() churchId: number,
    @CurrentContext() context: ActiveContext,
  ) {
    return this.dashboardService.servantStats(churchId, context.scope);
  }

  @Roles('servant', 'class_leader')
  @Get('servant/today')
  async servantToday(
    @CurrentTenant() churchId: number,
    @CurrentContext() context: ActiveContext,
  ) {
    return this.dashboardService.servantTodaySessions(churchId, context.scope);
  }

  @Roles('servant', 'class_leader')
  @Get('servant/tasks')
  async servantTasks(
    @Req() req: Request,
    @CurrentTenant() churchId: number,
    @CurrentContext() context: ActiveContext,
  ) {
    const user = req.user as any;
    return this.dashboardService.servantTasks(churchId, user.memberId, context.scope);
  }

  @Roles('service_leader', 'assistant_service_leader')
  @Get('service-leader/stats')
  async serviceLeaderStats(
    @CurrentTenant() churchId: number,
    @CurrentContext() context: ActiveContext,
  ) {
    return this.dashboardService.serviceLeaderStats(churchId, context.scope);
  }

  @Roles('sector_leader')
  @Get('sector-leader/stats')
  async sectorLeaderStats(
    @CurrentTenant() churchId: number,
    @CurrentContext() context: ActiveContext,
  ) {
    return this.dashboardService.sectorLeaderStats(churchId, context.scope);
  }

  @Roles('priest')
  @Get('priest/stats')
  async priestStats(
    @CurrentTenant() churchId: number,
  ) {
    return this.dashboardService.priestStats(churchId);
  }

  @Roles('served_member')
  @Get('member/stats')
  async memberStats(
    @Req() req: Request,
    @CurrentTenant() churchId: number,
  ) {
    const user = req.user as any;
    return this.dashboardService.memberStats(churchId, user.memberId);
  }

  @Roles('served_member')
  @Get('member/tasks')
  async memberTasks(
    @Req() req: Request,
    @CurrentTenant() churchId: number,
  ) {
    const user = req.user as any;
    return this.dashboardService.memberTasks(churchId, user.memberId);
  }
}
