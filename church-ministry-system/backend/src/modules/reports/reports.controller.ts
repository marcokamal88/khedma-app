import { Controller, Get, Query, UseGuards, Res, Req, Param } from '@nestjs/common';
import { Response, Request } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Roles('service_leader', 'assistant_service_leader', 'servant', 'sector_leader', 'priest')
  @Get('attendance')
  async attendanceReport(
    @Query('serviceId') serviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.attendanceReport(churchId, { serviceId, from, to });
  }

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('attendance/excel')
  async attendanceExcel(
    @Query('serviceId') serviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentTenant() churchId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const user = (req as any).user;
    // derive serviceId for service leaders if not supplied
    let sid = serviceId;
    if (!sid && user?.activeContext?.scope?.serviceId) sid = String(user.activeContext.scope.serviceId);
    const buf = await this.reportsService.attendanceExcel(churchId, { serviceId: sid, from, to });
    const fname = `Attendance_${sid || 'all'}_${from || 'start'}_to_${to || 'now'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fname)}"`);
    res.send(buf);
  }

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
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

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('taio')
  async taioReport(
    @Query('serviceYearId') serviceYearId: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.taioReport(churchId, { serviceYearId });
  }

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('taio/excel')
  async taioExcel(
    @Query('serviceId') serviceId: string,
    @Query('serviceYearId') serviceYearId: string,
    @CurrentTenant() churchId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let sid = serviceId;
    let sy = serviceYearId;
    const user = (req as any).user;
    if (!sid && user?.activeContext?.scope?.serviceId) sid = String(user.activeContext.scope.serviceId);
    const buf = await this.reportsService.taioExcel(churchId, { serviceId: sid, serviceYearId: sy });
    const fname = `Taio_${sid || 'all'}_${sy || 'current'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fname)}"; filename*=UTF-8''${encodeURIComponent(fname)}`);
    res.send(buf);
  }

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('servant-performance')
  async servantPerformanceReport(
    @Query('serviceId') serviceId: string,
    @Query('yearId') yearId: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.reportsService.servantPerformanceReport(churchId, { serviceId, yearId });
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('follow-ups/servant')
  async followUpServant(@Query('servantId') servantId: string, @Query('week') week: string, @Query('serviceYearId') syId: string, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = (req as any).user;
    const sid = servantId || String(user.memberId);
    return this.reportsService.followUpServantReport(churchId, sid, week, syId);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('follow-ups/class')
  async followUpClass(@Query('classId') classId: string, @Query('week') week: string, @Query('serviceYearId') syId: string, @CurrentTenant() churchId: string) {
    return this.reportsService.followUpClassReport(churchId, classId, week, syId);
  }

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('follow-ups/service')
  async followUpService(@Query('serviceId') serviceId: string, @Query('week') week: string, @Query('serviceYearId') syId: string, @CurrentTenant() churchId: string, @Req() req: Request) {
    let sid = serviceId;
    if (!sid) sid = (req as any).user?.activeContext?.scope?.serviceId;
    return this.reportsService.followUpServiceReport(churchId, String(sid), week, syId);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('follow-ups/member/:id')
  async followUpMember(@Param('id') id: string, @Query('serviceYearId') syId: string, @CurrentTenant() churchId: string) {
    return this.reportsService.followUpIndividualServedReport(churchId, id, syId);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('follow-ups/servant/:id')
  async followUpServantIndividual(@Param('id') id: string, @Query('serviceYearId') syId: string, @CurrentTenant() churchId: string) {
    return this.reportsService.followUpIndividualServantReport(churchId, id, syId);
  }

  @Roles('service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('follow-ups/excel')
  async followUpExcel(@Query('serviceId') serviceId: string, @Query('week') week: string, @Query('serviceYearId') syId: string, @CurrentTenant() churchId: string, @Req() req: Request, @Res() res: Response) {
    let sid = serviceId;
    if (!sid) sid = (req as any).user?.activeContext?.scope?.serviceId;
    const buf = await this.reportsService.followUpExcel(churchId, { serviceId: sid, week, serviceYearId: syId });
    const fname = `FollowUp_${sid || 'all'}_${week || 'current'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fname)}"; filename*=UTF-8''${encodeURIComponent(fname)}`);
    res.send(buf);
  }
}
