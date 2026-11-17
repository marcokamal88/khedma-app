import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChurchController } from './church.controller';
import { ChurchService } from './church.service';
import { Sector } from './entities/sector.entity';
import { Service } from './entities/service.entity';
import { StageGroup } from './entities/stage-group.entity';
import { Class } from './entities/class.entity';
import { TaioModule } from '../taio/taio.module';
import { MemberRole } from '../users/entities/member-role.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { AttendanceSession } from '../attendance/entities/attendance-session.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { SectorAssignment } from '../users/entities/sector-assignment.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Sector,
      Service,
      StageGroup,
      Class,
      MemberRole,
      ServantAssignment,
      AttendanceSession,
      AttendanceRecord,
      MemberProfile,
      Enrollment,
      SectorAssignment,
      ServiceYear,
    ]),
    TaioModule,
  ],
  controllers: [ChurchController],
  providers: [ChurchService],
  exports: [ChurchService],
})
export class ChurchModule {}
