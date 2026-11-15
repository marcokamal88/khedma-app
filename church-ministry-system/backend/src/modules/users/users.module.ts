import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ChurchMember } from './entities/church-member.entity';
import { MemberRole } from './entities/member-role.entity';
import { Role } from './entities/role.entity';
import { ServantAssignment } from './entities/servant-assignment.entity';
import { Enrollment } from './entities/enrollment.entity';
import { SectorAssignment } from './entities/sector-assignment.entity';
import { MemberProfile } from './entities/member-profile.entity';
import { Class } from '../church/entities/class.entity';
import { Service } from '../church/entities/service.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      ChurchMember,
      MemberRole,
      Role,
      ServantAssignment,
      Enrollment,
      SectorAssignment,
      MemberProfile,
      Class,
      Service,
      ServiceYear,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
