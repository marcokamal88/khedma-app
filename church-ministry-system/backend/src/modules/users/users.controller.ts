import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
}
