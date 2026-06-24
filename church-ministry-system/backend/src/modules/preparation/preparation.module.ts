import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PreparationController } from './preparation.controller';
import { PreparationService } from './preparation.service';
import { Preparation } from './entities/preparation.entity';
import { PreparationFile } from './entities/preparation-file.entity';

@Module({
  imports: [SequelizeModule.forFeature([Preparation, PreparationFile])],
  controllers: [PreparationController],
  providers: [PreparationService],
  exports: [PreparationService],
})
export class PreparationModule {}
