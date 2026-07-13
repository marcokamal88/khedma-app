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
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
