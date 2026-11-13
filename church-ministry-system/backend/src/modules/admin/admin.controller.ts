import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req, NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { StaticAuthGuard } from './static-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { CreateChurchDto } from './dto/create-church.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { AssignServiceLeaderDto } from './dto/assign-service-leader.dto';
import { AssignSectorLeaderDto } from './dto/assign-sector-leader.dto';
import { AssignClassDto } from './dto/assign-class.dto';
import { EnrollMemberDto } from './dto/enroll-member.dto';
import { Request } from 'express';

@Controller('admin')
@UseGuards(StaticAuthGuard)
@Public()
export class AdminController {
  constructor(private adminService: AdminService) {}

  /* ==================== CHURCH MANAGEMENT ==================== */

  @Post('churches')
  async createChurch(@Body() dto: CreateChurchDto) {
    return this.adminService.createChurch(dto);
  }

  @Get('churches')
  async getAllChurches() {
    return this.adminService.getAllChurches();
  }

  @Get('churches/:id')
  async getChurchById(@Param('id') id: string) {
    return this.adminService.getChurchById(Number(id));
  }

  /* ==================== USER MANAGEMENT ==================== */

  @Post('users')
  async createUser(@Body() dto: CreateAdminUserDto, @Query('churchId') churchId: string) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.createUser(dto, Number(churchId));
  }

  @Get('users')
  async getUsersByChurch(@Query('churchId') churchId: string) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.getUsersByChurch(Number(churchId));
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string, @Query('churchId') churchId: string) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.getUserById(id, Number(churchId));
  }

  @Get('users/:id/contexts')
  async getUserContexts(@Param('id') id: string, @Query('churchId') churchId: string) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.getUserContexts(id, Number(churchId));
  }

  @Patch('users/:id/status')
  async setMemberStatus(
    @Param('id') id: string,
    @Query('churchId') churchId: string,
    @Body() body: { isActive: boolean },
  ) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.setMemberStatus(id, Number(churchId), body.isActive);
  }

  /* ==================== ROLE ASSIGNMENT ==================== */

  @Post('users/:id/roles')
  async assignRole(
    @Param('id') id: string,
    @Query('churchId') churchId: string,
    @Body() dto: AssignRoleDto,
  ) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.assignRole(id, Number(churchId), dto);
  }

  @Delete('users/:id/roles/:roleId')
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Query('churchId') churchId: string,
  ) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.removeRole(id, Number(churchId), roleId);
  }

  /* ==================== SERVICE LEADER ==================== */

  @Post('users/:id/service-leader')
  async assignServiceLeader(
    @Param('id') id: string,
    @Query('churchId') churchId: string,
    @Body() dto: AssignServiceLeaderDto,
  ) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.assignServiceLeader(id, Number(churchId), dto);
  }

  /* ==================== SECTOR LEADER ==================== */

  @Post('users/:id/sector-leader')
  async assignSectorLeader(
    @Param('id') id: string,
    @Query('churchId') churchId: string,
    @Body() dto: AssignSectorLeaderDto,
  ) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.assignSectorLeader(id, Number(churchId), dto);
  }

  /* ==================== CLASS ASSIGNMENT ==================== */

  @Post('users/:id/class')
  async assignClass(
    @Param('id') id: string,
    @Query('churchId') churchId: string,
    @Body() dto: AssignClassDto,
  ) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.assignClass(id, Number(churchId), dto);
  }

  /* ==================== ENROLL SERVED MEMBER ==================== */

  @Post('users/:id/enroll')
  async enrollServedMember(
    @Param('id') id: string,
    @Query('churchId') churchId: string,
    @Body() dto: EnrollMemberDto,
  ) {
    if (!churchId) throw new NotFoundException('churchId query parameter is required');
    return this.adminService.enrollServedMember(id, Number(churchId), dto);
  }
}
