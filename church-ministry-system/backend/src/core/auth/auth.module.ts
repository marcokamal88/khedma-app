import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../../modules/users/entities/user.entity';
import { ChurchMember } from '../../modules/users/entities/church-member.entity';
import { MemberRole } from '../../modules/users/entities/member-role.entity';
import { Role } from '../../modules/users/entities/role.entity';
import { ServantAssignment } from '../../modules/users/entities/servant-assignment.entity';
import { Enrollment } from '../../modules/users/entities/enrollment.entity';
import { MemberProfile } from '../../modules/users/entities/member-profile.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<string>('jwt.expiresIn') },
      }),
    }),
    SequelizeModule.forFeature([
      User,
      ChurchMember,
      MemberRole,
      Role,
      ServantAssignment,
      Enrollment,
      MemberProfile,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
