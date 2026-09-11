import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PreparationController } from './preparation.controller';
import { PreparationService } from './preparation.service';
import { Preparation } from './entities/preparation.entity';
import { PreparationFile } from './entities/preparation-file.entity';
import { PreparationComment } from './entities/preparation-comment.entity';
import { ServiceYear } from '../service-year/entities/service-year.entity';
import { ServantAssignment } from '../users/entities/servant-assignment.entity';

@Module({
  imports: [SequelizeModule.forFeature([Preparation, PreparationFile, PreparationComment, ServiceYear, ServantAssignment])],
  controllers: [PreparationController],
  providers: [PreparationService],
  exports: [PreparationService],
})
export class PreparationModule {}
