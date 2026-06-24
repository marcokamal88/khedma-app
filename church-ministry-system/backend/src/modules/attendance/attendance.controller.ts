import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RequireContext } from '../../shared/decorators/context.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';
import { Request } from 'express';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Roles('servant', 'sector_leader', 'priest')
  @Post('sessions')
  async createSession(
    @Body() dto: CreateSessionDto,
    @CurrentTenant() churchId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.attendanceService.createSession(churchId, dto, user.memberId);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Get('sessions')
  async getSessions(
    @Query() filters: any,
    @CurrentTenant() churchId: string,
  ) {
    return this.attendanceService.getSessions(churchId, filters);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.attendanceService.getSession(churchId, id);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Post('sessions/:id/records')
  async recordAttendance(
    @Param('id') sessionId: string,
    @Body() dto: RecordAttendanceDto,
    @CurrentTenant() churchId: string,
  ) {
    return this.attendanceService.recordAttendance(churchId, sessionId, dto);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Put('records/:id')
  async updateRecord(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
    @CurrentTenant() churchId: string,
  ) {
    return this.attendanceService.updateRecord(churchId, id, body);
  }

  @Get('report')
  async getReport(@Query() filters: any, @CurrentTenant() churchId: string) {
    return this.attendanceService.getReport(churchId, filters);
  }
}
