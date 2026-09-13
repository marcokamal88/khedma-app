import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';
import { FollowupFamily } from './entities/followup-family.entity';
import { FollowupAssignment } from './entities/followup-assignment.entity';
import { FollowupLog } from './entities/followup-log.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { Class } from '../church/entities/class.entity';
import { Service } from '../church/entities/service.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { MemberRole } from '../users/entities/member-role.entity';
import { Role } from '../users/entities/role.entity';
import { ChurchMember } from '../users/entities/church-member.entity';
import { User } from '../users/entities/user.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { MemberProfile } from '../users/entities/member-profile.entity';
import { AttendanceSession } from '../attendance/entities/attendance-session.entity';
import { AttendanceRecord } from '../attendance/entities/attendance-record.entity';

@Module({
  imports: [SequelizeModule.forFeature([FollowupFamily, FollowupAssignment, FollowupLog, ServiceYear, Class, Service, Enrollment, MemberRole, Role, ChurchMember, User, ServantAssignment, MemberProfile, AttendanceSession, AttendanceRecord])],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
