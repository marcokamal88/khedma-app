import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StaticAuthGuard } from './static-auth.guard';
import { User } from '../users/entities/user.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { MemberRole } from '../users/entities/member-role.entity';
import { Role } from '../users/entities/role.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { SectorAssignment } from '../users/entities/sector-assignment.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { Church } from '../church/entities/church.entity';
import { Service } from '../church/entities/service.entity';
import { Sector } from '../church/entities/sector.entity';
import { Class } from '../church/entities/class.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([
      User,
      ChurchMember,
      MemberRole,
      Role,
      ServantAssignment,
      SectorAssignment,
      Enrollment,
      Church,
      Service,
      Sector,
      Class,
      MemberProfile,
      ServiceYear,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, StaticAuthGuard],
  exports: [AdminService],
})
export class AdminModule {}