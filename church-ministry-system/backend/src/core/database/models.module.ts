import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// All entities must be registered here so Sequelize can resolve cross-module associations
import { User } from '../../modules/users/entities/user.entity';
import { ChurchMember } from '../../modules/users/entities/church-member.entity';
import { MemberRole } from '../../modules/users/entities/member-role.entity';
import { Role } from '../../modules/users/entities/role.entity';
import { ServantAssignment } from '../../modules/users/entities/servant-assignment.entity';
import { Enrollment } from '../../modules/users/entities/enrollment.entity';
import { Church } from '../../modules/church/entities/church.entity';
import { Sector } from '../../modules/church/entities/sector.entity';
import { Service } from '../../modules/church/entities/service.entity';
import { StageGroup } from '../../modules/church/entities/stage-group.entity';
import { Class } from '../../modules/church/entities/class.entity';
import { ServiceYear } from '../../modules/service-year/entities/service-year.entity';
import { AttendanceSession } from '../../modules/attendance/entities/attendance-session.entity';
import { AttendanceRecord } from '../../modules/attendance/entities/attendance-record.entity';
import { Preparation } from '../../modules/preparation/entities/preparation.entity';
import { PreparationFile } from '../../modules/preparation/entities/preparation-file.entity';
import { Task } from '../../modules/tasks/entities/task.entity';
import { TaskAssignment } from '../../modules/tasks/entities/task-assignment.entity';
import { TaioTransaction } from '../../modules/taio/entities/taio-transaction.entity';
import { StoreItem } from '../../modules/taio/entities/store-item.entity';
import { StoreRedemption } from '../../modules/taio/entities/store-redemption.entity';
import { Event } from '../../modules/events/entities/event.entity';
import { EventRegistration } from '../../modules/events/entities/event-registration.entity';
import { PaymentInstallment } from '../../modules/events/entities/payment-installment.entity';
import { Family } from '../../modules/family/entities/family.entity';
import { FamilyMember } from '../../modules/family/entities/family-member.entity';
import { SiblingPair } from '../../modules/family/entities/sibling-pair.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { FollowupFamily } from '../../modules/follow-ups/entities/followup-family.entity';
import { FollowupAssignment } from '../../modules/follow-ups/entities/followup-assignment.entity';
import { FollowupLog } from '../../modules/follow-ups/entities/followup-log.entity';
import { Lesson } from '../../modules/lesson-library/entities/lesson.entity';
import { Activity } from '../../modules/activities/entities/activity.entity';
import { ActivityMember } from '../../modules/activities/entities/activity-member.entity';
import { ActivitySession } from '../../modules/activities/entities/activity-session.entity';
import { ActivityAttendance } from '../../modules/activities/entities/activity-attendance.entity';
import { AchievementDefinition } from '../../modules/achievements/entities/achievement-definition.entity';
import { MemberAchievement } from '../../modules/achievements/entities/member-achievement.entity';
import { AuditLog } from '../../shared/interceptors/audit-log.entity';
import { FcmToken } from '../../modules/notifications/entities/fcm-token.entity';
import { PreparationComment } from '../../modules/preparation/entities/preparation-comment.entity';
import { MemberProfile } from '../../modules/users/entities/member-profile.entity';

const ALL_ENTITIES = [
  User, ChurchMember, MemberRole, Role, ServantAssignment, Enrollment,
  Church, Sector, Service, StageGroup, Class,
  ServiceYear,
  AttendanceSession, AttendanceRecord,
  Preparation, PreparationFile,
  Task, TaskAssignment,
  TaioTransaction, StoreItem, StoreRedemption,
  Event, EventRegistration, PaymentInstallment,
  Family, FamilyMember, SiblingPair,
  Notification,
  FollowupFamily, FollowupAssignment, FollowupLog,
  Lesson,
  Activity, ActivityMember, ActivitySession, ActivityAttendance,
  AchievementDefinition, MemberAchievement,
  AuditLog,
  FcmToken,
  PreparationComment, MemberProfile,
];

@Global()
@Module({
  imports: [SequelizeModule.forFeature(ALL_ENTITIES)],
  exports: [SequelizeModule],
})
export class ModelsModule {}
