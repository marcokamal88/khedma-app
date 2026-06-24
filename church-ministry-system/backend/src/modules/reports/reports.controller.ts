import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Roles('servant', 'sector_leader', 'priest')
  @Get('attendance')
  async attendanceReport(
    @Query('serviceId') serviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.attendanceReport(churchId, { serviceId, from, to });
  }

  @Roles('sector_leader', 'priest')
  @Get('engagement')
  async engagementReport(
    @Query('serviceId') serviceId: string,
    @Query('yearId') yearId: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.engagementReport(churchId, { serviceId, yearId });
  }

  @Roles('sector_leader', 'priest')
  @Get('financial')
  async financialReport(
    @Query('eventId') eventId: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.financialReport(churchId, { eventId });
  }

  @Roles('sector_leader', 'priest')
  @Get('taio')
  async taioReport(
    @Query('serviceYearId') serviceYearId: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.taioReport(churchId, { serviceYearId });
  }

  @Roles('sector_leader', 'priest')
  @Get('servant-performance')
  async servantPerformanceReport(
    @Query('serviceId') serviceId: string,
    @Query('yearId') yearId: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.servantPerformanceReport(churchId, { serviceId, yearId });
  }
}
