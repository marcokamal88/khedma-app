import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PreparationController } from './preparation.controller';
import { PreparationService } from './preparation.service';
import { Preparation } from './entities/preparation.entity';
import { PreparationFile } from './entities/preparation-file.entity';
import { PreparationComment } from './entities/preparation-comment.entity';

@Module({
  imports: [SequelizeModule.forFeature([Preparation, PreparationFile, PreparationComment])],
  controllers: [PreparationController],
  providers: [PreparationService],
  exports: [PreparationService],
})
export class PreparationModule {}
