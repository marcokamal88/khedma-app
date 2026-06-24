import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServiceYearController } from './service-year.controller';
import { ServiceYearService } from './service-year.service';
import { ServiceYear } from './entities/service-year.entity';
import { Enrollment } from '../users/entities/enrollment.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';
import { StageGroup } from '../church/entities/stage-group.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([ServiceYear, Enrollment, ServantAssignment, StageGroup]),
  ],
  controllers: [ServiceYearController],
  providers: [ServiceYearService],
  exports: [ServiceYearService],
})
export class ServiceYearModule {}
