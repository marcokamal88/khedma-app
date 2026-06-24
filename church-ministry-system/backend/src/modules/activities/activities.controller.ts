import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Post()
  async create(@Body() dto: CreateActivityDto, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.activitiesService.create(churchId, dto, user.sub);
  }

  @Get()
  async findAll(@CurrentTenant() churchId: string, @Query('type') type?: string) {
    return this.activitiesService.findAll(churchId, type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.activitiesService.findOne(churchId, id);
  }

  @Post(':id/enroll')
  async enroll(@Param('id') id: string, @Body('memberId') memberId: string, @CurrentTenant() churchId: string) {
    return this.activitiesService.enroll(churchId, id, memberId);
  }

  @Delete(':id/unenroll')
  async unenroll(@Param('id') id: string, @Body('memberId') memberId: string, @CurrentTenant() churchId: string) {
    return this.activitiesService.unenroll(churchId, id, memberId);
  }

  @Post(':id/attendance')
  async recordAttendance(
    @Param('id') id: string,
    @Body('records') records: Array<{ churchMemberId: string; sessionDate: string; status: string }>,
    @CurrentTenant() churchId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.activitiesService.recordAttendance(churchId, id, records, user.sub);
  }

  @Get(':id/attendance')
  async getAttendance(
    @Param('id') id: string,
    @CurrentTenant() churchId: string,
    @Query('sessionDate') sessionDate?: string,
  ) {
    return this.activitiesService.getAttendance(churchId, id, sessionDate);
  }
}
