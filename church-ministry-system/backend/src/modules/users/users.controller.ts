import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateMemberDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentTenant } from '../../core/tenant/tenant.decorator';
import { Request } from 'express';

@Controller()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Public()
  @Post('members')
  async create(@Body() dto: CreateUserDto, @CurrentTenant() churchId: string) {
    return this.usersService.create(dto, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('members/me')
  async getMe(@Req() req: Request, @CurrentTenant() churchId: string) {
    const user = req.user as any;
    return this.usersService.getMe(user.memberId, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('members/me')
  async updateMe(
    @Req() req: Request,
    @Body() dto: UpdateUserDto,
    @CurrentTenant() churchId: string,
  ) {
    const user = req.user as any;
    return this.usersService.updateMe(user.memberId, dto, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('members')
  async findAll(@CurrentTenant() churchId: string) {
    return this.usersService.findByChurch(churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('members/search')
  async searchMembers(@Query('q') q: string, @CurrentTenant() churchId: string) {
    return this.usersService.searchMembers(churchId, q || '');
  }

  @UseGuards(JwtAuthGuard)
  @Post('members/register')
  async registerMember(
    @Body() dto: CreateUserDto & {
      serviceId?: string;
      classId?: string;
      serviceYearId?: string;
      address?: string;
      birthDate?: string;
      notes?: string;
      gender?: string;
      schoolGrade?: number;
    },
    @CurrentTenant() churchId: string,
  ) {
    return this.usersService.registerMember(dto, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('members/:id')
  async updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentTenant() churchId: string,
  ) {
    return this.usersService.updateMember(id, dto, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('servant-assignments/my-class')
  async getMyClass(@Req() req: Request, @CurrentTenant() churchId: string) {
    const user = req.user as any;
    return this.usersService.getMyClass(user.memberId, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('sector_leader', 'priest', 'service_leader')
  @Post('servant-assignments')
  async assignServant(
    @Body() body: { churchMemberId: string; serviceId: string; classId: string; leaderRole?: string },
    @CurrentTenant() churchId: string,
    @Req() req: Request,
  ) {
    return this.usersService.assignServant(body, churchId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('sector_leader', 'priest', 'service_leader')
  @Get('servant-assignments')
  async getServantAssignments(
    @Query('serviceId') serviceId: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.usersService.getServantAssignments(churchId, serviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('sector_leader', 'priest', 'service_leader')
  @Patch('servant-assignments/:id')
  async updateServantAssignment(
    @Param('id') id: string,
    @Body() body: { classId?: string; leaderRole?: string },
    @CurrentTenant() churchId: string,
  ) {
    return this.usersService.updateServantAssignment(churchId, id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('sector_leader', 'priest', 'service_leader')
  @Delete('servant-assignments/:id')
  async removeServantAssignment(
    @Param('id') id: string,
    @CurrentTenant() churchId: string,
  ) {
    return this.usersService.removeServantAssignment(churchId, id);
  }
}
