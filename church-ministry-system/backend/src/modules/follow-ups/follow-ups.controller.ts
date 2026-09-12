import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RequireContext } from '../../shared/decorators/context.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private followUpsService: FollowUpsService) {}

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Post()
  async create(@Body() dto: CreateFollowUpDto, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    // responsible is self unless service_leader creates for another servant
    return this.followUpsService.create(churchId, dto, user.memberId || user.sub);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get('weekly')
  async weekly(@Query('week') week: string, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    // weekly is per responsible servant
    return this.followUpsService.getWeekly(churchId, String(user.memberId), week);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get()
  async findAll(@CurrentTenant() churchId: string, @Query('servantId') servantId?: string, @Query('serviceId') serviceId?: string, @Query('classId') classId?: string, @Query('status') status?: string, @Query('targetType') targetType?: string, @Req() req?: Request) {
    const user = (req as any).user;
    // Scope enforcement: servants can only see own unless leader
    const roles: string[] = user?.roles || [];
    const isLeader = roles.includes('service_leader') || roles.includes('assistant_service_leader') || roles.includes('sector_leader') || roles.includes('priest');
    if (!isLeader && !servantId) {
      // default my
      return this.followUpsService.findAll(churchId, { servantId: String(user.memberId), serviceId, classId, status, targetType } as any, user);
    }
    return this.followUpsService.findAll(churchId, { servantId, serviceId, classId, status, targetType } as any, user);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.followUpsService.findOne(churchId, id);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Patch(':id')
  async updateFamily(@Param('id') id: string, @Body() body: { name?: string; notes?: string }, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.followUpsService.updateFamily(churchId, id, body, user.memberId || user.sub);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get(':id/monitoring')
  async monitoring(@Param('id') id: string, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.followUpsService.getMonitoring(churchId, id, String(user.memberId), user.roles || []);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Post(':id/members')
  async addMembers(@Param('id') id: string, @Body('memberIds') memberIds: number[], @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.followUpsService.addMembers(churchId, id, memberIds, user.memberId);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Delete(':id/members/:memberId')
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.followUpsService.removeMember(churchId, id, memberId, user.memberId);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @CurrentTenant() churchId: string) {
    return this.followUpsService.updateStatus(churchId, id, status);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Post(':id/activities')
  async addActivity(
    @Param('id') id: string,
    @Body() dto: AddActivityDto,
    @CurrentTenant() churchId: string,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.followUpsService.addActivity(churchId, id, dto, user.memberId);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Get(':id/activities')
  async getActivities(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.followUpsService.getActivities(churchId, id);
  }

  @Roles('servant', 'class_leader', 'service_leader', 'assistant_service_leader', 'sector_leader', 'priest')
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.followUpsService.remove(churchId, id);
  }
}
