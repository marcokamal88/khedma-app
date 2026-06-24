import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Roles('servant', 'sector_leader', 'priest')
  @Post('tasks')
  async create(@Body() body: any, @CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.tasksService.create(churchId, body, user.memberId);
  }

  @Get('tasks')
  async findAll(@Query() filters: any, @CurrentTenant() churchId: string) {
    return this.tasksService.findAll(churchId, filters);
  }

  @Get('tasks/:id')
  async findOne(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.tasksService.findOne(churchId, id);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Patch('tasks/:id')
  async update(
    @Param('id') id: string, @Body() body: any, @CurrentTenant() churchId: string,
  ) {
    return this.tasksService.update(churchId, id, body);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Delete('tasks/:id')
  async remove(@Param('id') id: string, @CurrentTenant() churchId: string) {
    return this.tasksService.remove(churchId, id);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Post('tasks/:id/assign')
  async assign(
    @Param('id') id: string, @Body() body: { memberIds: string[] }, @CurrentTenant() churchId: string,
  ) {
    return this.tasksService.assignToMembers(churchId, id, body.memberIds);
  }

  @Get('my-tasks')
  async getMyTasks(@CurrentTenant() churchId: string, @Req() req: Request) {
    const user = req.user as any;
    return this.tasksService.getMyTasks(churchId, user.memberId);
  }

  @Post('tasks/:id/complete')
  async completeTask(
    @Param('id') id: string, @CurrentTenant() churchId: string, @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.tasksService.completeTask(churchId, id, user.memberId);
  }

  @Roles('servant', 'sector_leader', 'priest')
  @Post('tasks/:id/verify/:memberId')
  async verifyTask(
    @Param('id') id: string, @Param('memberId') memberId: string,
    @CurrentTenant() churchId: string, @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.tasksService.verifyTask(churchId, id, memberId, user.memberId);
  }
}
