import { Controller, Get, Req, UseGuards, Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { CurrentContext } from '../../core/context/context.decorator';
import { Request } from 'express';

@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private dashboardService: DashboardService) {}

  @Roles('servant')
  @Get('servant/stats')
  async servantStats(
    @Req() req: Request,
    @CurrentTenant() churchId: number,
    @CurrentContext() context: any,
  ) {
    const user = req.user as any;
    return this.dashboardService.servantStats(
      churchId,
      user.memberId,
      context.serviceId,
      context.classId,
    );
  }

  @Roles('servant')
  @Get('servant/today')
  async servantToday(
    @CurrentTenant() churchId: number,
    @CurrentContext() context: any,
  ) {
    return this.dashboardService.servantTodaySessions(churchId, context.serviceId);
  }

  @Roles('servant')
  @Get('servant/tasks')
  async servantTasks(
    @Req() req: Request,
    @CurrentTenant() churchId: number,
    @CurrentContext() context: any,
  ) {
    const user = req.user as any;
    return this.dashboardService.servantTasks(
      churchId,
      user.memberId,
      context.serviceId,
      context.classId,
    );
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
